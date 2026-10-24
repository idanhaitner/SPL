// =============================================================================
// Lesson 2 exercises: built-in types
// =============================================================================
// What you practice: sizeof, converting double to int, unsigned wrap-around,
// and brace initialization ({}).
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=02-types
// =============================================================================

#include "check.hpp"

// -----------------------------------------------------------------------------
// 1. bytes_of_char
// Return how many bytes a char takes, using the sizeof operator.
//
//   returns  sizeof(char). The standard says this is always 1.
//
// Hint: sizeof gives a size_t. Returning it from a function that returns int
//       converts it for you.
// -----------------------------------------------------------------------------
int bytes_of_char() {
    return sizeof(char);
}

// -----------------------------------------------------------------------------
// 2. chars_per_int
// Return how many chars fit in one int, counted in bytes.
//
//   returns  sizeof(int) divided by sizeof(char). That is 4 on this Mac.
//
// Do not write the literal 4. Compute it with sizeof, so the answer stays right
// on a machine where int has a different size.
// -----------------------------------------------------------------------------
int chars_per_int() {
    return sizeof(int) / sizeof(char);
}

// -----------------------------------------------------------------------------
// 3. truncated
// Convert the double 3.9 to an int and return the result.
//
//   returns  3. Converting double to int drops the fraction. It does not round.
//
// Hint: write the conversion with static_cast<int>(...).
// -----------------------------------------------------------------------------
int truncated() {
    return static_cast<int>(3.9);
}

// -----------------------------------------------------------------------------
// 4. wrapped_byte
// Show that unsigned types wrap around. Make an unsigned char that holds 255
// (its largest value), add 1, and return the result as an int.
//
//   returns  0. An unsigned value that goes past its maximum starts again at 0.
//
// Note: wrap-around is defined only for unsigned types. A signed int that
//       overflows is undefined behavior.
// -----------------------------------------------------------------------------
int wrapped_byte() {
    unsigned char x = 255;
    x++;
    return x;
}

// -----------------------------------------------------------------------------
// 5. zero
// Declare an int with empty braces (`int x{};`) and return it.
//
//   returns  0. Empty braces value-initialize, and for an int that means 0.
//
// Compare with `int x;` and no initializer: reading that x is undefined
// behavior.
// -----------------------------------------------------------------------------
int zero() {
    int x{};
    return x;
}

// The checker. You do not edit main.
int main() {
    Score score;
    task(score, "char is one byte", [] {
        expect_eq(bytes_of_char(), static_cast<int>(sizeof(char)));
    });
    task(score, "how many chars fit in an int", [] {
        expect_eq(chars_per_int(), static_cast<int>(sizeof(int) / sizeof(char)));
    });
    task(score, "3.9 becomes 3", [] { expect_eq(truncated(), 3); });
    task(score, "a byte wraps to 0", [] { expect_eq(wrapped_byte(), 0); });
    task(score, "brace initialization zeroes an int", [] { expect_eq(zero(), 0); });
    return score.finish();
}
