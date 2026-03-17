import { motion } from 'framer-motion'

interface LandingScreenProps {
  onSolveManually:    () => void
  onUploadScreenshot: () => void
}

export function LandingScreen({ onSolveManually, onUploadScreenshot }: LandingScreenProps) {
  return (
    <motion.div
      className="relative min-h-dvh flex flex-col overflow-hidden"
      style={{ background: '#1a1a1a', fontFamily: "'Space Grotesk', sans-serif" }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      {/* Floating 3D cubes — desktop only */}
      <div className="hidden lg:block">
        <Cube3D size={52} color="#FCEE09" style={{ position: 'absolute', top: '18%', left: '14%', opacity: 0.5 }} delay={0.6} />
        <Cube3D size={36} color="#00F5FF" style={{ position: 'absolute', top: '55%', left: '11%', opacity: 0.35 }} delay={0.9} />
        <Cube3D size={44} color="#FCEE09" style={{ position: 'absolute', top: '30%', right: '13%', opacity: 0.4 }} delay={0.75} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-5 md:px-8 lg:px-20 pt-5 md:pt-7">
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

      {/* ════════════════════════════════════════════
          MOBILE layout  (< 768px)
          ════════════════════════════════════════════ */}
      <div className="md:hidden relative z-10 flex flex-col items-center text-center px-5 pt-8 pb-16 flex-1">
        <motion.h1
          className="font-black text-white leading-tight tracking-tight"
          style={{ fontSize: 'clamp(26px, 8vw, 34px)', maxWidth: 340 }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          Your Block Blast Board,{' '}
          <span style={{ color: '#FCEE09' }}>Solved Instantly.</span>
        </motion.h1>

        <motion.p
          className="mt-3 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(12px, 3.5vw, 14px)', maxWidth: 'min(300px, 82vw)' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          AI-powered solver finds the optimal move sequence in under 150ms.
        </motion.p>

        {/* CTA buttons — stacked, full width */}
        <motion.div
          className="flex flex-col gap-3 mt-6 w-full"
          style={{ maxWidth: 'min(280px, 78vw)' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
        >
          <motion.button
            className="flex items-center justify-center gap-2 w-full font-bold tracking-[0.05em] uppercase cursor-pointer rounded-xl"
            style={{ background: '#FCEE09', color: '#1a1a1a', border: 'none', fontSize: 'clamp(11px, 3.5vw, 14px)', padding: 'clamp(10px, 2.5vw, 14px) 0' }}
            onClick={onSolveManually}
            whileHover={{ background: '#fff176', boxShadow: '0 0 28px rgba(252,238,9,0.4)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <PlayIcon />
            Solve Manually
          </motion.button>
          <motion.button
            className="flex items-center justify-center gap-2 w-full font-bold tracking-[0.05em] uppercase cursor-pointer rounded-xl"
            style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.4)', color: '#00F5FF', fontSize: 'clamp(11px, 3.5vw, 14px)', padding: 'clamp(10px, 2.5vw, 14px) 0' }}
            onClick={onUploadScreenshot}
            whileHover={{ background: 'rgba(0,245,255,0.16)', borderColor: 'rgba(0,245,255,0.7)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <UploadIcon />
            Upload Screenshot
          </motion.button>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 gap-3 mt-8 w-full"
          style={{ maxWidth: 'min(320px, 88vw)' }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          {/* Speed */}
          <div className="flex flex-col rounded-2xl" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', padding: 'clamp(10px, 3vw, 14px)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 'clamp(24px, 6vw, 28px)', height: 'clamp(24px, 6vw, 28px)', background: 'rgba(252,238,9,0.12)', border: '1px solid rgba(252,238,9,0.25)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#FCEE09"/>
                </svg>
              </div>
              <span className="font-black leading-none" style={{ color: '#FCEE09', fontSize: 'clamp(14px, 4.5vw, 18px)' }}>&lt;150ms</span>
            </div>
            <span className="font-mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(9px, 2.2vw, 10px)' }}>solve time</span>
          </div>

          {/* Efficiency */}
          <div className="flex flex-col rounded-2xl" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', padding: 'clamp(10px, 3vw, 14px)' }}>
            <div className="flex items-end gap-1.5 mb-1">
              <PruningBars />
              <span className="font-black leading-none mb-0.5" style={{ color: '#00F5FF', fontSize: 'clamp(14px, 4.5vw, 18px)' }}>99.4%</span>
            </div>
            <span className="font-mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(9px, 2.2vw, 10px)' }}>states pruned</span>
          </div>

          {/* Review — spans both columns */}
          <div className="col-span-2 flex flex-col rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(16px)', padding: 'clamp(10px, 3vw, 14px)' }}>
            <div className="flex gap-0.5 mb-1.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#FCEE09"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ))}
            </div>
            <p className="leading-snug text-left" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(11px, 3vw, 12px)' }}>
              "Gets the optimal move every time. Saved my streak!"
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: 20, height: 20, fontSize: 9, background: '#FCEE09', color: '#1a1a1a' }}>A</div>
              <span className="font-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(9px, 2.2vw, 10px)' }}>Alex K. · verified</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════
          TABLET layout  (768px – 1023px)
          ════════════════════════════════════════════ */}
      <div className="hidden md:flex lg:hidden relative z-10 flex-col items-center text-center px-8 pt-10 pb-16 flex-1">
        <motion.h1
          className="font-black text-white leading-tight tracking-tight"
          style={{ fontSize: 'clamp(30px, 4.5vw, 44px)', maxWidth: 520 }}
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Your Block Blast Board,{' '}
          <span style={{ color: '#FCEE09' }}>Solved Instantly.</span>
        </motion.h1>

        <motion.p
          className="mt-3 leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.45)', fontSize: 'clamp(13px, 1.8vw, 15px)', maxWidth: 'clamp(300px, 50vw, 400px)' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          AI-powered solver finds the optimal move sequence. Upload a screenshot or enter your board manually.
        </motion.p>

        {/* CTA buttons — side by side */}
        <motion.div
          className="flex gap-3 mt-7"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          <motion.button
            className="flex items-center gap-2 font-bold tracking-[0.06em] uppercase cursor-pointer rounded-xl"
            style={{ background: '#FCEE09', color: '#1a1a1a', border: 'none', fontSize: 'clamp(11px, 1.5vw, 13px)', padding: 'clamp(10px, 1.4vw, 12px) clamp(20px, 3.5vw, 28px)' }}
            onClick={onSolveManually}
            whileHover={{ background: '#fff176', boxShadow: '0 0 28px rgba(252,238,9,0.4)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <PlayIcon />
            Solve Manually
          </motion.button>
          <motion.button
            className="flex items-center gap-2 font-bold tracking-[0.06em] uppercase cursor-pointer rounded-xl"
            style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.4)', color: '#00F5FF', fontSize: 'clamp(11px, 1.5vw, 13px)', padding: 'clamp(10px, 1.4vw, 12px) clamp(20px, 3.5vw, 28px)' }}
            onClick={onUploadScreenshot}
            whileHover={{ background: 'rgba(0,245,255,0.16)', borderColor: 'rgba(0,245,255,0.7)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.1 }}
          >
            <UploadIcon />
            Upload Screenshot
          </motion.button>
        </motion.div>

        {/* Phone + horizontal stats row */}
        <div className="flex items-end justify-center gap-8 mt-8 w-full max-w-2xl">
          {/* Left stat */}
          <motion.div
            className="flex flex-col rounded-2xl self-center"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', minWidth: 'clamp(120px, 17vw, 155px)', padding: 'clamp(10px, 1.6vw, 14px)' }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center rounded-lg flex-shrink-0" style={{ width: 'clamp(22px, 3vw, 28px)', height: 'clamp(22px, 3vw, 28px)', background: 'rgba(252,238,9,0.12)', border: '1px solid rgba(252,238,9,0.25)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#FCEE09"/>
                </svg>
              </div>
              <span className="font-black leading-none" style={{ color: '#FCEE09', fontSize: 'clamp(16px, 2.4vw, 20px)' }}>&lt;150ms</span>
            </div>
            <span className="font-mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(9px, 1.1vw, 10px)' }}>solve time</span>
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: 'relative', flexShrink: 0 }}
          >
            <motion.img
              src="/iphone.png"
              alt="BlockBlaster AI on mobile"
              style={{ width: 'clamp(200px, 28vw, 300px)', height: 'auto', display: 'block' }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              style={{
                position: 'absolute', bottom: 6, left: '50%', x: '-50%',
                width: 'clamp(240px, 34vw, 360px)', height: 28, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)',
                filter: 'blur(8px)', pointerEvents: 'none',
              }}
              animate={{ scaleX: [1, 0.7, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Right stat */}
          <motion.div
            className="flex flex-col rounded-2xl self-center"
            style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', minWidth: 'clamp(120px, 17vw, 155px)', padding: 'clamp(10px, 1.6vw, 14px)' }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="flex items-end gap-1.5 mb-1">
              <PruningBars />
              <span className="font-black leading-none mb-0.5" style={{ color: '#00F5FF', fontSize: 'clamp(16px, 2.4vw, 20px)' }}>99.4%</span>
            </div>
            <span className="font-mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(9px, 1.1vw, 10px)' }}>states pruned</span>
          </motion.div>
        </div>

        {/* Review card */}
        <motion.div
          className="flex flex-col rounded-2xl mt-5 w-full"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', backdropFilter: 'blur(16px)', maxWidth: 'clamp(300px, 45vw, 384px)', padding: 'clamp(12px, 2vw, 18px) clamp(14px, 2.5vw, 20px)' }}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.45 }}
        >
          <div className="flex gap-0.5 mb-1.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#FCEE09"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>
          <p className="leading-snug text-left" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(12px, 1.6vw, 13px)' }}>
            "Gets the optimal move every time. Saved my streak!"
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: 20, height: 20, fontSize: 9, background: '#FCEE09', color: '#1a1a1a' }}>A</div>
            <span className="font-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(9px, 1.1vw, 10px)' }}>Alex K. · verified</span>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════
          DESKTOP layout  (1024px+)
          ════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:flex-col lg:flex-1">
        {/* Hero text */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-6">
          <motion.h1
            className="font-black text-white leading-tight tracking-tight"
            style={{ fontSize: 'clamp(24px, 2.8vw, 42px)', maxWidth: 'clamp(400px, 42vw, 560px)' }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            Your Block Blast Board,{' '}
            <span style={{ color: '#FCEE09' }}>Solved Instantly.</span>
          </motion.h1>

          <motion.p
            style={{ color: 'rgba(255,255,255,0.4)', fontSize: 'clamp(12px, 1.1vw, 15px)', lineHeight: 1.7, maxWidth: 'clamp(300px, 30vw, 400px)', marginTop: 10 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            AI-powered solver finds the optimal move sequence. Upload a screenshot or enter your board manually.
          </motion.p>

          <motion.div
            className="flex gap-3 flex-wrap justify-center mt-5"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <motion.button
              className="flex items-center gap-2 font-bold tracking-[0.06em] uppercase cursor-pointer rounded-lg"
              style={{ background: '#FCEE09', color: '#1a1a1a', border: 'none', fontSize: 'clamp(10px, 0.85vw, 13px)', padding: 'clamp(8px, 0.75vw, 12px) clamp(16px, 1.5vw, 24px)' }}
              onClick={onSolveManually}
              whileHover={{ background: '#fff176', boxShadow: '0 0 24px rgba(252,238,9,0.35)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
            >
              <PlayIcon />
              Solve Manually
            </motion.button>
            <motion.button
              className="flex items-center gap-2 font-bold tracking-[0.06em] uppercase cursor-pointer rounded-lg"
              style={{ background: 'rgba(0,245,255,0.07)', border: '1px solid rgba(0,245,255,0.38)', color: '#00F5FF', fontSize: 'clamp(10px, 0.85vw, 13px)', padding: 'clamp(8px, 0.75vw, 12px) clamp(16px, 1.5vw, 24px)' }}
              onClick={onUploadScreenshot}
              whileHover={{ background: 'rgba(0,245,255,0.14)', borderColor: 'rgba(0,245,255,0.65)' }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
            >
              <UploadIcon />
              Upload Screenshot
            </motion.button>
          </motion.div>
        </div>

        {/* Phone + floating cards */}
        <div className="relative z-10 flex-1 flex justify-center items-start mt-4">
          <div className="flex items-start gap-4">

            {/* Left cards */}
            <div className="flex flex-col gap-4" style={{ width: 'clamp(140px, 14vw, 195px)', paddingTop: 'clamp(30px, 3.5vw, 48px)' }}>
              <div style={{ position: 'relative', left: 'calc(clamp(80px, 10.5vw, 150px) - 10px)', zIndex: 30 }}>
                <FloatCard delay={0.75} frosted>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 'clamp(28px, 2.5vw, 36px)', height: 'clamp(28px, 2.5vw, 36px)', background: 'rgba(252,238,9,0.1)', border: '1px solid rgba(252,238,9,0.2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" fill="#FCEE09"/>
                      </svg>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-black leading-none" style={{ color: '#FCEE09', fontSize: 'clamp(16px, 1.6vw, 22px)' }}>&lt;150ms</span>
                      <span className="font-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(8px, 0.7vw, 10px)' }}>solve time</span>
                    </div>
                  </div>
                </FloatCard>
              </div>

              <div style={{ marginTop: 'clamp(100px, 11.5vw, 160px)', position: 'relative', left: 18 }}>
                <FloatCard delay={0.85} tail="right" fitContent>
                  <span className="font-mono mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(8px, 0.7vw, 10px)' }}>optimal sequence</span>
                  <MiniBoard />
                  <div className="flex items-center gap-1.5 mt-2">
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00F5FF', flexShrink: 0 }} />
                    <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(9px, 0.8vw, 11px)' }}>Solution found</span>
                  </div>
                </FloatCard>
              </div>
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
                  style={{ width: 'clamp(240px, 25vw, 360px)', height: 'auto', display: 'block', margin: '0 auto' }}
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  style={{
                    position: 'absolute', bottom: 8, left: '50%', x: '-50%',
                    width: 'clamp(300px, 31vw, 450px)', height: 32, borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%)',
                    filter: 'blur(10px)', pointerEvents: 'none',
                  }}
                  animate={{ scaleX: [1, 0.7, 1], opacity: [0.75, 0.25, 0.75] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            </div>

            {/* Right cards */}
            <div className="flex flex-col gap-4" style={{ width: 'clamp(140px, 14vw, 195px)', paddingTop: 'clamp(30px, 3.5vw, 48px)' }}>
              <FloatCard delay={0.7} tail="left">
                <div className="flex gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#FCEE09"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
                <p className="leading-snug" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'clamp(10px, 0.85vw, 12px)' }}>
                  "Gets the optimal move every time. Saved my streak!"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="rounded-full flex items-center justify-center font-bold flex-shrink-0" style={{ width: 18, height: 18, fontSize: 8, background: '#FCEE09', color: '#1a1a1a' }}>A</div>
                  <span className="font-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(8px, 0.7vw, 10px)' }}>Alex K. · verified</span>
                </div>
              </FloatCard>

              <div style={{ position: 'relative', right: 'calc(clamp(80px, 10vw, 140px) - 20px)', marginTop: 'clamp(90px, 10vw, 140px)' }}>
                <FloatCard delay={0.9} frosted>
                  <span className="font-mono mb-2" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(8px, 0.7vw, 10px)' }}>search efficiency</span>
                  <div className="flex items-end gap-1.5">
                    <PruningBars />
                    <span className="font-black leading-none mb-0.5" style={{ color: '#00F5FF', fontSize: 'clamp(15px, 1.5vw, 20px)' }}>99.4%</span>
                  </div>
                  <span className="font-mono mt-1" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(8px, 0.7vw, 10px)' }}>states pruned</span>
                </FloatCard>
              </div>
            </div>

          </div>
        </div>
      </div>

    </motion.div>
  )
}

// ─── Float Card ────────────────────────────────────────────────────────────────

function FloatCard({ children, delay, transparent, frosted, tail, fitContent }: {
  children: React.ReactNode
  delay: number
  transparent?: boolean
  frosted?: boolean
  tail?: 'left' | 'right'
  fitContent?: boolean
}) {
  if (transparent) {
    return (
      <motion.div
        className="flex flex-col px-4 py-3 rounded-2xl"
        style={{ position: 'relative', background: 'transparent' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
      >{children}</motion.div>
    )
  }

  const innerBg = frosted ? 'rgba(255,255,255,0.11)' : 'rgba(16,16,22,0.82)'
  const tailColor = innerBg

  // Gradient border (#3)
  const borderGradient = frosted
    ? 'linear-gradient(145deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.04) 55%, rgba(255,255,255,0.14) 100%)'
    : 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.14) 100%)'

  return (
    <motion.div
      style={{ position: 'relative', display: 'inline-block', borderRadius: 18, padding: 1, background: borderGradient }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      {/* Tail — sits on gradient border wrapper so it pokes outside */}
      {tail === 'right' && (
        <div style={{
          position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: `8px solid ${tailColor}`,
        }} />
      )}
      {tail === 'left' && (
        <div style={{
          position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderRight: `8px solid ${tailColor}`,
        }} />
      )}
      {/* Inner card */}
      <div
        className="flex flex-col px-4 py-3"
        style={{
          borderRadius: 17,
          background: innerBg,
          backdropFilter: 'blur(20px)',
          minWidth: fitContent ? 0 : 180,
          width: fitContent ? 'fit-content' : undefined,
          // Top-edge highlight (#2)
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.12)',
        }}
      >
        {children}
      </div>
    </motion.div>
  )
}

// ─── Mini board graphic ────────────────────────────────────────────────────────

function MiniBoard() {
  const grid = [
    [1,1,1,1,0,0,0,0],
    [1,0,0,1,0,0,0,0],
    [1,1,0,0,0,0,0,0],
    [0,1,0,1,1,1,0,0],
    [0,0,0,1,0,1,0,0],
    [0,0,0,1,1,1,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
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
      display: 'grid', gridTemplateColumns: 'repeat(8, 14px)', gap: 2,
      background: 'transparent', borderRadius: 8,
    }}>
      {grid.flat().map((v, i) => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: 3,
          ...(v ? bevel(colors[v]) : { background: 'rgba(255,255,255,0.06)' }),
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
  const h = s * 0.5

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
        <polygon points={top}   fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={0.5} />
        <polygon points={left}  fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={0.5} />
        <polygon points={right} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={0.5} />
      </svg>
    </motion.div>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V6M5 12l7-7 7 7"/>
    </svg>
  )
}

function BlockIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <rect x="1"  y="1"  width="10" height="10" rx="2.5" fill="#FCEE09" />
      <rect x="15" y="1"  width="10" height="10" rx="2.5" fill="#FCEE09" opacity="0.6" />
      <rect x="1"  y="15" width="10" height="10" rx="2.5" fill="#00F5FF" opacity="0.5" />
      <rect x="15" y="15" width="10" height="10" rx="2.5" fill="#00F5FF" opacity="0.3" />
    </svg>
  )
}
