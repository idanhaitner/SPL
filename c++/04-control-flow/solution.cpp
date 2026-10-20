// Finished lesson 4. Write yours in exercise.cpp first.

#include "check.hpp"

int sign(int n) {
    if (n < 0) {
        return -1;
    }
    if (n == 0) {
        return 0;
    }
    return 1;
}

int max2(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}

int sum_to(int n) {
    int sum = 0;
    for (int i = 1; i <= n; ++i) {
        sum += i;
    }
    return sum;
}

int count_evens(int lo, int hi) {
    int count = 0;
    for (int i = lo; i <= hi; ++i) {
        if (i % 2 == 0) {
            ++count;
        }
    }
    return count;
}

int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
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
