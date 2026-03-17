import { motion } from 'framer-motion'

interface LandingScreenProps {
  onSolveManually:    () => void
  onUploadScreenshot: () => void
}

export function LandingScreen({ onSolveManually, onUploadScreenshot }: LandingScreenProps) {
  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden scanlines"
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Yellow center atmospheric glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(252,238,9,0.05) 0%, rgba(0,245,255,0.03) 45%, transparent 72%)',
        }}
      />

      {/* Top horizontal accent line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(252,238,9,0.5) 30%, rgba(252,238,9,0.8) 50%, rgba(252,238,9,0.5) 70%, transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Bottom horizontal accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.3) 30%, rgba(0,245,255,0.5) 50%, rgba(0,245,255,0.3) 70%, transparent)' }}
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Corner brackets */}
      <CornerBrackets />

      {/* ── Main content ─────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-8 max-w-[540px]">

        {/* Status badge */}
        {/* Title */}
        <motion.div
          className="flex flex-col items-center select-none"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            className="font-black text-white leading-[0.92] tracking-tighter"
            style={{ fontSize: 'clamp(52px, 14vw, 80px)' }}
          >
            BLOCKBLASTER
          </h1>
          <div
            className="font-black font-mono leading-[0.92] tracking-tighter"
            style={{ fontSize: 'clamp(52px, 14vw, 80px)', color: '#FCEE09' }}
          >
            AI
          </div>
        </motion.div>

        {/* Horizontal rule with ornament */}
        <motion.div
          className="flex items-center gap-3 w-full max-w-[360px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <div className="flex-1 h-px" style={{ background: 'rgba(252,238,9,0.2)' }} />
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1 h-1 rotate-45" style={{ background: i === 1 ? '#FCEE09' : 'rgba(252,238,9,0.35)' }} />
            ))}
          </div>
          <div className="flex-1 h-px" style={{ background: 'rgba(252,238,9,0.2)' }} />
        </motion.div>

        {/* Stat chips */}
        <motion.div
          className="flex gap-2.5 flex-wrap justify-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          {['8×8 GRID', '3 PIECES', 'INSTANT SOLVE'].map(label => (
            <StatChip key={label} label={label} />
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.div
          className="flex flex-col gap-1 text-[12px] font-mono tracking-wide"
          style={{ color: 'rgba(255,255,255,0.3)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.4 }}
        >
          <span>// FIND THE OPTIMAL MOVE SEQUENCE</span>
          <span>// FOR ANY BOARD CONFIGURATION</span>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-[300px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.4 }}
        >
          {/* Primary */}
          <motion.button
            className="w-full py-3.5 text-[13px] font-bold tracking-[0.18em] uppercase cursor-pointer flex items-center justify-center gap-3"
            style={{
              background:   '#FCEE09',
              border:       '1px solid #FCEE09',
              borderRadius: '2px',
              color:        '#060608',
            }}
            onClick={onSolveManually}
            whileHover={{ background: '#fff176', borderColor: '#fff176', boxShadow: '0 0 24px rgba(252,238,9,0.45)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <span style={{ fontSize: 11 }}>▶</span>
            SOLVE MANUALLY
          </motion.button>

          {/* Secondary */}
          <motion.button
            className="w-full py-3.5 text-[13px] font-bold tracking-[0.18em] uppercase cursor-pointer flex items-center justify-center gap-3"
            style={{
              background:   'transparent',
              border:       '1px solid rgba(252,238,9,0.4)',
              borderRadius: '2px',
              color:        'rgba(252,238,9,0.65)',
            }}
            onClick={onUploadScreenshot}
            whileHover={{ borderColor: '#FCEE09', color: '#FCEE09', boxShadow: '0 0 16px rgba(252,238,9,0.2)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <span style={{ fontSize: 11 }}>⊞</span>
            UPLOAD SCREENSHOT
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p
          className="text-[9px] font-mono tracking-[0.25em] uppercase"
          style={{ color: 'rgba(252,238,9,0.2)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.35, duration: 0.5 }}
        >
          SOLVE NOW
        </motion.p>
      </div>
    </motion.div>
  )
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({ label }: { label: string }) {
  return (
    <div
      className="px-2.5 py-1 text-[9px] font-mono tracking-[0.18em] uppercase"
      style={{
        border:      '1px solid rgba(252,238,9,0.22)',
        background:  'rgba(252,238,9,0.04)',
        color:       'rgba(252,238,9,0.55)',
        borderRadius: '2px',
      }}
    >
      {label}
    </div>
  )
}

// ─── Corner Brackets ──────────────────────────────────────────────────────────

function CornerBrackets() {
  const variants = {
    hidden: { opacity: 0 },
    show:   { opacity: 1, transition: { delay: 0.25, duration: 0.5 } },
  }
  const color = 'rgba(252,238,9,0.45)'
  const W = 36

  return (
    <>
      <motion.svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} fill="none"
        className="absolute top-5 left-5" variants={variants} initial="hidden" animate="show">
        <path d={`M1 ${W} L1 1 L${W} 1`} stroke={color} strokeWidth="1.5" strokeLinecap="square" />
      </motion.svg>
      <motion.svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} fill="none"
        className="absolute top-5 right-5" variants={variants} initial="hidden" animate="show">
        <path d={`M1 1 L${W-1} 1 L${W-1} ${W}`} stroke={color} strokeWidth="1.5" strokeLinecap="square" />
      </motion.svg>
      <motion.svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} fill="none"
        className="absolute bottom-5 left-5" variants={variants} initial="hidden" animate="show">
        <path d={`M1 1 L1 ${W-1} L${W} ${W-1}`} stroke={color} strokeWidth="1.5" strokeLinecap="square" />
      </motion.svg>
      <motion.svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} fill="none"
        className="absolute bottom-5 right-5" variants={variants} initial="hidden" animate="show">
        <path d={`M1 ${W-1} L${W-1} ${W-1} L${W-1} 1`} stroke={color} strokeWidth="1.5" strokeLinecap="square" />
      </motion.svg>
    </>
  )
}
