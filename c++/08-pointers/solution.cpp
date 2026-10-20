// Finished lesson 8. Write yours in exercise.cpp first.

#include "check.hpp"

void set_through(int* p, int value) {
    if (p == nullptr) {
        return;
    }
    *p = value;
}

int read_or(const int* p, int fallback) {
    if (p == nullptr) {
        return fallback;
    }
    return *p;
}

int sum_range(const int* begin, const int* end) {
    int total = 0;
    for (const int* p = begin; p != end; ++p) {
        total += *p;
    }
    return total;
}

void fill(int* begin, int* end, int value) {
    for (int* p = begin; p != end; ++p) {
        *p = value;
    }
}

int* find_min(int* begin, int* end) {
    int* best = begin;
    for (int* p = begin + 1; p != end; ++p) {
        if (*p < *best) {
            best = p;
        }
    }
    return best;
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
