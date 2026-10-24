// =============================================================================
// Lesson 12 exercises: the rule of three
// =============================================================================
// What you practice: writing a DEEP-copying copy constructor and copy
// assignment operator for a class that owns a heap buffer.
//
// The rule of three: if a class needs a destructor (because it owns
// something, here a new[] array), it also needs
//   1. a destructor               ~IntBuf()               given, leave it
//   2. a copy constructor         IntBuf(const IntBuf&)   YOU WRITE
//   3. a copy assignment operator operator=(const IntBuf&) YOU WRITE
//
// Why: the copies the compiler generates on its own are SHALLOW. They copy
// the pointer `data`, so two objects own one block. When both are destroyed,
// delete[] runs twice on the same block: undefined behavior, usually a crash.
//
// Run from the c++ directory:   make try LESSON=12-rule-of-three
// Then also:                    make test-asan   (catches leaks and double frees)
//
// Ignore data_ptr() and abandon(): the tests use them to detect a shallow copy
// and print [fail] instead of crashing. They are not part of a normal class.
// =============================================================================

#include "check.hpp"

#include <utility>

class IntBuf {
    int* data;   // points at a new int[n] block that this object OWNS
    int n;       // how many ints are in that block

public:
    // Given: allocates count ints and sets each one to fill.
    IntBuf(int count, int fill) : data(new int[count]), n(count) {
        for (int i = 0; i < n; ++i) {
            data[i] = fill;
        }
    }

    // Given: frees the block this object owns.
    ~IntBuf() { delete[] data; }

    IntBuf(const IntBuf& other);              // exercise 1, below the class

    IntBuf& operator=(const IntBuf& other);   // exercise 2, below the class

    // Given: exchanges the contents of two IntBufs. Only pointers and ints
    // move; no memory is allocated. Useful for exercise 2.
    void swap(IntBuf& other) {
        std::swap(data, other.data);
        std::swap(n, other.n);
    }

    int size() const { return n; }
    int at(int i) const { return data[i]; }
    void set(int i, int value) { data[i] = value; }
    const int* data_ptr() const { return data; }   // test helper
    void abandon() {                               // test helper
        data = nullptr;
        n = 0;
    }
};

// -----------------------------------------------------------------------------
// 1. Copy constructor:  IntBuf b = a;   or   IntBuf b(a);
// Build a NEW object (*this) that holds the same values as other, in its OWN
// heap block.
//
// After it runs:
//   - this->n == other.n
//   - this->data points at a NEW block (not other.data!)
//   - every this->data[i] == other.data[i]
//   - changing one object later does not affect the other
//
// Steps:
//   1. In the initializer list, allocate new int[other.n] for data and set
//      n to other.n. (Replace the `data(nullptr), n(0)` placeholder.)
//   2. In the body, copy other.n ints from other.data into data with a loop.
//   3. Delete the (void) line and the throw.
//
// You can read other.data even though it is private: access rules apply per
// class, not per object.
// -----------------------------------------------------------------------------
IntBuf::IntBuf(const IntBuf& other) : data(nullptr), n(0) {
    (void)other;
    throw NotImplemented("copy constructor");
}

// -----------------------------------------------------------------------------
// 2. Copy assignment:  a = b;   (both objects ALREADY exist)
// Make *this hold a deep copy of other's values, and free *this's old block.
//
// After it runs:
//   - this has other's size and values in its own fresh block
//   - this's OLD block has been freed (no leak)
//   - `a = a;` (self-assignment) still works and leaves a unchanged
//   - returns *this, so  a = b = c;  works
//
// Recommended way, COPY-AND-SWAP (3 lines):
//   IntBuf temp(other);   // deep copy, using exercise 1
//   swap(temp);           // *this takes the new block, temp takes the old one
//   return *this;         // temp's destructor frees the old block
// This handles self-assignment on its own, and if new[] throws, *this is not
// changed.
//
// Hard way (also accepted): if (this == &other) return *this; allocate a new
// block, copy, delete[] the old data, point data at the new block, set n.
// -----------------------------------------------------------------------------
IntBuf& IntBuf::operator=(const IntBuf& other) {
    (void)other;
    throw NotImplemented("copy assignment");
}

// The checker. You do not edit main.
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
