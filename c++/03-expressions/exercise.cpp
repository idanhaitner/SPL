// Lesson 3 exercises.
// From the c++ directory:  make try LESSON=03-expressions

#include "check.hpp"

int quotient(int a, int b) {
    return a / b;
}

int remainder(int a, int b) {
    return a % b;
}

int precedence() {
    // Return the value of 2 + 3 * 4, with no extra parentheses.
    return 2 + 3 * 4;
}

int value_after_prefix() {
    // Start from x = 5, apply prefix ++ once, and return x.
    int x = 5;
    ++x;
    return x;
}

int value_returned_by_postfix() {
    // Return the value of the expression y++, starting from y = 5.
    int y = 5;
    return y++;
}

bool in_range(int x, int lo, int hi) {
    // True when lo <= x <= hi. Write it with &&.
    return lo <= x && x <= hi;
}

bool value_of_chained_compare() {
    // `1 < 100 < 0` is parsed as (1 < 100) < 0. This compiler rejects the
    // chained spelling, so write that parse yourself and return its value.
    return (1 < 100) < 0;
}

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
