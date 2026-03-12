import type { Solution } from '../types'
import { computeMoveBoards } from '../lib/solver'

interface SolutionPanelProps {
  board: boolean[][]
  solution: Solution | null
  onReset: () => void
}

export function SolutionPanel({ board, solution, onReset }: SolutionPanelProps) {
  if (!solution) {
    return (
      <div className="panel">
        <div className="panel-title">Solution</div>
        <div className="empty-state">Solve a board to see results here.</div>
      </div>
    )
  }

  const moveBoards = solution.found ? computeMoveBoards(board, solution) : []

  return (
    <div className="panel">
      <div className="solution-header">
        <div>
          {solution.found ? (
            <span className="solution-found">Solution Found</span>
          ) : (
            <span className="no-solution">No Solution</span>
          )}
        </div>
        <button className="btn-reset" onClick={onReset}>
          Reset
        </button>
      </div>

      {solution.found ? (
        <>
          <div className="legend">
            <div className="legend-item">
              <div className="legend-swatch" style={{ background: 'var(--cell-filled)' }} />
              Existing
            </div>
            <div className="legend-item">
              <div className="legend-swatch" style={{ background: 'var(--cell-new)' }} />
              Placed this move
            </div>
          </div>

          <div className="moves-grid">
            {solution.order.map((pieceIdx, i) => (
              <div key={i} className="move-block">
                <div className="move-label">
                  Move {i + 1} — Piece {pieceIdx + 1}
                </div>
                <SolutionBoardGrid board={moveBoards[i]} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <p style={{ color: 'var(--text-dim)', marginTop: 8 }}>
          No valid placement exists for this configuration.
        </p>
      )}
    </div>
  )
}

function SolutionBoardGrid({
  board,
}: {
  board: Array<Array<'empty' | 'filled' | 'new'>>
}) {
  return (
    <div className="board-grid solution-grid">
      {board.map((row, r) =>
        row.map((state, c) => (
          <div
            key={`${r}-${c}`}
            className={`board-cell readonly ${state}`}
          />
        )),
      )}
    </div>
  )
}
