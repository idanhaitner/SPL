// Finished lesson 15. Write yours in exercise.cpp first.

#include "check.hpp"

#include <stdexcept>
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

IntStack::IntStack(const IntStack& other)
    : data(other.n == 0 ? nullptr : new int[other.n]), n(other.n), cap(other.n) {
    for (int i = 0; i < n; ++i) {
        data[i] = other.data[i];
    }
}

IntStack& IntStack::operator=(const IntStack& other) {
    IntStack temp(other);
    swap(temp);
    return *this;
}

void IntStack::push(int value) {
    if (n == cap) {
        int new_cap = cap == 0 ? 4 : cap * 2;
        int* fresh = new int[new_cap];
        for (int i = 0; i < n; ++i) {
            fresh[i] = data[i];
        }
        delete[] data;
        data = fresh;
        cap = new_cap;
    }
    data[n] = value;
    ++n;
}

int IntStack::pop() {
    if (n == 0) {
        throw std::runtime_error("pop on an empty stack");
    }
    --n;
    return data[n];
}

int IntStack::top() const {
    if (n == 0) {
        throw std::runtime_error("top on an empty stack");
    }
    return data[n - 1];
}

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
