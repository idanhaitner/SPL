int bagsAlive = 0;

class Bag {
    int _size;

  public:
    Bag(int size) : _size(size) {
        bagsAlive++;
    }
    ~Bag() {
        bagsAlive--;
    }
    int size() const {
        return _size;
    }
};

class Student {
  public:
    Student(int bagSize) {
    }
    ~Student() {
    }
    int bagSize() const {
        return 0;
    }
    void changeBag(int size) {
    }
};
