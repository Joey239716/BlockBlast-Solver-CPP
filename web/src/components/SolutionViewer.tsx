import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { SolverResult } from '@/types/solver'
import { PIECE_COLOR_VALUES, PIECE_COLORS } from '@/types/solver'
import { Grid } from '@/components/Grid'
import { StepControls } from '@/components/StepControls'
import { useAutoplay } from '@/hooks/useAutoplay'

interface SolutionViewerProps {
  result:    SolverResult
  onReset:   () => void
}

export function SolutionViewer({ result, onReset }: SolutionViewerProps) {
  const [step, setStep] = useState(0)
  const [confettiShown, setConfettiShown] = useState(false)

  const total = result.steps.length

  const advance = useCallback(() => {
    setStep(s => {
      if (s < total - 1) return s + 1
      autoplay.stop()
      return s
    })
  }, [total])

  const autoplay = useAutoplay(advance, 1500)

  // Confetti on last step
  useEffect(() => {
    if (step === total - 1 && !confettiShown) {
      setConfettiShown(true)
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#00d4ff', '#9b5cff', '#ff6b6b', '#39ff88', '#ff9f43'],
        })
      }, 350)
    }
  }, [step, total, confettiShown])

  // Stop autoplay when result changes
  useEffect(() => {
    setStep(0)
    setConfettiShown(false)
    autoplay.stop()
  }, [result])

  if (!result.found) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-20 gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-5xl">⚠️</div>
        <p className="text-[18px] font-semibold text-white/80">No Solution Found</p>
        <p className="text-[14px] text-white/35 text-center max-w-[280px]">
          The pieces can't be placed on this board. Try adjusting your setup.
        </p>
        <button
          className="mt-4 px-5 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04]
                     text-[13px] text-white/60 hover:text-white/90 hover:bg-white/[0.07]
                     transition-colors duration-150 cursor-pointer"
          onClick={onReset}
        >
          ← Back to Setup
        </button>
      </motion.div>
    )
  }

  const currentStepData = result.steps[step]
  const pieceColor = PIECE_COLORS[currentStepData.pieceIndex]
  const pieceHex   = PIECE_COLOR_VALUES[pieceColor]
  const isLast     = step === total - 1

  // Step description text
  const minX = Math.min(...currentStepData.placements.map(p => p.x))
  const minY = Math.min(...currentStepData.placements.map(p => p.y))
  const colorNames: Record<string, string> = { cyan: 'cyan', purple: 'purple', coral: 'coral' }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Step pill */}
      <div className="flex justify-center">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full border text-[12px] font-medium"
          style={{ background: '#0f0f1e', borderColor: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: pieceHex, boxShadow: `0 0 6px ${pieceHex}` }}
          />
          <span className="text-white font-semibold">{step + 1}</span>
          <span>of</span>
          <span>{total}</span>
        </div>
      </div>

      {/* Grid */}
      <Grid
        mode="solution"
        board={currentStepData.boardBefore}
        placedCells={currentStepData.placements}
        placedColor={pieceColor}
        stepKey={step}
      />

      {/* Controls */}
      <StepControls
        step={step}
        total={total}
        autoplay={autoplay}
        onPrev={() => { autoplay.stop(); setStep(s => Math.max(0, s - 1)) }}
        onNext={() => { autoplay.stop(); setStep(s => Math.min(total - 1, s + 1)) }}
      />

      {/* Step description */}
      <p
        className="text-center text-[12px] px-4 py-3 rounded-lg border font-mono"
        style={{
          background: '#0f0f1e',
          borderColor: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.35)',
        }}
      >
        Place{' '}
        <span style={{ color: pieceHex, fontWeight: 600 }}>
          {colorNames[pieceColor]} piece
        </span>
        {' — '}top-left corner at row {minY + 1}, col {minX + 1}
      </p>

      {/* Solved banner */}
      {isLast && (
        <motion.div
          className="flex flex-col items-center gap-1.5 p-5 rounded-xl border text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(57,255,136,0.07), rgba(0,212,255,0.07))',
            borderColor: 'rgba(57,255,136,0.22)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 400, damping: 30 }}
        >
          <p
            className="text-[22px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #39ff88, #00d4ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Solved!
          </p>
          <p className="text-[13px] text-white/35">
            All {total} piece{total !== 1 ? 's' : ''} placed optimally.
          </p>
        </motion.div>
      )}

      {/* Reset button */}
      <button
        className="mx-auto px-5 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03]
                   text-[13px] text-white/40 hover:text-white/70 hover:bg-white/[0.06]
                   transition-colors duration-150 cursor-pointer"
        onClick={onReset}
      >
        ← New Puzzle
      </button>
    </motion.div>
  )
}
