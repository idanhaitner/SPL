// Lesson 13 exercises.
// The copy operations are written. Write the two move operations,
// owned_int, shared_users, and ScoreList::sum.
// From the c++ directory:  make try LESSON=13-rule-of-five

#include "check.hpp"

#include <memory>
#include <utility>
#include <vector>

class MoveBuf {
    int* data;
    int n;

public:
    MoveBuf(int count, int fill) : data(new int[count]), n(count) {
        for (int i = 0; i < n; ++i) {
            data[i] = fill;
        }
    }

    ~MoveBuf() { delete[] data; }

    MoveBuf(const MoveBuf& other) : data(new int[other.n]), n(other.n) {
        for (int i = 0; i < n; ++i) {
            data[i] = other.data[i];
        }
    }

    MoveBuf& operator=(const MoveBuf& other) {
        MoveBuf temp(other);
        swap(temp);
        return *this;
    }

    MoveBuf(MoveBuf&& other);

    MoveBuf& operator=(MoveBuf&& other);

    void swap(MoveBuf& other) {
        std::swap(data, other.data);
        std::swap(n, other.n);
    }

    int size() const { return n; }
    int at(int i) const { return data[i]; }
    const int* data_ptr() const { return data; }
    void abandon() {
        data = nullptr;
        n = 0;
    }
};

MoveBuf::MoveBuf(MoveBuf&& other) : data(nullptr), n(0) {
    (void)other;
    throw NotImplemented("move constructor");
}

MoveBuf& MoveBuf::operator=(MoveBuf&& other) {
    (void)other;
    throw NotImplemented("move assignment");
}

std::unique_ptr<int> owned_int(int value) {
    throw NotImplemented("owned_int");
}

int shared_users() {
    // Make one shared_ptr<int>, copy it, and return the use_count.
    throw NotImplemented("shared_users");
}

class ScoreList {
    std::vector<int> scores_;

public:
    void add(int score) { scores_.push_back(score); }

    int sum() const {
        throw NotImplemented("ScoreList::sum");
    }
};

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
