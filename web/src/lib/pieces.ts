import type { Point } from '@/types/solver'

// ─── All 38 piece definitions — mirrors pieceLibrary.cpp exactly ──────────────

export const PIECES: Record<string, Point[]> = {
  // L-shapes
  L1:  [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:2,y:1}],
  L2:  [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:0,y:1}],  // normalized (original minY=1)
  L3:  [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:1,y:2}],
  L4:  [{x:1,y:0},{x:1,y:1},{x:1,y:2},{x:0,y:2}],
  L5:  [{x:0,y:0},{x:0,y:1},{x:1,y:1}],
  L6:  [{x:0,y:1},{x:1,y:0},{x:1,y:1}],
  L7:  [{x:0,y:0},{x:1,y:0},{x:1,y:1}],
  L8:  [{x:0,y:0},{x:0,y:1},{x:1,y:0}],
  L9:  [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:2,y:1},{x:2,y:2}],
  L10: [{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:1,y:2},{x:2,y:2}],
  L11: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:0,y:1},{x:0,y:2}],
  L12: [{x:2,y:0},{x:2,y:1},{x:2,y:2},{x:1,y:2},{x:0,y:2}],
  // Rectangles
  '1x1': [{x:0,y:0}],
  '2x1': [{x:0,y:0},{x:1,y:0}],
  '1x2': [{x:0,y:0},{x:0,y:1}],
  '3x1': [{x:0,y:0},{x:1,y:0},{x:2,y:0}],
  '1x3': [{x:0,y:0},{x:0,y:1},{x:0,y:2}],
  '4x1': [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}],
  '1x4': [{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3}],
  '5x1': [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0},{x:4,y:0}],
  '1x5': [{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:0,y:3},{x:0,y:4}],
  '2x2': [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}],
  '3x2': [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1}],
  '2x3': [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1},{x:0,y:2},{x:1,y:2}],
  '3x3': [
    {x:0,y:0},{x:1,y:0},{x:2,y:0},
    {x:0,y:1},{x:1,y:1},{x:2,y:1},
    {x:0,y:2},{x:1,y:2},{x:2,y:2},
  ],
  // T-shapes
  T1: [{x:0,y:0},{x:0,y:1},{x:0,y:2},{x:1,y:1}],
  T2: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:1,y:1}],
  T3: [{x:1,y:0},{x:1,y:1},{x:1,y:2},{x:0,y:1}],
  T4: [{x:0,y:1},{x:1,y:0},{x:1,y:1},{x:1,y:2}],
  // Z-shapes
  Z1: [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:2,y:1}],
  Z2: [{x:0,y:1},{x:1,y:1},{x:1,y:0},{x:2,y:0}],
  Z3: [{x:0,y:0},{x:0,y:1},{x:1,y:1},{x:1,y:2}],
  Z4: [{x:1,y:0},{x:1,y:1},{x:0,y:1},{x:0,y:2}],
  // Diagonals
  S1: [{x:0,y:0},{x:1,y:1},{x:2,y:2}],
  S2: [{x:0,y:2},{x:1,y:1},{x:2,y:0}],
  S3: [{x:0,y:0},{x:1,y:1}],
  S4: [{x:0,y:1},{x:1,y:0}],
}

export const PIECE_GROUPS: { name: string; ids: string[] }[] = [
  { name: 'L-Shapes',   ids: ['L1','L2','L3','L4','L5','L6','L7','L8','L9','L10','L11','L12'] },
  { name: 'Rectangles', ids: ['1x1','2x1','1x2','3x1','1x3','4x1','1x4','5x1','1x5','2x2','3x2','2x3','3x3'] },
  { name: 'T-Shapes',   ids: ['T1','T2','T3','T4'] },
  { name: 'Z-Shapes',   ids: ['Z1','Z2','Z3','Z4'] },
  { name: 'Diagonals',  ids: ['S1','S2','S3','S4'] },
]

/** Shift so min x = 0 and min y = 0. */
export function normalizePiece(points: Point[]): Point[] {
  if (points.length === 0) return []
  const minX = Math.min(...points.map(p => p.x))
  const minY = Math.min(...points.map(p => p.y))
  return points.map(p => ({ x: p.x - minX, y: p.y - minY }))
}

/** Width and height of a piece's bounding box (1-based). */
export function pieceBounds(points: Point[]): { w: number; h: number } {
  if (points.length === 0) return { w: 0, h: 0 }
  return {
    w: Math.max(...points.map(p => p.x)) + 1,
    h: Math.max(...points.map(p => p.y)) + 1,
  }
}
