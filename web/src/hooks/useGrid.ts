import { useState, useCallback } from 'react'
import type { Point } from '@/types/solver'

const empty8x8 = (): boolean[][] =>
  Array.from({ length: 8 }, () => Array(8).fill(false))

interface UseGridReturn {
  board:          boolean[][]
  pieces:         (Point[] | null)[]
  activePieceIdx: number | null
  toggleCell:     (row: number, col: number) => void
  setCell:        (row: number, col: number, value: boolean) => void
  setPiece:       (idx: number, points: Point[] | null) => void
  setActivePiece: (idx: number | null) => void
  resetAll:       () => void
}

export function useGrid(): UseGridReturn {
  const [board,          setBoard]          = useState<boolean[][]>(empty8x8)
  const [pieces,         setPieces]         = useState<(Point[] | null)[]>([null, null, null])
  const [activePieceIdx, setActivePieceIdx] = useState<number | null>(null)

  const toggleCell = useCallback((row: number, col: number) => {
    setBoard(prev => {
      const next = prev.map(r => [...r])
      next[row][col] = !next[row][col]
      return next
    })
  }, [])

  const setCell = useCallback((row: number, col: number, value: boolean) => {
    setBoard(prev => {
      if (prev[row][col] === value) return prev
      const next = prev.map(r => [...r])
      next[row][col] = value
      return next
    })
  }, [])

  const setPiece = useCallback((idx: number, points: Point[] | null) => {
    setPieces(prev => {
      const next = [...prev]
      next[idx] = points
      return next
    })
  }, [])

  const setActivePiece = useCallback((idx: number | null) => {
    setActivePieceIdx(idx)
  }, [])

  const resetAll = useCallback(() => {
    setBoard(empty8x8())
    setPieces([null, null, null])
    setActivePieceIdx(null)
  }, [])

  return { board, pieces, activePieceIdx, toggleCell, setCell, setPiece, setActivePiece, resetAll }
}
