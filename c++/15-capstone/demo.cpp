// Lesson 15 — the shape of a stack, before you write the owning one.
// From the c++ directory:  make run LESSON=15-capstone

#include <iostream>
#include <utility>
#include <vector>

// Rule of zero: vector owns the buffer. This class writes none of the five.
class VecStack {
    std::vector<int> data_;

public:
    void push(int value) { data_.push_back(value); }

    int pop() {
        int value = data_.back();
        data_.pop_back();
        return value;
    }

    int top() const { return data_.back(); }
};

int main() {
    VecStack pile;
    pile.push(10);
    pile.push(20);
    VecStack copy = pile;
    pile.push(30);
    std::cout << "copy top = " << copy.top() << "\n";
    std::cout << "original pop = " << pile.pop() << "\n";
    std::cout << "original pop = " << pile.pop() << "\n";
    return 0;
}
