#pragma once
#include <unordered_set>
#include <vector>
#include "pieceLibrary.h" 
#include "board.h"

class BlockBlastSolver {
public:



    struct Solution {
        bool found;
        std::array<std::vector<Point>, 3> solutionPlacements;
        std::vector<int> solutionOrder;
    };

    Solution Solve(const std::unordered_set<Point, PointHash>& p1, const std::unordered_set<Point, PointHash>& p2, const std::unordered_set<Point, PointHash>& p3, int board[8][8]);
    int simulateBlast(int tempBoard[8][8]);

private:
    void canSolve(int fittedPieces, int score, int board[8][8]);
    bool canFit(int offsetX, int offsetY, const std::unordered_set<Point, PointHash> &piece, int board[8][8], int r, int c);


    int maxResult = 0;
    std::array<std::vector<Point>, 3> bestPlacement;
    std::vector<int> bestOrder; 
    int tempScore;
    std::vector<int> order;
    const std::unordered_set<Point, PointHash> *pieces[3];
    std::array<std::vector<Point>, 3> placement;

};
