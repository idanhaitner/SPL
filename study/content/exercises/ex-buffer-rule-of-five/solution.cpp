#include <utility>

class Buffer {
  public:
    Buffer(int size) : _size(size), _values(new int[size]) {
        for (int i = 0; i < _size; i++) {
            _values[i] = 0;
        }
    }

    ~Buffer() {
        delete[] _values;
    }

    Buffer(const Buffer& other) : _size(other._size), _values(new int[other._size]) {
        for (int i = 0; i < _size; i++) {
            _values[i] = other._values[i];
        }
    }

    Buffer& operator=(const Buffer& other) {
        Buffer temp(other);
        std::swap(_size, temp._size);
        std::swap(_values, temp._values);
        return *this;
    }

    Buffer(Buffer&& other) : _size(other._size), _values(other._values) {
        other._size = 0;
        other._values = nullptr;
    }

    Buffer& operator=(Buffer&& other) {
        std::swap(_size, other._size);
        std::swap(_values, other._values);
        return *this;
    }

    int size() const {
        return _size;
    }

    int get(int index) const {
        return _values[index];
    }

    void set(int index, int value) {
        _values[index] = value;
    }

    const int* data() const {
        return _values;
    }

  private:
    int _size;
    int* _values;
};
