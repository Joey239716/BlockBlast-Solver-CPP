#!/usr/bin/env bash
set -e

# Activate emsdk (adjust path if you installed it elsewhere)
source ~/emsdk/emsdk_env.sh

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

emcc \
  "$REPO_ROOT/project/solver_wasm.cpp" \
  "$REPO_ROOT/project/solver.cpp" \
  "$REPO_ROOT/project/pieceLibrary.cpp" \
  -O2 \
  -std=c++17 \
  -I "$REPO_ROOT/project" \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME=createSolverModule \
  -s EXPORTED_FUNCTIONS='["_solve","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["HEAP32"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s NO_EXIT_RUNTIME=1 \
  -s ENVIRONMENT=web \
  -o "$REPO_ROOT/web/public/index.js"

echo ""
echo "Done! Output:"
echo "  web/public/index.js"
echo "  web/public/index.wasm"
echo ""
echo "Now run:  cd web && npm install && npm run dev"
