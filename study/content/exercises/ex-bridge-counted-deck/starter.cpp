class Deck {
  public:
    static int alive;

    Deck(int size) : _size(size), _cards(new int[size]) {
    }

    Deck(const Deck& other) : _size(other._size), _cards(other._cards) {
    }

    Deck& operator=(const Deck& other) {
        return *this;
    }

    ~Deck() {
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
