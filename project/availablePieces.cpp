#include "availablePieces.h"
#include "pieceLibrary.h"

bool board1[3][3] = {};
bool board2[3][3] = {};
bool board3[3][3] = {};

std::unordered_set<Point, PointHash> piece1;
std::unordered_set<Point, PointHash> piece2;
std::unordered_set<Point, PointHash> piece3;
