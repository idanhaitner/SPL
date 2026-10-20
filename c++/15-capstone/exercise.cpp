// Lesson 15 exercises.
// From the c++ directory:  make try LESSON=15-capstone
// IntStack owns a raw buffer. VecStack owns a vector.

#include "check.hpp"

#include <utility>
#include <vector>

class IntStack {
    int* data;
    int n;
    int cap;

public:
    IntStack() : data(nullptr), n(0), cap(0) {}

    ~IntStack() { delete[] data; }

    IntStack(const IntStack& other);

    IntStack& operator=(const IntStack& other);

    void swap(IntStack& other) {
        std::swap(data, other.data);
        std::swap(n, other.n);
        std::swap(cap, other.cap);
    }

    void push(int value);
    int pop();
    int top() const;
    int size() const { return n; }
    bool empty() const { return n == 0; }
};

IntStack::IntStack(const IntStack& other) : data(nullptr), n(0), cap(0) {
    (void)other;
    throw NotImplemented("IntStack copy");
}

IntStack& IntStack::operator=(const IntStack& other) {
    (void)other;
    throw NotImplemented("IntStack assign");
}

void IntStack::push(int value) {
    (void)value;
    throw NotImplemented("IntStack push");
}

int IntStack::pop() {
    throw NotImplemented("IntStack pop");
}

int IntStack::top() const {
    throw NotImplemented("IntStack top");
}

class VecStack {
    std::vector<int> data_;

public:
    void push(int value) {
        (void)value;
        throw NotImplemented("VecStack push");
    }

    int pop() {
        throw NotImplemented("VecStack pop");
    }

    int top() const {
        throw NotImplemented("VecStack top");
    }

    int size() const { return static_cast<int>(data_.size()); }
    bool empty() const { return data_.empty(); }
};

int main() {
    Score score;

    task(score, "push, top, and pop", [] {
        IntStack s;
        expect_true(s.empty(), "a new stack is empty");
        s.push(1);
        s.push(2);
        s.push(3);
        expect_eq(s.top(), 3);
        expect_eq(s.pop(), 3);
        expect_eq(s.size(), 2);
        expect_eq(s.top(), 2);
        expect_true(!s.empty(), "two values remain");
    });

    task(score, "the buffer grows past the first allocation", [] {
        IntStack s;
        for (int i = 0; i < 5; ++i) {
            s.push(i);
        }
        expect_eq(s.size(), 5);
        expect_eq(s.top(), 4);
        expect_eq(s.pop(), 4);
        expect_eq(s.pop(), 3);
    });

    task(score, "copy and assignment do not share the buffer", [] {
        IntStack s;
        s.push(1);
        s.push(2);
        IntStack t = s;
        s.push(9);
        expect_eq(t.size(), 2);
        expect_eq(t.top(), 2);
        t = s;
        expect_eq(t.size(), 3);
        expect_eq(t.top(), 9);
        IntStack& same = s;
        s = same;
        expect_eq(s.top(), 9);
    });

    task(score, "vector stack pushes and pops", [] {
        VecStack s;
        expect_true(s.empty(), "a new stack is empty");
        s.push(10);
        s.push(20);
        expect_eq(s.top(), 20);
        expect_eq(s.pop(), 20);
        expect_eq(s.size(), 1);
    });

    task(score, "vector stack copies itself", [] {
        VecStack s;
        s.push(1);
        s.push(2);
        VecStack t = s;
        s.push(9);
        expect_eq(t.size(), 2);
        expect_eq(t.top(), 2);
    });

    return score.finish();
}
