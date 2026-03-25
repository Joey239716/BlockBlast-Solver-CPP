/**
 * TestingPage.tsx
 *
 * Review pipeline for testing detection accuracy across all screenshots.
 * Decisions are persisted to localStorage and can be exported as JSON.
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useOpenCV } from '@/hooks/useOpenCV'
import { useSettings } from '@/context/SettingsContext'
import { detectBoardOnly, findBoardRect, matchPieceName } from '@/lib/detectGameState'
import { runDetectPieces } from '@/lib/detectPieces'
import { getYoloSession, runYoloBoard } from '@/lib/yoloDetect'
import type { InferenceSession } from 'onnxruntime-web'
import type { Point } from '@/types/solver'

// ─── Constants ────────────────────────────────────────────────────────────────

const PREVIEW_W  = 360
const PREVIEW_H  = 650
const LS_KEY     = 'blockblast-review'

// ─── Types ────────────────────────────────────────────────────────────────────

type Decision = 'accurate' | 'not-accurate'

interface ReviewDB {
  accurate:    string[]
  notAccurate: string[]
}

interface DetectionResult {
  board:        boolean[][] | null
  pieces:       (Point[] | null)[]
  filledCells:  number
  piecesFound:  number
}

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadDB(): ReviewDB {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as ReviewDB
  } catch {}
  return { accurate: [], notAccurate: [] }
}

function saveDB(db: ReviewDB) {
  localStorage.setItem(LS_KEY, JSON.stringify(db))
}

function getDecision(db: ReviewDB, name: string): Decision | null {
  if (db.accurate.includes(name))    return 'accurate'
  if (db.notAccurate.includes(name)) return 'not-accurate'
  return null
}

function setDecision(db: ReviewDB, name: string, decision: Decision): ReviewDB {
  const next: ReviewDB = {
    accurate:    db.accurate.filter(n => n !== name),
    notAccurate: db.notAccurate.filter(n => n !== name),
  }
  if (decision === 'accurate')    next.accurate.push(name)
  if (decision === 'not-accurate') next.notAccurate.push(name)
  return next
}

// ─── Mini board grid ──────────────────────────────────────────────────────────

function MiniBoardGrid({ board }: { board: boolean[][] }) {
  const { theme } = useSettings()
  return (
    <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(8, 10px)', gap: 1 }}>
      {board.map((row, r) =>
        row.map((filled, c) => (
          <div key={`${r}-${c}`} style={{
            width: 10, height: 10, borderRadius: 1,
            background: filled ? theme.accent : `${theme.accent}18`,
          }} />
        ))
      )}
    </div>
  )
}

// ─── Mini piece grid ──────────────────────────────────────────────────────────

function MiniPieceGrid({ piece }: { piece: Point[] | null }) {
  const { theme } = useSettings()
  if (!piece) {
    return (
      <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: `1px dashed ${theme.cardBorder}` }}>
        <span style={{ fontSize: 9, color: theme.textMuted }}>—</span>
      </div>
    )
  }
  const maxX  = Math.max(...piece.map(p => p.x))
  const maxY  = Math.max(...piece.map(p => p.y))
  const filled = new Set(piece.map(p => `${p.x},${p.y}`))
  return (
    <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${maxX + 1}, 9px)`, gap: 1 }}>
      {Array.from({ length: maxY + 1 }, (_, r) =>
        Array.from({ length: maxX + 1 }, (_, c) => (
          <div key={`${r}-${c}`} style={{
            width: 9, height: 9, borderRadius: 1,
            background: filled.has(`${c},${r}`) ? theme.accent2 : `${theme.accent2}18`,
          }} />
        ))
      )}
    </div>
  )
}

// ─── Export helpers ───────────────────────────────────────────────────────────

function downloadJSON(filename: string, data: string[]) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TestingPage() {
  const { theme }           = useSettings()
  const { cv, ready }       = useOpenCV()
  const canvasRef           = useRef<HTMLCanvasElement>(null)
  const debugCanvasRef      = useRef<HTMLCanvasElement>(null)
  const yoloRef             = useRef<InferenceSession | null>(null)

  const [images,    setImages]    = useState<string[]>([])
  const [selected,  setSelected]  = useState<string | null>(null)
  const [db,        setDB]        = useState<ReviewDB>(loadDB)
  const [result,    setResult]    = useState<DetectionResult | null>(null)
  const [status,    setStatus]    = useState('')
  const [running,   setRunning]   = useState(false)

  // Load YOLO session (shared singleton — won't re-fetch if already loaded)
  useEffect(() => {
    getYoloSession().then(s => { yoloRef.current = s }).catch(() => {})
  }, [])

  // Load manifest on mount
  useEffect(() => {
    fetch('/test-images/manifest.json')
      .then(r => r.json())
      .then((list: string[]) => {
        const images = list.filter(f => f !== 'manifest.json')
        setImages(images)
        if (images.length > 0) setSelected(images[0])
      })
      .catch(() => setStatus('Failed to load manifest.json'))
  }, [])

  // Persist db to localStorage whenever it changes
  useEffect(() => { saveDB(db) }, [db])

  // ── Run detection on selected image ────────────────────────────────────────

  const runDetection = useCallback(async (name: string) => {
    if (!ready || !cv) { setStatus('OpenCV not ready'); return }
    setRunning(true)
    setResult(null)
    setStatus('Detecting…')

    return new Promise<void>(resolve => {
      const img = new Image()
      img.onload = async () => {
        const canvas = canvasRef.current
        if (!canvas) { resolve(); return }
        canvas.width  = PREVIEW_W
        canvas.height = PREVIEW_H
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!
        ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H)

        const scale = Math.min(PREVIEW_W / img.naturalWidth, PREVIEW_H / img.naturalHeight)
        const drawW = Math.round(img.naturalWidth  * scale)
        const drawH = Math.round(img.naturalHeight * scale)
        const offX  = Math.round((PREVIEW_W - drawW) / 2)
        const offY  = Math.round((PREVIEW_H - drawH) / 2)
        ctx.drawImage(img, offX, offY, drawW, drawH)

        const imageData = ctx.getImageData(offX, offY, drawW, drawH)
        const src       = cv.matFromImageData(imageData)

        try {
          // YOLO is the primary board locator
          let boardHint: { x: number; y: number; width: number; height: number } | undefined
          if (yoloRef.current) {
            const box = await runYoloBoard(yoloRef.current, imageData)
            if (!box) {
              setResult({ board: null, pieces: [null, null, null], filledCells: 0, piecesFound: 0 })
              setStatus('Board not found')
              return
            }
            boardHint = { x: Math.round(box.x), y: Math.round(box.y), width: Math.round(box.width), height: Math.round(box.height) }
          }

          const boardOnly = detectBoardOnly(cv, src, imageData, boardHint)
          if (!boardOnly) {
            setResult({ board: null, pieces: [null, null, null], filledCells: 0, piecesFound: 0 })
            setStatus('Board not found')
            return
          }

          // Draw Canny detection — red
          const cannyRect = findBoardRect(cv, src, imageData.width, imageData.height)
          if (cannyRect) {
            ctx.strokeStyle = 'rgba(255,60,60,0.9)'; ctx.lineWidth = 3
            ctx.strokeRect(offX + cannyRect.x, offY + cannyRect.y, cannyRect.width, cannyRect.height)
          }

          // Draw YOLO detection — green
          if (boardHint) {
            ctx.strokeStyle = 'rgba(60,255,100,0.9)'; ctx.lineWidth = 3
            ctx.strokeRect(offX + boardHint.x, offY + boardHint.y, boardHint.width, boardHint.height)
          }

          // Draw refined grid lines from the YOLO-based board
          const { boardRect, cellSize } = boardOnly
          ctx.strokeStyle = 'rgba(60,255,100,0.25)'; ctx.lineWidth = 1
          for (let i = 1; i < 8; i++) {
            const x = offX + boardRect.x + i * cellSize
            ctx.beginPath(); ctx.moveTo(x, offY + boardRect.y); ctx.lineTo(x, offY + boardRect.y + boardRect.height); ctx.stroke()
            const y = offY + boardRect.y + i * cellSize
            ctx.beginPath(); ctx.moveTo(offX + boardRect.x, y); ctx.lineTo(offX + boardRect.x + boardRect.width, y); ctx.stroke()
          }

          const pieces = runDetectPieces(cv, src, imageData, canvas, offX, offY, debugCanvasRef.current ?? undefined, cellSize)
          const filledCells = boardOnly.board.flat().filter(Boolean).length
          const piecesFound = pieces.filter(Boolean).length

          setResult({ board: boardOnly.board, pieces, filledCells, piecesFound })
          setStatus(`${filledCells}/64 cells  |  ${piecesFound}/3 pieces`)
        } catch (err) {
          setStatus(`Error: ${String(err)}`)
        } finally {
          src.delete()
          setRunning(false)
          resolve()
        }
      }
      img.onerror = () => { setStatus('Failed to load image'); setRunning(false); resolve() }
      img.src = `/test-images/${name}`
    })
  }, [cv, ready])

  // Auto-detect when selection changes
  useEffect(() => {
    if (selected) void runDetection(selected)
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Review actions ─────────────────────────────────────────────────────────

  const decide = useCallback((decision: Decision) => {
    if (!selected) return
    const next = setDecision(db, selected, decision)
    setDB(next)
    // Advance to next unreviewed image
    const idx  = images.indexOf(selected)
    const rest = images.slice(idx + 1).find(n => getDecision(next, n) === null)
    if (rest) setSelected(rest)
  }, [selected, db, images])

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goTo = useCallback((name: string) => {
    if (name === selected) return
    setSelected(name)
  }, [selected])

  // ── Stats ──────────────────────────────────────────────────────────────────

  const total      = images.length
  const nAccurate  = db.accurate.length
  const nNot       = db.notAccurate.length
  const nReviewed  = nAccurate + nNot
  const nPending   = total - nReviewed
  const decision   = selected ? getDecision(db, selected) : null
  const muted      = theme.textMuted

  return (
    <div className="pt-6 flex flex-col gap-4" style={{ minHeight: 0 }}>

      {/* Header + stats + export */}
      <div className="flex items-center gap-4 flex-wrap">
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: theme.text }}>
          Detection Review
        </span>
        <div style={{ height: 1, flex: 1, background: theme.cardBorder }} />
        <span style={{ fontSize: 11, fontFamily: 'monospace', color: muted }}>
          {nReviewed}/{total} reviewed &nbsp;·&nbsp;
          <span style={{ color: '#4ade80' }}>{nAccurate} accurate</span>
          &nbsp;·&nbsp;
          <span style={{ color: '#f87171' }}>{nNot} not accurate</span>
          &nbsp;·&nbsp;
          {nPending} pending
        </span>
        <button
          onClick={() => downloadJSON('accurate.json', db.accurate)}
          style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, border: `1px solid #4ade8044`, background: '#4ade8011', color: '#4ade80', cursor: 'pointer', fontWeight: 600 }}
        >
          Export accurate.json
        </button>
        <button
          onClick={() => downloadJSON('not-accurate.json', db.notAccurate)}
          style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, border: `1px solid #f8717144`, background: '#f8717111', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}
        >
          Export not-accurate.json
        </button>
      </div>

      <div className="flex gap-4" style={{ minHeight: 0 }}>

        {/* ── Scrollable image list ─────────────────────────────────────────── */}
        <div style={{
          width: 190, flexShrink: 0,
          height: PREVIEW_H,
          overflowY: 'auto',
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: 10,
          background: `${theme.accent}05`,
        }}>
          {images.map(name => {
            const dec   = getDecision(db, name)
            const isSelected = name === selected
            return (
              <button
                key={name}
                onClick={() => goTo(name)}
                style={{
                  width: '100%',
                  padding: '5px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: isSelected ? `${theme.accent}18` : 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${theme.cardBorder}44`,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {/* Status dot */}
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  background: dec === 'accurate' ? '#4ade80'
                            : dec === 'not-accurate' ? '#f87171'
                            : `${theme.textMuted}44`,
                }} />
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: isSelected ? theme.accent : muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {name}
                </span>
              </button>
            )
          })}
        </div>

        {/* ── Preview canvas ───────────────────────────────────────────────── */}
        <div style={{ flexShrink: 0 }}>
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            style={{ display: 'block', width: PREVIEW_W, height: PREVIEW_H, borderRadius: 10, border: `1px solid ${theme.cardBorder}`, background: theme.bg }}
          />
        </div>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4" style={{ flex: 1, minWidth: 0 }}>

          {/* Review buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => decide('accurate')}
              disabled={running || !selected}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `2px solid ${decision === 'accurate' ? '#4ade80' : '#4ade8044'}`,
                background: decision === 'accurate' ? '#4ade8022' : '#4ade8008',
                color: decision === 'accurate' ? '#4ade80' : '#4ade8088',
                opacity: running ? 0.4 : 1,
              }}
            >
              Accurate
            </button>
            <button
              onClick={() => decide('not-accurate')}
              disabled={running || !selected}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `2px solid ${decision === 'not-accurate' ? '#f87171' : '#f8717144'}`,
                background: decision === 'not-accurate' ? '#f8717122' : '#f8717108',
                color: decision === 'not-accurate' ? '#f87171' : '#f8717188',
                opacity: running ? 0.4 : 1,
              }}
            >
              Not Accurate
            </button>
          </div>

          {/* Status */}
          {status && (
            <p style={{ fontSize: 11, fontFamily: 'monospace', color: status.startsWith('Error') ? '#f87171' : muted }}>
              {status}
            </p>
          )}

          {/* Board result */}
          {result?.board && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.accent, marginBottom: 6 }}>Board</p>
              <MiniBoardGrid board={result.board} />
            </div>
          )}
          {result && !result.board && (
            <p style={{ fontSize: 11, color: '#f87171' }}>Board not detected</p>
          )}

          {/* Piece results */}
          {result && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.accent2, marginBottom: 6 }}>Pieces</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {result.pieces.map((piece, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <MiniPieceGrid piece={piece} />
                    <span style={{ fontSize: 8, fontFamily: 'monospace', color: piece ? theme.accent2 : muted }}>
                      {piece ? (matchPieceName(piece) ?? '?') : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug canvas */}
          <div>
            <p style={{ fontSize: 9, fontFamily: 'monospace', marginBottom: 4, color: muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Dock mask</p>
            <canvas
              ref={debugCanvasRef}
              style={{ display: 'block', maxWidth: '100%', borderRadius: 6, border: `1px solid ${theme.cardBorder}`, background: '#000' }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}
