#include <string>

class Person {
  public:
    Person() : _id(0), _name("nobody") {
    }

    Person(int id, const std::string& name) : _id(id), _name(name) {
    }

    virtual ~Person() {
    }

    int id() const {
        return _id;
    }

    std::string name() const {
        return _name;
    }

  private:
    int _id;
    std::string _name;
};

class Student : public Person {
  public:
    Student(int id, const std::string& name, int credits) {
    }

    ~Student() {
    }

    Student(const Student& other) {
    }

    Student& operator=(const Student& other) {
        return *this;
    }

    int credits() const {
        return 0;
    }

    void setCredits(int credits) {
    }

  private:
    int* _credits;
};
