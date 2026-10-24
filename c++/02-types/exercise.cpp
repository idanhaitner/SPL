// Lesson 2 exercises.
// From the c++ directory:  make try LESSON=02-types

#include "check.hpp"

int bytes_of_char() {
    return sizeof(char);
}

int chars_per_int() {
    return sizeof(int) / sizeof(char);
}

int truncated() {
    // Return the int you get by converting the double 3.9.
    return static_cast<int>(3.9);
}

int wrapped_byte() {
    // unsigned char starts at 255. Add 1. Return the result as an int.
    unsigned char x = 255;
    x++;
    return x;
}

int zero() {
    // Return an int that was value-initialized with {}.
    int x{};
    return x;
}

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
