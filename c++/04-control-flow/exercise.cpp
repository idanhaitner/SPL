// =============================================================================
// Lesson 4 exercises: control flow
// =============================================================================
// What you practice: if / else if / else, while loops, for loops, and the
// accumulator pattern (start a variable at 0 or 1, update it in a loop).
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=04-control-flow
// =============================================================================

#include "check.hpp"

// -----------------------------------------------------------------------------
// 1. sign
// Report whether n is negative, zero, or positive.
//
//   n        any int
//   returns  -1 if n < 0
//             0 if n == 0
//             1 if n > 0
//
// Examples:  sign(-4) == -1    sign(0) == 0    sign(9) == 1
// Hint: an if / else if / else chain with three branches.
// -----------------------------------------------------------------------------
int sign(int n) {
    throw NotImplemented("sign");
}

// -----------------------------------------------------------------------------
// 2. max2
// Return the larger of a and b.
//
//   a, b     any ints
//   returns  the bigger one. When they are equal, return either one (same value).
//
// Examples:  max2(3, 8) == 8    max2(4, 4) == 4
// Write it with if, or with the ?: operator. Do not use std::max.
// -----------------------------------------------------------------------------
int max2(int a, int b) {
    throw NotImplemented("max2");
}

// -----------------------------------------------------------------------------
// 3. sum_to
// Add up every whole number from 1 to n.
//
//   n        >= 0 (never negative)
//   returns  1 + 2 + ... + n. When n is 0 there is nothing to add, so return 0.
//
// Examples:  sum_to(0) == 0    sum_to(3) == 6    sum_to(10) == 55
// Hint: int total = 0; then a for loop from 1 to n (including n) that adds
//       the loop counter to total.
// -----------------------------------------------------------------------------
int sum_to(int n) {
    throw NotImplemented("sum_to");
}

// -----------------------------------------------------------------------------
// 4. count_evens
// Count how many even numbers lie between lo and hi, including both ends.
//
//   lo, hi   the edges of the range, lo <= hi
//   returns  how many ints i with lo <= i <= hi have i % 2 == 0
//
// Examples:  count_evens(1, 10) == 5    (2, 4, 6, 8, 10)
//            count_evens(2, 2)  == 1    (just 2)
// Hint: loop i from lo to hi and add 1 to a counter when i % 2 == 0.
// -----------------------------------------------------------------------------
int count_evens(int lo, int hi) {
    throw NotImplemented("count_evens");
}

// -----------------------------------------------------------------------------
// 5. factorial
// Compute n! = 1 * 2 * 3 * ... * n with a loop (not recursion).
//
//   n        >= 0, small enough that the answer fits in an int (n <= 12)
//   returns  n!. By definition 0! is 1.
//
// Examples:  factorial(0) == 1    factorial(5) == 120
// Hint: like sum_to, but start the result at 1 and multiply instead of add.
//       Why 1? Starting at 0 would make every product 0.
// -----------------------------------------------------------------------------
int factorial(int n) {
    throw NotImplemented("factorial");
}

// The checker. You do not edit main.
int main() {
    Score score;
    task(score, "sign of -4", [] { expect_eq(sign(-4), -1); });
    task(score, "sign of 0", [] { expect_eq(sign(0), 0); });
    task(score, "sign of 9", [] { expect_eq(sign(9), 1); });
    task(score, "max2", [] { expect_eq(max2(3, 8), 8); });
    task(score, "max2 ties", [] { expect_eq(max2(4, 4), 4); });
    task(score, "sum through 0", [] { expect_eq(sum_to(0), 0); });
    task(score, "sum through 3", [] { expect_eq(sum_to(3), 6); });
    task(score, "sum through 10", [] { expect_eq(sum_to(10), 55); });
    task(score, "evens from 1 to 10", [] { expect_eq(count_evens(1, 10), 5); });
    task(score, "evens from 2 to 2", [] { expect_eq(count_evens(2, 2), 1); });
    task(score, "factorial 0", [] { expect_eq(factorial(0), 1); });
    task(score, "factorial 5", [] { expect_eq(factorial(5), 120); });
    return score.finish();
}
