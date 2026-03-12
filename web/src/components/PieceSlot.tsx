import { useState } from 'react'
import type { Point } from '../types'
import { PIECES, PIECE_GROUPS, pieceBounds, normalizePiece } from '../lib/pieces'

interface PieceSlotProps {
  index: number
  piece: Point[]
  onChange: (points: Point[]) => void
}

export function PieceSlot({ index, piece, onChange }: PieceSlotProps) {
  const [mode, setMode] = useState<'library' | 'draw'>('library')
  const [drawGrid, setDrawGrid] = useState<boolean[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(false)),
  )

  function handleDrawToggle(r: number, c: number) {
    const next = drawGrid.map(row => [...row])
    next[r][c] = !next[r][c]
    setDrawGrid(next)
    const pts: Point[] = []
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 5; col++)
        if (next[row][col]) pts.push({ x: col, y: row })
    onChange(pts)
  }

  function handleLibrarySelect(id: string) {
    onChange(PIECES[id])
    // Reflect selection in draw grid for visual consistency
    const next = Array.from({ length: 5 }, () => Array(5).fill(false)) as boolean[][]
    for (const { x, y } of normalizePiece(PIECES[id])) {
      if (y < 5 && x < 5) next[y][x] = true
    }
    setDrawGrid(next)
  }

  function handleClear() {
    onChange([])
    setDrawGrid(Array.from({ length: 5 }, () => Array(5).fill(false)))
  }

  const selectedId = Object.keys(PIECES).find(id =>
    PIECES[id].length === piece.length &&
    normalizePiece(PIECES[id]).every((p, i) => {
      const np = normalizePiece(piece)
      return np[i]?.x === p.x && np[i]?.y === p.y
    }),
  )

  return (
    <div className="piece-slot">
      <div className="piece-slot-header">
        <span className="piece-slot-label">Piece {index + 1}</span>
        <div className="mode-tabs">
          <button
            className={`mode-tab${mode === 'library' ? ' active' : ''}`}
            onClick={() => setMode('library')}
          >
            Library
          </button>
          <button
            className={`mode-tab${mode === 'draw' ? ' active' : ''}`}
            onClick={() => setMode('draw')}
          >
            Draw
          </button>
        </div>
      </div>

      {mode === 'library' ? (
        <PieceLibrary selectedId={selectedId} onSelect={handleLibrarySelect} />
      ) : (
        <DrawGrid grid={drawGrid} onToggle={handleDrawToggle} />
      )}

      {piece.length > 0 && (
        <button className="btn-clear" onClick={handleClear}>
          Clear
        </button>
      )}
    </div>
  )
}

// ── Draw Grid ──────────────────────────────────────────────────────────────

function DrawGrid({
  grid,
  onToggle,
}: {
  grid: boolean[][]
  onToggle: (r: number, c: number) => void
}) {
  return (
    <div className="draw-grid">
      {grid.map((row, r) =>
        row.map((filled, c) => (
          <button
            key={`${r}-${c}`}
            className={`draw-cell${filled ? ' filled' : ''}`}
            onClick={() => onToggle(r, c)}
          />
        )),
      )}
    </div>
  )
}

// ── Piece Library ──────────────────────────────────────────────────────────

function PieceLibrary({
  selectedId,
  onSelect,
}: {
  selectedId: string | undefined
  onSelect: (id: string) => void
}) {
  return (
    <div className="piece-library">
      {PIECE_GROUPS.map(group => (
        <div key={group.name}>
          <div className="piece-group-label">{group.name}</div>
          <div className="piece-group-items">
            {group.ids.map(id => (
              <PieceThumb
                key={id}
                id={id}
                points={PIECES[id]}
                selected={id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function PieceThumb({
  id,
  points,
  selected,
  onSelect,
}: {
  id: string
  points: Point[]
  selected: boolean
  onSelect: (id: string) => void
}) {
  const norm = normalizePiece(points)
  const { w, h } = pieceBounds(norm)
  const set = new Set(norm.map(p => `${p.x},${p.y}`))

  return (
    <button
      className={`piece-thumb${selected ? ' selected' : ''}`}
      onClick={() => onSelect(id)}
      title={id}
    >
      <div
        className="piece-thumb-grid"
        style={{ gridTemplateColumns: `repeat(${w}, 7px)` }}
      >
        {Array.from({ length: h }, (_, r) =>
          Array.from({ length: w }, (_, c) => (
            <div
              key={`${r}-${c}`}
              className={`piece-thumb-cell${set.has(`${c},${r}`) ? ' on' : ''}`}
            />
          )),
        )}
      </div>
    </button>
  )
}
