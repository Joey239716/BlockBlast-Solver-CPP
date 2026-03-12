interface BoardGridProps {
  board: boolean[][]
  onToggle?: (row: number, col: number) => void
}

export function BoardGrid({ board, onToggle }: BoardGridProps) {
  const readonly = !onToggle
  return (
    <div className="board-grid">
      {board.map((row, r) =>
        row.map((filled, c) => (
          <button
            key={`${r}-${c}`}
            className={`board-cell${filled ? ' filled' : ''}${readonly ? ' readonly' : ''}`}
            onClick={() => onToggle?.(r, c)}
            disabled={readonly}
            aria-label={`cell ${r},${c}`}
          />
        )),
      )}
    </div>
  )
}
