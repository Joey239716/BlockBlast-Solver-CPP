#pragma once
#include <array>
#include <unordered_set>
#include "pieceLibrary.h"

extern bool board1[3][3];
extern bool board2[3][3];
extern bool board3[3][3];       

extern std::unordered_set<Point, PointHash> piece1;
extern std::unordered_set<Point, PointHash> piece2;
extern std::unordered_set<Point, PointHash> piece3;    






