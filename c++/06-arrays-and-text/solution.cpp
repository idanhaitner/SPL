// Finished lesson 6. Write yours in exercise.cpp first.

#include "check.hpp"

#include <string>
#include <vector>

int sum(const int a[], int n) {
    int total = 0;
    for (int i = 0; i < n; ++i) {
        total += a[i];
    }
    return total;
}

int max_of(const int a[], int n) {
    int best = a[0];
    for (int i = 1; i < n; ++i) {
        if (a[i] > best) {
            best = a[i];
        }
    }
    return best;
}

int index_of(const int a[], int n, int target) {
    for (int i = 0; i < n; ++i) {
        if (a[i] == target) {
            return i;
        }
    }
    return -1;
}

int count_char(const std::string& text, char c) {
    int count = 0;
    for (char ch : text) {
        if (ch == c) {
            ++count;
        }
    }
    return count;
}

std::string shout(const std::string& text) {
    return text + "!";
}

int total(const std::vector<int>& values) {
    int sum = 0;
    for (int x : values) {
        sum += x;
    }
    return sum;
}

int main() {
    Score score;
    task(score, "sum of four scores", [] {
        int a[] = {10, 20, 30, 40};
        expect_eq(sum(a, 4), 100);
    });
    task(score, "sum of nothing", [] {
        int a[] = {0};
        expect_eq(sum(a, 0), 0);
    });
    task(score, "max of the array", [] {
        int a[] = {3, 9, 4, 9};
        expect_eq(max_of(a, 4), 9);
    });
    task(score, "index of 4", [] {
        int a[] = {3, 9, 4};
        expect_eq(index_of(a, 3, 4), 2);
    });
    task(score, "missing target", [] {
        int a[] = {3, 9, 4};
        expect_eq(index_of(a, 3, 7), -1);
    });
    task(score, "count a letter", [] {
        expect_eq(count_char("banana", 'a'), 3);
    });
    task(score, "shout", [] {
        expect_eq(shout("hi"), std::string("hi!"));
    });
    task(score, "vector total", [] {
        std::vector<int> values{1, 2, 3, 4};
        expect_eq(total(values), 10);
    });
    return score.finish();
}
