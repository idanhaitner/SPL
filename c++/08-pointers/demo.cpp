// Lesson 8 — pointers.
// From the c++ directory:  make run LESSON=08-pointers
// The numeric addresses change every run. The relationships do not.

#include <iostream>

int main() {
    int x = 10;
    int* p = &x;
    std::cout << "x = " << x << "\n";
    std::cout << "address of x = " << p << "\n";
    *p = 20;
    std::cout << "after *p = 20, x = " << x << "\n";

    int y = 30;
    p = &y;
    std::cout << "after reseating, *p = " << *p << "\n";

    int a[5] = {10, 20, 30, 40, 50};
    int* walk = a;
    std::cout << "first = " << *walk << "\n";
    ++walk;
    std::cout << "one int later = " << *walk << "\n";
    std::cout << "sizeof(int) = " << sizeof(int)
              << ", so the address moved by that many bytes\n";

    int i = 2;
    int* pi = &i;
    int** ppi = &pi;
    std::cout << "i = " << i << ", *pi = " << *pi << ", **ppi = " << **ppi << "\n";
    std::cout << "pi and *ppi name the same address: " << (pi == *ppi) << "\n";
    return 0;
}
