// Lesson 1 — a program.
// From the c++ directory:  make run LESSON=01-program

#include <iostream>

int main() {
    // Execution starts here. The operating system calls main.
    std::cout << "A C++ program starts in main.\n";

    // Declare an int and store 2026 in it.
    int year = 2026;
    std::cout << "year = " << year << "\n";

    // Assignment writes a new value into the same variable.
    year = year + 1;
    std::cout << "after adding 1, year = " << year << "\n";

    // 0 tells the operating system that the program succeeded.
    return 0;
}
