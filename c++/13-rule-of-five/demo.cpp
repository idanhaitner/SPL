// Lesson 13 — move, then a unique_ptr that makes the move unnecessary.
// From the c++ directory:  make run LESSON=13-rule-of-five

#include <iostream>
#include <memory>
#include <utility>

class Buffer {
    int* data_;
    int n_;

public:
    Buffer(int n, int fill) : data_(new int[n]), n_(n) {
        for (int i = 0; i < n_; ++i) {
            data_[i] = fill;
        }
    }

    ~Buffer() { delete[] data_; }

    Buffer(const Buffer& other) : data_(new int[other.n_]), n_(other.n_) {
        for (int i = 0; i < n_; ++i) {
            data_[i] = other.data_[i];
        }
    }

    Buffer& operator=(const Buffer& other) {
        Buffer temp(other);
        swap(temp);
        return *this;
    }

    Buffer(Buffer&& other) noexcept : data_(other.data_), n_(other.n_) {
        other.data_ = nullptr;
        other.n_ = 0;
    }

    Buffer& operator=(Buffer&& other) noexcept {
        swap(other);
        return *this;
    }

    void swap(Buffer& other) {
        std::swap(data_, other.data_);
        std::swap(n_, other.n_);
    }

    int size() const { return n_; }
    int at(int i) const { return data_[i]; }
};

int main() {
    Buffer avi(3, 7);
    Buffer benny(std::move(avi));
    std::cout << "benny[0] = " << benny.at(0) << "\n";
    std::cout << "avi size after move = " << avi.size() << "\n";

    std::unique_ptr<int> owned = std::make_unique<int>(5);
    std::unique_ptr<int> stolen = std::move(owned);
    std::cout << "unique value = " << *stolen << "\n";
    std::cout << "source is empty? " << (owned == nullptr) << "\n";

    auto shared = std::make_shared<int>(5);
    auto alias = shared;
    std::cout << "shared owners = " << shared.use_count() << "\n";
    return 0;
}
