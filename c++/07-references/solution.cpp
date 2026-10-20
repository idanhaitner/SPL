// Finished lesson 7. Write yours in exercise.cpp first.

#include "check.hpp"

void add_one(int& x) {
    x = x + 1;
}

void swap_int(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

void clamp(int& x, int lo, int hi) {
    if (x < lo) {
        x = lo;
    } else if (x > hi) {
        x = hi;
    }
}

int bigger(const int& a, const int& b) {
    if (a > b) {
        return a;
    }
    return b;
}

void sort2(int& a, int& b) {
    if (a > b) {
        swap_int(a, b);
    }
}

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
