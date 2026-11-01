#include <string>

int bagsAlive = 0;

class Bag {
  public:
    Bag(int capacity) : _capacity(capacity) {
        bagsAlive++;
    }

    Bag(const Bag& other) : _capacity(other._capacity) {
        bagsAlive++;
    }

    ~Bag() {
        bagsAlive--;
    }

    int capacity() const {
        return _capacity;
    }

    void setCapacity(int capacity) {
        _capacity = capacity;
    }

  private:
    int _capacity;
};

class Student {
  public:
    Student(const std::string& name, int capacity) : _name(name), _bag(new Bag(capacity)) {
    }

    ~Student() {
        delete _bag;
    }

    Student(const Student& other) : _name(other._name), _bag(new Bag(*other._bag)) {
    }

    Student& operator=(const Student& other) {
        if (this != &other) {
            _name = other._name;
            delete _bag;
            _bag = new Bag(*other._bag);
        }
        return *this;
    }

    std::string name() const {
        return _name;
    }

    int bagCapacity() const {
        return _bag->capacity();
    }

    void setBagCapacity(int capacity) {
        _bag->setCapacity(capacity);
    }

  private:
    std::string _name;
    Bag* _bag;
};
