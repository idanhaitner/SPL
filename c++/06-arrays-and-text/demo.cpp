// Lesson 6 — arrays and text.
// From the c++ directory:  make run LESSON=06-arrays-and-text

#include <iostream>
#include <string>
#include <vector>

int sum(const int a[], int n) {
    int total = 0;
    for (int i = 0; i < n; ++i) {
        total += a[i];
    }
    return total;
}

int main() {
    int scores[4] = {10, 20, 30, 40};
    std::cout << "sum of the array = " << sum(scores, 4) << "\n";
    std::cout << "sizeof the array in main = " << sizeof(scores) << "\n";

    std::vector<int> grown;
    grown.push_back(10);
    grown.push_back(20);
    int vector_sum = 0;
    for (int x : grown) {
        vector_sum += x;
    }
    std::cout << "vector size = " << grown.size()
              << ", sum = " << vector_sum << "\n";

    std::string name = "Avi";
    std::cout << name << " has " << name.size() << " characters\n";
    std::cout << (name + "!") << "\n";
    std::cout << "equals Avi? " << (name == "Avi") << "\n";

    const char* literal = "Avi";
    std::cout << "C string = " << literal << "\n";
    return 0;
}
