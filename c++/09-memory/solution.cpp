// Finished lesson 9. Write yours in exercise.cpp first.

#include "check.hpp"

int* make_filled(int n, int value) {
    int* p = new int[n];
    for (int i = 0; i < n; ++i) {
        p[i] = value;
    }
    return p;
}

void free_ints(int* p) {
    delete[] p;
}

int* copy_to_new(const int* src, int n) {
    int* copy = new int[n];
    for (int i = 0; i < n; ++i) {
        copy[i] = src[i];
    }
    return copy;
}

int tick() {
    static int c = 0;
    int x = c;
    c = c + 1;
    return x;
}

int main() {
    Score score;
    task(score, "make_filled allocates three 8s", [] {
        int* p = make_filled(3, 8);
        expect_true(p != nullptr, "allocation returned null");
        expect_eq(p[0], 8);
        expect_eq(p[2], 8);
        free_ints(p);
    });
    task(score, "copy_to_new is an independent buffer", [] {
        int src[] = {1, 2, 3};
        int* copy = copy_to_new(src, 3);
        src[0] = 9;
        expect_eq(copy[0], 1);
        expect_eq(copy[2], 3);
        free_ints(copy);
    });
    task(score, "tick returns 0 then 1", [] {
        expect_eq(tick(), 0);
        expect_eq(tick(), 1);
    });
    return score.finish();
}
