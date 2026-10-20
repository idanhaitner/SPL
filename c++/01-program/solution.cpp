// Finished lesson 1. Write yours in exercise.cpp first.

#include "check.hpp"

int add(int a, int b) {
    return a + b;
}

int double_of(int n) {
    return n * 2;
}

int subtract(int a, int b) {
    return a - b;
}

int volume(int w, int h, int d) {
    return w * h * d;
}

int main() {
    Score score;
    task(score, "add(2, 3) is 5", [] { expect_eq(add(2, 3), 5); });
    task(score, "add(-1, 1) is 0", [] { expect_eq(add(-1, 1), 0); });
    task(score, "double_of(21) is 42", [] { expect_eq(double_of(21), 42); });
    task(score, "subtract(10, 3) is 7", [] { expect_eq(subtract(10, 3), 7); });
    task(score, "volume(2, 3, 4) is 24", [] { expect_eq(volume(2, 3, 4), 24); });
    return score.finish();
}
