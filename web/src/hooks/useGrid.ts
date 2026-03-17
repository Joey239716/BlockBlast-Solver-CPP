import { useState, useCallback, useEffect } from 'react'
import type { Point } from '@/types/solver'

const empty8x8 = (): boolean[][] =>
  Array.from({ length: 8 }, () => Array(8).fill(false))

interface GridSnapshot {
  board:  boolean[][]
  pieces: (Point[] | null)[]
}

interface UseGridReturn {
  board:          boolean[][]
  pieces:         (Point[] | null)[]
  activePieceIdx: number | null
  canUndo:        boolean
  toggleCell:     (row: number, col: number) => void
  setCell:        (row: number, col: number, value: boolean) => void
  loadBoard:      (newBoard: boolean[][]) => void
  setPiece:       (idx: number, points: Point[] | null) => void
  setActivePiece: (idx: number | null) => void
  undo:           () => void
  resetAll:       () => void
}

const MAX_HISTORY = 50

export function useGrid(): UseGridReturn {
  const [history,        setHistory]        = useState<GridSnapshot[]>([{ board: empty8x8(), pieces: [null, null, null] }])
  const [cursor,         setCursor]         = useState(0)
  const [activePieceIdx, setActivePieceIdx] = useState<number | null>(null)

  const current = history[cursor]
  const board   = current.board
  const pieces  = current.pieces

  // Push a new snapshot, discarding any future history (past the cursor)
  const push = useCallback((snap: GridSnapshot) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, cursor + 1)
      const next    = [...trimmed, snap]
      if (next.length > MAX_HISTORY) next.shift()
      return next
    })
    setCursor(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [cursor])

  const toggleCell = useCallback((row: number, col: number) => {
    const next = board.map(r => [...r])
    next[row][col] = !next[row][col]
    push({ board: next, pieces })
  }, [board, pieces, push])

  const setCell = useCallback((row: number, col: number, value: boolean) => {
    if (board[row][col] === value) return
    const next = board.map(r => [...r])
    next[row][col] = value
    push({ board: next, pieces })
  }, [board, pieces, push])

  const loadBoard = useCallback((newBoard: boolean[][]) => {
    push({ board: newBoard.map(r => [...r]), pieces })
  }, [pieces, push])

const setPiece = useCallback((idx: number, points: Point[] | null) => {
    const next = [...pieces]
    next[idx]  = points
    push({ board, pieces: next })
  }, [board, pieces, push])

  const setActivePiece = useCallback((idx: number | null) => {
    setActivePieceIdx(idx)
  }, [])

  const undo = useCallback(() => {
    setCursor(prev => Math.max(0, prev - 1))
  }, [])

  const resetAll = useCallback(() => {
    const snap = { board: empty8x8(), pieces: [null, null, null] as (Point[] | null)[] }
    setHistory([snap])
    setCursor(0)
    setActivePieceIdx(null)
  }, [])

  // Cmd+Z / Ctrl+Z
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  return {
    board, pieces, activePieceIdx,
    canUndo: cursor > 0,
    toggleCell, setCell, loadBoard, setPiece, setActivePiece,
    undo, resetAll,
  }
}
