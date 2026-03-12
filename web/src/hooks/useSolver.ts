import { useState, useCallback } from 'react'
import type { Point, SolverResult } from '@/types/solver'
import { initWasm, callSolve, isWasmReady } from '@/lib/wasm'

interface UseSolverReturn {
  solve:   (board: boolean[][], pieces: (Point[] | null)[]) => Promise<void>
  result:  SolverResult | null
  loading: boolean
  error:   string | null
  ready:   boolean
  init:    () => Promise<void>
}

export function useSolver(): UseSolverReturn {
  const [result,  setResult]  = useState<SolverResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [ready,   setReady]   = useState(false)

  const init = useCallback(async () => {
    try {
      await initWasm()
      setReady(true)
    } catch (e) {
      setError(String(e))
    }
  }, [])

  const solve = useCallback(
    async (board: boolean[][], pieces: (Point[] | null)[]) => {
      if (!isWasmReady()) {
        setError('WASM not ready')
        return
      }
      setLoading(true)
      setError(null)
      // Yield to the render loop so LoadingOverlay can appear before WASM blocks
      await new Promise<void>(r => setTimeout(r, 0))
      try {
        const res = callSolve(board, pieces)
        setResult(res)
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { solve, result, loading, error, ready, init }
}
