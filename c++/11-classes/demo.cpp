// Lesson 11 — a class, an initializer list, const, and new.
// From the c++ directory:  make run LESSON=11-classes

#include <iostream>
#include <string>

class Student {
    std::string name_;
    int year_;

public:
    Student(const std::string& name, int year) : name_(name), year_(year) {}

    // Delegates to the constructor above. The list holds nothing else.
    Student(const std::string& name) : Student(name, 1) {}

    void print() const {
        std::cout << name_ << " (" << year_ << ")\n";
    }

    int year() const { return year_; }
};

int main() {
    Student avi("Avi", 2000);
    avi.print();

    const Student carmi("Carmi");
    carmi.print();
    std::cout << "carmi year = " << carmi.year() << "\n";

    Student* pb = new Student("Benni", 2000);
    pb->print();
    delete pb;
    return 0;
}
