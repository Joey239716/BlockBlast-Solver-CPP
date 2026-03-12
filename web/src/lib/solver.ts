import type { Point, Solution } from '../types'
import { normalizePiece } from './pieces'

// Declared globally by /public/solver.js (loaded via <script> in index.html)
declare function createSolverModule(): Promise<SolverModule>

interface SolverModule {
  _solve: (
    board: number,
    p1: number, p1Size: number,
    p2: number, p2Size: number,
    p3: number, p3Size: number,
  ) => number
  _malloc: (bytes: number) => number
  _free: (ptr: number) => void
  HEAP32: Int32Array
}

let mod: SolverModule | null = null

export async function loadSolver(): Promise<void> {
  mod = await createSolverModule()
}

function writeI32(values: number[]): number {
  if (!mod) throw new Error('Solver not loaded')
  const ptr = mod._malloc(Math.max(values.length, 1) * 4)
  for (let i = 0; i < values.length; i++) {
    mod.HEAP32[(ptr >> 2) + i] = values[i]
  }
  return ptr
}

export function runSolver(board: boolean[][], pieces: (Point[] | null)[]): Solution {
  if (!mod) throw new Error('Solver not loaded')

  const boardFlat = board.flat().map(v => (v ? 1 : 0))
  const pFlat = pieces.map(p => {
    if (!p || p.length === 0) return []
    return normalizePiece(p).flatMap(pt => [pt.x, pt.y])
  })

  const boardPtr = writeI32(boardFlat)
  const p1Ptr = writeI32(pFlat[0])
  const p2Ptr = writeI32(pFlat[1])
  const p3Ptr = writeI32(pFlat[2])

  const resultPtr = mod._solve(
    boardPtr,
    p1Ptr, pFlat[0].length,
    p2Ptr, pFlat[1].length,
    p3Ptr, pFlat[2].length,
  )

  mod._free(boardPtr)
  mod._free(p1Ptr)
  mod._free(p2Ptr)
  mod._free(p3Ptr)

  return parseResult(mod.HEAP32, resultPtr)
}

function parseResult(heap: Int32Array, ptr: number): Solution {
  const b = ptr >> 2
  const found = heap[b] === 1
  if (!found) return { found: false, order: [], placements: [[], [], []] }

  const order: number[] = []
  for (let i = 0; i < 3; i++) {
    const v = heap[b + 1 + i]
    if (v !== -1) order.push(v)
  }

  const placements: Point[][] = [[], [], []]
  let off = b + 4
  for (let j = 0; j < 3; j++) {
    const count = heap[off++]
    if (count > 0 && count < 100) {
      for (let k = 0; k < count; k++) {
        placements[j].push({ x: heap[off++], y: heap[off++] })
      }
    }
  }

  return { found: true, order, placements }
}

/** Reconstruct the 3 board states shown in the solution panel. */
export function computeMoveBoards(
  originalBoard: boolean[][],
  solution: Solution,
): Array<Array<Array<'empty' | 'filled' | 'new'>>> {
  const moves: Array<Array<Array<'empty' | 'filled' | 'new'>>> = []
  const board = originalBoard.map(row => [...row])

  for (const pieceIdx of solution.order) {
    const placements = solution.placements[pieceIdx]

    // Build display board: existing cells = 'filled', new piece = 'new'
    const display = board.map(row =>
      row.map((v): 'empty' | 'filled' | 'new' => (v ? 'filled' : 'empty')),
    )
    for (const { x, y } of placements) display[y][x] = 'new'
    moves.push(display)

    // Apply placement to live board
    for (const { x, y } of placements) board[y][x] = true

    // Apply blast: collect full rows and cols, then clear them all at once
    const toClear = new Set<string>()
    for (let r = 0; r < 8; r++) {
      if (board[r].every(v => v)) {
        for (let c = 0; c < 8; c++) toClear.add(`${r},${c}`)
      }
    }
    for (let c = 0; c < 8; c++) {
      if (board.every(row => row[c])) {
        for (let r = 0; r < 8; r++) toClear.add(`${r},${c}`)
      }
    }
    for (const key of toClear) {
      const [r, c] = key.split(',').map(Number)
      board[r][c] = false
    }
  }

  return moves
}
