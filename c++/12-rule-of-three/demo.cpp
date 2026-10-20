// Lesson 12 — deep copy of a tiny image.
// From the c++ directory:  make run LESSON=12-rule-of-three

#include <iostream>
#include <utility>

class Image {
    int width_;
    int height_;
    char* bytes_;

public:
    Image(int width, int height, char fill)
        : width_(width), height_(height), bytes_(new char[width * height]) {
        for (int i = 0; i < width_ * height_; ++i) {
            bytes_[i] = fill;
        }
        std::cout << "construct " << static_cast<void*>(bytes_) << "\n";
    }

    ~Image() {
        std::cout << "destroy  " << static_cast<void*>(bytes_) << "\n";
        delete[] bytes_;
    }

    Image(const Image& other)
        : width_(other.width_), height_(other.height_),
          bytes_(new char[other.width_ * other.height_]) {
        for (int i = 0; i < width_ * height_; ++i) {
            bytes_[i] = other.bytes_[i];
        }
        std::cout << "copy     " << static_cast<void*>(bytes_) << "\n";
    }

    Image& operator=(const Image& other) {
        Image temp(other);
        swap(temp);
        return *this;
    }

    void swap(Image& other) {
        std::swap(width_, other.width_);
        std::swap(height_, other.height_);
        std::swap(bytes_, other.bytes_);
    }

    char at(int i) const { return bytes_[i]; }
    void set(int i, char value) { bytes_[i] = value; }
};

int main() {
    Image avi(2, 2, 'A');
    Image benni = avi;
    avi.set(0, 'Z');
    std::cout << "benni's first byte is " << benni.at(0) << "\n";

    Image carmi(1, 1, 'C');
    carmi = benni;
    Image& same = carmi;
    carmi = same;
    std::cout << "carmi's first byte is " << carmi.at(0) << "\n";
    return 0;
}
