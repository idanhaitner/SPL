// =============================================================================
// Lesson 7 exercises: references
// =============================================================================
// What you practice: int& parameters (the function changes the CALLER's
// variable) and const int& parameters (read-only access, no copy).
//
// A reference is another name for an existing variable. Inside add_one(int& x),
// writing x = 5 writes the caller's variable. No * or & is needed in the body:
// use x like a normal int.
//
// Most functions here return void. They give their answer by changing the
// variables they received, not by returning a value.
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=07-references
// =============================================================================

#include "check.hpp"

// -----------------------------------------------------------------------------
// 1. add_one
// Increase the caller's int by 1.
//
//   x        a reference to the caller's int
//   returns  nothing. The effect is that the caller's variable is 1 bigger.
//
// Example:   int n = 10;  add_one(n);  // now n == 11
// Compare with increment_copy in lesson 5, which got a copy instead.
// -----------------------------------------------------------------------------
void add_one(int& x) {
    throw NotImplemented("add_one");
}

// -----------------------------------------------------------------------------
// 2. swap_int
// Exchange the values of the caller's two ints.
//
//   a, b     references to the caller's two ints
//   returns  nothing. Afterwards a holds b's old value and b holds a's old value.
//
// Example:   int a = 1, b = 2;  swap_int(a, b);  // now a == 2, b == 1
// Hint: you need a temporary:  int tmp = a;  a = b;  b = tmp;
//       Writing a = b; b = a; loses a's old value. Do not use std::swap here.
// -----------------------------------------------------------------------------
void swap_int(int& a, int& b) {
    throw NotImplemented("swap_int");
}

// -----------------------------------------------------------------------------
// 3. clamp
// Force the caller's x into the range [lo, hi].
//
//   x        reference to the caller's int. You may change it.
//   lo, hi   the allowed range (lo <= hi), passed by value
//   returns  nothing. Afterwards:
//              if x was < lo, x becomes lo
//              if x was > hi, x becomes hi
//              otherwise x does not change
//
// Examples (range 0..10):   -4 -> 0     40 -> 10     5 -> 5
// -----------------------------------------------------------------------------
void clamp(int& x, int lo, int hi) {
    throw NotImplemented("clamp");
}

// -----------------------------------------------------------------------------
// 4. bigger
// Return the larger of a and b.
//
//   a, b     const references: you can READ the caller's ints but you cannot
//            change them. Try writing a = 0; and read the compiler error.
//   returns  the larger value (either one when they are equal)
//
// Example:   bigger(3, 8) == 8, and the caller's a is still 3.
// const T& is how C++ passes large objects (strings, vectors) without copying.
// For an int it is only practice.
// -----------------------------------------------------------------------------
int bigger(const int& a, const int& b) {
    throw NotImplemented("bigger");
}

// -----------------------------------------------------------------------------
// 5. sort2
// Put the caller's two ints in order, so the smaller one ends up in a.
//
//   a, b     references to the caller's ints
//   returns  nothing. Afterwards a <= b.
//
// Example:   int a = 9, b = 2;  sort2(a, b);  // now a == 2, b == 9
// Hint: if a > b, call your own swap_int(a, b).
// -----------------------------------------------------------------------------
void sort2(int& a, int& b) {
    throw NotImplemented("sort2");
}

// The checker. You do not edit main.
int main() {
    Score score;
    task(score, "add_one writes the caller's int", [] {
        int n = 10;
        add_one(n);
        expect_eq(n, 11);
    });
    task(score, "swap exchanges the two ints", [] {
        int a = 1;
        int b = 2;
        swap_int(a, b);
        expect_eq(a, 2);
        expect_eq(b, 1);
    });
    task(score, "clamp raises a low value", [] {
        int x = -4;
        clamp(x, 0, 10);
        expect_eq(x, 0);
    });
    task(score, "clamp drops a high value", [] {
        int x = 40;
        clamp(x, 0, 10);
        expect_eq(x, 10);
    });
    task(score, "clamp leaves an inside value", [] {
        int x = 5;
        clamp(x, 0, 10);
        expect_eq(x, 5);
    });
    task(score, "bigger reads through const references", [] {
        int a = 3;
        int b = 8;
        expect_eq(bigger(a, b), 8);
        expect_eq(a, 3);
    });
    task(score, "sort2 orders the pair", [] {
        int a = 9;
        int b = 2;
        sort2(a, b);
        expect_eq(a, 2);
        expect_eq(b, 9);
    });
    return score.finish();
}
