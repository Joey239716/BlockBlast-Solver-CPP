import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Point, PieceColor } from '@/types/solver'
import { PIECE_COLOR_VALUES, PIECE_GLOW_VALUES, PIECE_COLORS } from '@/types/solver'
import { PIECES, PIECE_GROUPS, normalizePiece, pieceBounds } from '@/lib/pieces'

// ─── Props ────────────────────────────────────────────────────────────────────

interface PieceSelectorProps {
  pieces:         (Point[] | null)[]
  activePieceIdx: number | null
  onPieceChange:  (idx: number, points: Point[] | null) => void
  onActiveChange: (idx: number | null) => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PieceSelector({
  pieces, activePieceIdx, onPieceChange, onActiveChange,
}: PieceSelectorProps) {
  const [pickerOpenFor, setPickerOpenFor] = useState<number | null>(null)

  function openPicker(idx: number) {
    setPickerOpenFor(idx)
  }

  function closePicker() {
    setPickerOpenFor(null)
  }

  function selectPiece(idx: number, pieceId: string) {
    onPieceChange(idx, PIECES[pieceId])
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
      <div className="flex gap-3">
        {([0, 1, 2] as const).map(idx => {
          const piece  = pieces[idx]
          const color  = PIECE_COLORS[idx]
          const isActive = activePieceIdx === idx
          const hex    = PIECE_COLOR_VALUES[color]
          const glow   = PIECE_GLOW_VALUES[color]

          return (
            <motion.button
              key={idx}
              className="flex-1 flex flex-col items-center gap-3 p-4 rounded-xl border cursor-pointer
                         transition-colors duration-150 min-h-[100px] relative group"
              style={{
                background: isActive ? `${hex}10` : '#0f0f1e',
                borderColor: isActive ? hex : 'rgba(255,255,255,0.07)',
                boxShadow: isActive ? `0 0 20px ${glow}` : 'none',
              }}
              onClick={() => {
                if (piece) {
                  onActiveChange(isActive ? null : idx)
                } else {
                  openPicker(idx)
                }
              }}
              whileTap={{ scale: 0.97 }}
            >
              {/* Label */}
              <span
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: isActive ? hex : 'rgba(255,255,255,0.3)' }}
              >
                Piece {idx + 1}
              </span>

              {/* Preview or empty slot */}
              {piece ? (
                <PieceMiniPreview points={piece} color={color} />
              ) : (
                <div
                  className="w-9 h-9 rounded-lg border-[1.5px] border-dashed flex items-center justify-center
                             text-xl leading-none transition-colors duration-150 group-hover:border-white/20"
                  style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.2)' }}
                >
                  +
                </div>
              )}

              {/* Select label */}
              <span className="text-[10px] text-white/20">
                {piece ? (isActive ? 'Active' : 'Tap to preview') : 'Tap to select'}
              </span>

              {/* Clear button */}
              {piece && (
                <button
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/[0.06]
                             flex items-center justify-center text-[10px] text-white/30
                             hover:bg-red-500/20 hover:text-red-400 transition-colors duration-120"
                  onClick={e => clearPiece(idx, e)}
                  aria-label="Clear piece"
                >
                  ✕
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
            onClose={closePicker}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Mini piece preview ───────────────────────────────────────────────────────

function PieceMiniPreview({ points, color }: { points: Point[]; color: PieceColor }) {
  const norm = normalizePiece(points)
  const { w, h } = pieceBounds(norm)
  const filled = new Set(norm.map(p => `${p.x},${p.y}`))
  const hex = PIECE_COLOR_VALUES[color]
  const glow = PIECE_GLOW_VALUES[color]

  return (
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
              background: filled.has(`${c},${r}`) ? hex : 'rgba(255,255,255,0.04)',
              boxShadow: filled.has(`${c},${r}`) ? `0 0 4px ${glow}` : 'none',
            }}
          />
        )),
      )}
    </div>
  )
}

// ─── Piece picker modal (bottom sheet) ───────────────────────────────────────

interface PiecePickerModalProps {
  slotIdx:      number
  color:        PieceColor
  currentPiece: Point[] | null
  onSelect:     (slotIdx: number, pieceId: string) => void
  onClose:      () => void
}

function PiecePickerModal({
  slotIdx, color, currentPiece, onSelect, onClose,
}: PiecePickerModalProps) {
  const hex = PIECE_COLOR_VALUES[color]

  // Find which piece ID the current piece matches (if any)
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
        className="w-full max-w-[600px] max-h-[72vh] flex flex-col rounded-t-2xl border-t border-x border-white/10"
        style={{ background: '#14142a' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: hex, boxShadow: `0 0 6px ${hex}` }} />
            <span className="text-[15px] font-semibold text-white">
              Select Piece {slotIdx + 1}
            </span>
          </div>
          <button
            className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center
                       text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Scrollable piece list */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          {PIECE_GROUPS.map(group => (
            <div key={group.name}>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/25 mb-3">
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
      </motion.div>
    </motion.div>
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
  const norm = normalizePiece(PIECES[id])
  const { w, h } = pieceBounds(norm)
  const filled = new Set(norm.map(p => `${p.x},${p.y}`))

  return (
    <button
      className="p-2 rounded-lg border-[1.5px] transition-all duration-120 cursor-pointer"
      style={{
        background: selected ? `${accentHex}12` : 'rgba(255,255,255,0.03)',
        borderColor: selected ? accentHex : 'rgba(255,255,255,0.07)',
        boxShadow: selected ? `0 0 8px ${accentHex}50` : 'none',
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
                  ? selected ? accentHex : 'rgba(255,255,255,0.55)'
                  : 'rgba(255,255,255,0.04)',
              }}
            />
          )),
        )}
      </div>
    </button>
  )
}
