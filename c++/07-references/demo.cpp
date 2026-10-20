// Lesson 7 — references.
// From the c++ directory:  make run LESSON=07-references

#include <iostream>
#include <string>

void add_one(int& x) {
    x = x + 1;
}

void add_one_by_value(int x) {
    x = x + 1;
}

void swap_int(int& a, int& b) {
    int temp = a;
    a = b;
    b = temp;
}

int length_of(const std::string& text) {
    return static_cast<int>(text.size());
}

int main() {
    int n = 10;
    add_one_by_value(n);
    std::cout << "after pass by value, n = " << n << "\n";
    add_one(n);
    std::cout << "after pass by reference, n = " << n << "\n";

    int a = 1;
    int b = 2;
    swap_int(a, b);
    std::cout << "swapped a = " << a << ", b = " << b << "\n";

    std::string name = "Benni";
    std::cout << "length = " << length_of(name) << "\n";
    return 0;
}
