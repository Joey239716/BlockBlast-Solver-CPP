#pragma once
#include <vector>
#include <unordered_map>
#include <string>

struct Point {
    int x;
    int y;
};

extern const std::unordered_map<std::string, std::vector<Point>> blockType;
