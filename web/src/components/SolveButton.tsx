import { motion } from 'framer-motion'

interface SolveButtonProps {
  onClick:  () => void
  disabled: boolean
  solving:  boolean
}

export function SolveButton({ onClick, disabled, solving }: SolveButtonProps) {
  return (
    <motion.button
      className="relative w-full py-4 rounded-xl text-[15px] font-russo tracking-widest uppercase
                 text-white overflow-hidden cursor-pointer disabled:cursor-not-allowed
                 disabled:opacity-30 transition-opacity duration-200"
      style={{
        background: disabled
          ? 'rgba(255,255,255,0.05)'
          : 'linear-gradient(135deg, #00d4ff 0%, #6e3bff 60%, #9b5cff 100%)',
        border: disabled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,212,255,0.35)',
        boxShadow: disabled ? 'none' : '0 0 24px rgba(0,212,255,0.18), 0 0 48px rgba(155,92,255,0.12)',
      }}
      animate={solving ? {
        boxShadow: [
          '0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(155,92,255,0.2)',
          '0 0 48px rgba(0,212,255,0.65), 0 0 96px rgba(155,92,255,0.4)',
          '0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(155,92,255,0.2)',
        ],
      } : {}}
      transition={solving ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : {}}
      whileHover={!disabled ? { scale: 1.015, boxShadow: '0 0 36px rgba(0,212,255,0.35), 0 0 72px rgba(155,92,255,0.2)' } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={onClick}
      disabled={disabled}
    >
      {/* Sheen on hover */}
      {!disabled && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)' }}
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      )}

      <span className="relative z-10 flex items-center justify-center gap-2.5">
        {solving ? (
          <>
            <SpinnerIcon />
            Solving…
          </>
        ) : (
          <>
            <BoltIcon />
            Find Solution
          </>
        )}
      </span>
    </motion.button>
  )
}

function BoltIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M8.5 1.5L3 8.5H7.5L6.5 13.5L12 6.5H7.5L8.5 1.5Z"
        fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <motion.svg
      width="16" height="16" viewBox="0 0 16 16" fill="none"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  )
}
