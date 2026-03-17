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
                 overflow-hidden cursor-pointer disabled:cursor-not-allowed
                 disabled:opacity-30 transition-opacity duration-200"
      style={{
        background:  disabled ? 'rgba(255,255,255,0.05)' : '#FCEE09',
        border:      disabled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(252,238,9,0.6)',
        boxShadow:   disabled ? 'none' : '0 0 24px rgba(252,238,9,0.25)',
        color:       disabled ? 'rgba(255,255,255,0.4)' : '#060608',
      }}
      animate={solving ? {
        boxShadow: [
          '0 0 20px rgba(252,238,9,0.3)',
          '0 0 48px rgba(252,238,9,0.7)',
          '0 0 20px rgba(252,238,9,0.3)',
        ],
      } : {}}
      transition={solving ? { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } : {}}
      whileHover={!disabled ? { scale: 1.015, boxShadow: '0 0 36px rgba(252,238,9,0.5)' } : {}}
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
        {solving ? <><SpinnerIcon />Solving…</> : <>Find Solution</>}
      </span>
    </motion.button>
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
