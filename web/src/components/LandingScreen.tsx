import { motion } from 'framer-motion'

interface LandingScreenProps {
  onSolveManually:    () => void
  onUploadScreenshot: () => void
}

export function LandingScreen({ onSolveManually, onUploadScreenshot }: LandingScreenProps) {
  return (
    <motion.div
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ background: '#1a1a1a', fontFamily: "'Space Grotesk', sans-serif" }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      {/* Floating 3D cubes */}
      <Cube3D size={52} color="#FCEE09" style={{ position: 'absolute', top: '18%', left: '4%', opacity: 0.5 }} delay={0.6} />
      <Cube3D size={36} color="#00F5FF" style={{ position: 'absolute', top: '55%', left: '1%', opacity: 0.35 }} delay={0.9} />
      <Cube3D size={44} color="#FCEE09" style={{ position: 'absolute', top: '30%', right: '3%', opacity: 0.4 }} delay={0.75} />

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

      {/* Hero text */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-10">
        <motion.h1
          className="font-black text-white leading-tight tracking-tight"
          style={{ fontSize: 'clamp(28px, 3.5vw, 46px)', maxWidth: 560 }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Your Block Blast Board,{' '}
          <span style={{ color: '#FCEE09' }}>Solved Instantly.</span>
        </motion.h1>

        <motion.p
          style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, lineHeight: 1.7, maxWidth: 400, marginTop: 12 }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          AI-powered solver finds the optimal move sequence. Upload a screenshot or enter your board manually.
        </motion.p>

        <motion.div
          className="flex gap-3 flex-wrap justify-center mt-7"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          <motion.button
            className="flex items-center gap-2 px-6 py-3 text-[13px] font-bold tracking-[0.06em] uppercase cursor-pointer"
            style={{ background: '#FCEE09', border: '1px solid #FCEE09', borderRadius: 8, color: '#1a1a1a' }}
            onClick={onSolveManually}
            whileHover={{ background: '#fff176', boxShadow: '0 0 24px rgba(252,238,9,0.35)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            ▶ Solve Manually
          </motion.button>
          <motion.button
            className="flex items-center gap-2 px-6 py-3 text-[13px] font-bold tracking-[0.06em] uppercase cursor-pointer"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.5)' }}
            onClick={onUploadScreenshot}
            whileHover={{ borderColor: 'rgba(255,255,255,0.28)', color: '#fff' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V6M5 12l7-7 7 7"/></svg>
            Upload Screenshot
          </motion.button>
        </motion.div>
      </div>

      {/* Phone + cards — flex row so cards hug the phone */}
      <div className="relative z-10 flex-1 flex justify-center items-start mt-6">
        <div className="flex items-start gap-4">

          {/* Left cards */}
          <div className="flex flex-col gap-4" style={{ width: 195, paddingTop: 48 }}>
            <FloatCard delay={0.75}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: 'rgba(252,238,9,0.1)', border: '1px solid rgba(252,238,9,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#FCEE09"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-[22px] leading-none" style={{ color: '#FCEE09' }}>&lt;150ms</span>
                  <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>solve time</span>
                </div>
              </div>
            </FloatCard>

            <FloatCard delay={0.85}>
              <span className="text-[10px] font-mono mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>optimal sequence</span>
              <MiniBoard />
              <div className="flex items-center gap-1.5 mt-2">
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00F5FF' }} />
                <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Solution found</span>
              </div>
            </FloatCard>
          </div>

          {/* Phone */}
          <div style={{ flexShrink: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: 'relative' }}
            >
              <motion.img
                src="/iphone.png"
                alt="BlockBlaster AI on mobile"
                style={{ width: 380, height: 'auto', display: 'block', margin: '0 auto' }}
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                style={{
                  position: 'absolute', bottom: 8, left: '50%', x: '-50%',
                  width: 480, height: 36, borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
                  filter: 'blur(10px)', pointerEvents: 'none',
                }}
                animate={{ scaleX: [1, 0.7, 1], opacity: [0.75, 0.25, 0.75] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.div>
          </div>

          {/* Right cards */}
          <div className="flex flex-col gap-4" style={{ width: 195, paddingTop: 48 }}>
            <FloatCard delay={0.7}>
              <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#FCEE09"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-[12px] leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                "Gets the optimal move every time. Saved my streak!"
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: '#FCEE09', color: '#1a1a1a' }}>A</div>
                <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>Alex K. · verified</span>
              </div>
            </FloatCard>

            <FloatCard delay={0.9}>
              <span className="text-[10px] font-mono mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>search efficiency</span>
              <div className="flex items-end gap-1.5">
                <PruningBars />
                <span className="font-black text-[20px] leading-none mb-0.5" style={{ color: '#00F5FF' }}>99.4%</span>
              </div>
              <span className="text-[10px] font-mono mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>states pruned</span>
            </FloatCard>
          </div>

        </div>
      </div>
    </motion.div>
  )
}

// ─── Float Card ────────────────────────────────────────────────────────────────

function FloatCard({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      className="flex flex-col px-4 py-3 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        minWidth: 180,
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      {children}
    </motion.div>
  )
}

// ─── Mini board graphic ────────────────────────────────────────────────────────

function MiniBoard() {
  const grid = [
    [1,1,0,0,0,0],
    [0,1,0,2,2,0],
    [0,0,0,0,2,0],
    [3,0,0,0,0,0],
    [3,3,0,0,4,4],
    [0,0,0,0,0,4],
  ]
  const colors: Record<number, string> = {
    1: '#f5c030',
    2: '#00F5FF',
    3: '#ff6b6b',
    4: '#a78bfa',
  }
  const bevel = (color: string) => ({
    background: `linear-gradient(160deg, ${color} 0%, ${color}aa 100%)`,
    boxShadow: [
      'inset 0 2px 0 rgba(255,255,255,0.3)',
      'inset 0 -2px 0 rgba(0,0,0,0.35)',
      'inset -2px 0 0 rgba(0,0,0,0.15)',
      '0 2px 4px rgba(0,0,0,0.4)',
    ].join(', '),
  })
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 16px)', gap: 2,
      background: '#2d1600', padding: 6, borderRadius: 8,
      border: '1px solid rgba(0,0,0,0.5)',
    }}>
      {grid.flat().map((v, i) => (
        <div key={i} style={{
          width: 16, height: 16, borderRadius: 3,
          ...(v ? bevel(colors[v]) : {
            background: '#1c0e00',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
          }),
        }} />
      ))}
    </div>
  )
}

// ─── Pruning bar graphic ───────────────────────────────────────────────────────

function PruningBars() {
  const bars = [0.3, 0.5, 0.7, 0.55, 0.9, 0.75, 1.0]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 28 }}>
      {bars.map((h, i) => (
        <motion.div
          key={i}
          style={{ width: 5, borderRadius: 3, background: 'rgba(0,245,255,0.5)' }}
          initial={{ height: 0 }}
          animate={{ height: h * 28 }}
          transition={{ delay: 0.9 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ─── 3D Cube ──────────────────────────────────────────────────────────────────

function Cube3D({ size, color, style, delay }: { size: number; color: string; style?: React.CSSProperties; delay: number }) {
  const s = size
  const h = s * 0.5  // half for isometric top face height

  const top   = `${s},0 ${s*2},${h} ${s},${s} 0,${h}`
  const left  = `0,${h} ${s},${s} ${s},${s*2} 0,${s+h}`
  const right = `${s},${s} ${s*2},${h} ${s*2},${s+h} ${s},${s*2}`

  return (
    <motion.div
      style={{ position: 'absolute', zIndex: 1, pointerEvents: 'none', ...style }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: style?.opacity ?? 0.4, scale: 1, y: [0, -10, 0] }}
      transition={{
        opacity: { delay, duration: 0.6 },
        scale:   { delay, duration: 0.6 },
        y:       { delay: delay + 0.6, duration: 5, repeat: Infinity, ease: 'easeInOut' },
      }}
    >
      <svg width={s * 2} height={s * 2} viewBox={`0 0 ${s*2} ${s*2}`} fill="none">
        <polygon points={top}   fill={color}        fillOpacity={0.9} />
        <polygon points={left}  fill={color}        fillOpacity={0.4} />
        <polygon points={right} fill={color}        fillOpacity={0.6} />
        {/* Edge lines */}
        <polygon points={top}   fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={0.5} />
        <polygon points={left}  fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={0.5} />
        <polygon points={right} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={0.5} />
      </svg>
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
