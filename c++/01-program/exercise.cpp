// =============================================================================
// Lesson 1 exercises: your first functions
// =============================================================================
// What you practice: writing a function that takes ints and returns an int.
//
// How to work:
//   1. Each function below starts as `throw NotImplemented("...")`.
//      That line tells the checker "not written yet" and prints [todo].
//   2. Delete the throw line and write a `return` with the right value.
//   3. Run from the c++ directory:   make try LESSON=01-program
//   4. Repeat until every line prints [pass].
//   A finished version is in solution.cpp. Try before you open it.
// =============================================================================

#include "check.hpp"

// -----------------------------------------------------------------------------
// 1. add
// Return the sum of a and b.
//
//   a, b     any ints (negative is fine)
//   returns  a + b
//
// Examples:  add(2, 3) == 5      add(-1, 1) == 0
// -----------------------------------------------------------------------------
int add(int a, int b) {
    return a+b;
}

// -----------------------------------------------------------------------------
// 2. double_of
// Return twice n.
//
//   n        any int
//   returns  n multiplied by 2
//
// Example:   double_of(21) == 42
// -----------------------------------------------------------------------------
int double_of(int n) {
    return n*2;
}

// -----------------------------------------------------------------------------
// 3. subtract
// Return a minus b. Order matters: subtract(10, 3) is 7, not -3.
//
//   a        the number you start from
//   b        the number you take away
//   returns  a - b
//
// Example:   subtract(10, 3) == 7
// -----------------------------------------------------------------------------
int subtract(int a, int b) {
    return a-b;
}

// -----------------------------------------------------------------------------
// 4. volume
// Return the volume of a box that is w wide, h high, and d deep.
//
//   w, h, d  side lengths, all positive
//   returns  w * h * d
//
// Example:   volume(2, 3, 4) == 24
// -----------------------------------------------------------------------------
int volume(int w, int h, int d) {
    return w*h*d;
}

// The checker. You do not edit main. Each task(...) line calls one of your
// functions and compares the result with the expected value.
int main() {
    Score score;
    task(score, "add(2, 3) is 5", [] { expect_eq(add(2, 3), 5); });
    task(score, "add(-1, 1) is 0", [] { expect_eq(add(-1, 1), 0); });
    task(score, "double_of(21) is 42", [] { expect_eq(double_of(21), 42); });
    task(score, "subtract(10, 3) is 7", [] { expect_eq(subtract(10, 3), 7); });
    task(score, "volume(2, 3, 4) is 24", [] { expect_eq(volume(2, 3, 4), 24); });
    return score.finish();
}
