import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Point, PieceColor } from '@/types/solver'
import { PIECE_COLOR_VALUES, PIECE_GLOW_VALUES } from '@/types/solver'

// ─── Cell styles ──────────────────────────────────────────────────────────────

function emptyCellStyle(): React.CSSProperties {
  return {
    background: 'rgb(18, 19, 36)',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.55)',
  }
}

function filledCellStyle(): React.CSSProperties {
  return {
    background: 'linear-gradient(155deg, #7272e8 0%, #4646c2 100%)',
    border: '1px solid rgba(130,130,230,0.55)',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.28)',
      'inset 0 -2px 0 rgba(0,0,0,0.38)',
      '0 2px 5px rgba(0,0,0,0.45)',
    ].join(', '),
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
  const [hoverCell,   setHoverCell]   = useState<{ row: number; col: number } | null>(null)
  const [isHovering,  setIsHovering]  = useState(false)

  // Paint gesture state (setup mode only)
  const isPainting  = useRef(false)
  const paintValue  = useRef(true) // true = filling, false = erasing

  useEffect(() => {
    const stop = () => { isPainting.current = false }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  const isSetup = props.mode === 'setup'

  // Single-cell hover highlight (setup mode only — no piece ghost preview)
  const hoverKey = isSetup && hoverCell ? `${hoverCell.row},${hoverCell.col}` : null

  // Placed-cell set (solution mode)
  const placedSet = useMemo<Set<string>>(() => {
    if (props.mode !== 'solution') return new Set()
    return new Set(props.placedCells.map(p => `${p.y},${p.x}`))
  }, [props.mode, props.mode === 'solution' ? props.placedCells : null])

  const active = isSetup && isHovering

  return (
    <div
      className="mx-auto rounded-[10px] transition-all duration-200"
      style={{
        width:      '100%',
        maxWidth:   'min(480px, calc(100vw - 2.5rem))',
        border:     active ? '1.5px solid rgba(0,212,255,0.22)' : '1.5px solid rgba(255,255,255,0.05)',
        boxShadow:  active ? '0 0 28px rgba(0,212,255,0.08), 0 0 0 3px rgba(0,212,255,0.04)' : 'none',
        padding:    '3px',
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => { setIsHovering(false); setHoverCell(null) }}
    >
    <div
      className="grid grid-cols-8 gap-[3px] w-full aspect-square select-none"
      onDragStart={e => e.preventDefault()}
      role="grid"
      aria-label="BlockBlaster AI board"
    >
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const filled     = props.board[row][col]
          const cellKey    = `${row},${col}`
          const isHovered  = cellKey === hoverKey && !filled
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
          } else if (isHovered) {
            cellStyle = {
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)',
            }
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
            <motion.button
              key={cellKey}
              role="gridcell"
              className={`rounded-[7px] aspect-square w-full ${isSetup ? 'cursor-pointer' : 'cursor-default'}`}
              style={cellStyle}
              whileTap={isSetup ? { scale: 1.06 } : {}}
              transition={{ type: 'spring', stiffness: 500, damping: 15, duration: 0.12 }}
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
    </div>
  )
}
