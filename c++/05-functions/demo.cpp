// Lesson 5 — functions.
// From the c++ directory:  make run LESSON=05-functions

#include <iostream>

// A declaration. The body is further down, which is enough for main to call it.
int factorial(int n);

void add_one(int x) {
    x = x + 1;
}

int area(int w, int h) {
    return w * h;
}

double area(double w, double h) {
    return w * h;
}

int main() {
    int n = 10;
    add_one(n);
    std::cout << "after add_one, n = " << n << "\n";

    std::cout << "area(2, 3) = " << area(2, 3) << "\n";
    std::cout << "area(2.5, 4.0) = " << area(2.5, 4.0) << "\n";
    std::cout << "factorial(5) = " << factorial(5) << "\n";
    return 0;
}

int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
