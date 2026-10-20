// Lesson 4 — control flow.
// From the c++ directory:  make run LESSON=04-control-flow

#include <iostream>

int sum_to(int n) {
    int sum = 0;
    for (int i = 1; i <= n; ++i) {
        sum += i;
    }
    return sum;
}

int main() {
    std::cout << "sum_to(0) = " << sum_to(0) << "\n";
    std::cout << "sum_to(3) = " << sum_to(3) << "\n";
    std::cout << "sum_to(10) = " << sum_to(10) << "\n";

    int op = '-';
    int result = 0;
    switch (op) {
    case '+':
        result = 8 + 3;
        break;
    case '-':
        result = 8 - 3;
        break;
    default:
        result = 0;
        break;
    }
    std::cout << "8 - 3 via switch = " << result << "\n";
    return 0;
}
