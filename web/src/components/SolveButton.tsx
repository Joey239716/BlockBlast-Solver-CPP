import { motion } from 'framer-motion'

interface SolveButtonProps {
  onClick:  () => void
  disabled: boolean
  solving:  boolean
}

export function SolveButton({ onClick, disabled, solving }: SolveButtonProps) {
  return (
    <motion.button
      className="relative w-full py-4 rounded-xl text-[15px] font-semibold tracking-wide
                 text-white overflow-hidden cursor-pointer disabled:cursor-not-allowed
                 disabled:opacity-35 transition-opacity duration-200"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(155,92,255,0.12))',
        border: '1px solid rgba(0,212,255,0.22)',
      }}
      animate={solving ? {
        boxShadow: [
          '0 0 16px rgba(0,212,255,0.2), 0 0 32px rgba(155,92,255,0.1)',
          '0 0 36px rgba(0,212,255,0.55), 0 0 72px rgba(155,92,255,0.35)',
          '0 0 16px rgba(0,212,255,0.2), 0 0 32px rgba(155,92,255,0.1)',
        ],
      } : { boxShadow: '0 0 0px transparent' }}
      transition={solving ? { repeat: Infinity, duration: 1.6, ease: 'easeInOut' } : {}}
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
    >
      {/* Hover shimmer layer */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(155,92,255,0.08))' }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      />

      <span className="relative z-10 flex items-center justify-center gap-2">
        {solving ? (
          <>
            <SpinnerIcon />
            Solving…
          </>
        ) : (
          'Find Solution'
        )}
      </span>
    </motion.button>
  )
}

function SpinnerIcon() {
  return (
    <motion.svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
    >
      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <path
        d="M8 2a6 6 0 0 1 6 6"
        stroke="#00d4ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </motion.svg>
  )
}
