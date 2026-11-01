class Scores {
  public:
    Scores(int size) : _size(size), _values(new int[size]) {
        for (int i = 0; i < _size; i++) {
            _values[i] = 0;
        }
    }

    ~Scores() {
        delete[] _values;
    }

    Scores(const Scores& other) : _size(other._size), _values(new int[other._size]) {
        for (int i = 0; i < _size; i++) {
            _values[i] = other._values[i];
        }
    }

    Scores& operator=(const Scores& other) {
        if (this != &other) {
            delete[] _values;
            _size = other._size;
            _values = new int[_size];
            for (int i = 0; i < _size; i++) {
                _values[i] = other._values[i];
            }
        }
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

  private:
    int _size;
    int* _values;
};
