// =============================================================================
// Lesson 8 exercises: pointers
// =============================================================================
// What you practice: dereferencing (*p), checking for nullptr, and walking an
// array with a pointer instead of an index.
//
// Quick reminder:
//   int* p      p holds the ADDRESS of an int (or nullptr = "points nowhere")
//   *p          the int that p points at. You can read it or assign to it.
//   p + 1       the address of the NEXT int in memory
//   ++p         move p forward one int
//   p == q      do the two pointers hold the same address?
//
// HALF-OPEN RANGES [begin, end):  several functions get two pointers. begin
// points at the first element. end points ONE PAST the last element. Never
// read *end. The standard loop is:
//
//     for (const int* p = begin; p != end; ++p) { ... use *p ... }
//
// When begin == end the range is empty.
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=08-pointers
// =============================================================================

#include "check.hpp"

// -----------------------------------------------------------------------------
// 1. set_through
// Write value into the int that p points at.
//
//   p        address of an int, OR nullptr
//   value    the number to store
//   returns  nothing. If p is not null, *p becomes value.
//            If p is nullptr, do nothing at all (and do not crash).
//
// Example:   int x = 1;  set_through(&x, 5);  // now x == 5
//            set_through(nullptr, 5);         // nothing happens
// Why: *nullptr is undefined behavior, usually a crash. Check before you write.
// -----------------------------------------------------------------------------
void set_through(int* p, int value) {
    throw NotImplemented("set_through");
}

// -----------------------------------------------------------------------------
// 2. read_or
// Read the int p points at, with a fallback for null.
//
//   p          pointer to a const int (you may read *p, not write it), or nullptr
//   fallback   the value to return when p is nullptr
//   returns    *p when p is not null, otherwise fallback
//
// Examples:  int x = 7;  read_or(&x, -1) == 7
//            read_or(nullptr, -1) == -1
// -----------------------------------------------------------------------------
int read_or(const int* p, int fallback) {
    throw NotImplemented("read_or");
}

// -----------------------------------------------------------------------------
// 3. sum_range
// Add up every int in the half-open range [begin, end). See the header above.
//
//   begin    points at the first int to add
//   end      points one past the last int. Do NOT read *end.
//   returns  the sum. 0 when begin == end.
//
// Examples:  a = {10, 20, 30, 40}
//            sum_range(a, a + 4)     == 100   (all four)
//            sum_range(a + 1, a + 3) == 50    (20 + 30)
// Do it with pointers only: no index i, no a[i].
// -----------------------------------------------------------------------------
int sum_range(const int* begin, const int* end) {
    throw NotImplemented("sum_range");
}

// -----------------------------------------------------------------------------
// 4. fill
// Set every int in [begin, end) to value.
//
//   begin, end   a half-open range of ints you may write
//   value        the number to store in each one
//   returns      nothing. The caller's array is changed in place.
//
// Example:   int a[] = {0, 0, 0, 0};  fill(a, a + 4, 8);  // a is {8, 8, 8, 8}
// -----------------------------------------------------------------------------
void fill(int* begin, int* end, int value) {
    throw NotImplemented("fill");
}

// -----------------------------------------------------------------------------
// 5. find_min
// Find WHERE the smallest int is. Return a pointer to it, not its value.
//
//   begin, end   a half-open range. It is never empty (begin != end).
//   returns      a pointer to the smallest element. If the smallest value
//                appears more than once, return a pointer to the FIRST one.
//
// Example:   int a[] = {4, 1, 7, 1};
//            find_min(a, a + 4) == a + 1     (the first 1, at index 1)
// Hint: int* best = begin; then walk p from begin + 1 to end, and set
//       best = p when *p < *best. Use <, not <=, so a later tie does not
//       replace the first one.
// -----------------------------------------------------------------------------
int* find_min(int* begin, int* end) {
    throw NotImplemented("find_min");
}

// The checker. You do not edit main.
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
