/*
 * SPL practice — PS2, C++ memory handling
 * Slides: Exrecises/SPL_PS2 (1).pptx
 *
 * Fill in every NotImplemented, then run the file again. A finished copy is in solutions/PS02_Memory_solution.cpp — try before you open it.
 *
 * From this folder:
 *   g++ -std=c++17 -Wall -Wextra -Wno-unused-parameter -pthread -o PS02_Memory PS02_Memory.cpp && ./PS02_Memory
 *
 * Pointer mistakes in this file are real C++ mistakes. If the program
 * aborts after you edit a function, that function is the place to look.
 * The unfinished file does not dereference anything dangerous.
 */

#include <memory>

#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

// Thrown by every unfinished exercise. The runner turns it into a [todo] line
// instead of a crash, so you can run the file after filling in just one task.
struct NotImplemented : std::runtime_error {
    explicit NotImplemented(const char* exercise) : std::runtime_error(exercise) {}
};

struct Score {
    int passed = 0;
    int failed = 0;
    int todo = 0;

    void pass(const std::string& name) {
        std::cout << "  [pass] " << name << "\n";
        ++passed;
    }
    void fail(const std::string& name, const std::string& why) {
        std::cout << "  [fail] " << name << "\n         " << why << "\n";
        ++failed;
    }
    void skip(const std::string& name) {
        std::cout << "  [todo] " << name << "\n";
        ++todo;
    }
    int finish() const {
        std::cout << "\n" << passed << " passed, " << failed << " failed, "
                  << todo << " still to do.\n";
        if (failed == 0 && todo == 0) {
            std::cout << "All exercises complete. Nice work.\n";
        } else if (failed == 0 && passed == 0) {
            std::cout << "Every exercise is still open. Fill one in and run again.\n";
        } else if (failed == 0) {
            std::cout << "The finished ones are correct. Fill in each [todo].\n";
        }
        return failed == 0 ? 0 : 1;
    }
};

template <class T>
void expect_eq(const std::string& label, const T& got, const T& want) {
    if (!(got == want)) {
        std::ostringstream out;
        out << label << "\n         expected: " << want << "\n         got:      " << got;
        throw std::runtime_error(out.str());
    }
}

inline void expect_true(const std::string& label, bool cond) {
    if (!cond) throw std::runtime_error(label);
}

template <class F>
void check(Score& score, const std::string& name, F fn) {
    try {
        fn();
        score.pass(name);
    } catch (const NotImplemented&) {
        score.skip(name);
    } catch (const std::exception& ex) {
        score.fail(name, ex.what());
    }
}

inline void read(const std::string& line) {
    std::cout << "  [read] " << line << "\n";
}


// Exercise 1.
// `int* p = &x` stores the address of x. `*p` reads the int at that address.
// Return the value of x by going through a pointer.
int value_at(int x) {
    throw NotImplemented("value_at");
}

// Exercise 2.
// Swap the ints that a and b point at. The addresses stay the same.
// The numbers move. If a pointer is null, do nothing.
void swap_ptr(int* a, int* b) {
    throw NotImplemented("swap_ptr");
}

// Exercise 3.
// A reference is a second name for an existing object.
// Syntax:  int& name = existing;
// It has to be bound at birth, and it cannot be reseated or null.
// Swap a and b through references.
void swap_ref(int& a, int& b) {
    throw NotImplemented("swap_ref");
}

// Exercise 4.
// An array name is the address of the first element.
// p + 1 points at the next int, not the next byte. Walk n elements
// with pointer arithmetic and return their sum.
int sum_first(const int* begin, int n) {
    throw NotImplemented("sum_first");
}

// Exercise 5.
// new int(v) allocates one int on the heap and initializes it to v.
// delete frees that one int. Return v * 2, and free the heap int
// before you return.
int heap_double(int v) {
    throw NotImplemented("heap_double");
}

// Exercise 6.
// A C string is characters followed by a 0 byte. Count the characters
// before that 0. The 0 itself is not part of the length.
//   cstr_len("hello") is 5.  cstr_len("") is 0.
int cstr_len(const char* text) {
    throw NotImplemented("cstr_len");
}

// Exercise 7.
// A 2-D array on the heap is an array of pointers, and each pointer owns
// a row. Fill a[i][j] with i + j, return the sum of every cell, then free
// every row with delete[] and free the pointer array with delete[].
//   grid_sum(2, 3) is 0+1+2 + 1+2+3 = 9.
int grid_sum(int rows, int cols) {
    throw NotImplemented("grid_sum");
}

// Exercise 8.
// int* p = nullptr; *p = 3;
// Return "crash", "leak", or "ok".
std::string nullptr_deref() {
    throw NotImplemented("nullptr");
}

// Exercise 9.
// int* p = new int(1); delete p; *p = 5;
// The pointer still holds the old address, and that address is no longer yours.
// Return "crash", "leak", or "dangling".
std::string use_after_delete() {
    throw NotImplemented("dangling");
}

// Exercise 10.
// int* p = new int(1); p = nullptr;
// The heap int is still allocated, and you no longer have its address.
// Return "crash", "leak", or "ok".
std::string lost_heap_pointer() {
    throw NotImplemented("leak");
}

int main() {
    std::cout << R"(
============================================================
PS2 — C++ memory handling
Slides: Exrecises/SPL_PS2 (1).pptx
============================================================

Every process gets its own addresses. Two regions matter here.

The stack holds locals. Enter a function, the locals appear.
Leave the function, they are gone.

The heap holds what you ask for at run time with new.
That memory stays until delete. The pointer variable itself
still lives on the stack; it only stores the address.

    int i = 2;
    int* pi = &i;     // pi holds the address of i
    *pi = 3;          // the int at that address becomes 3, so i is 3

A pointer is typed so that pi + 1 steps one int forward, and pc + 1
on a char* steps one byte. The null address is nullptr. Reading it
is a crash. delete on a pointer you already deleted, or on a pointer
whose memory was freed through another name, is a dangling use.

A reference is written with & after the type:

    int& ri = i;      // ri is another name for i
    ri++;             // i changes

new int(2) is one int. delete frees it.
new int[10] is an array. delete[] frees it. The brackets have to match.

A C string is a char sequence closed by a 0 byte. std::string is the
object from PS1. s.c_str() borrows a C string that dies when s changes
or is destroyed, so you copy it if you need to keep it.

)";

    int local = 2;
    int* heap = new int(2);
    std::ostringstream where;
    where << "local int lives at " << static_cast<const void*>(&local)
          << ", heap int lives at " << static_cast<const void*>(heap);
    read(where.str());
    delete heap;

    int numbers[] = {10, 20, 30};
    read("numbers[1] and *(numbers + 1) are the same cell: " + std::to_string(*(numbers + 1)));

    const char* word = "abcdefg";
    read(std::string("C string from index 3: ") + (word + 3));

    std::cout << "\nExercises\n";
    Score score;

    check(score, "1. value_at — read an int through a pointer", [] {
        expect_eq("8", value_at(8), 8);
        expect_eq("0", value_at(0), 0);
    });
    check(score, "2. swap_ptr — swap two ints through pointers", [] {
        int a = 1, b = 2;
        swap_ptr(&a, &b);
        expect_eq("a", a, 2);
        expect_eq("b", b, 1);
        swap_ptr(nullptr, &a);
        expect_eq("null leaves a alone", a, 2);
    });
    check(score, "3. swap_ref — swap two ints through references", [] {
        int a = 4, b = 9;
        swap_ref(a, b);
        expect_eq("a", a, 9);
        expect_eq("b", b, 4);
    });
    check(score, "4. sum_first — walk an array with pointer arithmetic", [] {
        int a[] = {1, 2, 3, 4};
        expect_eq("four", sum_first(a, 4), 10);
        expect_eq("none", sum_first(a, 0), 0);
    });
    check(score, "5. heap_double — new, write, delete", [] {
        expect_eq("21", heap_double(21), 42);
        expect_eq("0", heap_double(0), 0);
    });
    check(score, "6. cstr_len — count characters before the 0 byte", [] {
        expect_eq("hello", cstr_len("hello"), 5);
        expect_eq("empty", cstr_len(""), 0);
    });
    check(score, "7. grid_sum — allocate a 2-D array, sum it, free it", [] {
        expect_eq("2x3", grid_sum(2, 3), 9);
        expect_eq("1x1", grid_sum(1, 1), 0);
        expect_eq("3x1", grid_sum(3, 1), 0 + 1 + 2);
    });
    check(score, "8. dereferencing nullptr", [] {
        expect_eq("nullptr", nullptr_deref(), std::string("crash"));
    });
    check(score, "9. using a pointer after delete", [] {
        expect_eq("after delete", use_after_delete(), std::string("dangling"));
    });
    check(score, "10. dropping the only pointer to a heap int", [] {
        expect_eq("lost pointer", lost_heap_pointer(), std::string("leak"));
    });

    return score.finish();
}
