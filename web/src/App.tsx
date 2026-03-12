import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import { Grid } from '@/components/Grid'
import { PieceSelector } from '@/components/PieceSelector'
import { SolveButton } from '@/components/SolveButton'
import { SolutionViewer } from '@/components/SolutionViewer'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { useGrid } from '@/hooks/useGrid'
import { useSolver } from '@/hooks/useSolver'
import { PIECE_COLORS } from '@/types/solver'

type Tab = 'setup' | 'solution'

const tabVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: dir * -24 }),
}

export default function App() {
  const [tab,    setTab]    = useState<Tab>('setup')
  const [tabDir, setTabDir] = useState(1)

  const grid   = useGrid()
  const solver = useSolver()

  // Init WASM on mount
  useEffect(() => { void solver.init() }, [solver.init])

  function switchTab(next: Tab) {
    setTabDir(next === 'solution' ? 1 : -1)
    setTab(next)
  }

  async function handleSolve() {
    await solver.solve(grid.board, grid.pieces)
    if (solver.result?.found !== false) {
      switchTab('solution')
    }
  }

  function handleReset() {
    grid.resetAll()
    switchTab('setup')
  }

  const canSolve = solver.ready && !solver.loading && grid.pieces.some(p => p && p.length > 0)

  return (
    <div className="min-h-screen bg-bg-base text-white">
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
                <div className="px-4 py-3 rounded-lg border border-accent-coral/25 bg-accent-coral/[0.07] text-[12px] text-accent-coral/80">
                  ⚠ {solver.error}
                </div>
              )}

              {/* Board */}
              <section>
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
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-widest uppercase text-white/20 mb-3">
      {children}
    </p>
  )
}
