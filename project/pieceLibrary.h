#pragma once
#include <vector>
#include <unordered_map>
#include <string>
#include <cstddef> // for size_t
#include <functional> // for std::hash

struct Point {
    int x, y;

    // This MUST have 'const' at the end 
    // and take a 'const Point&' as the argument
    bool operator==(const Point& other) const {
        return (x == other.x && y == other.y);
    }
};

struct PointHash {
    std::size_t operator()(const Point& p) const {
        // Shifting and XORing is a standard way to combine hashes
        return std::hash<int>{}(p.x) ^ (std::hash<int>{}(p.y) << 1);
    }
};

extern const std::unordered_map<std::string, std::vector<Point>> blockType;
