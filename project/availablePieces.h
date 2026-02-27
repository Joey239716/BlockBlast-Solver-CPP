#pragma once
#include <array>
#include <unordered_set>
#include "pieceLibrary.h"

extern bool board1[5][5];
extern bool board2[5][5];
extern bool board3[5][5];       

extern std::unordered_set<Point, PointHash> piece1;
extern std::unordered_set<Point, PointHash> piece2;
extern std::unordered_set<Point, PointHash> piece3;    

void resetPieces(bool board1[5][5], bool board2[5][5], bool board3[5][5], std::unordered_set<Point, PointHash>& piece1, std::unordered_set<Point, PointHash>& piece2, std::unordered_set<Point, PointHash>& piece3);

bool checkEmpty(std::unordered_set<Point, PointHash> piece1, std::unordered_set<Point, PointHash> piece2, std::unordered_set<Point, PointHash> piece3);





