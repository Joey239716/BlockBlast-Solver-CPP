import { motion } from 'framer-motion'

interface LandingScreenProps {
  onSolveManually:    () => void
  onUploadScreenshot: () => void
}

export function LandingScreen({ onSolveManually, onUploadScreenshot }: LandingScreenProps) {
  return (
    <motion.div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Boot-up scan line */}
      <motion.div
        className="absolute inset-x-0 z-20 pointer-events-none"
        style={{
          height: '2px',
          background:
            'linear-gradient(90deg, transparent 0%, #00d4ff 20%, rgba(155,92,255,0.8) 80%, transparent 100%)',
          boxShadow: '0 0 18px rgba(0,212,255,0.7), 0 0 40px rgba(155,92,255,0.4)',
        }}
        initial={{ top: '-2px' }}
        animate={{ top: '100vh' }}
        transition={{ duration: 0.85, ease: 'linear' }}
      />

      {/* Horizontal scan grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,212,255,0.022) 1px, transparent 1px)',
          backgroundSize: '100% 48px',
        }}
      />

      {/* Bottom gradient accent */}
      <div
        className="absolute bottom-0 inset-x-0 h-64 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(110,59,255,0.06), transparent)',
        }}
      />

      {/* Corner brackets */}
      <CornerBrackets />

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-7 max-w-[540px]">

        {/* Status badge */}
        <motion.div
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border"
          style={{
            borderColor: 'rgba(57,255,136,0.28)',
            background:  'rgba(57,255,136,0.05)',
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: '#39ff88' }}
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span
            className="text-[9.5px] font-mono tracking-[0.28em] uppercase"
            style={{ color: 'rgba(57,255,136,0.75)' }}
          >
            SOLVER ONLINE
          </span>
        </motion.div>

        {/* Title block */}
        <div className="flex flex-col items-center gap-0">
          <motion.p
            className="text-[10px] font-mono tracking-[0.55em] uppercase mb-2"
            style={{ color: 'rgba(255,255,255,0.22)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.88, duration: 0.5 }}
          >
            NOW
          </motion.p>

          <motion.h1
            className="font-russo leading-[0.87] tracking-tight select-none"
            style={{
              fontSize: 'clamp(48px, 13vw, 68px)',
              background:
                'linear-gradient(135deg, #ffffff 0%, #00d4ff 42%, #9b5cff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 28px rgba(0,212,255,0.22))',
            }}
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: 0.82,
              duration: 0.55,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            SOLVING<br />BLOCK<br />BLAST
          </motion.h1>
        </div>

        {/* Divider */}
        <motion.div
          className="flex items-center gap-3 w-full max-w-[280px]"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.1, duration: 0.45, ease: 'easeOut' }}
        >
          <div
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(to right, transparent, rgba(0,212,255,0.28))',
            }}
          />
          <span style={{ color: 'rgba(0,212,255,0.3)', fontSize: 8 }}>◆</span>
          <div
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(to left, transparent, rgba(0,212,255,0.28))',
            }}
          />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-[13px] leading-relaxed tracking-wide max-w-[280px]"
          style={{ color: 'rgba(255,255,255,0.38)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.18, duration: 0.5 }}
        >
          Find the optimal move sequence for any Block Blast board configuration.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col gap-3 w-full max-w-[300px]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.32, duration: 0.5 }}
        >
          {/* Primary — Solve Manually */}
          <motion.button
            className="relative w-full py-4 rounded-xl font-russo tracking-widest uppercase text-[13.5px] text-white overflow-hidden cursor-pointer"
            style={{
              background:
                'linear-gradient(135deg, #00d4ff 0%, #6e3bff 60%, #9b5cff 100%)',
              border: '1px solid rgba(0,212,255,0.35)',
              boxShadow:
                '0 0 24px rgba(0,212,255,0.18), 0 0 48px rgba(155,92,255,0.12)',
            }}
            onClick={onSolveManually}
            whileHover={{
              scale: 1.02,
              boxShadow:
                '0 0 40px rgba(0,212,255,0.38), 0 0 80px rgba(155,92,255,0.22)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            {/* Sheen */}
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background:
                  'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.13) 50%, transparent 60%)',
              }}
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
            <span className="relative z-10 flex items-center justify-center gap-2.5">
              <GridIcon />
              SOLVE MANUALLY
            </span>
          </motion.button>

          {/* Secondary — Upload Screenshot */}
          <motion.button
            className="w-full py-4 rounded-xl font-russo tracking-widest uppercase text-[13.5px] cursor-pointer transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'rgba(255,255,255,0.4)',
            }}
            onClick={onUploadScreenshot}
            whileHover={{
              borderColor: 'rgba(155,92,255,0.38)',
              color: 'rgba(255,255,255,0.72)',
              background: 'rgba(155,92,255,0.06)',
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
          >
            <span className="flex items-center justify-center gap-2.5">
              <UploadIcon />
              UPLOAD SCREENSHOT
            </span>
          </motion.button>
        </motion.div>

        {/* Footer metadata */}
        <motion.div
          className="flex items-center gap-2.5 font-mono uppercase"
          style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.13)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.65, duration: 0.5 }}
        >
          <span>OPENCV.JS</span>
          <span>◆</span>
          <span>WASM</span>
          <span>◆</span>
          <span>REACT</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Corner Brackets ──────────────────────────────────────────────────────────

function CornerBrackets() {
  const bracketVariants = {
    hidden: { opacity: 0, scale: 0.6 },
    show: {
      opacity: 0.42,
      scale: 1,
      transition: { delay: 0.48, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
    },
  }

  // Each bracket is a 32×32 SVG with an L-shaped path
  const color = '#00d4ff'
  const sw = 2
  const W = 32

  return (
    <>
      {/* Top-left */}
      <motion.svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} fill="none"
        className="absolute top-5 left-5"
        variants={bracketVariants} initial="hidden" animate="show">
        <path d={`M${sw} ${W} L${sw} ${sw} L${W} ${sw}`}
          stroke={color} strokeWidth={sw} strokeLinecap="square" />
      </motion.svg>

      {/* Top-right */}
      <motion.svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} fill="none"
        className="absolute top-5 right-5"
        variants={bracketVariants} initial="hidden" animate="show">
        <path d={`M${sw} ${sw} L${W - sw} ${sw} L${W - sw} ${W}`}
          stroke={color} strokeWidth={sw} strokeLinecap="square" />
      </motion.svg>

      {/* Bottom-left */}
      <motion.svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} fill="none"
        className="absolute bottom-5 left-5"
        variants={bracketVariants} initial="hidden" animate="show">
        <path d={`M${sw} ${sw} L${sw} ${W - sw} L${W} ${W - sw}`}
          stroke={color} strokeWidth={sw} strokeLinecap="square" />
      </motion.svg>

      {/* Bottom-right */}
      <motion.svg width={W} height={W} viewBox={`0 0 ${W} ${W}`} fill="none"
        className="absolute bottom-5 right-5"
        variants={bracketVariants} initial="hidden" animate="show">
        <path d={`M${sw} ${W - sw} L${W - sw} ${W - sw} L${W - sw} ${sw}`}
          stroke={color} strokeWidth={sw} strokeLinecap="square" />
      </motion.svg>
    </>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="1"  y="1"  width="5" height="5" rx="1"   fill="currentColor" />
      <rect x="9"  y="1"  width="5" height="5" rx="1"   fill="currentColor" opacity="0.7" />
      <rect x="1"  y="9"  width="5" height="5" rx="1"   fill="currentColor" opacity="0.5" />
      <rect x="9"  y="9"  width="5" height="5" rx="1"   fill="currentColor" opacity="0.35" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 1.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.5 4.5L7.5 1.5L10.5 4.5" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11.5V13H13V11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
