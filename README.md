A desktop application that solves Block Blast puzzle configurations using a heuristic-guided backtracking algorithm. Built with C++, SDL2, and Dear ImGui.
Features

Interactive 8x8 board editor — click to toggle filled and empty cells
Three piece input grids for defining the current pieces to place
Real-time solution visualization with color-coded move steps
Heuristic-guided backtracking with branch pruning, reducing search space by 99.4% vs brute force
Memoization caching of board state evaluations for a 7x speedup in solve time
Custom dark UI theme built with Dear ImGui

How It Works
GridSolver takes the current board state and up to three pieces as input and finds the optimal placement sequence to maximize line clears.
Algorithm:

For each unplaced piece, score its best possible immediate placement using simulateBlast
Sort pieces by score descending so the most promising piece is tried first
Recurse through valid placements using backtracking
Prune branches early if the maximum possible remaining score cannot beat the current best (branch and bound)
Cache simulateBlast results using a board state hash to avoid redundant recomputation

Dependencies

SDL2
Dear ImGui
OpenCV
CMake 3.15+
C++17 or later

Building
bashmkdir build && cd build
cmake ..
make
./blockBlast
Usage

Click cells on the Current Board grid to mark filled squares
Click cells on each Piece grid to define the three pieces
Press Find Solution to run the solver
The right panel shows each move with the newly placed piece highlighted in green
Press Done Solving to reset and start over
