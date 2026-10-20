// Lesson 1 exercises.
// Replace each `throw NotImplemented(...)` with a return.
// From the c++ directory:  make try LESSON=01-program
// A finished version is in solution.cpp. Try before you open it.

#include "check.hpp"

int add(int a, int b) {
    throw NotImplemented("add");
}

int double_of(int n) {
    throw NotImplemented("double_of");
}

int subtract(int a, int b) {
    throw NotImplemented("subtract");
}

int volume(int w, int h, int d) {
    throw NotImplemented("volume");
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
