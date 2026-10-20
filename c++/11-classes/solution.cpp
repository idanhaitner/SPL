// Finished lesson 11. Write yours in exercise.cpp first.

#include "check.hpp"

struct Point {
    const int x;
    const int y;

    Point(int x, int y) : x(x), y(y) {}

    int manhattan(const Point& other) const {
        int dx = x - other.x;
        if (dx < 0) {
            dx = -dx;
        }
        int dy = y - other.y;
        if (dy < 0) {
            dy = -dy;
        }
        return dx + dy;
    }
};

class Counter {
    int value_;

public:
    explicit Counter(int start) : value_(start) {}

    void increment() { ++value_; }

    int get() const { return value_; }
};

int bumped(Counter* c) {
    c->increment();
    return c->get();
}

int main() {
    Score score;
    task(score, "manhattan distance", [] {
        const Point a(1, 1);
        Point b(4, 5);
        expect_eq(a.manhattan(b), 7);
        expect_eq(b.manhattan(a), 7);
    });
    task(score, "counter starts where you say and then increments", [] {
        Counter c(3);
        expect_eq(c.get(), 3);
        c.increment();
        expect_eq(c.get(), 4);
    });
    task(score, "a pointer uses arrow", [] {
        Counter c(3);
        expect_eq(bumped(&c), 4);
        expect_eq(c.get(), 4);
    });
    return score.finish();
}
