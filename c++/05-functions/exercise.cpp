// =============================================================================
// Lesson 5 exercises: functions
// =============================================================================
// What you practice: loops inside functions, early return, overloading (two
// functions with the same name and different parameter types), and pass by
// value (the function gets a copy).
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=05-functions
// =============================================================================

#include "check.hpp"

// -----------------------------------------------------------------------------
// 1. power
// Compute base raised to the power exp (base^exp) with a loop.
//
//   base     any int
//   exp      >= 0 (never negative)
//   returns  base multiplied by itself exp times. Anything to the power 0 is 1.
//
// Examples:  power(2, 10) == 1024    power(5, 0) == 1    power(3, 4) == 81
// Hint: start int result = 1 and multiply by base, exp times.
//       Do not use std::pow: it works on doubles, and this lesson is the loop.
// -----------------------------------------------------------------------------
int power(int base, int exp) {
    throw NotImplemented("power");
}

// -----------------------------------------------------------------------------
// 2. is_prime
// Decide whether n is a prime number: greater than 1, and divisible only by
// 1 and itself.
//
//   n        any int, possibly 0 or negative
//   returns  true if n is prime, otherwise false.
//            Every n < 2 (including 0, 1, and negatives) returns false.
//
// Examples:  is_prime(1) == false    is_prime(2) == true
//            is_prime(9) == false    is_prime(13) == true
// Hint: if n < 2, return false. Otherwise try every d from 2 up to n - 1.
//       If n % d == 0, you found a divisor, so return false right away.
//       If the loop finishes, return true.
//       (Faster: stop once d * d > n. Not required.)
// -----------------------------------------------------------------------------
bool is_prime(int n) {
    throw NotImplemented("is_prime");
}

// -----------------------------------------------------------------------------
// 3. area (int version) and 4. area (double version)
// Two functions with the same name: this is OVERLOADING. The compiler picks
// one from the argument types: area(3, 4) calls the int one, and
// area(2.5, 4.0) calls the double one.
//
//   w, h     width and height of a rectangle
//   returns  w * h, in the same type as the parameters
//
// Examples:  area(3, 4) == 12    area(2.5, 4.0) == 10.0
// -----------------------------------------------------------------------------
int area(int w, int h) {
    throw NotImplemented("area int");
}

double area(double w, double h) {
    throw NotImplemented("area double");
}

// -----------------------------------------------------------------------------
// 5. increment_copy
// Return x + 1.
//
//   x        a COPY of the caller's int (pass by value)
//   returns  x + 1
//
// The point: even if you write ++x inside this function, the caller's
// variable does not change, because x is a separate copy. The test checks
// that the caller's n is still 10 after the call.
//
// Example:   int n = 10;  increment_copy(n) == 11, and n is still 10.
// -----------------------------------------------------------------------------
int increment_copy(int x) {
    throw NotImplemented("increment_copy");
}

// The checker. You do not edit main.
int main() {
    Score score;
    task(score, "2^10", [] { expect_eq(power(2, 10), 1024); });
    task(score, "5^0", [] { expect_eq(power(5, 0), 1); });
    task(score, "3^4", [] { expect_eq(power(3, 4), 81); });
    task(score, "1 is not prime", [] { expect_true(!is_prime(1), "1 is not prime"); });
    task(score, "2 is prime", [] { expect_true(is_prime(2), "2 is prime"); });
    task(score, "9 is not prime", [] { expect_true(!is_prime(9), "9 is not prime"); });
    task(score, "13 is prime", [] { expect_true(is_prime(13), "13 is prime"); });
    task(score, "int area", [] { expect_eq(area(3, 4), 12); });
    task(score, "double area", [] { expect_eq(area(2.5, 4.0), 10.0); });
    task(score, "pass by value returns a new int", [] {
        int n = 10;
        expect_eq(increment_copy(n), 11);
        expect_eq(n, 10);
    });
    return score.finish();
}
