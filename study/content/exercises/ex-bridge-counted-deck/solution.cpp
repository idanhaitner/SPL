class Deck {
  public:
    static int alive;

    Deck(int size) : _size(size), _cards(new int[size]) {
        for (int i = 0; i < _size; i++) {
            _cards[i] = 0;
        }
        alive = alive + 1;
    }

    Deck(const Deck& other) : _size(other._size), _cards(new int[other._size]) {
        for (int i = 0; i < _size; i++) {
            _cards[i] = other._cards[i];
        }
        alive = alive + 1;
    }

    Deck& operator=(const Deck& other) {
        if (this != &other) {
            delete[] _cards;
            _size = other._size;
            _cards = new int[_size];
            for (int i = 0; i < _size; i++) {
                _cards[i] = other._cards[i];
            }
        }
        return *this;
    }

    ~Deck() {
        delete[] _cards;
        alive = alive - 1;
    }

    int size() const {
        return _size;
    }

    int get(int index) const {
        return _cards[index];
    }

    void set(int index, int value) {
        _cards[index] = value;
    }

  private:
    int _size;
    int* _cards;
};

int Deck::alive = 0;
