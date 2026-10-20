// Finished lesson 5. Write yours in exercise.cpp first.

#include "check.hpp"

int power(int base, int exp) {
    int result = 1;
    for (int i = 0; i < exp; ++i) {
        result *= base;
    }
    return result;
}

bool is_prime(int n) {
    if (n < 2) {
        return false;
    }
    for (int d = 2; d * d <= n; ++d) {
        if (n % d == 0) {
            return false;
        }
    }
    return true;
}

int area(int w, int h) {
    return w * h;
}

double area(double w, double h) {
    return w * h;
}

int increment_copy(int x) {
    return x + 1;
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
