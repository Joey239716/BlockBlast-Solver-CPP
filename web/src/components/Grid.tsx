import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Point, PieceColor } from '@/types/solver'
import { useSettings, pieceColorHex } from '@/context/SettingsContext'

// ─── Cell styles ──────────────────────────────────────────────────────────────

function emptyCellStyle(bg: string, border: string, shadow: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, boxShadow: shadow }
}

function filledCellStyle(color: string): React.CSSProperties {
  return {
    background: color,
    border: `1px solid ${color}88`,
    boxShadow: [
      'inset 0 3px 0 rgba(255,255,255,0.35)',
      'inset 0 -3px 0 rgba(0,0,0,0.4)',
      'inset -3px 0 0 rgba(0,0,0,0.2)',
      '0 3px 6px rgba(0,0,0,0.5)',
    ].join(', '),
  }
}

function pieceCellStyle(hex: string, opacity = 1): React.CSSProperties {
  const alpha = opacity < 1 ? Math.round(opacity * 255).toString(16).padStart(2, '0') : ''
  return {
    background: `${hex}${alpha}`,
    border: `1px solid ${hex}99`,
    boxShadow: [
      'inset 0 3px 0 rgba(255,255,255,0.3)',
      'inset 0 -3px 0 rgba(0,0,0,0.35)',
      'inset -3px 0 0 rgba(0,0,0,0.15)',
      `0 0 10px ${hex}72`,
      '0 3px 6px rgba(0,0,0,0.4)',
    ].join(', '),
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
  stepKey:      number
}

type GridProps = GridSetupProps | GridSolutionProps

// ─── Component ───────────────────────────────────────────────────────────────

export function Grid(props: GridProps) {
  const { theme, settings, effectivePieceColors } = useSettings()
  const [hoverCell,  setHoverCell]  = useState<{ row: number; col: number } | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  const isPainting = useRef(false)
  const paintValue = useRef(true)

  useEffect(() => {
    const stop = () => { isPainting.current = false }
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  const isSetup  = props.mode === 'setup'
  const hoverKey = isSetup && hoverCell ? `${hoverCell.row},${hoverCell.col}` : null

  const placedSet = useMemo<Set<string>>(() => {
    if (props.mode !== 'solution') return new Set()
    return new Set(props.placedCells.map(p => `${p.y},${p.x}`))
  }, [props.mode, props.mode === 'solution' ? props.placedCells : null])

  const active = isSetup && isHovering

  return (
    <div
      className="mx-auto rounded-[10px] transition-all duration-200"
      style={{
        width:        '100%',
        maxWidth:     'min(480px, calc(100vw - 2.5rem))',
        background:   theme.boardBg,
        border:       active
          ? `2px solid ${theme.boardActiveBorder}`
          : '2px solid rgba(0,0,0,0.6)',
        boxShadow:    active
          ? `0 0 28px ${theme.boardActiveGlow}`
          : '0 8px 32px rgba(0,0,0,0.6)',
        padding:      '6px',
        borderRadius: '14px',
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
            const filled    = props.board[row][col]
            const cellKey   = `${row},${col}`
            const isHovered = cellKey === hoverKey && !filled
            const isPlaced  = placedSet.has(cellKey)
            const placedIdx = props.mode === 'solution'
              ? props.placedCells.findIndex(p => p.y === row && p.x === col)
              : -1

            let cellStyle: React.CSSProperties
            if (isPlaced && props.mode === 'solution') {
              cellStyle = pieceCellStyle(pieceColorHex(props.placedColor, effectivePieceColors))
            } else if (filled) {
              cellStyle = filledCellStyle(settings.boardFilledColor)
            } else if (isHovered) {
              cellStyle = {
                background: 'rgba(255,255,255,0.07)',
                border:     '1px solid rgba(255,255,255,0.18)',
                boxShadow:  'inset 0 1px 0 rgba(255,255,255,0.1)',
              }
            } else {
              cellStyle = emptyCellStyle(theme.cellEmpty, theme.cellEmptyBorder, theme.cellEmptyShadow)
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
                    transition={{ type: 'spring', stiffness: 480, damping: 26, delay: placedIdx * 0.04 }}
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
                    if (paintValue.current && !filled)  (props as GridSetupProps).onCellSet(row, col, true)
                    else if (!paintValue.current && filled) (props as GridSetupProps).onCellSet(row, col, false)
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
