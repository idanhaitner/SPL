class Scores {
  public:
    Scores(int size) {
    }

    ~Scores() {
    }

    Scores(const Scores& other) {
    }

    Scores& operator=(const Scores& other) {
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

  private:
    int _size;
    int* _values;
};
