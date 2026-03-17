# BlockBlaster AI

**Live demo → [blockblasterai.vercel.app](https://blockblasterai.vercel.app)**

An AI-powered Block Blast puzzle solver that runs entirely in the browser — no backend, no account, no install. Upload a screenshot of your board and get the optimal move sequence in under 150ms.

---

## Technical Overview

The project has two main components: a **C++ solver compiled to WebAssembly** and a **React frontend with OpenCV-based board detection**.

### Solver — C++ → WebAssembly

The core solver is written in C++17 and compiled to WASM via Emscripten. It uses **heuristic-guided backtracking with branch-and-bound pruning** to search for the optimal 3-piece placement sequence.

**Algorithm:**
1. For each unplaced piece, score its best possible placement using `simulateBlast()` (simulates row/column clears)
2. Sort pieces by descending score so the most promising branch is explored first
3. Recurse through valid placements — place, simulate, recurse, undo
4. Prune any branch where `current score + optimistic upper bound < global best` (branch-and-bound)
5. Cache `simulateBlast()` results keyed by a 64-bit XOR board hash to avoid recomputation

**Results:**
- **99.4% reduction** in states evaluated vs brute force (1.57M → ~10K typical)
- **7× speedup** from memoization cache
- **<150ms** average solve time in-browser

JavaScript calls into the WASM module by writing flat `Int32` arrays onto the WASM heap via `_malloc`, invoking `_solve`, and reading the result back through `HEAP32`.

### Board Detection — OpenCV.js

When a user uploads a screenshot, a CV pipeline runs entirely in the browser using OpenCV.js:

1. **Localize the board** — Canny edge detection → morphological dilation → contour extraction → score candidates by area and aspect ratio
2. **Classify each cell** — Divide the detected rectangle into an 8×8 grid, sample 16 brightness points per cell (4×4 grid, 10% inset), compute `mean + range` as a bevel-contrast score, threshold at the median → `boolean[][]`

The bevel-contrast score (`mean + range`) works across all Block Blast color themes — it detects the 3D tile highlight regardless of the tile's actual color.

### Frontend

Built with **React 18 + TypeScript + Vite**, styled with **Tailwind CSS** and animated with **Framer Motion**.

- **Setup tab** — interactive 8×8 board, 3 piece selectors (38 predefined shapes), screenshot upload, undo history
- **Solution tab** — step-by-step playback with animated piece highlights and autoplay

The app uses `SharedArrayBuffer` (required for multi-threaded WASM), which requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers — configured in `vercel.json`.

---

## Stack

| Layer | Technology |
|---|---|
| Solver | C++17, Emscripten, WebAssembly |
| Board detection | OpenCV.js 4.12 |
| Frontend | React 18, TypeScript 5, Vite 5 |
| Styling | Tailwind CSS 3, Framer Motion 11 |
| Deployment | Vercel (CDN edge, COOP/COEP headers) |

---

## Architecture

```
BlockBlastSolver/
├── project/              # C++ solver source
│   ├── solver.cpp        # Backtracking algorithm + memoization
│   ├── solver_wasm.cpp   # Emscripten FFI wrapper (extern "C")
│   └── pieceLibrary.cpp  # 38 piece definitions
├── web/                  # React frontend
│   ├── src/
│   │   ├── hooks/
│   │   │   ├── useSolver.ts          # WASM init + solve call
│   │   │   ├── useBoardDetection.ts  # OpenCV pipeline
│   │   │   └── useGrid.ts            # Board state + undo history
│   │   ├── lib/
│   │   │   ├── wasm.ts     # WASM heap bridge (malloc/free/HEAP32)
│   │   │   └── pieces.ts   # Piece library + normalization
│   │   └── components/     # Grid, PieceSelector, SolutionViewer, ...
│   ├── public/
│   │   ├── index.wasm    # Compiled solver (~157KB)
│   │   └── opencv.js     # OpenCV WASM build
│   └── vercel.json       # COOP/COEP headers for SharedArrayBuffer
└── ml/                   # Python data collection pipeline (screenshots + labeling)
```

---

## Running Locally

```bash
cd web
npm install
npm run dev
```

To recompile the WASM solver (requires Emscripten):

```bash
cd web
bash build-wasm.sh
```
