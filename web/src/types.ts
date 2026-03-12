export interface Point {
  x: number; // column
  y: number; // row
}

// 'new' = just placed this move (shown in cyan in solution)
export type CellState = 'empty' | 'filled' | 'new';

export interface Solution {
  found: boolean;
  order: number[];         // piece indices in placement order
  placements: Point[][];   // placements[pieceIdx] = board positions for that piece
}
