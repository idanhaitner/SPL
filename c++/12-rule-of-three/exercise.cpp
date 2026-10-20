// Lesson 12 exercises.
// Write the copy constructor and operator=. Leave the destructor and swap.
// From the c++ directory:  make try LESSON=12-rule-of-three
// data_ptr and abandon exist so a shallow copy prints [fail] instead of crashing.

#include "check.hpp"

#include <utility>

class IntBuf {
    int* data;
    int n;

public:
    IntBuf(int count, int fill) : data(new int[count]), n(count) {
        for (int i = 0; i < n; ++i) {
            data[i] = fill;
        }
    }

    ~IntBuf() { delete[] data; }

    IntBuf(const IntBuf& other);

    IntBuf& operator=(const IntBuf& other);

    void swap(IntBuf& other) {
        std::swap(data, other.data);
        std::swap(n, other.n);
    }

    int size() const { return n; }
    int at(int i) const { return data[i]; }
    void set(int i, int value) { data[i] = value; }
    const int* data_ptr() const { return data; }
    void abandon() {
        data = nullptr;
        n = 0;
    }
};

IntBuf::IntBuf(const IntBuf& other) : data(nullptr), n(0) {
    (void)other;
    throw NotImplemented("copy constructor");
}

IntBuf& IntBuf::operator=(const IntBuf& other) {
    (void)other;
    throw NotImplemented("copy assignment");
}

int main() {
    Score score;

    task(score, "copy allocates a new buffer", [] {
        IntBuf a(3, 1);
        IntBuf b = a;
        if (a.data_ptr() == b.data_ptr()) {
            b.abandon();
            throw std::runtime_error("both objects hold the same pointer (shallow copy)");
        }
        a.set(0, 9);
        expect_eq(b.at(0), 1);
        expect_eq(b.at(2), 1);
    });

    task(score, "assignment replaces the old buffer", [] {
        IntBuf a(2, 1);
        IntBuf b(4, 2);
        a = b;
        if (a.data_ptr() == b.data_ptr()) {
            a.abandon();
            throw std::runtime_error("assignment shared the pointer");
        }
        expect_eq(a.size(), 4);
        expect_eq(a.at(3), 2);
        b.set(3, 9);
        expect_eq(a.at(3), 2);
    });

    task(score, "self-assignment is harmless", [] {
        IntBuf a(2, 5);
        IntBuf& same = a;
        a = same;
        expect_eq(a.size(), 2);
        expect_eq(a.at(0), 5);
        expect_eq(a.at(1), 5);
    });

    return score.finish();
}
