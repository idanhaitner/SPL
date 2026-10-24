// =============================================================================
// Lesson 3 exercises: expressions
// =============================================================================
// What you practice: integer division, %, operator precedence, prefix and
// postfix ++, && in a range test, and why `a < b < c` is not a range test.
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=03-expressions
// =============================================================================

#include "check.hpp"

// -----------------------------------------------------------------------------
// 1. quotient
// Return a divided by b, using int division.
//
//   a        the dividend
//   b        the divisor, never 0
//   returns  the whole-number part of a / b. int / int drops the fraction.
//
// Example:   quotient(7, 2) == 3   (not 3.5)
// -----------------------------------------------------------------------------
int quotient(int a, int b) {
    return a / b;
}

// -----------------------------------------------------------------------------
// 2. remainder
// Return what is left over after dividing a by b.
//
//   a, b     ints, b never 0
//   returns  a % b
//
// Example:   remainder(7, 2) == 1   (7 = 2*3 + 1)
// -----------------------------------------------------------------------------
int remainder(int a, int b) {
    return a % b;
}

// -----------------------------------------------------------------------------
// 3. precedence
// Return the value of 2 + 3 * 4, written exactly like that, with no extra
// parentheses.
//
//   returns  14. * binds tighter than +, so this is 2 + 12, not 5 * 4.
// -----------------------------------------------------------------------------
int precedence() {
    return 2 + 3 * 4;
}

// -----------------------------------------------------------------------------
// 4. value_after_prefix
// Make a local int x = 5. Apply prefix ++ once (++x). Return x.
//
//   returns  6. ++x adds 1 to x first, then yields the new value.
// -----------------------------------------------------------------------------
int value_after_prefix() {
    int x = 5;
    ++x;
    return x;
}

// -----------------------------------------------------------------------------
// 5. value_returned_by_postfix
// Make a local int y = 5. Return the value of the expression y++ itself
// (write `return y++;`).
//
//   returns  5. y++ yields the OLD value. y does become 6, but only after
//            the expression has produced 5.
// -----------------------------------------------------------------------------
int value_returned_by_postfix() {
    int y = 5;
    return y++;
}

// -----------------------------------------------------------------------------
// 6. in_range
// Is x between lo and hi, including both ends?
//
//   x        the value to test
//   lo, hi   the edges of the range, lo <= hi
//   returns  true when lo <= x and x <= hi. Otherwise false.
//
// Examples:  in_range(5, 1, 10) == true
//            in_range(0, 1, 10) == false
//            in_range(10, 1, 10) == true   (the end itself is inside)
//
// Write it as two comparisons joined with &&.
// -----------------------------------------------------------------------------
bool in_range(int x, int lo, int hi) {
    return lo <= x && x <= hi;
}

// -----------------------------------------------------------------------------
// 7. value_of_chained_compare
// In math, 1 < 100 < 0 is false because 100 < 0 is false. C++ reads it
// differently: as (1 < 100) < 0. First (1 < 100) becomes true, which acts as 1,
// and then 1 < 0 is computed.
//
// This compiler rejects the chained spelling, so write the parenthesized
// version yourself and return it.
//
//   returns  the value of (1 < 100) < 0, which is false
// -----------------------------------------------------------------------------
bool value_of_chained_compare() {
    return (1 < 100) < 0;
}

// The checker. You do not edit main.
int main() {
    Score score;
    task(score, "integer quotient", [] { expect_eq(quotient(7, 2), 3); });
    task(score, "remainder", [] { expect_eq(remainder(7, 2), 1); });
    task(score, "multiplication before addition", [] { expect_eq(precedence(), 14); });
    task(score, "prefix increment changes x first", [] { expect_eq(value_after_prefix(), 6); });
    task(score, "postfix increment yields the old value", [] {
        expect_eq(value_returned_by_postfix(), 5);
    });
    task(score, "5 is inside 1..10", [] { expect_true(in_range(5, 1, 10), "5 should be inside"); });
    task(score, "0 is outside 1..10", [] { expect_true(!in_range(0, 1, 10), "0 should be outside"); });
    task(score, "10 is inside 1..10", [] { expect_true(in_range(10, 1, 10), "10 should be inside"); });
    task(score, "chained < is not a range test", [] {
        expect_true(value_of_chained_compare() == false, "1 < 100 < 0 is false");
    });
    return score.finish();
}
