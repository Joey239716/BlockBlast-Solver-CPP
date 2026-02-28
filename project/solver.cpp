#include "solver.h"
#include <cmath>
#include <algorithm>
#include <iostream>
#include <chrono>

BlockBlastSolver::Solution BlockBlastSolver::Solve(const std::unordered_set<Point, PointHash> &p1, const std::unordered_set<Point, PointHash> &p2, const std::unordered_set<Point, PointHash> &p3, int board[8][8], bool useCache)
{
    statesEvaluated = 0;
    cacheHits = 0;
    cachingEnabled = useCache;
    blastCache.clear();
    pieces[0] = &p1;
    pieces[1] = &p2;
    pieces[2] = &p3;
    maxResult = 0;
    bestPlacement = {};
    bestOrder = {};
    placement = {};
    order = {};
    Solution solution;

    auto start = std::chrono::high_resolution_clock::now();
    canSolve(0, 0, board);
    auto end = std::chrono::high_resolution_clock::now();
    float ms = std::chrono::duration<float, std::milli>(end - start).count();

    if (!bestOrder.empty()){
        solution.found = 1;
        solution.solutionPlacements = bestPlacement;
        solution.solutionOrder = bestOrder;
    }
    else {
        solution.found = 0;
    }

    std::cout << (cachingEnabled ? "[WITH CACHE]" : "[NO CACHE]") << std::endl;
    std::cout << "States evaluated: " << statesEvaluated << std::endl;
    std::cout << "Search space reduction: " << (1 - (float)statesEvaluated / 1572864) * 100 << "%" << std::endl;
    std::cout << "Cache hits: " << cacheHits << std::endl;
    std::cout << "Solve time: " << ms << "ms" << std::endl;
    std::cout << "-----------------------------" << std::endl;

    return solution;
}

size_t BlockBlastSolver::hashBoard(int board[8][8])
{
    size_t seed = 0;
    for (int r = 0; r < 8; ++r)
        for (int c = 0; c < 8; ++c)
            seed ^= std::hash<int>{}(board[r][c]) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
    return seed;
}

int BlockBlastSolver::maxPossibleScore(int board[8][8])
{
    int unplaced = 0;
    for (size_t j = 0; j < 3; ++j)
        if (!pieces[j]->empty() && placement[j].empty())
            unplaced++;
    return unplaced * 16;
}

void BlockBlastSolver::canSolve(int fittedPieces, int score, int board[8][8])
{
    statesEvaluated++;
    int numPieces = 0;
    for (size_t j = 0; j < 3; ++j)
        if (!pieces[j]->empty()) numPieces++;

    if (fittedPieces == numPieces)
    {
        if (score >= maxResult)
        {
            maxResult = score;
            bestPlacement = placement;
            bestOrder = order;
        }
        return;
    }

    if (score + maxPossibleScore(board) <= maxResult)
        return;

    struct PieceCandidate {
        int pieceIdx;
        int bestImmediateScore;
    };

    std::vector<PieceCandidate> candidates;
    for (size_t j = 0; j < 3; ++j)
    {
        if (!placement[j].empty()) continue;
        if (pieces[j]->empty()) continue;

        Point anchor = *(pieces[j]->begin());
        int offsetX = -1 * anchor.x;
        int offsetY = -1 * anchor.y;

        int bestScore = -1;
        for (int r = 0; r < 8; ++r)
        {
            for (int c = 0; c < 8; ++c)
            {
                if (canFit(offsetX, offsetY, *pieces[j], board, r, c))
                {
                    int tempBoard[8][8];
                    memcpy(tempBoard, board, sizeof(tempBoard));
                    for (const auto &p : *pieces[j])
                    {
                        int newX = p.x + c + offsetX;
                        int newY = p.y + r + offsetY;
                        tempBoard[newY][newX] = 1;
                    }
                    int s = simulateBlast(tempBoard);
                    if (s > bestScore) bestScore = s;
                }
            }
        }
        candidates.push_back({(int)j, bestScore});
    }

    std::sort(candidates.begin(), candidates.end(), [](const PieceCandidate &a, const PieceCandidate &b) {
        return a.bestImmediateScore > b.bestImmediateScore;
    });

    for (const auto &candidate : candidates)
    {
        size_t j = candidate.pieceIdx;

        Point anchor = *(pieces[j]->begin());
        int offsetX = -1 * anchor.x;
        int offsetY = -1 * anchor.y;

        for (int r = 0; r < 8; ++r)
        {
            for (int c = 0; c < 8; ++c)
            {
                if (canFit(offsetX, offsetY, *pieces[j], board, r, c))
                {
                    int tempBoard[8][8];
                    memcpy(tempBoard, board, sizeof(tempBoard));
                    for (const auto &p : *pieces[j])
                    {
                        int newX = p.x + c + offsetX;
                        int newY = p.y + r + offsetY;
                        Point validPoint = {static_cast<int>(newX), static_cast<int>(newY)};
                        placement[j].push_back(validPoint);
                        tempBoard[newY][newX] = 1;
                    }
                    order.push_back(j);
                    tempScore = simulateBlast(tempBoard);
                    canSolve(fittedPieces + 1, tempScore + score, tempBoard);
                    placement[j].clear();
                    order.pop_back();
                }
            }
        }
    }
}

int BlockBlastSolver::simulateBlast(int tempBoard[8][8])
{
    if (cachingEnabled)
    {
        size_t key = hashBoard(tempBoard);
        auto it = blastCache.find(key);
        if (it != blastCache.end())
        {
            cacheHits++;
            return it->second;
        }

        std::unordered_set<Point, PointHash> willDisappear;
        std::vector<Point> filledInPoints;
        int pieceScore = 0;

        for (size_t r = 0; r < 8; ++r)
        {
            filledInPoints.clear();
            for (size_t c = 0; c < 8; ++c)
            {
                Point curPoint = {(int)c, (int)r};
                if (tempBoard[r][c] != 0)
                    filledInPoints.push_back(curPoint);
            }
            if (filledInPoints.size() == 8)
                willDisappear.insert(filledInPoints.begin(), filledInPoints.end());
        }

        for (size_t c = 0; c < 8; ++c)
        {
            filledInPoints.clear();
            for (size_t r = 0; r < 8; ++r)
            {
                Point curPoint = {(int)c, (int)r};
                if (tempBoard[r][c] != 0)
                    filledInPoints.push_back(curPoint);
            }
            if (filledInPoints.size() == 8)
                willDisappear.insert(filledInPoints.begin(), filledInPoints.end());
        }

        for (const auto &point : willDisappear)
        {
            tempBoard[point.y][point.x] = 0;
            pieceScore += 1;
        }

        blastCache[key] = pieceScore;
        return pieceScore;
    }
    else
    {
        std::unordered_set<Point, PointHash> willDisappear;
        std::vector<Point> filledInPoints;
        int pieceScore = 0;

        for (size_t r = 0; r < 8; ++r)
        {
            filledInPoints.clear();
            for (size_t c = 0; c < 8; ++c)
            {
                Point curPoint = {(int)c, (int)r};
                if (tempBoard[r][c] != 0)
                    filledInPoints.push_back(curPoint);
            }
            if (filledInPoints.size() == 8)
                willDisappear.insert(filledInPoints.begin(), filledInPoints.end());
        }

        for (size_t c = 0; c < 8; ++c)
        {
            filledInPoints.clear();
            for (size_t r = 0; r < 8; ++r)
            {
                Point curPoint = {(int)c, (int)r};
                if (tempBoard[r][c] != 0)
                    filledInPoints.push_back(curPoint);
            }
            if (filledInPoints.size() == 8)
                willDisappear.insert(filledInPoints.begin(), filledInPoints.end());
        }

        for (const auto &point : willDisappear)
        {
            tempBoard[point.y][point.x] = 0;
            pieceScore += 1;
        }

        return pieceScore;
    }
}

bool BlockBlastSolver::canFit(int offsetX, int offsetY, const std::unordered_set<Point, PointHash> &piece, int board[8][8], int r, int c)
{
    for (const Point &p : piece)
    {
        int newX = p.x + c + offsetX;
        int newY = p.y + r + offsetY;
        if (newX < 0 || newX >= 8 || newY < 0 || newY >= 8 || board[newY][newX] != 0)
            return false;
    }
    return true;
}