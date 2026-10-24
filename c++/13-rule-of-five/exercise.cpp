// =============================================================================
// Lesson 13 exercises: the rule of five, smart pointers, the rule of zero
// =============================================================================
// What you practice:
//   - a MOVE constructor and MOVE assignment: take another object's buffer
//     instead of copying it
//   - std::unique_ptr (one owner) and std::shared_ptr (counted owners)
//   - the rule of zero: a class whose members clean up after themselves needs
//     no destructor or copy code
//
// Background: std::move(a) does not move anything. It only marks a as "you may
// take my contents". That makes the && overloads below get chosen instead of
// the copying ones.
//
// Run from the c++ directory:   make try LESSON=13-rule-of-five
// Then also:                    make test-asan
//
// The copy operations, destructor, and swap are given. Ignore data_ptr() and
// abandon(): they are test helpers.
// =============================================================================

#include "check.hpp"

#include <memory>
#include <utility>
#include <vector>

class MoveBuf {
    int* data;   // owned new int[n] block, or nullptr after a move
    int n;

public:
    MoveBuf(int count, int fill) : data(new int[count]), n(count) {
        for (int i = 0; i < n; ++i) {
            data[i] = fill;
        }
    }

    ~MoveBuf() { delete[] data; }   // delete[] nullptr is safe and does nothing

    // Given: deep copy (lesson 12).
    MoveBuf(const MoveBuf& other) : data(new int[other.n]), n(other.n) {
        for (int i = 0; i < n; ++i) {
            data[i] = other.data[i];
        }
    }

    // Given: copy-and-swap (lesson 12).
    MoveBuf& operator=(const MoveBuf& other) {
        MoveBuf temp(other);
        swap(temp);
        return *this;
    }

    MoveBuf(MoveBuf&& other);              // exercise 1, below the class

    MoveBuf& operator=(MoveBuf&& other);   // exercise 2, below the class

    void swap(MoveBuf& other) {
        std::swap(data, other.data);
        std::swap(n, other.n);
    }

    int size() const { return n; }
    int at(int i) const { return data[i]; }
    const int* data_ptr() const { return data; }   // test helper
    void abandon() {                               // test helper
        data = nullptr;
        n = 0;
    }
};

// -----------------------------------------------------------------------------
// 1. Move constructor:  MoveBuf b(std::move(a));
// Build *this by TAKING other's block. No new[], no loop, no copying values.
//
// After it runs:
//   - this->data is the SAME pointer other.data had (the test checks the
//     address)
//   - this->n is other's old n
//   - other.data == nullptr and other.n == 0
//
// Why null out other? other will still be destroyed later. If it kept the
// pointer, its destructor would delete[] the block that *this now owns.
//
// Steps: the initializer list already starts *this empty (nullptr, 0). In the
// body, copy other.data and other.n into this object, then set other's two
// fields to nullptr and 0. (Or simply: swap(other); since *this starts empty.)
// -----------------------------------------------------------------------------
MoveBuf::MoveBuf(MoveBuf&& other) : data(nullptr), n(0) {
    (void)other;
    throw NotImplemented("move constructor");
}

// -----------------------------------------------------------------------------
// 2. Move assignment:  b = std::move(a);   (b already owns a block)
// *this takes other's block, and *this's OLD block must not leak.
//
// After it runs:
//   - this->data is other's old pointer, this->n is other's old n
//   - this's old block is freed (now, or by other's destructor later)
//   - other no longer owns the block *this now holds
//   - b = std::move(b) (moving onto itself) keeps b's values unchanged
//   - returns *this
//
// Simplest correct version:
//   if (this != &other) { swap(other); }
//   return *this;
// After the swap, other holds this's old block, and other's destructor frees
// it. That is allowed: a moved-from object only has to be safe to destroy.
//
// Alternative: if (this != &other) { delete[] data; take other's fields; set
// other's fields to nullptr / 0; } return *this;
// -----------------------------------------------------------------------------
MoveBuf& MoveBuf::operator=(MoveBuf&& other) {
    (void)other;
    throw NotImplemented("move assignment");
}

// -----------------------------------------------------------------------------
// 3. owned_int
// Create a heap int that holds value, owned by a unique_ptr.
//
//   value    the number to store
//   returns  a std::unique_ptr<int> pointing at a heap int equal to value.
//            When the unique_ptr goes out of scope, the int is deleted for you.
//            You never write delete.
//
// One line:   return std::make_unique<int>(value);
// You can return a unique_ptr even though it cannot be copied, because the
// returned value is moved out of the function.
// -----------------------------------------------------------------------------
std::unique_ptr<int> owned_int(int value) {
    throw NotImplemented("owned_int");
}

// -----------------------------------------------------------------------------
// 4. shared_users
// See shared ownership counting at work.
//
//   returns  the use_count() after you have two shared_ptrs to one int: 2
//
// Steps:
//   std::shared_ptr<int> a = std::make_shared<int>(42);   // count = 1
//   std::shared_ptr<int> b = a;                           // copy: count = 2
//   return a.use_count();   (b.use_count() gives the same number)
// When the last shared_ptr is destroyed, the int is deleted.
// Do not return the literal 2. Return use_count().
// -----------------------------------------------------------------------------
int shared_users() {
    throw NotImplemented("shared_users");
}

// -----------------------------------------------------------------------------
// ScoreList: the RULE OF ZERO.
// The only member is a std::vector, which manages its own memory. So this class
// needs NO destructor, copy constructor, operator=, or move operations. The
// compiler-generated ones are correct. Compare that with MoveBuf above.
// -----------------------------------------------------------------------------
class ScoreList {
    std::vector<int> scores_;

public:
    void add(int score) { scores_.push_back(score); }

    // -------------------------------------------------------------------------
    // 5. ScoreList::sum
    // Return the sum of every score added so far. 0 if none.
    //
    // Example:   add(10); add(20); add(5);   sum() == 35
    // Hint: for (int s : scores_) ...
    // -------------------------------------------------------------------------
    int sum() const {
        throw NotImplemented("ScoreList::sum");
    }
};

// The checker. You do not edit main.
int main() {
    Score score;

    task(score, "move constructor steals the buffer", [] {
        MoveBuf a(3, 1);
        const int* stolen = a.data_ptr();
        MoveBuf b(std::move(a));
        if (a.data_ptr() != nullptr && a.data_ptr() == b.data_ptr()) {
            a.abandon();
            throw std::runtime_error("source still owns the stolen buffer");
        }
        expect_true(b.data_ptr() == stolen, "move should keep the same block");
        expect_true(a.data_ptr() == nullptr, "source pointer should be null");
        expect_eq(a.size(), 0);
        expect_eq(b.at(0), 1);
        expect_eq(b.size(), 3);
    });

    task(score, "move assignment takes the new buffer", [] {
        MoveBuf a(3, 1);
        MoveBuf b(2, 8);
        const int* stolen = a.data_ptr();
        b = std::move(a);
        if (a.data_ptr() != nullptr && a.data_ptr() == b.data_ptr()) {
            a.abandon();
            throw std::runtime_error("move assignment left both objects owning one block");
        }
        expect_true(b.data_ptr() == stolen, "destination should hold a's old block");
        expect_eq(b.size(), 3);
        expect_eq(b.at(2), 1);
    });

    task(score, "moving a buffer onto itself keeps the values", [] {
        MoveBuf b(3, 4);
        MoveBuf& same = b;
        b = std::move(same);
        expect_eq(b.size(), 3);
        expect_eq(b.at(0), 4);
    });

    task(score, "unique_ptr owns the int", [] {
        std::unique_ptr<int> p = owned_int(4);
        expect_true(p != nullptr, "missing unique_ptr");
        expect_eq(*p, 4);
    });

    task(score, "a copied shared_ptr has two owners", [] {
        expect_eq(shared_users(), 2);
    });

    task(score, "a vector member needs no destructor", [] {
        ScoreList list;
        list.add(10);
        list.add(20);
        list.add(5);
        expect_eq(list.sum(), 35);
    });

    return score.finish();
}
