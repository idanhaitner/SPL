// =============================================================================
// Lesson 11 exercises: classes
// =============================================================================
// What you practice: member initializer lists, const member functions, a
// private field behind public methods, and calling methods through a pointer
// with ->.
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=11-classes
//
// About the `(void)something;` lines: they only keep the compiler from warning
// "unused" while the body is still a throw. Delete them when you write the
// real code.
// =============================================================================

#include "check.hpp"

#include <cstdlib>   // std::abs

// -----------------------------------------------------------------------------
// Point: given except for manhattan
// -----------------------------------------------------------------------------
struct Point {
    const int x;
    const int y;

    // Given. const members CANNOT be assigned in the constructor body
    // (x = 1; would not compile). They must get their value in the initializer
    // list after the colon. Leave this constructor as it is.
    Point(int x, int y) : x(x), y(y) {}

    // -------------------------------------------------------------------------
    // 1. manhattan
    // The "city block" distance between this point and other: how far you
    // walk if you can only move along the grid.
    //
    //   other    the other point (const reference: read it, do not copy it)
    //   returns  |x - other.x| + |y - other.y|
    //
    // Example:   (1,1) and (4,5):  |1-4| + |1-5| = 3 + 4 = 7
    //            The answer is the same in both directions.
    //
    // The `const` after the parentheses means "this method does not change
    // the object". That is what lets the test call it on a const Point.
    // Hint: std::abs(n) gives |n|.
    // -------------------------------------------------------------------------
    int manhattan(const Point& other) const {
        throw NotImplemented("manhattan");
    }
};

// -----------------------------------------------------------------------------
// Counter: a number that only goes up.
// value_ is private, so code outside the class can only reach it through
// increment() and get().
// -----------------------------------------------------------------------------
class Counter {
    int value_;

public:
    // -------------------------------------------------------------------------
    // 2. Counter constructor
    // Start the counter at `start`.
    //
    //   start    the first value, e.g. Counter c(3); means c.get() == 3
    //
    // Right now the initializer list says value_(0). Change it so value_ starts
    // at start, then delete the (void) lines and the throw. The body can be
    // empty: {}
    //
    // `explicit` stops C++ from silently turning an int into a Counter
    // (Counter c = 3; will not compile). You do not need to change it.
    // -------------------------------------------------------------------------
    explicit Counter(int start) : value_(0) {
        (void)start;
        (void)value_;
        throw NotImplemented("Counter");
    }

    // -------------------------------------------------------------------------
    // 3. increment
    // Add 1 to the counter. Not const, because it changes the object.
    // -------------------------------------------------------------------------
    void increment() {
        throw NotImplemented("increment");
    }

    // -------------------------------------------------------------------------
    // 4. get
    // Return the current value. const, because reading does not change
    // anything.
    // -------------------------------------------------------------------------
    int get() const {
        throw NotImplemented("get");
    }
};

// -----------------------------------------------------------------------------
// 5. bumped
// Increment a Counter you reach through a pointer, then report its new value.
//
//   c        pointer to a Counter that belongs to the caller (never null here)
//   returns  the counter's value after one increment
//
// Example:   Counter k(3);  bumped(&k) == 4, and afterwards k.get() == 4 too.
//            It is the caller's object, not a copy.
// Use ->:  c->increment()  means  (*c).increment()
// -----------------------------------------------------------------------------
int bumped(Counter* c) {
    throw NotImplemented("bumped");
}

// The checker. You do not edit main.
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
