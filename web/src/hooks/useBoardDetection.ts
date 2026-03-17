import { useCallback, useState } from 'react'
import { useOpenCV } from './useOpenCV'

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBoardDetection(
  onBoardLoaded: (board: boolean[][]) => void,
  onStatusChange: (status: string) => void,
) {
  const { cv, ready, progress } = useOpenCV()
  const [processing, setProcessing] = useState(false)
  const setStatus = onStatusChange

  const detect = useCallback(async (file: File) => {
    if (!ready || !cv) return
    setProcessing(true)
    onStatusChange('Processing…')

    try {
      const bitmap = await createImageBitmap(file)
      const scale  = Math.min(1, 1200 / bitmap.width, 1200 / bitmap.height)
      const w      = Math.max(1, Math.round(bitmap.width  * scale))
      const h      = Math.max(1, Math.round(bitmap.height * scale))

      const off    = document.createElement('canvas')
      off.width = w; off.height = h
      const offCtx = off.getContext('2d', { willReadFrequently: true })!
      offCtx.drawImage(bitmap, 0, 0, w, h)
      const imageData = offCtx.getImageData(0, 0, w, h)

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

      if (bestRect) {
        const insetX = Math.round(bestRect.width  * 0.025)
        const insetY = Math.round(bestRect.height * 0.025)
        const rect = {
          x:      bestRect.x + insetX,
          y:      bestRect.y + insetY,
          width:  bestRect.width  - insetX * 2,
          height: bestRect.height - insetY * 2,
        }
        const raw   = src.data as Uint8Array
        const board = detectBoardCells(raw, w, rect.x, rect.y, rect.width, rect.height, 8, 8)
        const filled = board.flat().filter(Boolean).length
        onBoardLoaded(board)
        setStatus(`Board detected — ${filled}/64 cells filled`)
      } else {
        setStatus('No board found — try a clearer screenshot')
      }

      src.delete(); gray.delete(); blurred.delete()
      edges.delete(); dilated.delete(); contours.delete(); hier.delete()
    } catch (err) {
      setStatus(`Error: ${String(err)}`)
    } finally {
      setProcessing(false)
    }
  }, [cv, ready, onBoardLoaded, onStatusChange])

  return { ready, progress, processing, detect }
}
