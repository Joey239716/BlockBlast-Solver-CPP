import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Point, PieceColor } from '@/types/solver'
import { PIECE_COLOR_VALUES, PIECE_GLOW_VALUES } from '@/types/solver'
import { normalizePiece } from '@/lib/pieces'

// ─── Cell styles ──────────────────────────────────────────────────────────────

function emptyCellStyle(): React.CSSProperties {
  return {
    background: 'rgb(26, 27, 42)',
    border: '1px solid rgba(255,255,255,0.05)',
  }
}

function filledCellStyle(): React.CSSProperties {
  return {
    background: '#5b5bd5',
    border: '1px solid rgba(100,100,200,0.3)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07)',
  }
}

function pieceCellStyle(color: PieceColor, opacity = 1): React.CSSProperties {
  const hex  = PIECE_COLOR_VALUES[color]
  const glow = PIECE_GLOW_VALUES[color]
  return {
    background: `${hex}${opacity < 1 ? Math.round(opacity * 255).toString(16).padStart(2,'0') : 'b3'}`,
    border: `1px solid ${hex}`,
    boxShadow: `0 0 12px ${glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
  }
}

function ghostInvalidStyle(): React.CSSProperties {
  return {
    background: 'rgba(255,80,80,0.2)',
    border: '1px solid rgba(255,80,80,0.4)',
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GridSetupProps {
  mode:             'setup'
  board:            boolean[][]
  activePiece:      Point[] | null
  activePieceColor: PieceColor | null
  onCellToggle:     (row: number, col: number) => void
  onCellSet:        (row: number, col: number, value: boolean) => void
}

interface GridSolutionProps {
  mode:         'solution'
  board:        boolean[][]
  placedCells:  Point[]
  placedColor:  PieceColor
  stepKey:      number      // changes each step to re-trigger animations
}

type GridProps = GridSetupProps | GridSolutionProps

// ─── Component ───────────────────────────────────────────────────────────────

export function Grid(props: GridProps) {
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null)

  // Paint gesture state (setup mode only)
  const isPainting  = useRef(false)
  const paintValue  = useRef(true) // true = filling, false = erasing

  useEffect(() => {
    const stop = () => { isPainting.current = false }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  // Ghost cells (setup mode only)
  const ghostInfo = useMemo<{ cells: Set<string>; valid: boolean } | null>(() => {
    if (props.mode !== 'setup') return null
    if (!hoverCell || !props.activePiece || props.activePiece.length === 0) return null

    const norm  = normalizePiece(props.activePiece)
    const cells = new Set<string>()
    let valid   = true

    for (const pt of norm) {
      const r = hoverCell.row + pt.y
      const c = hoverCell.col + pt.x
      if (r < 0 || r >= 8 || c < 0 || c >= 8 || props.board[r][c]) valid = false
      if (r >= 0 && r < 8 && c >= 0 && c < 8) cells.add(`${r},${c}`)
    }

    return { cells, valid }
  }, [props.mode, hoverCell, props.mode === 'setup' ? props.activePiece : null, props.board])

  // Placed-cell set (solution mode)
  const placedSet = useMemo<Set<string>>(() => {
    if (props.mode !== 'solution') return new Set()
    return new Set(props.placedCells.map(p => `${p.y},${p.x}`))
  }, [props.mode, props.mode === 'solution' ? props.placedCells : null])

  const isSetup = props.mode === 'setup'

  return (
    <div
      className="grid grid-cols-8 gap-[3px] w-full max-w-[480px] mx-auto aspect-square select-none"
      onMouseLeave={() => setHoverCell(null)}
      onDragStart={e => e.preventDefault()}
      role="grid"
      aria-label="Block Blast board"
    >
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const filled     = props.board[row][col]
          const cellKey    = `${row},${col}`
          const isGhost    = ghostInfo?.cells.has(cellKey) && !filled
          const isPlaced   = placedSet.has(cellKey)
          const placedIdx  = props.mode === 'solution'
            ? props.placedCells.findIndex(p => p.y === row && p.x === col)
            : -1

          // Determine style
          let cellStyle: React.CSSProperties
          if (isPlaced && props.mode === 'solution') {
            cellStyle = pieceCellStyle(props.placedColor)
          } else if (filled) {
            cellStyle = filledCellStyle()
          } else if (isGhost && ghostInfo && isSetup && props.activePieceColor) {
            cellStyle = ghostInfo.valid
              ? { ...pieceCellStyle(props.activePieceColor, 0.4), boxShadow: 'none' }
              : ghostInvalidStyle()
          } else {
            cellStyle = emptyCellStyle()
          }

          if (isPlaced && props.mode === 'solution') {
            return (
              <AnimatePresence key={cellKey} mode="wait">
                <motion.div
                  key={`placed-${props.stepKey}-${row}-${col}`}
                  role="gridcell"
                  className="rounded-[7px] aspect-square w-full"
                  style={cellStyle}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1,   opacity: 1 }}
                  transition={{
                    type:      'spring',
                    stiffness: 480,
                    damping:   26,
                    delay:     placedIdx * 0.04,
                  }}
                />
              </AnimatePresence>
            )
          }

          return (
            <button
              key={cellKey}
              role="gridcell"
              className={`rounded-[7px] aspect-square w-full transition-all duration-[120ms]
                ${isSetup ? 'cursor-pointer active:scale-[0.88]' : 'cursor-default'}`}
              style={cellStyle}
              onMouseDown={isSetup ? () => {
                const p = props as GridSetupProps
                paintValue.current = !filled
                isPainting.current = true
                p.onCellSet(row, col, !filled)
              } : undefined}
              onMouseEnter={isSetup ? () => {
                setHoverCell({ row, col })
                if (isPainting.current) {
                  // Only paint in the current stroke's direction; never flip already-set cells
                  if (paintValue.current && !filled) {
                    (props as GridSetupProps).onCellSet(row, col, true)
                  } else if (!paintValue.current && filled) {
                    (props as GridSetupProps).onCellSet(row, col, false)
                  }
                }
              } : undefined}
              aria-label={`row ${row + 1} col ${col + 1} ${filled ? 'filled' : 'empty'}`}
            />
          )
        }),
      )}
    </div>
  )
}
