// Lesson 6 exercises.
// From the c++ directory:  make try LESSON=06-arrays-and-text

#include "check.hpp"

#include <string>
#include <vector>

int sum(const int a[], int n) {
    throw NotImplemented("sum");
}

int max_of(const int a[], int n) {
    // n is at least 1.
    throw NotImplemented("max_of");
}

int index_of(const int a[], int n, int target) {
    // First index of target, or -1.
    throw NotImplemented("index_of");
}

int count_char(const std::string& text, char c) {
    throw NotImplemented("count_char");
}

std::string shout(const std::string& text) {
    throw NotImplemented("shout");
}

int total(const std::vector<int>& values) {
    throw NotImplemented("total");
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
