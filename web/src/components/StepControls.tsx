import { motion } from 'framer-motion'

interface StepControlsProps {
  step:     number  // 0-based
  total:    number
  autoplay: { isPlaying: boolean; toggle: () => void }
  onPrev:   () => void
  onNext:   () => void
}

export function StepControls({
  step, total, autoplay, onPrev, onNext,
}: StepControlsProps) {
  const isFirst = step === 0
  const isLast  = step === total - 1

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Prev */}
      <CtrlButton
        label="Prev"
        icon={<ChevronLeft />}
        onClick={onPrev}
        disabled={isFirst}
      />

      {/* Autoplay */}
      <motion.button
        className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-xl border cursor-pointer
                   transition-colors duration-150 min-w-[80px]"
        style={{
          background: autoplay.isPlaying ? 'rgba(57,255,136,0.08)'   : '#0f0f1e',
          borderColor: autoplay.isPlaying ? '#39ff88'                  : 'rgba(255,255,255,0.07)',
          boxShadow:  autoplay.isPlaying ? '0 0 14px rgba(57,255,136,0.3)' : 'none',
          color:      autoplay.isPlaying ? '#39ff88'                  : 'rgba(255,255,255,0.45)',
        }}
        onClick={autoplay.toggle}
        disabled={isLast && !autoplay.isPlaying}
        whileTap={{ scale: 0.95 }}
      >
        <span className="leading-none flex items-center justify-center">
          {autoplay.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </span>
        <span className="text-[10px] font-medium tracking-widest uppercase">
          {autoplay.isPlaying ? 'Pause' : 'Play'}
        </span>
      </motion.button>

      {/* Next */}
      <CtrlButton
        label="Next"
        icon={<ChevronRight />}
        onClick={onNext}
        disabled={isLast}
      />
    </div>
  )
}

// ─── Shared control button ────────────────────────────────────────────────────

interface CtrlButtonProps {
  label:    string
  icon:     React.ReactNode
  onClick:  () => void
  disabled: boolean
}

function CtrlButton({ label, icon, onClick, disabled }: CtrlButtonProps) {
  return (
    <motion.button
      className="flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-xl border
                 transition-colors duration-150 min-w-[72px]"
      style={{
        background:   '#0f0f1e',
        borderColor:  'rgba(255,255,255,0.07)',
        color:        disabled ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.55)',
        cursor:       disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { borderColor: 'rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.85)' } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      transition={{ duration: 0.12 }}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[10px] font-medium tracking-widest uppercase">{label}</span>
    </motion.button>
  )
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M5 3.5L13 8L5 12.5V3.5Z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="3" height="10" rx="1" fill="currentColor" />
      <rect x="9" y="3" width="3" height="10" rx="1" fill="currentColor" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}
