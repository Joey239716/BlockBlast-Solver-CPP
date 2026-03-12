import { motion, AnimatePresence } from 'framer-motion'

interface LoadingOverlayProps {
  visible: boolean
}

export function LoadingOverlay({ visible }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-5"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(8,8,16,0.82)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Concentric pulsing rings */}
          <div className="relative w-16 h-16">
            {/* Outer ring pulse */}
            <motion.div
              className="absolute inset-0 rounded-full border border-accent-cyan/20"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeOut' }}
            />
            {/* Middle ring */}
            <motion.div
              className="absolute inset-2 rounded-full border border-accent-purple/30"
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, delay: 0.3, ease: 'easeOut' }}
            />
            {/* Spinning arc */}
            <div className="absolute inset-3">
              <motion.svg
                viewBox="0 0 40 40"
                className="w-full h-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <circle cx="20" cy="20" r="17" stroke="rgba(0,212,255,0.12)" strokeWidth="3" fill="none" />
                <path
                  d="M 20 3 A 17 17 0 0 1 37 20"
                  stroke="#00d4ff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(0,212,255,0.7))' }}
                />
              </motion.svg>
            </div>
            {/* Center dot */}
            <motion.div
              className="absolute inset-[22px] rounded-full bg-accent-purple"
              animate={{ scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
              style={{ boxShadow: '0 0 10px rgba(155,92,255,0.8)' }}
            />
          </div>

          <motion.p
            className="text-[13px] text-white/40 tracking-widest uppercase font-medium"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            Solving…
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
