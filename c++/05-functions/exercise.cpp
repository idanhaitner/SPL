// Lesson 5 exercises.
// From the c++ directory:  make try LESSON=05-functions

#include "check.hpp"

int power(int base, int exp) {
    // base^exp for exp >= 0. Anything to the power 0 is 1.
    throw NotImplemented("power");
}

bool is_prime(int n) {
    // True only when n is prime. False for every n < 2.
    throw NotImplemented("is_prime");
}

int area(int w, int h) {
    throw NotImplemented("area int");
}

double area(double w, double h) {
    throw NotImplemented("area double");
}

int increment_copy(int x) {
    // Return x + 1. The caller keeps the original, because this is pass by value.
    throw NotImplemented("increment_copy");
}

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
