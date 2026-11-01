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
    Student(const std::string& name, int capacity) {
    }

    ~Student() {
    }

    Student(const Student& other) {
    }

    Student& operator=(const Student& other) {
        return *this;
    }

    std::string name() const {
        return "";
    }

    int bagCapacity() const {
        return 0;
    }

    void setBagCapacity(int capacity) {
    }

  private:
    std::string _name;
    Bag* _bag;
};
