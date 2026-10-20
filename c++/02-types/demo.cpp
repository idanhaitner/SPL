// Lesson 2 — types.
// From the c++ directory:  make run LESSON=02-types

#include <iostream>

int main() {
    std::cout << "sizeof(char)      = " << sizeof(char) << "\n";
    std::cout << "sizeof(short)     = " << sizeof(short) << "\n";
    std::cout << "sizeof(int)       = " << sizeof(int) << "\n";
    std::cout << "sizeof(long)      = " << sizeof(long) << "\n";
    std::cout << "sizeof(long long) = " << sizeof(long long) << "\n";
    std::cout << "sizeof(float)     = " << sizeof(float) << "\n";
    std::cout << "sizeof(double)    = " << sizeof(double) << "\n";
    std::cout << "sizeof(bool)      = " << sizeof(bool) << "\n";
    std::cout << "sizeof(int*)      = " << sizeof(int*) << "\n";

    double almost = 3.9;
    int cut = static_cast<int>(almost);
    std::cout << "static_cast<int>(3.9) = " << cut << "\n";

    unsigned char byte = 255;
    byte = static_cast<unsigned char>(byte + 1);
    std::cout << "unsigned char 255 + 1 = " << static_cast<int>(byte) << "\n";

    char letter = 'A';
    std::cout << "letter = " << letter
              << ", code = " << static_cast<int>(letter) << "\n";

    const int width = 1080;
    int zero{};
    std::cout << "const width = " << width << ", zero = " << zero << "\n";
    return 0;
}
