#include "availablePieces.h"
#include "pieceLibrary.h"

bool board1[5][5] = {};
bool board2[5][5] = {};
bool board3[5][5] = {};

std::unordered_set<Point, PointHash> piece1;
std::unordered_set<Point, PointHash> piece2;
std::unordered_set<Point, PointHash> piece3;

void resetPieces(bool board1[5][5], bool board2[5][5], bool board3[5][5], std::unordered_set<Point, PointHash>& piece1, std::unordered_set<Point, PointHash>& piece2, std::unordered_set<Point, PointHash>& piece3) {
    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < 5; j++) {
            board1[i][j] = false;
            board2[i][j] = false;
            board3[i][j] = false;
        }
    }
    piece1.clear();
    piece2.clear();
    piece3.clear();
}

bool checkEmpty(std::unordered_set<Point, PointHash> piece1, std::unordered_set<Point, PointHash> piece2, std::unordered_set<Point, PointHash> piece3) {
    if (piece1.empty() && piece2.empty() && piece3.empty()) {
        return 1;
    }

    else {
        return 0;
    }
}

