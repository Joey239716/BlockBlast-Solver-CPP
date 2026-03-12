// ─── Core geometry ────────────────────────────────────────────────────────────

export interface Point {
  x: number // column (0–7)
  y: number // row    (0–7)
}

// ─── Piece colours ────────────────────────────────────────────────────────────

export type PieceColor = 'cyan' | 'purple' | 'coral'

export const PIECE_COLORS: PieceColor[] = ['cyan', 'purple', 'coral']

export const PIECE_COLOR_VALUES: Record<PieceColor, string> = {
  cyan:   '#00d4ff',
  purple: '#9b5cff',
  coral:  '#ff6b6b',
}

export const PIECE_GLOW_VALUES: Record<PieceColor, string> = {
  cyan:   'rgba(0,212,255,0.45)',
  purple: 'rgba(155,92,255,0.45)',
  coral:  'rgba(255,107,107,0.45)',
}

// ─── Cell display states ──────────────────────────────────────────────────────

export type CellState =
  | 'empty'
  | 'filled'
  | { kind: 'piece';       color: PieceColor }
  | { kind: 'ghost';       color: PieceColor }
  | { kind: 'ghost-invalid' }

// ─── Piece shape ──────────────────────────────────────────────────────────────

export interface PieceShape {
  id: string
  points: Point[]
}

// ─── Solver result ────────────────────────────────────────────────────────────

export interface PlacementStep {
  pieceIndex: number       // which of the 3 user pieces (0 | 1 | 2)
  placements: Point[]      // where every cell of the piece lands on the 8×8 board
  boardBefore: boolean[][] // 8×8 board state *before* this placement
}

export interface SolverResult {
  found: boolean
  steps: PlacementStep[]
}
