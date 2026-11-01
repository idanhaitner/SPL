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
    Student(int id, const std::string& name, int credits)
        : Person(id, name), _credits(new int(credits)) {
    }

    ~Student() {
        delete _credits;
    }

    Student(const Student& other) : Person(other), _credits(new int(*other._credits)) {
    }

    Student& operator=(const Student& other) {
        if (this != &other) {
            Person::operator=(other);
            delete _credits;
            _credits = new int(*other._credits);
        }
        return *this;
    }

    int credits() const {
        return *_credits;
    }

    void setCredits(int credits) {
        *_credits = credits;
    }

  private:
    int* _credits;
};
