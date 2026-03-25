import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
      transition={{ duration: 0.18 }}
      style={{ display: active ? undefined : 'none' }}
    >
      {children}
    </motion.div>
  )
}
import { Navbar } from '@/components/Navbar'
import type { Tab } from '@/components/Navbar'
import { Grid } from '@/components/Grid'
import { PieceSelector } from '@/components/PieceSelector'
import { SolveButton } from '@/components/SolveButton'
import { SolutionViewer } from '@/components/SolutionViewer'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { UploadModal } from '@/components/UploadModal'
import { SettingsPage } from '@/components/SettingsPage'
import { useGrid } from '@/hooks/useGrid'
import { useSolver } from '@/hooks/useSolver'
import { useBoardDetection } from '@/hooks/useBoardDetection'
import { PIECE_COLORS } from '@/types/solver'
import { BackgroundCanvas } from '@/components/BackgroundCanvas'
import { useSettings } from '@/context/SettingsContext'


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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('setup')
  const [showUpload, setShowUpload] = useState(() => searchParams.get('upload') === '1')
  const isDesktop = useIsDesktop()
  const { theme } = useSettings()

  const grid   = useGrid()
  const solver = useSolver()
  const [cvStatus, setCvStatus] = useState('')
  const { ready: cvReady, progress: cvProgress, processing: cvProcessing, detect } =
    useBoardDetection(grid.loadBoard, setCvStatus)

  useEffect(() => { void solver.init() }, [solver.init])

  function switchTab(next: Tab) {
    setTab(next)
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
    <div className="min-h-screen" style={{ background: theme.bg, color: theme.text }}>
      <BackgroundCanvas />

      <UploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onFile={detect}
      />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <LoadingOverlay visible={solver.loading} />
        <Navbar activeTab={tab} onTabChange={switchTab} onHome={() => navigate('/')} />

        <main className="max-w-page md:max-w-[960px] mx-auto px-5 pb-20 md:min-h-[calc(100vh-3.5rem)] md:flex md:flex-col md:justify-center">
            <TabPanel active={tab === 'settings'}>
              <div className="pt-8">
                <SettingsPage />
              </div>
            </TabPanel>
            <TabPanel active={tab === 'setup'}>
              <div className="pt-8 flex flex-col gap-6">
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
                          className={`text-[11px] font-mono mt-2 ${cvStatus.startsWith('Error') ? 'text-accent-coral/70' : ''}`}
                          style={{ color: cvStatus.startsWith('Error') ? undefined : theme.textMuted }}
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

                {!isDesktop && (
                  <SolveButton
                    onClick={() => void handleSolve()}
                    disabled={!canSolve}
                    solving={solver.loading}
                  />
                )}
              </div>
            </TabPanel>
            <TabPanel active={tab === 'solution'}>
              <div className="pt-8">
                {solver.result ? (
                  <SolutionViewer result={solver.result} onReset={handleReset} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <p className="text-[14px]" style={{ color: theme.textMuted }}>No solution computed yet.</p>
                    <button
                      className="text-[13px] hover:underline cursor-pointer"
                      style={{ color: theme.accent2 }}
                      onClick={() => switchTab('setup')}
                    >
                      ← Go to Setup
                    </button>
                  </div>
                )}
              </div>
            </TabPanel>
        </main>
      </motion.div>
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
      style={{ border: '1px solid rgba(0,212,255,0.2)', background: 'rgba(0,212,255,0.05)', color: 'rgba(0,212,255,0.7)' }}
      whileHover={ready && !processing ? { borderColor: 'rgba(0,212,255,0.45)', background: 'rgba(0,212,255,0.1)', color: 'rgba(0,212,255,1)' } : {}}
      whileTap={ready && !processing ? { scale: 0.97 } : {}}
    >
      {processing ? (
        <><motion.span className="w-3 h-3 rounded-full border border-current border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} />Scanning…</>
      ) : loading ? (
        <><span className="w-3 h-3 rounded-full border border-current border-t-transparent opacity-50" />Loading…</>
      ) : (
        <><CameraIcon />Upload Screenshot</>
      )}
    </motion.button>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme } = useSettings()
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: theme.text }}>
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: theme.cardBorder }} />
    </div>
  )
}

function UndoButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  const { theme } = useSettings()
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed"
      style={{ border: `1px solid ${theme.cardBorder}`, background: 'transparent', color: theme.text }}
      whileHover={!disabled ? { borderColor: `${theme.text}44` } : {}}
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
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}
