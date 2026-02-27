#pragma once
#include <unordered_set>
#include <vector>
#include "pieceLibrary.h" 
#include "board.h"

class BlockBlastSolver {
public:
    struct Solution {
        bool found;
        std::vector<Point> placements;
    };

    Solution Solve(const std::unordered_set<Point, PointHash>& p1, const std::unordered_set<Point, PointHash>& p2, const std::unordered_set<Point, PointHash>& p3, bool board[8][8]);
};
