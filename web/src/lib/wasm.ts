import type { Point, SolverResult, PlacementStep } from '@/types/solver'
import { normalizePiece } from '@/lib/pieces'

// ─── Emscripten module shape ──────────────────────────────────────────────────

interface WasmModule {
  _solve: (
    board: number,
    p1: number, p1Size: number,
    p2: number, p2Size: number,
    p3: number, p3Size: number,
  ) => number
  _malloc: (bytes: number) => number
  _free:   (ptr: number)   => void
  HEAP32:  Int32Array
}

// ─── Module singleton ─────────────────────────────────────────────────────────

let wasmMod: WasmModule | null = null

/**
 * Wait for the Emscripten script (loaded in index.html) to initialise.
 * Supports both MODULARIZE=1 (factory function) and MODULARIZE=0 (global Module).
 */
export async function initWasm(timeoutMs = 15_000): Promise<void> {
  if (wasmMod) return

  const start = Date.now()

  return new Promise((resolve, reject) => {
    function poll() {
      const win = window as unknown as Record<string, unknown>

      // MODULARIZE=1 — various possible export names
      for (const name of ['createSolverModule', 'createModule']) {
        const factory = win[name]
        if (typeof factory === 'function') {
          ;(factory as () => Promise<WasmModule>)()
            .then(m => { wasmMod = m; resolve() })
            .catch(reject)
          return
        }
      }

      // MODULARIZE=0 — Module object already populated
      const mod = win['Module'] as WasmModule | undefined
      if (mod && typeof mod._solve === 'function') {
        wasmMod = mod
        resolve()
        return
      }

      if (win['__wasmLoadError']) {
        reject(new Error('index.js failed to load. Run build-wasm.sh first.'))
        return
      }

      if (Date.now() - start > timeoutMs) {
        reject(new Error('Timed out waiting for WASM module.'))
        return
      }

      setTimeout(poll, 100)
    }
    poll()
  })
}

export function isWasmReady(): boolean {
  return wasmMod !== null
}

// ─── Heap helpers ─────────────────────────────────────────────────────────────

function writeI32(values: number[]): number {
  if (!wasmMod) throw new Error('WASM not initialised')
  const n = Math.max(values.length, 1)
  const ptr = wasmMod._malloc(n * 4)
  for (let i = 0; i < values.length; i++) {
    wasmMod.HEAP32[(ptr >> 2) + i] = values[i]
  }
  return ptr
}

// ─── Public solve call ────────────────────────────────────────────────────────

export function callSolve(
  board: boolean[][],
  pieces: (Point[] | null)[],
): SolverResult {
  if (!wasmMod) throw new Error('WASM not initialised')

  const boardFlat = board.flat().map(v => (v ? 1 : 0))
  const pFlat = pieces.map(pts =>
    pts && pts.length > 0 ? normalizePiece(pts).flatMap(p => [p.x, p.y]) : [],
  )

  const boardPtr = writeI32(boardFlat)
  const pPtrs = pFlat.map(writeI32)

  const resultPtr = wasmMod._solve(
    boardPtr,
    pPtrs[0], pFlat[0].length,
    pPtrs[1], pFlat[1].length,
    pPtrs[2], pFlat[2].length,
  )

  wasmMod._free(boardPtr)
  pPtrs.forEach(p => wasmMod!._free(p))

  return parseResult(wasmMod.HEAP32, resultPtr, board)
}

// ─── Result parser ────────────────────────────────────────────────────────────

function parseResult(
  heap: Int32Array,
  ptr: number,
  originalBoard: boolean[][],
): SolverResult {
  const base = ptr >> 2
  if (heap[base] !== 1) return { found: false, steps: [] }

  // Read placement order
  const order: number[] = []
  for (let i = 0; i < 3; i++) {
    const v = heap[base + 1 + i]
    if (v >= 0) order.push(v)
  }

  // Read per-piece placements
  const placements: Point[][] = [[], [], []]
  let off = base + 4
  for (let j = 0; j < 3; j++) {
    const count = heap[off++]
    if (count > 0 && count < 100) {
      for (let k = 0; k < count; k++) {
        placements[j].push({ x: heap[off++], y: heap[off++] })
      }
    }
  }

  // Build steps with incremental board snapshots
  const board = originalBoard.map(row => [...row])
  const steps: PlacementStep[] = []

  for (const pieceIdx of order) {
    const pts = placements[pieceIdx]
    steps.push({
      pieceIndex: pieceIdx,
      placements: pts,
      boardBefore: board.map(row => [...row]),
    })

    for (const { x, y } of pts) board[y][x] = true

    // Simulate blast: collect full rows / cols, clear simultaneously
    const toClear = new Set<string>()
    for (let r = 0; r < 8; r++) {
      if (board[r].every(Boolean)) {
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

  return { found: true, steps }
}
