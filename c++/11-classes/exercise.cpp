// Lesson 11 exercises.
// From the c++ directory:  make try LESSON=11-classes

#include "check.hpp"

struct Point {
    const int x;
    const int y;

    // const members are initialized here, before the body. Leave this list.
    Point(int x, int y) : x(x), y(y) {}

    // |x - other.x| + |y - other.y|. This method must stay const.
    int manhattan(const Point& other) const {
        throw NotImplemented("manhattan");
    }
};

class Counter {
    int value_;

public:
    explicit Counter(int start) : value_(0) {
        (void)start;
        (void)value_;
        throw NotImplemented("Counter");
    }

    void increment() {
        throw NotImplemented("increment");
    }

    int get() const {
        throw NotImplemented("get");
    }
};

int bumped(Counter* c) {
    // Increment through the pointer and return the new value. Use ->.
    throw NotImplemented("bumped");
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
