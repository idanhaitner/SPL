// Lesson 3 — expressions.
// From the c++ directory:  make run LESSON=03-expressions

#include <iostream>

int main() {
    std::cout << "7 / 2 = " << (7 / 2) << "\n";
    std::cout << "7 % 2 = " << (7 % 2) << "\n";
    std::cout << "7.0 / 2 = " << (7.0 / 2) << "\n";
    std::cout << "2 + 3 * 4 = " << (2 + 3 * 4) << "\n";

    // `1 < 100 < 0` is parsed as (1 < 100) < 0. true converts to 1, and 1 < 0
    // is false. This compiler rejects the chained spelling.
    bool first = 1 < 100;
    int as_number = first;
    bool chained = as_number < 0;
    std::cout << "(1 < 100 < 0) = " << chained << "\n";

    int x = 5;
    int prefix = ++x;
    std::cout << "prefix value = " << prefix << ", x = " << x << "\n";

    int y = 5;
    int postfix = y++;
    std::cout << "postfix value = " << postfix << ", y = " << y << "\n";
    return 0;
}
