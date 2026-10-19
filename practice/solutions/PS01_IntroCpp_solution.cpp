/*
 * SPL practice — PS1, Introduction to C++
 * Slides: materials/sessions/SPL_PS1 (1).pptx
 *
 * Completed answers for PS01_IntroCpp.cpp. Try that file on your own first, then compare.
 *
 * From this folder:
 *   g++ -std=c++17 -Wall -Wextra -Wno-unused-parameter -pthread -o PS01_IntroCpp PS01_IntroCpp.cpp && ./PS01_IntroCpp
 *
 * Edit a function, save, and run again. A [todo] line is an exercise you
 * have not filled in yet. A [fail] line means the code ran and the result
 * was different from what the slides are aiming at.
 */

#include <string>
#include <vector>

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


// ---------------------------------------------------------------------------
// Worked example. Read this, then run the file and look for the [read] line.
// A C++ function does not have to sit inside a class.
// ---------------------------------------------------------------------------
int add_example(int a, int b) {
    return a + b;
}

// Declaration only: the prototype, ending in a semicolon.
// A header file (.h) is mostly lines like this. The matching definition
// (the body) lives in a .cpp file, once.
int clamp(int value, int lo, int hi);

// Exercise 1.
// Syntax:  return-type name(parameters) { statements; return value; }
// Return the sum of a and b.
int add(int a, int b) {
    return a + b;
}

// Exercise 2.
// This is the definition of the clamp declared above.
// Keep value inside the closed range [lo, hi].
//   clamp(10, 0, 3) is 3.  clamp(-4, 0, 3) is 0.  clamp(2, 0, 3) is 2.
int clamp(int value, int lo, int hi) {
    if (value < lo) return lo;
    if (value > hi) return hi;
    return value;
}

// Exercise 3.
// const std::string& is a promise: this function reads the text and does
// not modify the caller's string. Build a new string made of `times` copies.
//   repeat("ab", 3) is "ababab".  repeat("ab", 0) is "".
std::string repeat(const std::string& word, int times) {
    std::string out;
    for (int i = 0; i < times; ++i) out += word;
    return out;
}

// Exercise 4.
// std::string is mutable. Java's String is not: there, a method returns a
// new string. Here, append changes the string the caller handed you.
// Add three exclamation marks to word.
void shout(std::string& word) {
    word.append(3, '!');
}

// Exercise 5.
// std::vector<T> grows as you push_back, and v[i] / v.at(i) reach element i.
// Return the sum of every element. An empty vector sums to 0.
int sum(const std::vector<int>& values) {
    int total = 0;
    for (int value : values) total += value;
    return total;
}

// Exercise 6.
// Push 10, then 20, then 30 onto the vector, in that order.
void grow(std::vector<int>& values) {
    values.push_back(10);
    values.push_back(20);
    values.push_back(30);
}

// Exercise 7.
// g++ -c compiles and assembles a .cpp into a .o file and stops before the link.
// Return the letter of that flag: 'c', 'o', or 'g'.
char compile_but_do_not_link_flag() {
    return 'c';
}

// Exercise 8.
// Typing `make` with no target name builds the first target in the makefile.
// Return 'F' for first, 'L' for last, or 'A' for every target.
char target_plain_make_builds() {
    return 'F';
}

// Exercise 9.
// Java writes `final` on a variable that must not be reassigned.
// Return the C++ keyword that plays that role for a local variable.
std::string keyword_like_java_final() {
    return "const";
}

int main() {
    std::cout << R"(
============================================================
PS1 — Introduction to C++
Slides: materials/sessions/SPL_PS1 (1).pptx
============================================================

A function can live outside any class. main is the free function
the operating system calls:

    int main(int argc, char** argv)

argc is how many command-line words there are. argv[0] is the
program name. The int that main returns is the process status.

Two words the compiler treats differently:

    int add(int, int);                 // declaration, a prototype
    int add(int a, int b) { return a + b; }   // definition, the body

You can declare a function as many times as you like. You define it once.
A header is a pile of declarations. #include pastes that file in, the way
a copy would. Paste a .cpp by accident and the definitions appear twice.

The build walks four steps:

    source  ->  preprocessor  ->  compiler  ->  assembler  ->  linker
                (#include)       (C++ to       (.o object     (one executable,
                                  assembly)      file)          finds main)

Java loads classes while the program runs. C++ finishes linking first.

Flags worth remembering: -o name, -c (object file, no link), -g (debug), -Wall.

`make` with no arguments builds the first target in the makefile. A target
is rebuilt when it is older than one of the files it depends on.

std::string can be changed in place, and == compares the characters.
std::vector<T> is a growable array: push_back adds, [i] reads.

)";

    read("add_example(2, 5) = " + std::to_string(add_example(2, 5)));

    const int days = 7;
    read(std::string("const days = ") + std::to_string(days) + "  (const is the keyword from exercise 9)");

    std::vector<int> demo{1, 2, 3};
    demo.push_back(4);
    read("a vector can grow: size is now " + std::to_string(demo.size()));

    std::cout << "\nExercises\n";
    Score score;

    check(score, "1. add — return a + b", [] {
        expect_eq("add(2, 3)", add(2, 3), 5);
        expect_eq("add(-4, 4)", add(-4, 4), 0);
    });
    check(score, "2. clamp — pull a value into [lo, hi]", [] {
        expect_eq("too big", clamp(10, 0, 3), 3);
        expect_eq("too small", clamp(-4, 0, 3), 0);
        expect_eq("inside", clamp(2, 0, 3), 2);
    });
    check(score, "3. repeat — build a new string from copies", [] {
        expect_eq("three", repeat("ab", 3), std::string("ababab"));
        expect_eq("zero", repeat("ab", 0), std::string(""));
        std::string original = "ab";
        (void)repeat(original, 2);
        expect_eq("caller unchanged", original, std::string("ab"));
    });
    check(score, "4. shout — mutate the caller's string", [] {
        std::string word = "hello";
        shout(word);
        expect_eq("shout", word, std::string("hello!!!"));
    });
    check(score, "5. sum — add every element of a vector", [] {
        expect_eq("1..4", sum(std::vector<int>{1, 2, 3, 4}), 10);
        expect_eq("empty", sum(std::vector<int>{}), 0);
    });
    check(score, "6. grow — push_back 10, 20, 30", [] {
        std::vector<int> values{1};
        grow(values);
        expect_eq("size", static_cast<int>(values.size()), 4);
        expect_eq("last", values.back(), 30);
        expect_eq("kept the old element", values.front(), 1);
    });
    check(score, "7. g++ -c stops before the link", [] {
        expect_eq("flag", compile_but_do_not_link_flag(), 'c');
    });
    check(score, "8. plain make builds the first target", [] {
        expect_eq("target", target_plain_make_builds(), 'F');
    });
    check(score, "9. the C++ keyword that matches Java final", [] {
        expect_eq("keyword", keyword_like_java_final(), std::string("const"));
    });

    return score.finish();
}
