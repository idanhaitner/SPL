// Lesson 8 exercises.
// From the c++ directory:  make try LESSON=08-pointers

#include "check.hpp"

void set_through(int* p, int value) {
    // If p is null, do nothing. Otherwise write value through p.
    throw NotImplemented("set_through");
}

int read_or(const int* p, int fallback) {
    // Return *p, or fallback when p is null.
    throw NotImplemented("read_or");
}

int sum_range(const int* begin, const int* end) {
    // Add the ints in the half-open range [begin, end).
    throw NotImplemented("sum_range");
}

void fill(int* begin, int* end, int value) {
    throw NotImplemented("fill");
}

int* find_min(int* begin, int* end) {
    // Pointer to the smallest int in [begin, end). The range is not empty.
    throw NotImplemented("find_min");
}

int main() {
    Score score;
    task(score, "set_through writes x", [] {
        int x = 1;
        set_through(&x, 5);
        expect_eq(x, 5);
    });
    task(score, "set_through ignores null", [] {
        set_through(nullptr, 5);
    });
    task(score, "read_or on a live int", [] {
        int x = 7;
        expect_eq(read_or(&x, -1), 7);
    });
    task(score, "read_or on null", [] {
        expect_eq(read_or(nullptr, -1), -1);
    });
    task(score, "sum of a range", [] {
        int a[] = {10, 20, 30, 40};
        expect_eq(sum_range(a, a + 4), 100);
        expect_eq(sum_range(a + 1, a + 3), 50);
    });
    task(score, "fill a range", [] {
        int a[] = {0, 0, 0, 0};
        fill(a, a + 4, 8);
        expect_eq(a[0], 8);
        expect_eq(a[3], 8);
    });
    task(score, "find the minimum", [] {
        int a[] = {4, 1, 7, 1};
        int* p = find_min(a, a + 4);
        expect_true(p == a + 1, "the first 1 is at index 1");
        expect_eq(*p, 1);
    });
    return score.finish();
}
