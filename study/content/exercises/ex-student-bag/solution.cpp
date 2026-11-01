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
    Bag* _bag;

  public:
    Student(int bagSize) : _bag(new Bag(bagSize)) {
    }
    ~Student() {
        delete _bag;
    }
    int bagSize() const {
        return _bag->size();
    }
    void changeBag(int size) {
        delete _bag;
        _bag = new Bag(size);
    }
};
