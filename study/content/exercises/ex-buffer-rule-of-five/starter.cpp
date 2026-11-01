#include <utility>

class Buffer {
  public:
    Buffer(int size) {
    }

    ~Buffer() {
    }

    Buffer(const Buffer& other) {
    }

    Buffer& operator=(const Buffer& other) {
        return *this;
    }

    Buffer(Buffer&& other) {
    }

    Buffer& operator=(Buffer&& other) {
        return *this;
    }

    int size() const {
        return 0;
    }

    int get(int index) const {
        return 0;
    }

    void set(int index, int value) {
    }

    const int* data() const {
        return nullptr;
    }

  private:
    int _size;
    int* _values;
};
