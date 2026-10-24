// =============================================================================
// Lesson 15 exercises: capstone, the same stack written two ways
// =============================================================================
// A STACK is last-in, first-out: push puts a value on top, pop removes the
// top value and returns it, top looks at it without removing it.
//
//   push(1) push(2) push(3)   ->   [1, 2, 3]    top() == 3
//   pop() returns 3           ->   [1, 2]       top() == 2
//
// You write it twice:
//   IntStack   owns a RAW heap buffer (int* data). You manage memory yourself:
//              growing the buffer, deep copy, assignment. This is the rule of
//              three from lesson 12.
//   VecStack   owns a std::vector. The vector does all of that for you. This is
//              the rule of zero from lesson 13.
// Seeing both side by side is the point of the lesson.
//
// Run from the c++ directory:   make try LESSON=15-capstone
// Then also:                    make test-asan   (leaks, double frees, overruns)
//
// Delete the `(void)something;` lines when you write the real code.
// =============================================================================

#include "check.hpp"

#include <stdexcept>
#include <utility>
#include <vector>

// -----------------------------------------------------------------------------
// IntStack: how the three fields work together
//
//   data   points at a new int[cap] block, or nullptr when nothing has been
//          allocated yet
//   n      how many values are on the stack now. They are data[0] .. data[n-1].
//          data[n-1] is the TOP.
//   cap    how many ints the block can hold (its capacity). Always n <= cap.
//
//   Example after push(1), push(2), push(3) with cap 4:
//       data -> [ 1 | 2 | 3 | ? ]     n = 3, cap = 4, top = data[2] = 3
//
// Given: the default constructor (empty: nullptr, 0, 0), the destructor, swap,
// size, and empty.
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 1. Copy constructor:  IntStack t = s;
// Make *this an independent deep copy of other.
//
// After it runs: n == other.n, the values data[0..n-1] match other's, and data
// is a NEW block (or nullptr if other is empty). Pushing onto one stack later
// must not change the other.
//
// Steps: in the initializer list allocate new int[other.n] (but use nullptr
// when other.n == 0), set n = other.n and cap = other.n (or other.cap, either
// is fine). In the body, copy the n values with a loop.
// -----------------------------------------------------------------------------
IntStack::IntStack(const IntStack& other) : data(nullptr), n(0), cap(0) {
    (void)other;
    throw NotImplemented("IntStack copy");
}

// -----------------------------------------------------------------------------
// 2. Copy assignment:  t = s;
// Replace *this's contents with a deep copy of other. Free the old block. Make
// self-assignment (s = s) safe. Return *this.
//
// Use copy-and-swap, exactly as in lesson 12:
//   IntStack temp(other);  swap(temp);  return *this;
// -----------------------------------------------------------------------------
IntStack& IntStack::operator=(const IntStack& other) {
    (void)other;
    throw NotImplemented("IntStack assign");
}

// -----------------------------------------------------------------------------
// 3. push
// Put value on top of the stack. Grow the buffer when it is full.
//
//   value    the int to push
//   effect   value becomes data[n], and n increases by 1
//
// When n == cap (full, including the very first push where cap == 0):
//   1. choose new_cap: 4 if cap is 0, otherwise cap * 2
//   2. int* fresh = new int[new_cap];
//   3. copy data[0..n-1] into fresh
//   4. delete[] data;        (the old block, or nullptr, which is safe)
//   5. data = fresh;  cap = new_cap;
// Then store the value:  data[n] = value;  ++n;
//
// The test pushes 5 values, so your buffer must grow at least once (4 -> 8).
// Writing data[n] when n == cap is past the end of the block: undefined
// behavior. make test-asan will catch it.
// -----------------------------------------------------------------------------
void IntStack::push(int value) {
    (void)value;
    throw NotImplemented("IntStack push");
}

// -----------------------------------------------------------------------------
// 4. pop
// Remove the top value and return it.
//
//   returns  the value that was on top (data[n-1]). Afterwards n is 1 smaller.
//   empty    if n == 0, throw std::runtime_error("pop on an empty stack")
//
// Example:   [1, 2, 3]  pop() returns 3, and the stack becomes [1, 2]
// You do not need to erase or shrink anything. Decreasing n is enough, because
// the slot past n is no longer part of the stack.
// -----------------------------------------------------------------------------
int IntStack::pop() {
    throw NotImplemented("IntStack pop");
}

// -----------------------------------------------------------------------------
// 5. top
// Return the top value WITHOUT removing it. const: it does not change the
// stack.
//
//   returns  data[n-1]
//   empty    if n == 0, throw std::runtime_error("top on an empty stack")
// -----------------------------------------------------------------------------
int IntStack::top() const {
    throw NotImplemented("IntStack top");
}

// -----------------------------------------------------------------------------
// VecStack: the same stack, built on std::vector.
// Notice what is MISSING: no destructor, no copy constructor, no operator=.
// The vector copies and frees itself, so the compiler-generated versions are
// correct (the rule of zero). The test "vector stack copies itself" passes
// without any extra code from you.
//
// The vector methods you need:
//   data_.push_back(v)   adds v at the end (the end of the vector is the top)
//   data_.back()         the last element (the top). Undefined on an empty
//                        vector.
//   data_.pop_back()     removes the last element and returns NOTHING (void)
// -----------------------------------------------------------------------------
class VecStack {
    std::vector<int> data_;

public:
    // 6. push: add value on top. One line with push_back.
    void push(int value) {
        (void)value;
        throw NotImplemented("VecStack push");
    }

    // 7. pop: remove the top and return it. pop_back() returns void, so read
    //    back() into a local first, then pop_back(), then return the local.
    //    The tests never pop an empty VecStack.
    int pop() {
        throw NotImplemented("VecStack pop");
    }

    // 8. top: return the top value without removing it.
    int top() const {
        throw NotImplemented("VecStack top");
    }

    int size() const { return static_cast<int>(data_.size()); }
    bool empty() const { return data_.empty(); }
};

// The checker. You do not edit main.
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
