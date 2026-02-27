#pragma once
#include <vector>
#include <unordered_map>
#include <string>

struct Point {
    int x, y;

    bool operator<(const Point& other) const {
        if (x != other.x) return x < other.x;
        return y < other.y;
    }
};

extern const std::unordered_map<std::string, std::vector<Point>> blockType;
