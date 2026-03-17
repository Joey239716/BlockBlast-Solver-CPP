import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { PlacementStep, PieceColor } from '@/types/solver'
import { PIECE_COLOR_VALUES, PIECE_GLOW_VALUES } from '@/types/solver'

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'placing' | 'flashing' | 'clearing' | 'settled'

interface Props {
  stepData:    PlacementStep
  placedColor: PieceColor
  stepKey:     number
  onDone?:     () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStep(board: boolean[][], placements: { x: number; y: number }[]) {
  const after = board.map(r => [...r])
  for (const p of placements) after[p.y][p.x] = true

  const clearedRows: number[] = []
  const clearedCols: number[] = []

  for (let r = 0; r < 8; r++)
    if (after[r].every(Boolean)) clearedRows.push(r)
  for (let c = 0; c < 8; c++)
    if (after.every(row => row[c])) clearedCols.push(c)

  const clearedSet = new Set<string>()
  for (const r of clearedRows) for (let c = 0; c < 8; c++) clearedSet.add(`${r},${c}`)
  for (const col of clearedCols) for (let r = 0; r < 8; r++) clearedSet.add(`${r},${col}`)

  const boardAfterClear = after.map((row, r) =>
    row.map((cell, c) => cell && !clearedSet.has(`${r},${c}`))
  )

  return { after, clearedRows, clearedCols, clearedSet, boardAfterClear }
}

// Inward offset for the collapse animation
// Row clearing: cell at col c moves toward horizontal center (3.5)
// Col clearing: cell at row r moves toward vertical center (3.5)
function inwardOffset(
  row: number, col: number,
  clearedRows: number[], clearedCols: number[],
): { x: number; y: number } {
  const PULL = 32
  let x = 0, y = 0
  if (clearedRows.includes(row)) x = (3.5 - col) * (PULL / 3.5)
  if (clearedCols.includes(col)) y = (3.5 - row) * (PULL / 3.5)
  return { x, y }
}

// Stagger delay: outermost cells clear first
function clearDelay(row: number, col: number, clearedRows: number[], clearedCols: number[]): number {
  let d = 0
  if (clearedRows.includes(row)) d = Math.max(d, Math.min(col, 7 - col) * 25)
  if (clearedCols.includes(col)) d = Math.max(d, Math.min(row, 7 - row) * 25)
  return d
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlaybackGrid({ stepData, placedColor, stepKey, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('placing')

  const { after, clearedRows, clearedCols, clearedSet, boardAfterClear } = useMemo(
    () => computeStep(stepData.boardBefore, stepData.placements),
    [stepKey],
  )

  const hasClears = clearedSet.size > 0
  const placedSet = useMemo(
    () => new Set(stepData.placements.map(p => `${p.y},${p.x}`)),
    [stepKey],
  )

  // Phase sequencing
  useEffect(() => {
    setPhase('placing')

    if (!hasClears) {
      const t = setTimeout(() => { setPhase('settled'); onDone?.() }, 480)
      return () => clearTimeout(t)
    }

    const t1 = setTimeout(() => setPhase('flashing'),  420)
    const t2 = setTimeout(() => setPhase('clearing'),  650)
    const t3 = setTimeout(() => { setPhase('settled'); onDone?.() }, 1100)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [stepKey])

  const hex  = PIECE_COLOR_VALUES[placedColor]
  const glow = PIECE_GLOW_VALUES[placedColor]

  return (
    <div className="grid grid-cols-8 gap-[3px] w-full max-w-[480px] mx-auto aspect-square select-none">
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 8 }, (_, col) => {
          const key       = `${row},${col}`
          const isPlaced  = placedSet.has(key)
          const isCleared = clearedSet.has(key)

          // Which board state to show
          const isFilled  = phase === 'settled'
            ? boardAfterClear[row][col]
            : after[row][col]

          if (isCleared && (phase === 'flashing' || phase === 'clearing')) {
            const { x, y }  = inwardOffset(row, col, clearedRows, clearedCols)
            const delay      = clearDelay(row, col, clearedRows, clearedCols)
            const isFlashing = phase === 'flashing'

            return (
              <motion.div
                key={`${stepKey}-${key}`}
                className="rounded-[7px] aspect-square w-full"
                style={{
                  background:  isPlaced ? `${hex}b3` : '#5b5bd5',
                  border:      `1px solid ${isPlaced ? hex : 'rgba(100,100,200,0.3)'}`,
                  boxShadow:   isFlashing
                    ? `0 0 20px ${isPlaced ? glow : 'rgba(255,255,255,0.5)'}, 0 0 40px ${isPlaced ? glow : 'rgba(255,255,255,0.3)'}`
                    : `0 0 8px ${isPlaced ? glow : 'rgba(255,255,255,0.2)'}`,
                }}
                animate={isFlashing ? {
                  scale: [1, 1.12, 1.08],
                  opacity: 1,
                  x: 0, y: 0,
                } : {
                  scale: 0,
                  opacity: 0,
                  x, y,
                }}
                transition={isFlashing ? {
                  duration: 0.2,
                  ease: 'easeOut',
                } : {
                  duration: 0.28,
                  ease: [0.4, 0, 0.6, 1],
                  delay: delay / 1000,
                }}
              />
            )
          }

          if (isPlaced && phase === 'placing') {
            const placedIdx = stepData.placements.findIndex(p => p.y === row && p.x === col)
            return (
              <motion.div
                key={`${stepKey}-placed-${key}`}
                className="rounded-[7px] aspect-square w-full"
                style={{
                  background: `${hex}b3`,
                  border:     `1px solid ${hex}`,
                  boxShadow:  `0 0 12px ${glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                }}
                initial={{ scale: 0.2, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{
                  type:      'spring',
                  stiffness: 500,
                  damping:   24,
                  delay:     placedIdx * 0.04,
                }}
              />
            )
          }

          // Static cell (filled or empty)
          if (phase === 'settled' && !isFilled) {
            return (
              <motion.div
                key={`${stepKey}-empty-${key}`}
                className="rounded-[7px] aspect-square w-full"
                style={{
                  background: 'rgb(26,27,42)',
                  border:     '1px solid rgba(255,255,255,0.05)',
                }}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.02 }}
              />
            )
          }

          return (
            <div
              key={key}
              className="rounded-[7px] aspect-square w-full"
              style={isFilled ? {
                background: isPlaced ? `${hex}b3` : '#5b5bd5',
                border:     `1px solid ${isPlaced ? hex : 'rgba(100,100,200,0.3)'}`,
                boxShadow:  isPlaced ? `0 0 12px ${glow}, inset 0 1px 0 rgba(255,255,255,0.15)` : 'inset 0 1px 0 rgba(255,255,255,0.07)',
              } : {
                background: 'rgb(26,27,42)',
                border:     '1px solid rgba(255,255,255,0.05)',
              }}
            />
          )
        })
      )}
    </div>
  )
}
