#include "solver.h"
#include <cmath>

  /*
    Logic
    1. Set an anchor for the piece we want to place (start with p1)
    2. Check if each point can fit in the current position with the anchor as the reference point
    3. If it can fit, place the piece and move on to the next piece, simulate the block blast
     and update the board accordingly, then repeat the process for the next piece.
     We can then continue without simulating the blast to look for a more optimal solution
    4. If it cannot fit, try the next position on the board
    5. If we go through the entire board and cannot place the piece, try a different piece (backtrack)
    6. If we find a solution
    */

BlockBlastSolver::Solution BlockBlastSolver::Solve(const std::unordered_set<Point, PointHash> &p1, const std::unordered_set<Point, PointHash> &p2, const std::unordered_set<Point, PointHash> &p3, bool board[8][8])
{

    const std::unordered_set<Point, PointHash> *pieces[3] = {&p1, &p2, &p3};

    int curBest = 0;
    std::array<std::vector<Point>, 3> bestPlacement;
    std::vector<int> bestOrder; 
    int tempScore

    int canSolve(size_t i, int fittedPieces, int score, bool board[8][8], std::array<std::vector<Point>, 3> placement,std::vector<int> order)
    {
        if (fittedPieces == 3)
        {
            if (score > maxResult)
            {
                maxResult = score;
                bestPlacement = placement;
                bestOrder = order;
            }
            return;
        }

        /* For j in range of pieces[i].size(), check if its been used already, if not try placing the anchor first at (0,0)
        and check if the piece can fit, if it can fit, place the piece and simulate the blast, then recursively call canSolve for the next piece.
        If it can't fit we try the next position on the board until we exhaust all possibilities. If we exhaust all possibilities for the current piece,
         we backtrack and try a different piece. */

        for (size_t j = 0; j < 3; ++j)
        {
            if (used[j])
                continue;

            Point anchor = *(pieces[j]->begin());

            int offsetX = -1 * anchor.x;
            int offsetY = -1 * anchor.y;

            for (int r = 0; r < 8; ++r)
            {
                for (int c = 0; c < 8; ++c)
                {
                    if (canFit(offsetX, offsetY, pieces[j], board, r, c))
                    {
                        bool tempBoard[8][8];
                        for (const auto &p : *pieces[j])
                        {
                            auto tempBoard = board;

                            int newX = p.x + c + offsetX;
                            int newY = p.y + r + offsetY;

                            Point validPoint = {static_cast<int>(newX), static_cast<int>(newY)};

                            placement[j].push_back(validPoint);

                            tempBoard[newY][newX] = 1;

                        }
                        order.push_back(j);
                        tempScore = simulateBlast(tempBoard);
                        canSolve(j + 1, fittedPieces + 1, tempScore + score, tempBoard, placement, order);
                        placement[j].clear();
                        order.pop_back();
                    }

                }

                if (bestPlacement[0].empty() && bestPlacement[1].empty() && bestPlacement[2].empty()) {
                    {
                        bool solvable = 0;
                    }
                return solvable;
            }
        }
    }

    int simulateBlast(bool tempBoard[8][8])
    {
        // Iterate through each row and each column in our board, if it will be blasted, then add the coordinates to our set this way we don't double count points
        std::unordered_set<Point, PointHash> willDisappear;
        std::vector<Point> filledInPoints;
        int pieceScore = 0;

        for (size_t r = 0; r < 8; ++r)
        {
            filledInPoints.clear();
            for (size_t c = 0; c < 8; ++c)
            {
                Point curPoint = {(int)c, (int)r};

                if (tempBoard[r][c])
                {
                    filledInPoints.push_back(curPoint);
                }
            }
            if (filledInPoints.size() == 8)
            {
                willDisappear.insert(filledInPoints.begin(), filledInPoints.end());
            }
        }

        for (size_t c = 0; c < 8; ++c)
        {
            filledInPoints.clear();
            for (size_t r = 0; r < 8; ++r)
            {
                Point curPoint = {(int)c, (int)r};

                if (tempBoard[r][c])
                {
                    filledInPoints.push_back(curPoint);
                }
            }
            if (filledInPoints.size() == 8)
            {
                willDisappear.insert(filledInPoints.begin(), filledInPoints.end());
            }
        }

        for (const auto &point : willDisappear)
        {
            tempBoard[point.y][point.x] = 0;
            pieceScore += 1;
        }
        return pieceScore;
    }

    bool canFit(int offsetX, int offsetY, const std::unordered_set<Point, PointHash> &piece, bool board[8][8], int r, int c)
    {
        for (const Point &p : piece)
        {
            int newX = p.x + c + offsetX;
            int newY = p.y + r + offsetY;

            // Check if the new position is within bounds and not occupied
            if (newX < 0 || newX >= 8 || newY < 0 || newY >= 8 || board[newY][newX])
            {
                return false;
            }
        }
        return true;
    }