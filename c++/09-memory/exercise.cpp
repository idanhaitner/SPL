// =============================================================================
// Lesson 9 exercises: memory (stack, heap, static)
// =============================================================================
// What you practice: new[] / delete[] for heap arrays, deep-copying a buffer,
// and a function-local static variable that survives between calls.
//
// Rules for heap arrays:
//   int* p = new int[n];   allocates n ints on the heap. The values start as
//                          garbage until you set them.
//   delete[] p;            frees them. Use delete[] (with brackets) for
//                          anything made with new[]. Free each block once.
//
// After lessons with new/delete, run   make test-asan   to catch leaks and
// double frees.
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=09-memory
// =============================================================================

#include "check.hpp"

// -----------------------------------------------------------------------------
// 1. make_filled
// Create a new heap array of n ints, all equal to value.
//
//   n        how many ints to allocate, >= 1
//   value    the number to put in every slot
//   returns  a pointer to the first int of the new array.
//            The CALLER now owns it and will free it with free_ints.
//
// Example:   int* p = make_filled(3, 8);   // p[0], p[1], p[2] are all 8
// Why the heap: a local array (int a[3];) dies when the function returns, so
// returning its address gives a dangling pointer. A new[] block lives until
// someone calls delete[].
// -----------------------------------------------------------------------------
int* make_filled(int n, int value) {
    throw NotImplemented("make_filled");
}

// -----------------------------------------------------------------------------
// 2. free_ints
// Free an array that make_filled or copy_to_new returned.
//
//   p        a pointer that came from new int[...]
//   returns  nothing. The block is released. p must not be used afterwards.
//
// One line. The question is which delete: delete or delete[]?
// -----------------------------------------------------------------------------
void free_ints(int* p) {
    throw NotImplemented("free_ints");
}

// -----------------------------------------------------------------------------
// 3. copy_to_new
// Make a DEEP copy: allocate a new heap array and copy n ints into it.
//
//   src      the array to copy from (read only)
//   n        how many ints to copy, >= 1
//   returns  a pointer to a brand-new array holding the same n values.
//            Changing src later must NOT change the copy. They are two separate
//            blocks. The caller frees the copy with free_ints.
//
// Example:   int src[] = {1, 2, 3};
//            int* c = copy_to_new(src, 3);
//            src[0] = 9;              // c[0] is still 1
// Watch out: `int* c = src;` (or return src) is a SHALLOW copy, only the
// address. You need new int[n] and a loop that copies the values.
// -----------------------------------------------------------------------------
int* copy_to_new(const int* src, int n) {
    throw NotImplemented("copy_to_new");
}

// -----------------------------------------------------------------------------
// 4. tick
// A counter that remembers its value between calls, using a function-local
// static (the same idea as the lecture example).
//
//   returns  0 on the first call, 1 on the second, 2 on the third, ...
//
// How: inside the function write   static int c = 0;
//   - a static local is initialized ONCE, the first time, not on every call
//   - it lives in the static (data) region, not on the stack, so it survives
//     after the function returns
// Each call: remember the current c, add 1 to c, and return the value you
// remembered (the OLD one).
// -----------------------------------------------------------------------------
int tick() {
    throw NotImplemented("tick");
}

// The checker. You do not edit main.
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
