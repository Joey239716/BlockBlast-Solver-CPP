/**
 * detectGameState.ts
 *
 * Full screenshot → game-state pipeline:
 *   1. findBoardRect      — OpenCV Canny + contours locates the 8×8 board frame
 *   2. refineBoardRect    — 1D brightness projection corrects for rounded corners / border width
 *   3. calibrateBoard     — samples empty/filled cell brightness from the board itself
 *                           (no corner sampling — corners have UI chrome in Block Blast)
 *   4. classifyBoardCells — Otsu threshold on per-cell scores → boolean[8][8]
 *   5. detectTrayPieces   — blob detection below the board, candidate-origin grid snapping,
 *                           then fuzzy match to the 38-piece library
 */

import type { Point } from '@/types/solver'
import { normalizePiece, PIECES } from '@/lib/pieces'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface Rect { x: number; y: number; width: number; height: number }

export interface DetectedGameState {
  board:     boolean[][]
  pieces:    (Point[] | null)[]  // 3 slots; null = empty / unrecognised
  boardRect: Rect
  cellSize:  number
}

// ─── Pixel helpers ────────────────────────────────────────────────────────────

/** Read RGB from a flat RGBA Uint8Array. No bounds check — caller must guarantee. */
function px(data: Uint8Array, imgW: number, x: number, y: number): [number, number, number] {
  const i = (y * imgW + x) * 4
  return [data[i], data[i + 1], data[i + 2]]
}

/** Perceived brightness — max channel (matches existing codebase convention). */
function bright(r: number, g: number, b: number): number {
  return Math.max(r, g, b)
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

// ─── Otsu threshold ───────────────────────────────────────────────────────────

function otsu(values: number[]): number {
  if (values.length === 0) return 0
  const lo = Math.min(...values), hi = Math.max(...values)
  if (lo === hi) return lo

  const BINS  = 256
  const scale = (BINS - 1) / (hi - lo)
  const hist  = new Float64Array(BINS)
  for (const v of values) hist[Math.min(BINS - 1, Math.floor((v - lo) * scale))]++

  const N = values.length
  let wB = 0, sumB = 0, bestVar = 0, bestThr = lo
  const sumAll = hist.reduce((acc, v, i) => acc + i * v, 0)

  for (let t = 0; t < BINS; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = N - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sumAll - sumB) / wF
    const between = wB * wF * (mB - mF) ** 2
    if (between > bestVar) {
      bestVar = between
      bestThr = lo + (t / scale)
    }
  }
  return bestThr
}

// ─── 1. Board finding via OpenCV ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function findBoardRect(cv: any, src: any, imgW: number, imgH: number): Rect | null {
  const gray     = new cv.Mat(), blurred = new cv.Mat()
  const edges    = new cv.Mat(), dilated = new cv.Mat()
  const contours = new cv.MatVector(), hier = new cv.Mat()
  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0)
    cv.Canny(blurred, edges, 30, 100)

    const kSize  = Math.max(15, Math.min(40, Math.round(imgW * 0.04)))
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kSize, kSize))
    cv.dilate(edges, dilated, kernel)
    kernel.delete()

    cv.findContours(dilated, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    let best: Rect | null = null, bestScore = 0
    for (let i = 0; i < contours.size(); i++) {
      const r      = cv.boundingRect(contours.get(i))
      const area   = r.width * r.height
      const aspect = r.width / r.height
      if (area   < imgW * imgH * 0.10)       continue
      if (aspect < 0.7  || aspect > 1.4)    continue
      if (r.y    < imgH * 0.10)             continue   // board never starts at the very top
      if (r.y + r.height / 2 > imgH * 0.65) continue
      const score = area * (1 - Math.abs(1 - aspect))
      if (score > bestScore) { bestScore = score; best = { x: r.x, y: r.y, width: r.width, height: r.height } }
    }
    if (!best) return null

    // Inset 2.5% on each side to step inside the rounded frame border
    const ix = Math.round(best.width  * 0.025)
    const iy = Math.round(best.height * 0.025)
    return { x: best.x + ix, y: best.y + iy, width: best.width - ix * 2, height: best.height - iy * 2 }
  } finally {
    gray.delete(); blurred.delete(); edges.delete(); dilated.delete(); contours.delete(); hier.delete()
  }
}

// ─── 2. Board rect refinement via 1D brightness projection ───────────────────
//
// Filled cells are bright; grid lines / frame borders are darker, creating
// faint valleys in the column/row brightness projections.  We search for the
// 9 boundary positions (start + 8 inter-cell lines + end) in those valleys.
//
// Fallback: if the valleys are not consistent (uniform-gap check), keep the
// approximate rect unchanged.

function refineBoardRect(data: Uint8Array, imgW: number, imgH: number, approx: Rect): Rect {
  // Build column projection (average brightness of each vertical strip)
  const colProj = new Float64Array(approx.width)
  for (let dx = 0; dx < approx.width; dx++) {
    let sum = 0, n = 0
    for (let dy = 0; dy < approx.height; dy++) {
      const px_ = approx.x + dx, py_ = approx.y + dy
      if (px_ < 0 || px_ >= imgW || py_ < 0 || py_ >= imgH) continue
      const [r, g, b] = px(data, imgW, px_, py_)
      sum += bright(r, g, b); n++
    }
    colProj[dx] = n > 0 ? sum / n : 0
  }

  // Build row projection
  const rowProj = new Float64Array(approx.height)
  for (let dy = 0; dy < approx.height; dy++) {
    let sum = 0, n = 0
    for (let dx = 0; dx < approx.width; dx++) {
      const px_ = approx.x + dx, py_ = approx.y + dy
      if (px_ < 0 || px_ >= imgW || py_ < 0 || py_ >= imgH) continue
      const [r, g, b] = px(data, imgW, px_, py_)
      sum += bright(r, g, b); n++
    }
    rowProj[dy] = n > 0 ? sum / n : 0
  }

  /**
   * For each of the n+1 expected boundaries, find the local minimum within
   * ±18% of one cell-length around the expected position.
   * Returns null if the resulting gaps are not within ±20% of the mean gap
   * (which would indicate the minima are noise, not real grid lines).
   */
  function findBoundaries(proj: Float64Array, n: number, offset: number): number[] | null {
    const cellLen = proj.length / n
    const radius  = Math.round(cellLen * 0.18)
    const bounds: number[] = []

    for (let i = 0; i <= n; i++) {
      const center = Math.round(i * cellLen)
      const lo_ = Math.max(0, center - radius)
      const hi_ = Math.min(proj.length - 1, center + radius)
      let minVal = Infinity, minPos = center
      for (let p = lo_; p <= hi_; p++) {
        if (proj[p] < minVal) { minVal = proj[p]; minPos = p }
      }
      bounds.push(offset + minPos)
    }

    const gaps    = bounds.slice(1).map((v, i) => v - bounds[i])
    const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
    if (gaps.some(g => Math.abs(g - meanGap) > meanGap * 0.20)) return null
    return bounds
  }

  const colB = findBoundaries(colProj, 8, approx.x)
  const rowB = findBoundaries(rowProj, 8, approx.y)
  if (!colB || !rowB) return approx   // projection didn't find clean grid lines → keep approx

  return { x: colB[0], y: rowB[0], width: colB[8] - colB[0], height: rowB[8] - rowB[0] }
}

// ─── 3. Board calibration — cell scoring + adaptive thresholds ────────────────
//
// scoreCellBrightness returns mean + range of max-channel samples over the
// inner 80% of a cell.  This matches the formula in the pre-existing hook so
// results are consistent.
//
// calibrateBoard runs that over all 64 cells, then:
//   • threshold            — Otsu split for board cell classification
//   • rawBrightnessThreshold — midpoint of raw pixel brightness between the
//                             emptiest and most-filled cells; used for blob
//                             detection in the tray where we work per-pixel.
//
// Crucially, no corners or pre-defined colour values are used.

export function scoreCellBrightness(
  data: Uint8Array, imgW: number, imgH: number,
  cx: number, cy: number, cw: number, ch: number,
): number {
  const MARGIN = 0.20, S = 4
  const samples: number[] = []
  for (let dy = 0; dy < S; dy++) {
    for (let dx = 0; dx < S; dx++) {
      const fx = MARGIN + (dx / (S - 1)) * (1 - 2 * MARGIN)
      const fy = MARGIN + (dy / (S - 1)) * (1 - 2 * MARGIN)
      const sx = clamp(Math.round(cx + fx * cw), 0, imgW - 1)
      const sy = clamp(Math.round(cy + fy * ch), 0, imgH - 1)
      const [r, g, b] = px(data, imgW, sx, sy)
      samples.push(bright(r, g, b))
    }
  }
  // Sort and take the top half of samples as the score — robust to single
  // border/grid-line pixels that inflate range-based formulas
  samples.sort((a, b) => a - b)
  const top = samples.slice(Math.floor(samples.length / 2))
  return top.reduce((a, b) => a + b, 0) / top.length
}

interface BoardCalibration {
  scores:                number[]  // 64 cell scores (row-major)
  threshold:             number    // Otsu — for board classification
  rawBrightnessThreshold: number   // midpoint raw pixel brightness — for tray blobs
}

function calibrateBoard(
  data: Uint8Array, imgW: number, imgH: number,
  boardRect: Rect,
): BoardCalibration {
  const cw = boardRect.width  / 8
  const ch = boardRect.height / 8

  const scores: number[] = []
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++)
      scores.push(scoreCellBrightness(data, imgW, imgH,
        boardRect.x + c * cw, boardRect.y + r * ch, cw, ch))

  const threshold = otsu(scores)

  // Sample the raw center-pixel brightness of the 16 lowest-scoring cells
  // (guaranteed empty) and 16 highest-scoring cells (guaranteed filled).
  const indexed = scores.map((s, i) => ({ s, i })).sort((a, b) => a.s - b.s)

  function sampleRawBrightness(idxList: number[]): number {
    let sum = 0, n = 0
    for (const idx of idxList) {
      const row = Math.floor(idx / 8), col = idx % 8
      const sx = clamp(Math.round(boardRect.x + (col + 0.5) * cw), 0, imgW - 1)
      const sy = clamp(Math.round(boardRect.y + (row + 0.5) * ch), 0, imgH - 1)
      const [r, g, b] = px(data, imgW, sx, sy)
      sum += bright(r, g, b); n++
    }
    return n > 0 ? sum / n : 0
  }

  const emptyIdx  = indexed.slice(0, 16).map(x => x.i)
  const filledIdx = indexed.slice(48).map(x => x.i)
  const bgBright  = sampleRawBrightness(emptyIdx)
  const fgBright  = sampleRawBrightness(filledIdx)

  // Use 30% of the way from bg to filled (not the midpoint) so that most
  // of each piece cell is captured as blob pixels, not just the bright highlight.
  return { scores, threshold, rawBrightnessThreshold: bgBright + (fgBright - bgBright) * 0.30 }
}

// ─── 4. Board cell classification ────────────────────────────────────────────

function classifyBoardCells(scores: number[], threshold: number): boolean[][] {
  return Array.from({ length: 8 }, (_, r) =>
    Array.from({ length: 8 }, (_, c) => scores[r * 8 + c] > threshold),
  )
}

// ─── 5. Bevel-based piece detection inside a bounding box ────────────────────
//
// Same technique as board cell classification: score each candidate cell with
// scoreCellBrightness (mean + range), run Otsu to split filled vs empty.
// The YOLO box has some padding so we try candidate origins in a ±½ cell
// window and pick the origin whose Otsu split has the highest between-class
// variance (most confident separation).

export function detectPieceInBox(
  data: Uint8Array, imgW: number, imgH: number,
  boxX: number, boxY: number, boxW: number, boxH: number,
  cellSize: number,
): Point[] | null {
  const cs   = cellSize
  const cols = Math.max(1, Math.round(boxW / cs))
  const rows = Math.max(1, Math.round(boxH / cs))

  const step  = Math.max(1, Math.round(cs / 4))
  const range = Math.round(cs / 2)

  let bestShape: Point[] | null = null
  let bestVar   = -Infinity

  for (let offY = -range; offY <= range; offY += step) {
    for (let offX = -range; offX <= range; offX += step) {
      const ox = boxX + offX
      const oy = boxY + offY

      const scores: number[] = []
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          scores.push(scoreCellBrightness(data, imgW, imgH,
            ox + c * cs, oy + r * cs, cs, cs))

      const thr    = otsu(scores)
      const filled = scores.filter(s => s >  thr)
      const empty  = scores.filter(s => s <= thr)
      if (!filled.length) continue   // no cells at all above threshold

      let v: number
      if (!empty.length) {
        // All cells filled — compact piece that tiles its box (e.g. 3×3).
        // No between-class variance; use mean score as confidence proxy.
        v = filled.reduce((a, b) => a + b, 0) / filled.length / 510
      } else {
        const mF = filled.reduce((a, b) => a + b, 0) / filled.length
        const mE = empty.reduce((a, b)  => a + b, 0) / empty.length
        v = (filled.length * empty.length * (mF - mE) ** 2) / scores.length ** 2
      }

      if (v > bestVar) {
        bestVar = v
        const shape: Point[] = []
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++)
            if (scores[r * cols + c] > thr) shape.push({ x: c, y: r })
        bestShape = shape.length > 0 ? normalizePiece(shape) : null
      }
    }
  }

  return bestShape
}

// ─── 5b. Legacy tray piece detection ─────────────────────────────────────────

/**
 * Connected-component blob finder over a rectangular region.
 * A pixel is "foreground" when its max-channel brightness exceeds rawBrightnessThreshold.
 * Returns blobs with at least minPixels pixels (filters noise / JPEG artefacts).
 */
export function findBlobs(
  data: Uint8Array, imgW: number, imgH: number,
  x0: number, y0: number, x1: number, y1: number,
  rawBrightnessThreshold: number,
  minPixels = 9,
): Array<{ x: number; y: number }[]> {
  const ox = Math.max(0, x0), oy = Math.max(0, y0)
  const W  = Math.max(0, Math.min(imgW, x1) - ox)
  const H  = Math.max(0, Math.min(imgH, y1) - oy)
  if (W <= 0 || H <= 0) return []

  const mask    = new Uint8Array(W * H)
  const visited = new Uint8Array(W * H)

  for (let dy = 0; dy < H; dy++) {
    for (let dx = 0; dx < W; dx++) {
      const [r, g, b] = px(data, imgW, ox + dx, oy + dy)
      if (bright(r, g, b) > rawBrightnessThreshold) mask[dy * W + dx] = 1
    }
  }

  const blobs: Array<{ x: number; y: number }[]> = []
  for (let i = 0; i < W * H; i++) {
    if (!mask[i] || visited[i]) continue
    const blob: { x: number; y: number }[] = []
    const queue = [i]
    visited[i] = 1
    while (queue.length) {
      const idx = queue.pop()!
      const dy  = Math.floor(idx / W), dx = idx % W
      blob.push({ x: ox + dx, y: oy + dy })
      for (const [nx, ny] of [[dx - 1, dy], [dx + 1, dy], [dx, dy - 1], [dx, dy + 1]] as [number, number][]) {
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
        const ni = ny * W + nx
        if (!mask[ni] || visited[ni]) continue
        visited[ni] = 1
        queue.push(ni)
      }
    }
    if (blob.length >= minPixels) blobs.push(blob)
  }
  return blobs
}

/**
 * Given a blob, find the cell-grid origin that best explains the blob pixels.
 *
 * Rather than re-sampling image brightness (which mixes units with
 * rawBrightnessThreshold), we count how many blob pixels fall inside each
 * candidate cell.  A cell is "filled" when it has ≥ FILL_FRAC of its area
 * covered by blob pixels.  This is immune to glow/shadow artefacts: those
 * pixels are either below the blob threshold (not in the blob at all) or too
 * sparse to exceed FILL_FRAC.
 */
export function snapBlobToGrid(
  blob: { x: number; y: number }[],
  cellSize: number,
): Point[] | null {
  if (!blob.length) return null

  const minX = Math.min(...blob.map(p => p.x))
  const maxX = Math.max(...blob.map(p => p.x))
  const minY = Math.min(...blob.map(p => p.y))
  const maxY = Math.max(...blob.map(p => p.y))

  // Build a compact bitmask so pixel counting is O(cellSize²) not O(blob.length)
  const W    = maxX - minX + 1
  const H    = maxY - minY + 1
  const mask = new Uint8Array(W * H)
  for (const p of blob) mask[(p.y - minY) * W + (p.x - minX)] = 1

  const cs           = Math.round(cellSize)
  const FILL_FRAC    = 0.15                   // 15% of cell area must be blob pixels
  const fillThresh   = cs * cs * FILL_FRAC

  function countPixels(rx: number, ry: number): number {
    const x0 = Math.max(0, rx - minX),     x1 = Math.min(W, rx + cs - minX)
    const y0 = Math.max(0, ry - minY),     y1 = Math.min(H, ry + cs - minY)
    let n = 0
    for (let y = y0; y < y1; y++) {
      const row = y * W
      for (let x = x0; x < x1; x++) n += mask[row + x]
    }
    return n
  }

  const maxCols = Math.min(5, Math.ceil((maxX - minX + 1) / cellSize) + 1)
  const maxRows = Math.min(5, Math.ceil((maxY - minY + 1) / cellSize) + 1)
  const step    = Math.max(1, Math.round(cellSize / 6))

  let bestShape: Point[] | null = null
  let bestScore = -Infinity

  for (let offX = 0; offX < cellSize; offX += step) {
    for (let offY = 0; offY < cellSize; offY += step) {
      const originX = Math.round(minX - offX)
      const originY = Math.round(minY - offY)

      let score = 0
      const shape: Point[] = []

      for (let gy = 0; gy < maxRows; gy++) {
        for (let gx = 0; gx < maxCols; gx++) {
          const count    = countPixels(originX + gx * cs, originY + gy * cs)
          const isFilled = count >= fillThresh
          // Reward confident classification (far from threshold in either direction)
          score += Math.abs(count - fillThresh)
          if (isFilled) shape.push({ x: gx, y: gy })
        }
      }

      if (shape.length === 0 || shape.length > 9) continue
      if (score > bestScore) {
        bestScore = score
        bestShape = normalizePiece(shape)
      }
    }
  }
  return bestShape
}

// ─── 5b. Piece shape matching ─────────────────────────────────────────────────
//
// Tries an exact match first (normalised point-set equality).
// Falls back to the closest piece by symmetric difference, accepting up to
// 2 mismatched cells (covers single-cell JPEG artefacts / glow bleed).

export function matchPieceName(detected: Point[]): string | null {
  if (!detected.length) return null
  const norm   = normalizePiece(detected)
  const detKey = norm.map(p => `${p.x},${p.y}`).sort().join('|')

  let bestName: string | null = null, bestDiff = Infinity
  for (const [name, points] of Object.entries(PIECES)) {
    const pKey = normalizePiece(points).map(p => `${p.x},${p.y}`).sort().join('|')
    if (pKey === detKey) return name
    const pSet = new Set(pKey.split('|'))
    const dSet = new Set(detKey.split('|'))
    const diff = [...pSet].filter(k => !dSet.has(k)).length +
                 [...dSet].filter(k => !pSet.has(k)).length
    if (diff < bestDiff) { bestDiff = diff; bestName = name }
  }
  return bestDiff <= 2 ? bestName : null
}

export function matchPieceShape(detected: Point[]): Point[] | null {
  if (!detected.length) return null

  const norm   = normalizePiece(detected)
  const detKey = norm.map(p => `${p.x},${p.y}`).sort().join('|')

  // Exact match
  for (const points of Object.values(PIECES)) {
    const pKey = normalizePiece(points).map(p => `${p.x},${p.y}`).sort().join('|')
    if (pKey === detKey) return points
  }

  // Fuzzy match — symmetric difference ≤ 2
  let bestPiece: Point[] | null = null, bestDiff = Infinity
  const detSet = new Set(detKey.split('|'))
  for (const points of Object.values(PIECES)) {
    const pSet = new Set(normalizePiece(points).map(p => `${p.x},${p.y}`))
    const diff = [...pSet].filter(k => !detSet.has(k)).length +
                 [...detSet].filter(k => !pSet.has(k)).length
    if (diff < bestDiff) { bestDiff = diff; bestPiece = points }
  }

  return bestDiff <= 2 ? bestPiece : null
}

/**
 * Compute a blob-detection threshold calibrated from the tray region itself.
 *
 * The tray uses the app background colour, which is different (lighter) from
 * the darker board-interior colour used by calibrateBoard().  We therefore
 * cannot reuse rawBrightnessThreshold from the board calibration.
 *
 * Strategy: sample all tray pixels at a coarse step, sort them, and place the
 * threshold 35% of the way from the median (background) to the 95th percentile
 * (piece-cell centres).  Pieces occupy ~3–15% of the tray, so the 95th
 * percentile reliably lands in the bright-piece zone.
 */
export function computeTrayThreshold(
  data: Uint8Array, imgW: number, imgH: number,
  trayY0: number,
): number {
  const trayH = imgH - trayY0
  if (trayH <= 0) return 128

  // Sample ~10 000 pixels evenly across the tray
  const step = Math.max(1, Math.round(Math.sqrt(imgW * trayH) / 100))
  const samples: number[] = []
  for (let y = trayY0; y < imgH; y += step)
    for (let x = 0; x < imgW; x += step) {
      const [r, g, b] = px(data, imgW, x, y)
      samples.push(bright(r, g, b))
    }

  samples.sort((a, b) => a - b)
  const bgBright = samples[Math.floor(samples.length * 0.50)]   // background
  const fgBright = samples[Math.floor(samples.length * 0.95)]   // piece-cell centres

  // Guard: if there's very little contrast (no pieces / uniform tray), return
  // a high threshold so nothing is falsely detected.
  if (fgBright - bgBright < 15) return bgBright + 40

  return bgBright + (fgBright - bgBright) * 0.35
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectTrayPieces(
  cv: any, src: any,
  imgW: number, imgH: number,
  boardRect: Rect,
): (Point[] | null)[] {
  const cellSize   = boardRect.width / 8
  const TRAY_SCALE = 0.43                      // tray piece cells are ~43% the size of board cells
  const cs         = cellSize * TRAY_SCALE
  const trayY0     = boardRect.y + boardRect.height
  const trayH      = imgH - trayY0
  if (trayH <= 0) return [null, null, null]

  // Same sensitivity constants as detectPieces.ts
  const SENSITIVITY = 0.7
  const S_MIN = Math.round(60 - SENSITIVITY * 40)
  const V_MIN = Math.round(60 - SENSITIVITY * 40)
  const H_TOL = Math.round(25 - SENSITIVITY * 15)
  const S_TOL = Math.round(50 - SENSITIVITY * 30)
  const V_TOL = Math.round(50 - SENSITIVITY * 30)

  // Allocate all Mats up front — never delete src (caller owns it)
  const trayROI      = new cv.Mat()
  const rgb          = new cv.Mat()
  const hsv          = new cv.Mat()
  const mask         = new cv.Mat()
  const cleaned      = new cv.Mat()
  const lowBG        = new cv.Mat()
  const highBG       = new cv.Mat()
  const isNotBG      = new cv.Mat()
  const isColorful   = new cv.Mat()
  const isBrightWhite = new cv.Mat()
  const lowColor     = new cv.Mat()
  const highColor    = new cv.Mat()
  const lowWhite     = new cv.Mat()
  const highWhite    = new cv.Mat()
  const contours     = new cv.MatVector()
  const hierarchy    = new cv.Mat()

  try {
    // 1. Crop to the full tray region
    src.roi(new cv.Rect(0, trayY0, imgW, trayH)).copyTo(trayROI)

    // 2. Convert RGBA → RGB → HSV
    cv.cvtColor(trayROI, rgb, cv.COLOR_RGBA2RGB)
    cv.cvtColor(rgb, hsv, cv.COLOR_RGB2HSV)

    // 3. Background subtraction
    const bgMean = cv.mean(hsv)
    lowBG.create(hsv.rows, hsv.cols, hsv.type())
    lowBG.setTo(new cv.Scalar(Math.max(0, bgMean[0]-H_TOL), Math.max(0, bgMean[1]-S_TOL), Math.max(0, bgMean[2]-V_TOL), 0))
    highBG.create(hsv.rows, hsv.cols, hsv.type())
    highBG.setTo(new cv.Scalar(Math.min(180, bgMean[0]+H_TOL), Math.min(255, bgMean[1]+S_TOL), Math.min(255, bgMean[2]+V_TOL), 0))
    cv.inRange(hsv, lowBG, highBG, isNotBG)
    cv.bitwise_not(isNotBG, isNotBG)

    // 4. Colorful filter (pieces have saturation and brightness)
    lowColor.create(hsv.rows, hsv.cols, hsv.type())
    lowColor.setTo(new cv.Scalar(0, S_MIN, V_MIN, 0))
    highColor.create(hsv.rows, hsv.cols, hsv.type())
    highColor.setTo(new cv.Scalar(180, 255, 255, 0))
    cv.inRange(hsv, lowColor, highColor, isColorful)
    cv.bitwise_and(isNotBG, isColorful, mask)

    // 5. White piece bypass — bright low-saturation pieces pass through regardless
    lowWhite.create(hsv.rows, hsv.cols, hsv.type())
    lowWhite.setTo(new cv.Scalar(0, 0, 200, 0))
    highWhite.create(hsv.rows, hsv.cols, hsv.type())
    highWhite.setTo(new cv.Scalar(180, 60, 255, 0))
    cv.inRange(hsv, lowWhite, highWhite, isBrightWhite)
    cv.bitwise_or(mask, isBrightWhite, mask)

    // 6. Morphological closing — fills gaps inside pieces
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(11, 11))
    cv.morphologyEx(mask, cleaned, cv.MORPH_CLOSE, kernel)
    kernel.delete()

    // 5. Find contours and collect their bounding boxes (tray-local coords)
    cv.findContours(cleaned, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    const MIN_AREA = 400
    const bounds: { x: number; y: number; width: number; height: number; area: number }[] = []
    for (let i = 0; i < contours.size(); i++) {
      const cnt  = contours.get(i)
      const area = cv.contourArea(cnt)
      const b    = cv.boundingRect(cnt)
      cnt.delete()
      if (area >= MIN_AREA) bounds.push({ x: b.x, y: b.y, width: b.width, height: b.height, area })
    }

    console.log(`[pieces] cellSize=${cellSize.toFixed(1)}  cs=${cs.toFixed(1)}  trayY0=${trayY0}  contours=${bounds.length}`)

    // 6. For each of the 3 slots, take the largest contour whose centre falls in that slot
    return [0, 1, 2].map(slot => {
      const slotX0 = Math.round(slot       * imgW / 3)
      const slotX1 = Math.round((slot + 1) * imgW / 3)

      const inSlot = bounds.filter(b => {
        const cx = b.x + b.width / 2
        return cx >= slotX0 && cx < slotX1
      })
      if (!inSlot.length) return null

      const best = inSlot.reduce((a, b) => a.area > b.area ? a : b)

      // 7. Sampling grid — read center pixel of each cell from the binary mask
      const cols = Math.max(1, Math.round(best.width  / cs))
      const rows = Math.max(1, Math.round(best.height / cs))

      const shape: Point[] = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const maskX = Math.min(cleaned.cols - 1, Math.max(0, Math.round(best.x + (c + 0.5) * cs)))
          const maskY = Math.min(cleaned.rows - 1, Math.max(0, Math.round(best.y + (r + 0.5) * cs)))
          let whiteCount = 0
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const py = Math.min(cleaned.rows - 1, Math.max(0, maskY + dy))
              const px = Math.min(cleaned.cols - 1, Math.max(0, maskX + dx))
              if (cleaned.data[py * cleaned.cols + px] > 127) whiteCount++
            }
          }
          if (whiteCount > 4) shape.push({ x: c, y: r })
        }
      }

      if (!shape.length) return null
      const matched = matchPieceShape(normalizePiece(shape))
      console.log(`[pieces] slot ${slot}  grid=${cols}×${rows}  shape=${shape.length}cells  matched=${matched ? matched.length + 'cells' : 'null'}`)
      return matched
    })

  } finally {
    // Only delete Mats we created — src is owned by the caller
    trayROI.delete(); rgb.delete(); hsv.delete()
    mask.delete(); cleaned.delete()
    lowBG.delete(); highBG.delete(); isNotBG.delete(); isColorful.delete()
    isBrightWhite.delete(); lowColor.delete(); highColor.delete()
    lowWhite.delete(); highWhite.delete()
    contours.delete(); hierarchy.delete()
  }
}

// ─── Board-only entry point ───────────────────────────────────────────────────

export interface BoardOnlyState {
  board:     boolean[][]
  boardRect: Rect
  cellSize:  number
  data:      Uint8Array
  imgW:      number
  imgH:      number
}

/**
 * Detect only the board (steps 1–4), returning raw pixel data for downstream
 * piece detection.  Cheaper than detectGameState() when pieces are handled
 * separately (e.g. via YOLO).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function detectBoardOnly(cv: any, src: any, imageData: ImageData, boardHint?: Rect): BoardOnlyState | null {
  const { width: imgW, height: imgH } = imageData
  const data = new Uint8Array(imageData.data.buffer)

  const approxRect = boardHint ?? findBoardRect(cv, src, imgW, imgH)
  if (!approxRect) return null

  const boardRect   = refineBoardRect(data, imgW, imgH, approxRect)
  const calibration = calibrateBoard(data, imgW, imgH, boardRect)
  const board       = classifyBoardCells(calibration.scores, calibration.threshold)

  return { board, boardRect, cellSize: boardRect.width / 8, data, imgW, imgH }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Detect the board state and tray pieces from a Block Blast screenshot.
 *
 * @param cv          OpenCV.js instance (from useOpenCV hook)
 * @param src         cv.Mat created from the imageData (RGBA)
 * @param imageData   Raw ImageData from the offscreen canvas
 * @returns           Detected game state, or null if the board could not be found
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function detectGameState(cv: any, src: any, imageData: ImageData): DetectedGameState | null {
  const { width: imgW, height: imgH } = imageData
  const data = new Uint8Array(imageData.data.buffer)

  // 1. Locate board via contour detection
  const approxRect = findBoardRect(cv, src, imgW, imgH)
  if (!approxRect) return null

  // 2. Refine boundaries via brightness projection (falls back to approxRect on failure)
  const boardRect = refineBoardRect(data, imgW, imgH, approxRect)

  // 3. Calibrate brightness thresholds from the board itself
  const calibration = calibrateBoard(data, imgW, imgH, boardRect)

  // 4. Classify all 64 board cells
  const board = classifyBoardCells(calibration.scores, calibration.threshold)

  // 5. Detect the 3 tray pieces
  const pieces = detectTrayPieces(cv, src, imgW, imgH, boardRect)

  return { board, pieces, boardRect, cellSize: boardRect.width / 8 }
}
