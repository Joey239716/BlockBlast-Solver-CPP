import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Grid } from '@/components/Grid'
import { PieceSelector } from '@/components/PieceSelector'
import { SolveButton } from '@/components/SolveButton'
import { SolutionViewer } from '@/components/SolutionViewer'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { LandingScreen } from '@/components/LandingScreen'
import { UploadModal } from '@/components/UploadModal'
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

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export default function App() {
  const [showLanding, setShowLanding] = useState(true)
  const [tab,         setTab]         = useState<Tab>('setup')
  const [tabDir,      setTabDir]      = useState(1)
  const [showUpload,  setShowUpload]  = useState(false)
  const isDesktop = useIsDesktop()

  const grid   = useGrid()
  const solver = useSolver()
  const [cvStatus, setCvStatus] = useState('')
  const { ready: cvReady, progress: cvProgress, processing: cvProcessing, detect } =
    useBoardDetection(grid.loadBoard, setCvStatus)

  useEffect(() => { void solver.init() }, [solver.init])

  const TAB_ORDER: Tab[] = ['setup', 'solution']
  function switchTab(next: Tab) {
    setTabDir(TAB_ORDER.indexOf(next) > TAB_ORDER.indexOf(tab) ? 1 : -1)
    setTab(next)
  }

  function openUpload() {
    setShowLanding(false)
    setTab('setup')
    setShowUpload(true)
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

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onFile={detect}
      />

      <AnimatePresence mode="wait">
        {showLanding ? (
          <div key="landing" className="relative" style={{ zIndex: 10 }}>
            <LandingScreen
              onSolveManually={() => { setShowLanding(false); setTab('setup') }}
              onUploadScreenshot={openUpload}
            />
          </div>
        ) : (
          <div key="app" className="relative" style={{ zIndex: 10 }}>
            <LoadingOverlay visible={solver.loading} />
            <Navbar activeTab={tab} onTabChange={switchTab} />

            <main className="max-w-page md:max-w-[960px] mx-auto px-5 pb-20">
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

                    {/* Board + Pieces side-by-side on desktop */}
                    <div className="flex flex-col md:flex-row md:items-start md:gap-8 gap-6">

                      {/* Board */}
                      <section className="md:flex-shrink-0 md:w-[480px]">
                        <SectionLabel>Board</SectionLabel>

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

                        {/* CV status */}
                        <AnimatePresence>
                          {cvStatus && (
                            <motion.p
                              className={`text-[11px] font-mono mt-2 ${cvStatus.startsWith('Error') ? 'text-accent-coral/70' : 'text-white/55'}`}
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {cvStatus}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        {/* Board actions */}
                        <div className="flex gap-3 mt-3">
                          <UploadButton
                            ready={cvReady}
                            processing={cvProcessing}
                            progress={cvProgress}
                            onClick={() => setShowUpload(true)}
                          />
                          <UndoButton disabled={!grid.canUndo} onClick={grid.undo} />
                        </div>
                      </section>

                      {/* Pieces */}
                      <section className="md:w-[220px] md:flex-shrink-0">
                        <SectionLabel>Pieces</SectionLabel>
                        <PieceSelector
                          pieces={grid.pieces}
                          activePieceIdx={grid.activePieceIdx}
                          onPieceChange={grid.setPiece}
                          onActiveChange={grid.setActivePiece}
                          vertical={isDesktop}
                        />

                        {/* Solve button in sidebar on desktop */}
                        {isDesktop && (
                          <div className="mt-6">
                            <SolveButton
                              onClick={() => void handleSolve()}
                              disabled={!canSolve}
                              solving={solver.loading}
                            />
                          </div>
                        )}
                      </section>
                    </div>

                    {/* Solve button below on mobile */}
                    {!isDesktop && (
                      <SolveButton
                        onClick={() => void handleSolve()}
                        disabled={!canSolve}
                        solving={solver.loading}
                      />
                    )}
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
                        <p className="text-white/55 text-[14px]">No solution computed yet.</p>
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
      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        border:     '1px solid rgba(0,212,255,0.2)',
        background: 'rgba(0,212,255,0.05)',
        color:      'rgba(0,212,255,0.7)',
      }}
      whileHover={ready && !processing ? {
        borderColor: 'rgba(0,212,255,0.45)',
        background:  'rgba(0,212,255,0.1)',
        color:       'rgba(0,212,255,1)',
      } : {}}
      whileTap={ready && !processing ? { scale: 0.97 } : {}}
    >
      {processing ? (
        <>
          <motion.span
            className="w-3 h-3 rounded-full border border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          />
          Scanning…
        </>
      ) : loading ? (
        <>
          <span className="w-3 h-3 rounded-full border border-current border-t-transparent opacity-50" />
          Loading…
        </>
      ) : (
        <>
          <CameraIcon />
          Upload Screenshot
        </>
      )}
    </motion.button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-white">
        {children}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

function UndoButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
      style={{
        border:     '1px solid rgba(255,255,255,0.1)',
        background: 'transparent',
        color:      'rgba(255,255,255,1)',
      }}
      whileHover={!disabled ? { borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,1)' } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
    >
      <UndoIcon />
      Undo
    </motion.button>
  )
}

function UndoIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7h13a5 5 0 0 1 0 10H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 3L3 7l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
