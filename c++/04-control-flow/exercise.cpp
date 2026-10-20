// Lesson 4 exercises.
// From the c++ directory:  make try LESSON=04-control-flow

#include "check.hpp"

int sign(int n) {
    // -1 when n is negative, 0 when n is 0, 1 when n is positive.
    throw NotImplemented("sign");
}

int max2(int a, int b) {
    throw NotImplemented("max2");
}

int sum_to(int n) {
    // 1 + 2 + ... + n. The sum through 0 is 0. n is never negative.
    throw NotImplemented("sum_to");
}

int count_evens(int lo, int hi) {
    // How many even integers are in lo..hi, including both ends.
    throw NotImplemented("count_evens");
}

int factorial(int n) {
    // n! for n >= 0. 0! is 1. Use a loop.
    throw NotImplemented("factorial");
}

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
