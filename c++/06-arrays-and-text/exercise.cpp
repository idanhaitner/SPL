// =============================================================================
// Lesson 6 exercises: arrays and text
// =============================================================================
// What you practice: walking a C array with an index, std::string, and
// std::vector.
//
// Important about C arrays: an array passed to a function does NOT know its
// own length. That is why the C-array functions also take n, the number of
// elements. Valid indexes are 0 .. n-1. Reading a[n] is past the end and is
// undefined behavior.
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=06-arrays-and-text
// =============================================================================

#include "check.hpp"

#include <string>
#include <vector>

// -----------------------------------------------------------------------------
// 1. sum
// Add up the first n elements of the array a.
//
//   a        a C array of ints (const: read it, do not change it)
//   n        how many elements to read, >= 0
//   returns  a[0] + a[1] + ... + a[n-1]. When n == 0 there is nothing, so 0.
//
// Example:   a = {10, 20, 30, 40}, n = 4   ->  100
// Hint: for (int i = 0; i < n; ++i) total += a[i];
// -----------------------------------------------------------------------------
int sum(const int a[], int n) {
    throw NotImplemented("sum");
}

// -----------------------------------------------------------------------------
// 2. max_of
// Find the largest value among the first n elements.
//
//   a        a C array of ints
//   n        number of elements, ALWAYS >= 1 (the array is never empty)
//   returns  the biggest value in a[0..n-1]
//
// Example:   a = {3, 9, 4, 9}, n = 4   ->  9
// Hint: start best = a[0] (not 0: what if all values were negative?), then
//       loop from index 1 and replace best whenever a[i] > best.
// -----------------------------------------------------------------------------
int max_of(const int a[], int n) {
    throw NotImplemented("max_of");
}

// -----------------------------------------------------------------------------
// 3. index_of
// Search the array for target.
//
//   a        a C array of ints
//   n        number of elements, >= 0
//   target   the value to look for
//   returns  the index of the FIRST element equal to target,
//            or -1 if target does not appear at all.
//
// Examples:  a = {3, 9, 4}, target 4  ->  2
//            a = {3, 9, 4}, target 7  -> -1
// Hint: return i as soon as a[i] == target. If the loop ends, return -1.
// -----------------------------------------------------------------------------
int index_of(const int a[], int n, int target) {
    throw NotImplemented("index_of");
}

// -----------------------------------------------------------------------------
// 4. count_char
// Count how many times the character c appears in text.
//
//   text     the string to scan (passed by const reference: no copy is made,
//            and you may not change it)
//   c        the character to count, e.g. 'a'. Single quotes mean char.
//   returns  the number of positions i where text[i] == c
//
// Example:   count_char("banana", 'a') == 3
// Hint: text.size() is the length. Or use a range-for: for (char ch : text)
// -----------------------------------------------------------------------------
int count_char(const std::string& text, char c) {
    throw NotImplemented("count_char");
}

// -----------------------------------------------------------------------------
// 5. shout
// Return a NEW string: text with one '!' added at the end.
//
//   text     the original string (const: do not modify it, build a new one)
//   returns  text followed by "!"
//
// Example:   shout("hi") == "hi!"
// Hint: std::string supports + for joining:  text + "!"
// -----------------------------------------------------------------------------
std::string shout(const std::string& text) {
    throw NotImplemented("shout");
}

// -----------------------------------------------------------------------------
// 6. total
// Add up every element of the vector.
//
//   values   a std::vector<int>. Unlike a C array it knows its own size:
//            values.size().
//   returns  the sum of all elements. 0 for an empty vector.
//
// Example:   {1, 2, 3, 4}  ->  10
// Hint: for (int v : values) total += v;
// -----------------------------------------------------------------------------
int total(const std::vector<int>& values) {
    throw NotImplemented("total");
}

// The checker. You do not edit main.
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
