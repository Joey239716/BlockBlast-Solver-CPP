#include <emscripten/emscripten.h>
#include "solver.h"
#include "pieceLibrary.h"
#include <unordered_set>
#include <cstring>

// Output buffer layout:
// [0]        = found (1 or 0)
// [1..3]     = solutionOrder[0..2] (-1 if unused)
// [4]        = piece0 placement count
// [5..]      = piece0 placements as (x, y) pairs
// [5+2*c0]   = piece1 placement count
// ...        = piece1 (x, y) pairs
// ...        = piece2 count + (x, y) pairs
static int resultBuffer[200];

extern "C" {

EMSCRIPTEN_KEEPALIVE
int* solve(
    int* boardFlat,
    int* p1Flat, int p1Size,
    int* p2Flat, int p2Size,
    int* p3Flat, int p3Size)
{
    int board[8][8];
    for (int r = 0; r < 8; r++)
        for (int c = 0; c < 8; c++)
            board[r][c] = boardFlat[r * 8 + c];

    auto makeSet = [](int* flat, int size) {
        std::unordered_set<Point, PointHash> s;
        for (int i = 0; i + 1 < size; i += 2)
            s.insert({flat[i], flat[i + 1]});
        return s;
    };

    auto p1 = makeSet(p1Flat, p1Size);
    auto p2 = makeSet(p2Flat, p2Size);
    auto p3 = makeSet(p3Flat, p3Size);

    BlockBlastSolver solver;
    auto result = solver.Solve(p1, p2, p3, board, true);

    memset(resultBuffer, -1, sizeof(resultBuffer));
    resultBuffer[0] = result.found ? 1 : 0;

    if (result.found) {
        for (int i = 0; i < (int)result.solutionOrder.size() && i < 3; i++)
            resultBuffer[1 + i] = result.solutionOrder[i];

        int offset = 4;
        for (int j = 0; j < 3; j++) {
            const auto& pts = result.solutionPlacements[j];
            resultBuffer[offset++] = (int)pts.size();
            for (const auto& p : pts) {
                resultBuffer[offset++] = p.x;
                resultBuffer[offset++] = p.y;
            }
        }
    }

    return resultBuffer;
}

} // extern "C"
