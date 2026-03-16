import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useOpenCV } from './hooks/useOpenCV'

interface Props {
  onBoardLoaded: (board: boolean[][]) => void
  onGoToSetup:   () => void
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

export default function OpenCVTestPage({ onBoardLoaded, onGoToSetup }: Props) {
  const { cv, ready, progress } = useOpenCV()
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [status,        setStatus]        = useState('')
  const [detectedBoard, setDetectedBoard] = useState<boolean[][] | null>(null)

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !ready || !canvasRef.current || !containerRef.current) return
    e.target.value = ''

    setStatus('Processing…')
    setDetectedBoard(null)

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

        const filled = board.flat().filter(Boolean).length
        setStatus(`Board detected — ${filled}/64 cells filled`)
        setDetectedBoard(board)

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
