// Lesson 10 — declaration, then definition, in one file.
// From the c++ directory:  make run LESSON=10-build
// The two-file version is split/mathx.hpp, split/mathx.cpp, split/main.cpp.

#include <iostream>

int add(int a, int b);     // declaration: main may call add before the body exists

int main() {
    std::cout << "add(2, 3) = " << add(2, 3) << "\n";
    std::cout << "This file has main, so the linker can build a program.\n";
    return 0;
}

int add(int a, int b) {    // the one definition
    return a + b;
}
