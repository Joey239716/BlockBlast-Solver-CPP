import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Point, PieceColor } from '@/types/solver'
import { PIECE_COLORS } from '@/types/solver'
import { useSettings, pieceColorHex } from '@/context/SettingsContext'
import { PIECES, PIECE_GROUPS, normalizePiece, pieceBounds } from '@/lib/pieces'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PieceSelectorProps {
  pieces:         (Point[] | null)[]
  activePieceIdx: number | null
  onPieceChange:  (idx: number, points: Point[] | null) => void
  onActiveChange: (idx: number | null) => void
  vertical?:      boolean
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PieceSelector({
  pieces, activePieceIdx, onPieceChange, onActiveChange, vertical = false,
}: PieceSelectorProps) {
  const { effectivePieceColors, theme } = useSettings()
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null)

  function openPicker(idx: number) { setPickerOpenFor(idx) }
  function closePicker()           { setPickerOpenFor(null) }

  function selectPiece(idx: number, pieceId: string) {
    onPieceChange(idx, PIECES[pieceId])
    onActiveChange(idx)
    closePicker()
  }

  function selectCustomPiece(idx: number, points: Point[]) {
    onPieceChange(idx, points)
    onActiveChange(idx)
    closePicker()
  }

  function clearPiece(idx: number, e: React.MouseEvent) {
    e.stopPropagation()
    onPieceChange(idx, null)
    if (activePieceIdx === idx) onActiveChange(null)
  }

  return (
    <>
      <div className={`flex ${vertical ? 'flex-col' : ''} gap-3`}>
        {([0, 1, 2] as const).map(idx => {
          const piece    = pieces[idx]
          const color    = PIECE_COLORS[idx]
          const isActive = activePieceIdx === idx
          const hex      = pieceColorHex(color, effectivePieceColors)
          const glow     = `${hex}72`

          return (
            <motion.button
              key={idx}
              className={`${vertical ? 'w-full' : 'flex-1'} flex flex-col items-center gap-3 p-4 rounded-xl border cursor-pointer
                         min-h-[100px] relative group`}
              style={{
                background:  isActive ? `${hex}14` : theme.cardBg,
                borderColor: isActive ? hex : theme.cardBorder,
                boxShadow:   piece && isActive ? `0 0 20px ${glow}` : 'none',
              }}
              onClick={() => openPicker(idx)}
              whileHover={{ borderColor: `${hex}66` }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Label */}
              <span
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: isActive ? hex : theme.textMuted }}
              >
                Piece {idx + 1}
              </span>

              {/* Preview or ghost cycler */}
              {piece ? (
                <PieceMiniPreview points={piece} color={color} />
              ) : (
                <GhostCycler slotIdx={idx} color={color} />
              )}

              {/* Status label */}
              <span className="text-[11px] font-medium" style={{ color: theme.textMuted }}>
                {piece ? 'Tap to change' : 'Tap to add'}
              </span>

              {/* Clear button */}
              {piece && (
                <button
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center
                             hover:bg-red-500/20 hover:text-red-400 transition-colors duration-120 cursor-pointer"
                  style={{ background: `${theme.cardBorder}`, color: theme.textMuted }}
                  onClick={e => clearPiece(idx, e)}
                  aria-label="Clear piece"
                >
                  <CloseIcon />
                </button>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Piece picker bottom-sheet modal */}
      <AnimatePresence>
        {pickerOpenFor !== null && (
          <PiecePickerModal
            slotIdx={pickerOpenFor}
            color={PIECE_COLORS[pickerOpenFor]}
            currentPiece={pieces[pickerOpenFor]}
            onSelect={selectPiece}
            onCustomSelect={selectCustomPiece}
            onClose={closePicker}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Ghost piece cycler (empty slots) ────────────────────────────────────────

const GHOST_SEQUENCE = ['5x1', 'L1', 'T2', '3x3', '2x2', 'Z1', 'L5', 'T4', '1x4', 'L13', 'Z3', 'S1']
const SLOT_START     = [0, 4, 8] // each slot starts at a different piece
const CYCLE_MS       = 3800

function GhostCycler({ slotIdx, color }: { slotIdx: number; color: PieceColor }) {
  const [seqIdx, setSeqIdx] = useState(SLOT_START[slotIdx] % GHOST_SEQUENCE.length)
  const { effectivePieceColors } = useSettings()

  useEffect(() => {
    // Stagger start time so slots don't cycle in sync
    const delay = setTimeout(() => {
      const t = setInterval(() => setSeqIdx(i => (i + 1) % GHOST_SEQUENCE.length), CYCLE_MS)
      return () => clearInterval(t)
    }, slotIdx * 700)
    return () => clearTimeout(delay)
  }, [slotIdx])

  const pieceId = GHOST_SEQUENCE[seqIdx]
  const points  = PIECES[pieceId]
  if (!points) return null

  const norm   = normalizePiece(points)
  const { w, h } = pieceBounds(norm)
  const filled = new Set(norm.map(p => `${p.x},${p.y}`))
  const hex    = pieceColorHex(color, effectivePieceColors)
  const glow   = `${hex}72`

  return (
    <div className="flex items-center justify-center" style={{ width: 56, height: 56 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pieceId}
          className="inline-grid"
          style={{ gridTemplateColumns: `repeat(${w}, 10px)`, gap: '2px' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {Array.from({ length: h }, (_, r) =>
            Array.from({ length: w }, (_, c) => {
              const on = filled.has(`${c},${r}`)
              return (
                <div
                  key={`${r}-${c}`}
                  className="rounded-[2.5px]"
                  style={{
                    width:      10,
                    height:     10,
                    background: on ? `${hex}0d` : 'transparent',
                    border:     `1px solid ${on ? `${hex}18` : 'transparent'}`,
                    boxShadow:  on ? `0 0 4px ${glow}18` : 'none',
                  }}
                />
              )
            })
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ─── Mini piece preview ───────────────────────────────────────────────────────

function PieceMiniPreview({ points, color }: { points: Point[]; color: PieceColor }) {
  const { effectivePieceColors, theme } = useSettings()
  const norm   = normalizePiece(points)
  const { w, h } = pieceBounds(norm)
  const filled = new Set(norm.map(p => `${p.x},${p.y}`))
  const hex    = pieceColorHex(color, effectivePieceColors)
  const glow   = `${hex}72`

  return (
    <div className="flex items-center justify-center" style={{ width: 56, height: 56 }}>
      <div
        className="inline-grid"
        style={{ gridTemplateColumns: `repeat(${w}, 10px)`, gap: '2px' }}
      >
        {Array.from({ length: h }, (_, r) =>
          Array.from({ length: w }, (_, c) => (
            <div
              key={`${r}-${c}`}
              className="rounded-[2.5px]"
              style={{
                width: 10, height: 10,
                background: filled.has(`${c},${r}`) ? hex : theme.cellEmpty,
                boxShadow:  filled.has(`${c},${r}`) ? `0 0 4px ${glow}` : 'none',
              }}
            />
          )),
        )}
      </div>
    </div>
  )
}

// ─── Piece picker modal (bottom sheet) ───────────────────────────────────────

interface PiecePickerModalProps {
  slotIdx:        number
  color:          PieceColor
  currentPiece:   Point[] | null
  onSelect:       (slotIdx: number, pieceId: string) => void
  onCustomSelect: (slotIdx: number, points: Point[]) => void
  onClose:        () => void
}

function PiecePickerModal({
  slotIdx, color, currentPiece, onSelect, onCustomSelect, onClose,
}: PiecePickerModalProps) {
  const { effectivePieceColors, theme } = useSettings()
  const hex = pieceColorHex(color, effectivePieceColors)

  const currentId = currentPiece
    ? Object.keys(PIECES).find(id => {
        const norm = normalizePiece(PIECES[id])
        const cur  = normalizePiece(currentPiece)
        return norm.length === cur.length &&
          norm.every((p, i) => cur[i]?.x === p.x && cur[i]?.y === p.y)
      })
    : undefined

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-[600px] max-h-[92vh] flex flex-col rounded-t-2xl"
        style={{ background: theme.bg, borderTop: `1px solid ${theme.cardBorder}`, borderLeft: `1px solid ${theme.cardBorder}`, borderRight: `1px solid ${theme.cardBorder}` }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full" style={{ background: theme.cardBorder }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: hex, boxShadow: `0 0 6px ${hex}` }} />
            <span className="text-[15px] font-semibold" style={{ color: theme.text }}>
              Select Piece {slotIdx + 1}
            </span>
          </div>
          <button
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: theme.cardBorder, color: theme.textMuted }}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="px-5 py-4 space-y-5">
            {/* Custom piece editor */}
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: theme.textMuted }}>
                Draw Custom
              </p>
              <CustomPieceEditor
                color={color}
                onConfirm={pts => onCustomSelect(slotIdx, pts)}
              />
            </div>

            {/* Divider */}
            <div className="h-px" style={{ background: theme.cardBorder }} />

            {/* Preset library */}
            {PIECE_GROUPS.map(group => (
              <div key={group.name}>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: theme.textMuted }}>
                  {group.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.ids.map(id => (
                    <PieceThumb
                      key={id}
                      id={id}
                      selected={id === currentId}
                      accentHex={hex}
                      onSelect={() => onSelect(slotIdx, id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Custom 5×5 piece editor ──────────────────────────────────────────────────

const GRID_SIZE = 5

function CustomPieceEditor({
  color, onConfirm,
}: { color: PieceColor; onConfirm: (points: Point[]) => void }) {
  const [grid, setGrid] = useState<boolean[][]>(
    () => Array.from({ length: GRID_SIZE }, () => Array<boolean>(GRID_SIZE).fill(false)),
  )
  const isPainting = useRef(false)
  const paintMode  = useRef(true) // true = fill, false = erase

  const { effectivePieceColors, theme } = useSettings()
  const hex  = pieceColorHex(color, effectivePieceColors)
  const glow = `${hex}72`

  // Stop painting on global mouseup / touchend
  useEffect(() => {
    const stop = () => { isPainting.current = false }
    window.addEventListener('mouseup',  stop)
    window.addEventListener('touchend', stop)
    return () => {
      window.removeEventListener('mouseup',  stop)
      window.removeEventListener('touchend', stop)
    }
  }, [])

  function paintCell(r: number, c: number, mode: boolean) {
    setGrid(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = mode
      return next
    })
  }

  function handleMouseDown(r: number, c: number) {
    isPainting.current = true
    paintMode.current  = !grid[r][c]
    paintCell(r, c, paintMode.current)
  }

  function handleMouseEnter(r: number, c: number) {
    if (isPainting.current) paintCell(r, c, paintMode.current)
  }

  // Touch: derive row/col from element under touch point
  function handleTouchMove(e: React.TouchEvent) {
    if (!isPainting.current) return
    e.preventDefault()
    const touch = e.touches[0]
    const el    = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!el) return
    const r = el.getAttribute('data-r')
    const c = el.getAttribute('data-c')
    if (r !== null && c !== null) paintCell(Number(r), Number(c), paintMode.current)
  }

  function handleTouchStart(r: number, c: number, e: React.TouchEvent) {
    e.preventDefault()
    isPainting.current = true
    paintMode.current  = !grid[r][c]
    paintCell(r, c, paintMode.current)
  }

  const activePoints = grid.flatMap((row, r) =>
    row.flatMap((on, c) => on ? [{ x: c, y: r }] : []),
  )
  const normalized = normalizePiece(activePoints)
  const hasAny     = activePoints.length > 0

  function handleClear() {
    setGrid(Array.from({ length: GRID_SIZE }, () => Array<boolean>(GRID_SIZE).fill(false)))
  }

  return (
    <div className="flex flex-col items-center gap-5 px-5 py-5">
      {/* Instruction */}
      <p className="text-[11px] tracking-wide" style={{ color: theme.textMuted }}>
        Click or drag to draw your piece shape
      </p>

      {/* 5×5 drawing grid */}
      <div
        className="select-none touch-none"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 5 }}
        onMouseLeave={() => { /* keep painting if cursor re-enters */ }}
        onTouchMove={handleTouchMove}
      >
        {grid.map((row, r) =>
          row.map((filled, c) => (
            <div
              key={`${r}-${c}`}
              data-r={r}
              data-c={c}
              className="rounded-md cursor-pointer transition-all duration-75"
              style={{
                width:      44,
                height:     44,
                background: filled ? hex : theme.cellEmpty,
                boxShadow:  filled ? `0 0 8px ${glow}` : 'none',
                border:     `1.5px solid ${filled ? hex : theme.cellEmptyBorder}`,
              }}
              onMouseDown={() => handleMouseDown(r, c)}
              onMouseEnter={() => handleMouseEnter(r, c)}
              onTouchStart={e => handleTouchStart(r, c, e)}
            />
          )),
        )}
      </div>

      {/* Live preview */}
      <div className="flex items-center gap-3 min-h-[24px]">
        {hasAny && (
          <>
            <span className="text-[10px] tracking-widest uppercase" style={{ color: theme.textMuted }}>Preview</span>
            <PieceMiniPreview points={normalized} color={color} />
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <button
          className="flex-1 py-2.5 rounded-xl text-[12px] font-medium transition-colors duration-150 cursor-pointer"
          style={{ border: `1px solid ${theme.cardBorder}`, background: 'transparent', color: theme.textMuted }}
          onClick={handleClear}
        >
          Clear
        </button>
        <button
          className="flex-[2] py-2.5 rounded-xl text-[12px] font-semibold transition-opacity duration-150"
          style={{
            background:  hasAny ? `linear-gradient(135deg, ${hex}, ${hex}bb)` : theme.cardBorder,
            border:      hasAny ? `1px solid ${hex}55` : `1px solid ${theme.cardBorder}`,
            color:       '#ffffff',
            opacity:     hasAny ? 1 : 0.45,
            cursor:      hasAny ? 'pointer' : 'not-allowed',
          }}
          disabled={!hasAny}
          onClick={() => { if (hasAny) onConfirm(normalized) }}
        >
          Use Piece
        </button>
      </div>
    </div>
  )
}

// ─── Piece thumbnail ──────────────────────────────────────────────────────────

interface PieceThumbProps {
  id:        string
  selected:  boolean
  accentHex: string
  onSelect:  () => void
}

function PieceThumb({ id, selected, accentHex, onSelect }: PieceThumbProps) {
  const { theme } = useSettings()
  const norm   = normalizePiece(PIECES[id])
  const { w, h } = pieceBounds(norm)
  const filled = new Set(norm.map(p => `${p.x},${p.y}`))

  return (
    <button
      className="p-2 rounded-lg border-[1.5px] transition-all duration-120 cursor-pointer"
      style={{
        background:  selected ? `${accentHex}12` : theme.cardBg,
        borderColor: selected ? accentHex : theme.cardBorder,
        boxShadow:   selected ? `0 0 8px ${accentHex}50` : 'none',
        minWidth: 40, minHeight: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onSelect}
      title={id}
    >
      <div
        className="inline-grid"
        style={{ gridTemplateColumns: `repeat(${w}, 6px)`, gap: '1.5px' }}
      >
        {Array.from({ length: h }, (_, r) =>
          Array.from({ length: w }, (_, c) => (
            <div
              key={`${r}-${c}`}
              className="rounded-[1.5px]"
              style={{
                width: 6, height: 6,
                background: filled.has(`${c},${r}`)
                  ? selected ? accentHex : theme.textMuted
                  : theme.cellEmpty,
              }}
            />
          )),
        )}
      </div>
    </button>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────


function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
