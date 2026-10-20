// Finished lesson 2. Write yours in exercise.cpp first.

#include "check.hpp"

int bytes_of_char() {
    return static_cast<int>(sizeof(char));
}

int chars_per_int() {
    return static_cast<int>(sizeof(int) / sizeof(char));
}

int truncated() {
    double d = 3.9;
    return static_cast<int>(d);
}

int wrapped_byte() {
    unsigned char byte = 255;
    byte = static_cast<unsigned char>(byte + 1);
    return static_cast<int>(byte);
}

int zero() {
    int value{};
    return value;
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
