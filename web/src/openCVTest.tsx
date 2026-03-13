import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useOpenCV } from './hooks/useOpenCV'
import type { Point } from '@/types/solver'
import { normalizePiece } from '@/lib/pieces'

interface Props {
  onBoardLoaded:  (board: boolean[][]) => void
  onPiecesLoaded: (pieces: (Point[] | null)[]) => void
  onGoToSetup:    () => void
}

// ─── Bevel-based cell scoring ─────────────────────────────────────────────────

const SAMPLE_S      = 4
const SAMPLE_MARGIN = 0.10

function scoreCellFilled(
  data: Uint8Array, imgW: number,
  cellX: number, cellY: number, cellW: number, cellH: number,
): number {
  const samples: number[] = []
  for (let dy = 0; dy < SAMPLE_S; dy++) {
    for (let dx = 0; dx < SAMPLE_S; dx++) {
      const fx = SAMPLE_MARGIN + (dx / (SAMPLE_S - 1)) * (1 - 2 * SAMPLE_MARGIN)
      const fy = SAMPLE_MARGIN + (dy / (SAMPLE_S - 1)) * (1 - 2 * SAMPLE_MARGIN)
      const px = Math.round(cellX + fx * cellW)
      const py = Math.round(cellY + fy * cellH)
      if (px < 0 || py < 0 || px >= imgW) continue
      const i = (py * imgW + px) * 4
      samples.push(Math.max(data[i], data[i + 1], data[i + 2]))
    }
  }
  if (samples.length === 0) return 0
  const mean  = samples.reduce((a, b) => a + b, 0) / samples.length
  const range = Math.max(...samples) - Math.min(...samples)
  return mean + range
}

// ─── Board detection ──────────────────────────────────────────────────────────

function detectBoardCells(
  data: Uint8Array, imgW: number,
  bx: number, by: number, bw: number, bh: number,
  rows: number, cols: number,
): boolean[][] {
  const cw = bw / cols
  const ch = bh / rows
  const scores: number[] = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      scores.push(scoreCellFilled(data, imgW, bx + c * cw, by + r * ch, cw, ch))
  const lo  = Math.min(...scores)
  const hi  = Math.max(...scores)
  const thr = (lo + hi) / 2
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => scores[r * cols + c] > thr),
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OpenCVTestPage({ onBoardLoaded, onPiecesLoaded, onGoToSetup }: Props) {
  const { cv, ready, progress } = useOpenCV()
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [status,         setStatus]         = useState('')
  const [detectedBoard,  setDetectedBoard]  = useState<boolean[][] | null>(null)
  const [detectedPieces, setDetectedPieces] = useState<(Point[] | null)[] | null>(null)

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !ready || !canvasRef.current || !containerRef.current) return
    e.target.value = ''

    setStatus('Processing…')
    setDetectedBoard(null)
    setDetectedPieces(null)

    try {
      const bitmap = await createImageBitmap(file)

      const maxW  = containerRef.current.clientWidth || window.innerWidth
      const maxH  = window.innerHeight - 320
      const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height)
      const w     = Math.max(1, Math.round(bitmap.width  * scale))
      const h     = Math.max(1, Math.round(bitmap.height * scale))

      const off    = document.createElement('canvas')
      off.width = w; off.height = h
      const offCtx = off.getContext('2d', { willReadFrequently: true })!
      offCtx.drawImage(bitmap, 0, 0, w, h)
      const imageData = offCtx.getImageData(0, 0, w, h)

      // ── OpenCV: find board region ─────────────────────────────────────────
      const src      = cv.matFromImageData(imageData)
      const gray     = new cv.Mat()
      const blurred  = new cv.Mat()
      const edges    = new cv.Mat()
      const dilated  = new cv.Mat()
      const contours = new cv.MatVector()
      const hier     = new cv.Mat()

      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
      cv.GaussianBlur(gray, blurred, new cv.Size(3, 3), 0)
      cv.Canny(blurred, edges, 30, 100)

      const kSize  = Math.max(15, Math.min(40, Math.round(w * 0.04)))
      const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kSize, kSize))
      cv.dilate(edges, dilated, kernel)
      kernel.delete()

      cv.findContours(dilated, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

      const minArea = w * h * 0.10
      let bestRect: { x: number; y: number; width: number; height: number } | null = null
      let bestScore = 0

      for (let i = 0; i < contours.size(); i++) {
        const rect    = cv.boundingRect(contours.get(i))
        const area    = rect.width * rect.height
        const aspect  = rect.width / rect.height
        const centerY = rect.y + rect.height / 2
        if (area < minArea)               continue
        if (aspect < 0.7 || aspect > 1.4) continue
        if (centerY > h * 0.65)           continue
        const score = area * (1 - Math.abs(1 - aspect))
        if (score > bestScore) { bestScore = score; bestRect = rect }
      }

      const display = src.clone()

      if (bestRect) {
        const insetX = Math.round(bestRect.width  * 0.025)
        const insetY = Math.round(bestRect.height * 0.025)
        bestRect = {
          x:      bestRect.x + insetX,
          y:      bestRect.y + insetY,
          width:  bestRect.width  - insetX * 2,
          height: bestRect.height - insetY * 2,
        }

        const raw   = src.data as Uint8Array
        const board = detectBoardCells(raw, w, bestRect.x, bestRect.y, bestRect.width, bestRect.height, 8, 8)
        const cw    = bestRect.width  / 8
        const ch    = bestRect.height / 8

        // ── Adaptive V threshold from empty board cells ───────────────────
        // The background color varies across game themes, so a fixed threshold
        // is unreliable. Instead, sample the empty board cells (which we already
        // know from board detection) to measure the actual background brightness.
        // Piece blocks are always significantly brighter than the background,
        // so threshold = median(background V) + 55 works for any theme.
        const bgVSamples: number[] = []
        for (let r = 0; r < 8; r++) {
          for (let c = 0; c < 8; c++) {
            if (!board[r][c]) {
              const px = Math.round(bestRect.x + (c + 0.5) * cw)
              const py = Math.round(bestRect.y + (r + 0.5) * ch)
              if (px >= 0 && px < w && py >= 0 && py < h) {
                const idx = (py * w + px) * 4
                // max(R,G,B) ≡ HSV Value channel scaled to 0–255
                bgVSamples.push(Math.max(raw[idx], raw[idx + 1], raw[idx + 2]))
              }
            }
          }
        }
        bgVSamples.sort((a, b) => a - b)
        const bgV       = bgVSamples.length > 0 ? bgVSamples[Math.floor(bgVSamples.length / 2)] : 80
        const vThreshold = Math.min(220, bgV + 55)

        // ── OpenCV: detect piece blocks in tray (HSV Value mask) ────────────
        // Strategy: all piece blocks are significantly brighter than background.
        // Threshold on the V channel using the adaptive value computed above.
        const pieces: (Point[] | null)[] = [null, null, null]
        const trayY = bestRect.y + bestRect.height
        // Cap tray scan at 28% of image height — the piece tray in Block Blast
        // sits just below the board and never extends to ad banners at the bottom.
        const trayH = Math.min(h - trayY, Math.round(h * 0.28))
        const ORANGE = new cv.Scalar(60, 160, 255, 255)

        if (trayH > 20) {
          type Block = { cx: number; cy: number; sz: number }

          for (let slot = 0; slot < 3; slot++) {
            const slotX = Math.round(slot       * w / 3)
            const slotW = Math.round((slot + 1) * w / 3) - slotX

            const roi      = src.roi(new cv.Rect(slotX, trayY, slotW, trayH))
            const roiRGB   = new cv.Mat()
            const roiHSV   = new cv.Mat()
            const roiBlur  = new cv.Mat()
            const channels = new cv.MatVector()
            const roiBin   = new cv.Mat()
            const roiCnts  = new cv.MatVector()
            const roiHier  = new cv.Mat()

            // Convert RGBA → RGB → HSV
            cv.cvtColor(roi, roiRGB, cv.COLOR_RGBA2RGB)
            cv.cvtColor(roiRGB, roiHSV, cv.COLOR_RGB2HSV)

            // Extract the V (Value) channel — index 2 in HSV
            cv.split(roiHSV, channels)
            const roiV = channels.get(2).clone()
            channels.delete()

            // Light blur to suppress noise before threshold
            cv.GaussianBlur(roiV, roiBlur, new cv.Size(3, 3), 0)

            cv.threshold(roiBlur, roiBin, vThreshold, 255, cv.THRESH_BINARY)

            cv.findContours(roiBin, roiCnts, roiHier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

            const estCell  = slotW / 6
            const minCArea = (estCell * 0.2) ** 2
            const maxCArea = (estCell * 2.8) ** 2
            const blocks: Block[] = []

            for (let i = 0; i < roiCnts.size(); i++) {
              const r      = cv.boundingRect(roiCnts.get(i))
              const area   = r.width * r.height
              const aspect = r.width / r.height
              if (area < minCArea || area > maxCArea) continue
              if (aspect < 0.3 || aspect > 3.2)      continue
              blocks.push({
                cx: slotX + r.x + r.width  / 2,   // full-image x
                cy:          r.y + r.height / 2,   // relative to tray top
                sz: (r.width + r.height) / 2,
              })
            }

            if (blocks.length >= 2) {
              // Cell size = min pairwise center distance (= actual block spacing)
              let cellSz = Infinity
              for (let i = 0; i < blocks.length; i++)
                for (let j = i + 1; j < blocks.length; j++) {
                  const dx = blocks[i].cx - blocks[j].cx
                  const dy = blocks[i].cy - blocks[j].cy
                  cellSz = Math.min(cellSz, Math.sqrt(dx * dx + dy * dy))
                }

              // Draw overlay at each detected block
              for (const { cx, cy, sz } of blocks)
                cv.rectangle(display,
                  new cv.Point(Math.round(cx - sz / 2) + 1, Math.round(trayY + cy - sz / 2) + 1),
                  new cv.Point(Math.round(cx + sz / 2) - 1, Math.round(trayY + cy + sz / 2) - 1),
                  ORANGE, 2,
                )

              // Snap to grid using real block spacing
              const minCX = Math.min(...blocks.map(b => b.cx))
              const minCY = Math.min(...blocks.map(b => b.cy))
              const seen  = new Set<string>()
              const pts: Point[] = []
              for (const { cx, cy } of blocks) {
                const gx  = Math.round((cx - minCX) / cellSz)
                const gy  = Math.round((cy - minCY) / cellSz)
                const key = `${gx},${gy}`
                if (!seen.has(key)) { seen.add(key); pts.push({ x: gx, y: gy }) }
              }
              if (pts.length > 0) pieces[slot] = normalizePiece(pts)

            } else if (blocks.length === 1) {
              const b = blocks[0]
              cv.rectangle(display,
                new cv.Point(Math.round(b.cx - b.sz / 2) + 1, Math.round(trayY + b.cy - b.sz / 2) + 1),
                new cv.Point(Math.round(b.cx + b.sz / 2) - 1, Math.round(trayY + b.cy + b.sz / 2) - 1),
                ORANGE, 2,
              )
              pieces[slot] = [{ x: 0, y: 0 }]
            }

            roi.delete(); roiRGB.delete(); roiHSV.delete()
            roiV.delete(); roiBlur.delete()
            roiBin.delete(); roiCnts.delete(); roiHier.delete()
          }
        }

        // ── Draw board overlay ────────────────────────────────────────────
        const CYAN = new cv.Scalar(0, 220, 255, 255)
        const GRAY = new cv.Scalar(60, 60, 80, 255)

        cv.rectangle(display,
          new cv.Point(bestRect.x, bestRect.y),
          new cv.Point(bestRect.x + bestRect.width, bestRect.y + bestRect.height),
          CYAN, 3,
        )
        for (let i = 1; i < 8; i++) {
          cv.line(display,
            new cv.Point(Math.round(bestRect.x + i * cw), bestRect.y),
            new cv.Point(Math.round(bestRect.x + i * cw), bestRect.y + bestRect.height),
            GRAY, 1,
          )
          cv.line(display,
            new cv.Point(bestRect.x, Math.round(bestRect.y + i * ch)),
            new cv.Point(bestRect.x + bestRect.width, Math.round(bestRect.y + i * ch)),
            GRAY, 1,
          )
        }
        for (let row = 0; row < 8; row++)
          for (let col = 0; col < 8; col++) {
            if (!board[row][col]) continue
            cv.rectangle(display,
              new cv.Point(Math.round(bestRect.x + col * cw) + 2,       Math.round(bestRect.y + row * ch) + 2),
              new cv.Point(Math.round(bestRect.x + (col + 1) * cw) - 2, Math.round(bestRect.y + (row + 1) * ch) - 2),
              CYAN, 2,
            )
          }

        const filled     = board.flat().filter(Boolean).length
        const pieceCount = pieces.filter(Boolean).length
        setStatus(`Board detected — ${filled}/64 cells · ${pieceCount}/3 pieces found`)
        setDetectedBoard(board)
        setDetectedPieces(pieces)

      } else {
        setStatus('No board found — try a clearer screenshot')
      }

      const canvas = canvasRef.current!
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d')!.putImageData(
        new ImageData(new Uint8ClampedArray(display.data), w, h), 0, 0,
      )

      src.delete(); gray.delete(); blurred.delete()
      edges.delete(); dilated.delete(); contours.delete(); hier.delete(); display.delete()

    } catch (err) {
      setStatus(`Error: ${String(err)}`)
    }
  }

  function handleApply() {
    if (!detectedBoard) return
    onBoardLoaded(detectedBoard)
    if (detectedPieces) onPiecesLoaded(detectedPieces)
    onGoToSetup()
  }

  const loading   = !ready && progress >= 0
  const loadError = progress === -1

  return (
    <div ref={containerRef} className="flex flex-col gap-5 w-full">

      {loading && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-white/50">Loading OpenCV.js…</span>
            <span className="text-white/30 tabular-nums">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {loadError && (
        <p className="text-accent-coral text-[12px]">Failed to load OpenCV.js.</p>
      )}

      <div className="flex items-center gap-3">
        {ready && (
          <span className="text-[11px] font-mono tracking-wide text-accent-lime/70">● READY</span>
        )}
        <input
          type="file" accept="image/*"
          onChange={handleImage}
          disabled={!ready}
          className="text-[13px] text-white/70
            file:mr-3 file:py-1.5 file:px-4 file:rounded-full
            file:border file:border-white/10 file:bg-white/[0.05]
            file:text-white/60 file:text-[12px] file:cursor-pointer
            hover:file:bg-white/10 disabled:opacity-40 cursor-pointer"
        />
      </div>

      {status && (
        <p className={`text-[12px] font-mono ${status.startsWith('Error') ? 'text-accent-coral' : 'text-white/40'}`}>
          {status}
        </p>
      )}

      <canvas ref={canvasRef} className="rounded-lg border border-white/[0.07] max-w-full" />

      {detectedBoard && (
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold tracking-[0.22em] uppercase"
              style={{ color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.5)' }}>
              Detected Board
            </span>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </div>
          <div className="inline-grid gap-[3px] self-center"
            style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
            {detectedBoard.map((row, r) =>
              row.map((filled, c) => (
                <div key={`${r}-${c}`} className="rounded-[2px]" style={{
                  width: 30, height: 30,
                  background: filled ? 'linear-gradient(135deg, #00d4ff, #6e3bff)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${filled ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                }} />
              )),
            )}
          </div>

          {detectedPieces && detectedPieces.some(Boolean) && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold tracking-[0.22em] uppercase"
                  style={{ color: '#ff9b3b', textShadow: '0 0 8px rgba(255,155,59,0.5)' }}>
                  Detected Pieces
                </span>
                <div className="flex-1 h-px bg-white/[0.05]" />
              </div>
              <div className="flex gap-4 justify-center">
                {detectedPieces.map((piece, i) => {
                  if (!piece) return (
                    <div key={i} className="flex items-center justify-center w-[80px] h-[80px]
                      rounded-lg border border-white/[0.06] text-white/20 text-[11px]">
                      empty
                    </div>
                  )
                  const maxX   = Math.max(...piece.map(p => p.x))
                  const maxY   = Math.max(...piece.map(p => p.y))
                  const filled = new Set(piece.map(p => `${p.x},${p.y}`))
                  return (
                    <div key={i} className="inline-grid gap-[2px]"
                      style={{ gridTemplateColumns: `repeat(${maxX + 1}, 16px)` }}>
                      {Array.from({ length: maxY + 1 }, (_, r) =>
                        Array.from({ length: maxX + 1 }, (_, c) => (
                          <div key={`${r}-${c}`} className="rounded-[2px]" style={{
                            width: 16, height: 16,
                            background: filled.has(`${c},${r}`)
                              ? 'linear-gradient(135deg, #ff9b3b, #ff6b6b)'
                              : 'rgba(255,255,255,0.03)',
                          }} />
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <motion.button
            className="relative w-full py-4 rounded-xl font-russo tracking-widest uppercase
                       text-[13.5px] text-white overflow-hidden cursor-pointer"
            style={{
              background:  'linear-gradient(135deg, #00d4ff 0%, #6e3bff 60%, #9b5cff 100%)',
              border:      '1px solid rgba(0,212,255,0.35)',
              boxShadow:   '0 0 24px rgba(0,212,255,0.18), 0 0 48px rgba(155,92,255,0.12)',
            }}
            onClick={handleApply}
            whileHover={{ scale: 1.01, boxShadow: '0 0 36px rgba(0,212,255,0.32), 0 0 72px rgba(155,92,255,0.2)' }}
            whileTap={{ scale: 0.97 }}
          >
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)' }}
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2.5">
              <ArrowRightIcon />
              Apply to Setup
            </span>
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M2 7.5H13M8 2.5L13 7.5L8 12.5"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
