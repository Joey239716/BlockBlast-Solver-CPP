import { motion } from 'framer-motion'

interface LandingScreenProps {
  onSolveManually:    () => void
  onUploadScreenshot: () => void
}

export function LandingScreen({ onSolveManually, onUploadScreenshot }: LandingScreenProps) {
  return (
    <motion.div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#060608' }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 md:px-20 pt-7">
        <div className="flex items-center gap-2">
          <BlockIcon />
          <span className="font-bold text-[15px] tracking-tight">
            <span className="text-white">Block</span>
            <span style={{ color: '#FCEE09' }}>Blaster</span>
            <span className="font-mono font-normal text-[10px] ml-1.5" style={{ color: 'rgba(252,238,9,0.4)' }}>AI</span>
          </span>
        </div>
        <motion.button
          className="px-4 py-2 text-[12px] font-bold tracking-[0.1em] uppercase cursor-pointer"
          style={{ border: '1px solid rgba(252,238,9,0.3)', borderRadius: 6, color: 'rgba(252,238,9,0.8)', background: 'transparent' }}
          onClick={onSolveManually}
          whileHover={{ borderColor: '#FCEE09', color: '#FCEE09', background: 'rgba(252,238,9,0.06)' }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
        >
          Launch App →
        </motion.button>
      </nav>

      {/* ── Centered hero text ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{
            padding: '4px 14px', borderRadius: 100,
            border: '1px solid rgba(252,238,9,0.22)',
            background: 'rgba(252,238,9,0.05)',
            color: 'rgba(252,238,9,0.7)',
            fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
          }}
        >
          ✦ FREE · RUNS IN YOUR BROWSER
        </motion.div>

        <motion.h1
          className="font-black text-white leading-tight tracking-tight mt-5"
          style={{ fontSize: 'clamp(34px, 5vw, 62px)', maxWidth: 680 }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Your Block Blast board,{' '}
          <span style={{ color: '#FCEE09' }}>solved instantly.</span>
        </motion.h1>

        <motion.p
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, maxWidth: 460, marginTop: 14 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          AI-powered solver finds the optimal move sequence. Upload a screenshot or enter your board manually — no login required.
        </motion.p>

        <motion.div
          className="flex gap-3 flex-wrap justify-center mt-6"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
        >
          <motion.button
            className="flex items-center gap-2 px-7 py-3.5 text-[13px] font-bold tracking-[0.08em] uppercase cursor-pointer"
            style={{ background: '#FCEE09', border: '1px solid #FCEE09', borderRadius: 8, color: '#060608' }}
            onClick={onSolveManually}
            whileHover={{ background: '#fff176', boxShadow: '0 0 28px rgba(252,238,9,0.4)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            ▶ Solve Manually
          </motion.button>
          <motion.button
            className="flex items-center gap-2 px-7 py-3.5 text-[13px] font-bold tracking-[0.08em] uppercase cursor-pointer"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.5)' }}
            onClick={onUploadScreenshot}
            whileHover={{ borderColor: 'rgba(255,255,255,0.28)', color: '#fff' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            ⊞ Upload Screenshot
          </motion.button>
        </motion.div>
      </div>

      {/* ── Phone + floating cards ── */}
      <div className="relative z-10 flex-1 flex items-start justify-center mt-2" style={{ minHeight: 500 }}>

        {/* Floating card: top-left */}
        <FloatCard delay={0.65} style={{ position: 'absolute', left: '12%', top: '4%' }}>
          <span className="font-black text-[22px] leading-none" style={{ color: '#FCEE09' }}>&lt;150ms</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>solve time</span>
        </FloatCard>

        {/* Floating card: top-right */}
        <FloatCard delay={0.75} style={{ position: 'absolute', right: '12%', top: '4%' }}>
          <div className="flex items-center gap-2">
            <span style={{ color: '#00F5FF', fontSize: 14 }}>✓</span>
            <span className="font-semibold text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>Solution found!</span>
          </div>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>optimal move sequence</span>
        </FloatCard>

        {/* Floating card: mid-left */}
        <FloatCard delay={0.85} style={{ position: 'absolute', left: '6%', top: '42%' }}>
          <span className="font-black text-[22px] leading-none" style={{ color: '#00F5FF' }}>99.4%</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>states pruned</span>
        </FloatCard>

        {/* Floating card: mid-right */}
        <FloatCard delay={0.9} style={{ position: 'absolute', right: '6%', top: '42%' }}>
          <span className="font-black text-[22px] leading-none" style={{ color: '#FCEE09' }}>38</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>piece types</span>
        </FloatCard>

        {/* Floating badge: bottom-left */}
        <FloatCard delay={1.0} style={{ position: 'absolute', left: '14%', bottom: '18%' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FCEE09' }} />
            <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>No login required</span>
          </div>
        </FloatCard>

        {/* Floating badge: bottom-right */}
        <FloatCard delay={1.05} style={{ position: 'absolute', right: '14%', bottom: '18%' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00F5FF' }} />
            <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Runs in browser</span>
          </div>
        </FloatCard>

        {/* Phone image — centered, bleeds off bottom */}
        {/* Entrance wrapper */}
        <motion.div
          style={{ position: 'relative', zIndex: 5 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Float loop */}
          <motion.img
            src="/iphone Image hero.png"
            alt="BlockBlaster AI on mobile"
            style={{ width: 1000, height: 'auto', display: 'block' }}
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Subtle bottom glow under phone */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 120,
          background: 'radial-gradient(ellipse, rgba(252,238,9,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }} />
      </div>
    </motion.div>
  )
}

// ─── Float Card ────────────────────────────────────────────────────────────────

function FloatCard({ children, delay, style }: { children: React.ReactNode; delay: number; style?: React.CSSProperties }) {
  return (
    <motion.div
      className="flex flex-col gap-1 px-4 py-3 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        ...style,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

// ─── Block Icon ────────────────────────────────────────────────────────────────

function BlockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
      <rect x="1"  y="1"  width="10" height="10" rx="2.5" fill="#FCEE09" />
      <rect x="15" y="1"  width="10" height="10" rx="2.5" fill="#FCEE09" opacity="0.6" />
      <rect x="1"  y="15" width="10" height="10" rx="2.5" fill="#00F5FF" opacity="0.5" />
      <rect x="15" y="15" width="10" height="10" rx="2.5" fill="#00F5FF" opacity="0.3" />
    </svg>
  )
}
