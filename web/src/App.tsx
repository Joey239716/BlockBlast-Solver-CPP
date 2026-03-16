import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Grid } from '@/components/Grid'
import { PieceSelector } from '@/components/PieceSelector'
import { SolveButton } from '@/components/SolveButton'
import { SolutionViewer } from '@/components/SolutionViewer'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { LandingScreen } from '@/components/LandingScreen'
import { useGrid } from '@/hooks/useGrid'
import { useSolver } from '@/hooks/useSolver'
import { useBoardDetection } from '@/hooks/useBoardDetection'
import { PIECE_COLORS } from '@/types/solver'
import { BackgroundCanvas } from '@/components/BackgroundCanvas'

type Tab = 'setup' | 'solution'

const tabVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir * -24 }),
}

export default function App() {
  const [showLanding,    setShowLanding]    = useState(true)
  const [tab,            setTab]            = useState<Tab>('setup')
  const [tabDir,         setTabDir]         = useState(1)
  const [pendingUpload,  setPendingUpload]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const grid   = useGrid()
  const solver = useSolver()
  const { ready: cvReady, progress: cvProgress, status: cvStatus, processing: cvProcessing, detect } =
    useBoardDetection(grid.loadBoard)

  useEffect(() => { void solver.init() }, [solver.init])

  // After landing upload transitions to setup, trigger file picker
  useEffect(() => {
    if (pendingUpload && !showLanding) {
      setPendingUpload(false)
      setTimeout(() => fileInputRef.current?.click(), 50)
    }
  }, [pendingUpload, showLanding])

  const TAB_ORDER: Tab[] = ['setup', 'solution']
  function switchTab(next: Tab) {
    setTabDir(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? 1 : -1)
    setTab(next)
  }

  function handleLandingUpload() {
    setShowLanding(false)
    setTab('setup')
    setPendingUpload(true)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await detect(file)
  }

  async function handleSolve() {
    await solver.solve(grid.board, grid.pieces)
    if (solver.result?.found !== false) switchTab('solution')
  }

  function handleReset() {
    grid.resetAll()
    switchTab('setup')
  }

  const canSolve = solver.ready && !solver.loading && grid.pieces.some(p => p && p.length > 0)

  return (
    <div className="min-h-screen bg-bg-base text-white">
      <BackgroundCanvas />

      {/* Hidden file input — always in DOM so landing can trigger it */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <AnimatePresence mode="wait">
        {showLanding ? (
          <div key="landing" className="relative" style={{ zIndex: 10 }}>
            <LandingScreen
              onSolveManually={() => { setShowLanding(false); setTab('setup') }}
              onUploadScreenshot={handleLandingUpload}
            />
          </div>
        ) : (
          <div key="app" className="relative" style={{ zIndex: 10 }}>
            <LoadingOverlay visible={solver.loading} />
            <Navbar activeTab={tab} onTabChange={switchTab} />

            <main className="max-w-page mx-auto px-5 pb-20">
              <AnimatePresence mode="wait" custom={tabDir}>
                {tab === 'setup' ? (
                  <motion.div
                    key="setup"
                    custom={tabDir}
                    variants={tabVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="pt-8 flex flex-col gap-6"
                  >
                    {/* WASM error banner */}
                    {solver.error && !solver.loading && (
                      <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-accent-coral/25 bg-accent-coral/[0.07] text-[12px] text-accent-coral/80">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
                          <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                          <path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                          <circle cx="7" cy="10" r="0.6" fill="currentColor"/>
                        </svg>
                        {solver.error}
                      </div>
                    )}

                    {/* Board */}
                    <section>
                      <div className="flex items-center gap-2 mb-3">
                        <span
                          className="text-[9px] font-bold tracking-[0.22em] uppercase"
                          style={{ color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.5)' }}
                        >
                          Board
                        </span>
                        <div className="flex-1 h-px bg-white/[0.05]" />
                        <UploadButton
                          ready={cvReady}
                          processing={cvProcessing}
                          progress={cvProgress}
                          onClick={() => fileInputRef.current?.click()}
                        />
                      </div>

                      {/* CV status */}
                      <AnimatePresence>
                        {cvStatus && (
                          <motion.p
                            className={`text-[11px] font-mono mb-2 ${cvStatus.startsWith('Error') ? 'text-accent-coral/70' : 'text-white/30'}`}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {cvStatus}
                          </motion.p>
                        )}
                      </AnimatePresence>

                      <Grid
                        mode="setup"
                        board={grid.board}
                        activePiece={
                          grid.activePieceIdx !== null ? grid.pieces[grid.activePieceIdx] ?? null : null
                        }
                        activePieceColor={
                          grid.activePieceIdx !== null ? PIECE_COLORS[grid.activePieceIdx] : null
                        }
                        onCellToggle={grid.toggleCell}
                        onCellSet={grid.setCell}
                      />
                    </section>

                    {/* Pieces */}
                    <section>
                      <SectionLabel>Pieces</SectionLabel>
                      <PieceSelector
                        pieces={grid.pieces}
                        activePieceIdx={grid.activePieceIdx}
                        onPieceChange={grid.setPiece}
                        onActiveChange={grid.setActivePiece}
                      />
                    </section>

                    {/* Solve */}
                    <SolveButton
                      onClick={() => void handleSolve()}
                      disabled={!canSolve}
                      solving={solver.loading}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="solution"
                    custom={tabDir}
                    variants={tabVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="pt-8"
                  >
                    {solver.result ? (
                      <SolutionViewer result={solver.result} onReset={handleReset} />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <p className="text-white/30 text-[14px]">No solution computed yet.</p>
                        <button
                          className="text-accent-cyan text-[13px] hover:underline cursor-pointer"
                          onClick={() => switchTab('setup')}
                        >
                          ← Go to Setup
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Upload button ─────────────────────────────────────────────────────────────

interface UploadButtonProps {
  ready:      boolean
  processing: boolean
  progress:   number
  onClick:    () => void
}

function UploadButton({ ready, processing, progress, onClick }: UploadButtonProps) {
  const loading = !ready && progress >= 0

  return (
    <motion.button
      onClick={onClick}
      disabled={!ready || processing}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
      style={{
        border:     '1px solid rgba(0,212,255,0.2)',
        background: 'rgba(0,212,255,0.04)',
        color:      'rgba(0,212,255,0.6)',
      }}
      whileHover={ready && !processing ? {
        borderColor: 'rgba(0,212,255,0.45)',
        background:  'rgba(0,212,255,0.1)',
        color:       'rgba(0,212,255,0.9)',
      } : {}}
      whileTap={ready && !processing ? { scale: 0.95 } : {}}
    >
      {processing ? (
        <>
          <motion.span
            className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          />
          Scanning…
        </>
      ) : loading ? (
        <>
          <span className="w-2.5 h-2.5 rounded-full border border-current border-t-transparent opacity-50" />
          Loading CV…
        </>
      ) : (
        <>
          <UploadIcon />
          Upload Screenshot
        </>
      )}
    </motion.button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="text-[9px] font-bold tracking-[0.22em] uppercase"
        style={{ color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.5)' }}
      >
        {children}
      </span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 1.5V9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4.5 4.5L7.5 1.5L10.5 4.5" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 11.5V13H13V11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
