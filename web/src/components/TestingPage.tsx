/**
 * TestingPage.tsx
 *
 * Developer tab for testing OpenCV board and piece detection against
 * preloaded screenshot samples.
 */

import { useRef, useState, useCallback } from 'react'
import { useOpenCV } from '@/hooks/useOpenCV'
import { useSettings } from '@/context/SettingsContext'
import { detectBoardOnly } from '@/lib/detectGameState'
import { runDetectPieces } from '@/lib/detectPieces'

// ─── Test image manifest ──────────────────────────────────────────────────────

const TEST_IMAGES = [
  '1rsgj95_0.jpeg',
  '1rs3tbc_0.jpeg',
  '1rrt9vr_0.png',
  '1rropho_0.png',
  '1rqqtyv_0.png',
  '1rqstko_0.jpeg',
  '1rol6jz_0.png',
  '1rnd0a0_0.png',
  '1rmwind_0.png',
  '1rpgipt_0.jpeg',
]

// ─── Constants ────────────────────────────────────────────────────────────────

// Preview container — slightly larger than a standard iPhone screen
const PREVIEW_W = 420
const PREVIEW_H = 760

// ─── Types ────────────────────────────────────────────────────────────────────

interface BoardResult {
  board: boolean[][]
  cellSize: number
  boardRect: { x: number; y: number; width: number; height: number }
}

// ─── Mini board grid ──────────────────────────────────────────────────────────

function MiniBoardGrid({ board }: { board: boolean[][] }) {
  const { theme } = useSettings()
  return (
    <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(8, 14px)', gap: 1 }}>
      {board.map((row, r) =>
        row.map((filled, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: 14, height: 14,
              borderRadius: 2,
              background: filled ? theme.accent : `${theme.accent}18`,
              border: `1px solid ${theme.cardBorder}`,
            }}
          />
        ))
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TestingPage() {
  const { theme }           = useSettings()
  const { cv, ready }       = useOpenCV()
  const canvasRef           = useRef<HTMLCanvasElement>(null)
  const debugCanvasRef      = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<string>(TEST_IMAGES[0])
  const [status,   setStatus]   = useState<string>('')
  const [boardResult, setBoardResult] = useState<BoardResult | null>(null)

  // ── Shared: load selected image → canvas + ImageData ──────────────────────

  const loadImage = useCallback((): Promise<{ imageData: ImageData; src: any } | null> => {
    return new Promise(resolve => {
      if (!ready || !cv) { setStatus('OpenCV not ready'); resolve(null); return }
      const img = new Image()
      img.onload = () => {
        // Draw scaled into the fixed preview canvas
        const canvas = canvasRef.current
        if (!canvas) { resolve(null); return }
        canvas.width  = PREVIEW_W
        canvas.height = PREVIEW_H
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!
        ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H)

        // Fit image into preview box, centred, preserving aspect ratio
        const scale  = Math.min(PREVIEW_W / img.naturalWidth, PREVIEW_H / img.naturalHeight)
        const drawW  = Math.round(img.naturalWidth  * scale)
        const drawH  = Math.round(img.naturalHeight * scale)
        const offX   = Math.round((PREVIEW_W - drawW) / 2)
        const offY   = Math.round((PREVIEW_H - drawH) / 2)
        ctx.drawImage(img, offX, offY, drawW, drawH)

        const imageData = ctx.getImageData(offX, offY, drawW, drawH)
        const matSrc    = cv.matFromImageData(imageData)
        resolve({ imageData, src: matSrc })
      }
      img.onerror = () => { setStatus('Failed to load image'); resolve(null) }
      img.src = `/test-images/${selected}`
    })
  }, [cv, ready, selected])

  // ── Detect Board ──────────────────────────────────────────────────────────

  const handleDetectBoard = useCallback(async () => {
    setBoardResult(null)
        setStatus('Running board detection…')

    const loaded = await loadImage()
    if (!loaded) return
    const { imageData, src } = loaded

    try {
      const result = detectBoardOnly(cv, src, imageData)
      if (!result) {
        setStatus('Board not found — try a clearer screenshot')
        return
      }

      // Draw board rect + grid overlay on the canvas
      const canvas = canvasRef.current!
      const ctx    = canvas.getContext('2d')!
      const offX   = Math.round((PREVIEW_W - imageData.width)  / 2)
      const offY   = Math.round((PREVIEW_H - imageData.height) / 2)

      const toX = (x: number) => offX + x
      const toY = (y: number) => offY + y

      const { boardRect, cellSize } = result

      // Board bounding rect
      ctx.strokeStyle = 'rgba(0,212,255,0.9)'
      ctx.lineWidth   = 2
      ctx.strokeRect(toX(boardRect.x), toY(boardRect.y), boardRect.width, boardRect.height)

      // Grid lines
      ctx.strokeStyle = 'rgba(0,212,255,0.35)'
      ctx.lineWidth   = 1
      for (let i = 1; i < 8; i++) {
        const x = toX(boardRect.x + i * cellSize)
        ctx.beginPath(); ctx.moveTo(x, toY(boardRect.y)); ctx.lineTo(x, toY(boardRect.y + boardRect.height)); ctx.stroke()
        const y = toY(boardRect.y + i * cellSize)
        ctx.beginPath(); ctx.moveTo(toX(boardRect.x), y); ctx.lineTo(toX(boardRect.x + boardRect.width), y); ctx.stroke()
      }

      setBoardResult({ board: result.board, cellSize: result.cellSize, boardRect: result.boardRect })
      const filled = result.board.flat().filter(Boolean).length
      setStatus(`Board detected — ${filled}/64 cells filled  |  cellSize=${cellSize.toFixed(1)}px`)
    } finally {
      src.delete()
    }
  }, [cv, loadImage])

  // ── Detect Pieces ──────────────────────────────────────────────────────────

  const handleDetectPieces = useCallback(async () => {
    setBoardResult(null)
        setStatus('Running piece detection…')

    const loaded = await loadImage()
    if (!loaded) return
    const { imageData, src } = loaded

    try {
      const canvas = canvasRef.current!
      const offX   = Math.round((PREVIEW_W - imageData.width)  / 2)
      const offY   = Math.round((PREVIEW_H - imageData.height) / 2)

      runDetectPieces(cv, src, imageData, canvas, offX, offY, debugCanvasRef.current ?? undefined, boardResult?.cellSize)
      setStatus('Piece detection ran — check canvas overlay')
    } catch (err) {
      setStatus(`Error: ${String(err)}`)
    } finally {
      src.delete()
    }
  }, [cv, loadImage])

  // ── Render ────────────────────────────────────────────────────────────────

  const muted = theme.textMuted

  return (
    <div className="pt-8 flex flex-col gap-6">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: theme.text }}>
          CV Testing
        </span>
        <div className="flex-1 h-px" style={{ background: theme.cardBorder }} />
      </div>

      {/* Image strip */}
      <div className="flex gap-2 flex-wrap">
        {TEST_IMAGES.map(name => (
          <button
            key={name}
            onClick={() => { setSelected(name); setBoardResult(null); setStatus('') }}
            style={{
              width: 56, height: 56,
              borderRadius: 8,
              overflow: 'hidden',
              border: selected === name
                ? `2px solid ${theme.accent}`
                : `2px solid ${theme.cardBorder}`,
              padding: 0,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <img
              src={`/test-images/${name}`}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </button>
        ))}
      </div>

      {/* Main layout: preview + buttons + results */}
      <div className="flex flex-row gap-4 items-start">

        {/* Preview canvas */}
        <div style={{ flexShrink: 0 }}>
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            style={{
              display: 'block',
              width:  PREVIEW_W,
              height: PREVIEW_H,
              borderRadius: 12,
              border: `1px solid ${theme.cardBorder}`,
              background: theme.bg,
            }}
          />
        </div>

        {/* Debug canvas — dock slice mask */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: 10, fontFamily: 'monospace', marginBottom: 6, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            dock mask
          </p>
          <canvas
            ref={debugCanvasRef}
            style={{
              display: 'block',
              maxWidth: PREVIEW_W,
              borderRadius: 8,
              border: `1px solid ${theme.cardBorder}`,
              background: '#000',
            }}
          />
        </div>

        {/* Buttons + results — stacked vertically to the right */}
        <div className="flex flex-col gap-3" style={{ paddingTop: 4 }}>
          <button
            onClick={() => void handleDetectBoard()}
            disabled={!ready}
            style={{
              width: 130,
              padding: '8px 0',
              borderRadius: 10,
              border: `1px solid ${theme.accent}44`,
              background: `${theme.accent}0d`,
              color: ready ? theme.accent : muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: ready ? 'pointer' : 'not-allowed',
              opacity: ready ? 1 : 0.45,
            }}
          >
            Detect Board
          </button>
          <button
            onClick={() => void handleDetectPieces()}
            disabled={!ready}
            style={{
              width: 130,
              padding: '8px 0',
              borderRadius: 10,
              border: `1px solid ${theme.accent2}44`,
              background: `${theme.accent2}0d`,
              color: ready ? theme.accent2 : muted,
              fontSize: 12,
              fontWeight: 600,
              cursor: ready ? 'pointer' : 'not-allowed',
              opacity: ready ? 1 : 0.45,
            }}
          >
            Detect Pieces
          </button>

          {/* Status line */}
          {status && (
            <p style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 4, maxWidth: 160, lineHeight: 1.5, color: status.startsWith('Error') || status.includes('not found') ? '#ff6b6b' : muted }}>
              {status}
            </p>
          )}

          {/* Results panel */}
          <div className="flex flex-col gap-5" style={{ minWidth: 0 }}>

          {/* Board result */}
          {boardResult && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.accent, marginBottom: 8 }}>
                Board State
              </p>
              <MiniBoardGrid board={boardResult.board} />
            </div>
          )}

          {!boardResult && (
            <p style={{ fontSize: 12, color: muted }}>Select an image and run a detection.</p>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
