// Lesson 9 exercises.
// From the c++ directory:  make try LESSON=09-memory

#include "check.hpp"

int* make_filled(int n, int value) {
    // Allocate n ints on the heap, set each one to value, and return the pointer.
    // The caller will delete[] it.
    throw NotImplemented("make_filled");
}

void free_ints(int* p) {
    throw NotImplemented("free_ints");
}

int* copy_to_new(const int* src, int n) {
    // Allocate a new array and copy n ints from src. The caller frees both.
    throw NotImplemented("copy_to_new");
}

int tick() {
    // Match the lecture: a static that survives, a returned value that is the
    // old static, then the static increases by 1.
    throw NotImplemented("tick");
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
