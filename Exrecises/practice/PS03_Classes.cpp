/*
 * SPL practice — PS3, C++ classes
 * Slides: Exrecises/SPL_PS3.pptx
 *
 * Fill in every NotImplemented, then run the file again. A finished copy is in solutions/PS03_Classes_solution.cpp — try before you open it.
 *
 * From this folder:
 *   g++ -std=c++17 -Wall -Wextra -Wno-unused-parameter -pthread -o PS03_Classes PS03_Classes.cpp && ./PS03_Classes
 */

#include <memory>
#include <type_traits>
#include <utility>

#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

// Thrown by every unfinished exercise. The runner turns it into a [todo] line
// instead of a crash, so you can run the file after filling in just one task.
struct NotImplemented : std::runtime_error {
    explicit NotImplemented(const char* exercise) : std::runtime_error(exercise) {}
};

struct Score {
    int passed = 0;
    int failed = 0;
    int todo = 0;

    void pass(const std::string& name) {
        std::cout << "  [pass] " << name << "\n";
        ++passed;
    }
    void fail(const std::string& name, const std::string& why) {
        std::cout << "  [fail] " << name << "\n         " << why << "\n";
        ++failed;
    }
    void skip(const std::string& name) {
        std::cout << "  [todo] " << name << "\n";
        ++todo;
    }
    int finish() const {
        std::cout << "\n" << passed << " passed, " << failed << " failed, "
                  << todo << " still to do.\n";
        if (failed == 0 && todo == 0) {
            std::cout << "All exercises complete. Nice work.\n";
        } else if (failed == 0 && passed == 0) {
            std::cout << "Every exercise is still open. Fill one in and run again.\n";
        } else if (failed == 0) {
            std::cout << "The finished ones are correct. Fill in each [todo].\n";
        }
        return failed == 0 ? 0 : 1;
    }
};

template <class T>
void expect_eq(const std::string& label, const T& got, const T& want) {
    if (!(got == want)) {
        std::ostringstream out;
        out << label << "\n         expected: " << want << "\n         got:      " << got;
        throw std::runtime_error(out.str());
    }
}

inline void expect_true(const std::string& label, bool cond) {
    if (!cond) throw std::runtime_error(label);
}

template <class F>
void check(Score& score, const std::string& name, F fn) {
    try {
        fn();
        score.pass(name);
    } catch (const NotImplemented&) {
        score.skip(name);
    } catch (const std::exception& ex) {
        score.fail(name, ex.what());
    }
}

inline void read(const std::string& line) {
    std::cout << "  [read] " << line << "\n";
}


// ---------------------------------------------------------------------------
// Worked example: a class declaration ends with a semicolon.
// Fields start private. public: opens the section callers may use.
// The member initializer list runs before the constructor body.
// A const method promises not to change the object.
// ---------------------------------------------------------------------------
class Point {
public:
    Point(double x, double y) : x(x), y(y) {}
    void move(double dx, double dy) { x += dx; y += dy; }
    double getX() const { return x; }
    double getY() const { return y; }
private:
    double x;
    double y;
};

// A const member can be set in the initializer list. The constructor body
// runs too late: the member already exists.
class Badge {
    const int id;
public:
        explicit Badge(int id_) : id(0) {
        throw NotImplemented("Badge initializer list");
    }
        int get() const { return id; }
};

// Exercise.
// Pass by reference so the caller's string grows. Append three '!'.
// The pointer form below is the same idea with an explicit address.
void emphasize(std::string& word) {
    throw NotImplemented("emphasize");
}

// `word->append(...)` is `(*word).append(...)`.
// A pointer can be null. A reference cannot, so check before you use it.
void emphasize_ptr(std::string* word) {
    throw NotImplemented("emphasize_ptr");
}

// ---------------------------------------------------------------------------
// Rule of three. Owned holds one heap int.
// If a class needs a destructor, it almost certainly needs a copy
// constructor and a copy assignment operator too. The ones the compiler
// writes copy the pointer, so two objects would delete the same int.
// ---------------------------------------------------------------------------
class Owned {
public:
    static int allocations;

    explicit Owned(int v) : value(create(v)) {}
    ~Owned() { destroy(value); }

    Owned(const Owned& other) : value(nullptr) {
        throw NotImplemented("Owned copy constructor");
    }

    Owned& operator=(const Owned& other) {
        throw NotImplemented("Owned copy assignment");
    }

    int get() const { return *value; }
    void set(int v) { *value = v; }

private:
    int* value;
    static int* create(int v) {
        ++allocations;
        return new int(v);
    }
    static void destroy(int* p) {
        --allocations;
        delete p;
    }
};

int Owned::allocations = 0;

// ---------------------------------------------------------------------------
// virtual means the call follows the real object, at run time.
// override on the derived method tells the compiler you meant to replace
// the base method. A destructor of a base class is virtual when a derived
// object might be deleted through a base pointer.
// ---------------------------------------------------------------------------
class Animal {
public:
    virtual ~Animal() = default;
    virtual std::string speak() const { return "..."; }
};

class Dog : public Animal {
public:
    std::string speak() const override {
        throw NotImplemented("Dog::speak");
    }
};

class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;  // pure virtual: Shape itself cannot be created
};

class Rect : public Shape {
public:
    Rect(double w, double h) : w(w), h(h) {}
    double area() const override {
        throw NotImplemented("Rect::area");
    }
private:
    double w;
    double h;
};

class ShakyBase {
public:
        ~ShakyBase() {}  // TODO: make this destructor virtual
    };

struct Loud : ShakyBase {
    static int died;
    ~Loud() { ++died; }
};

int Loud::died = 0;

int main() {
    std::cout << R"(
============================================================
PS3 — C++ classes
Slides: Exrecises/SPL_PS3.pptx
============================================================

Passing an int by value copies it. The function can change its copy
and the caller keeps the original. Passing std::string by value copies
the whole string, which is why a large object usually travels as a
reference (std::string&) or a pointer (std::string*).

    void emphasize(std::string& word) { word.append(3, '!'); }
    void emphasize(std::string* word) { word->append(3, '!'); }

The dot is for an object. The arrow is for a pointer.
p->getX() and (*p).getX() are the same call.

A class written in a header ends with a semicolon. public: and private:
cover a whole section, until the next label. A const method can be called
on a const object, and it does not change the fields.

The member initializer list is the part after the colon:

    Point::Point(double x, double y) : x(x), y(y) {}

It runs before the body. const fields are initialized there.

Objects in C++ are values. `Point p(1, 2);` builds a Point, it does not
create a null reference the way a bare Java variable would.

The rule of three: a destructor, a copy constructor, and a copy
assignment operator. Write all three when the class owns a resource.
Copy assignment has to tolerate `a = a`, and it returns *this.

virtual on a method chooses the derived version at run time.
virtual on the destructor makes `delete basePointer` run the derived
destructor too. `= 0` makes a method pure virtual, and the class abstract.

)";

    Point p(1, 2);
    p.move(3, 4);
    read("Point (1, 2) moved by (3, 4) has x = " + std::to_string(p.getX()));

    std::string sentence = "Everything is awesome";
    std::string copy = sentence;
    copy.append("?");
    read("pass by value would edit a copy. original is still: " + sentence);

    std::cout << "\nExercises\n";
    Score score;

    check(score, "1. Badge — initialize the const id in the member list", [] {
        Badge badge(7);
        expect_eq("id", badge.get(), 7);
        Badge other(3);
        expect_eq("other", other.get(), 3);
    });
    check(score, "2. emphasize — append !!! through a reference", [] {
        std::string word = "Hi";
        emphasize(word);
        expect_eq("word", word, std::string("Hi!!!"));
    });
    check(score, "3. emphasize_ptr — arrow operator, and null does nothing", [] {
        emphasize_ptr(nullptr);
        std::string word = "Hi";
        emphasize_ptr(&word);
        expect_eq("word", word, std::string("Hi!!!"));
    });
    check(score, "4. Owned copy constructor — a deep copy", [] {
        int before = Owned::allocations;
        {
            Owned a(5);
            Owned b(a);
            b.set(9);
            expect_eq("original", a.get(), 5);
            expect_eq("copy", b.get(), 9);
        }
        expect_eq("freed", Owned::allocations, before);
    });
    check(score, "5. Owned copy assignment — deep, and safe for a = a", [] {
        int before = Owned::allocations;
        {
            Owned a(5);
            Owned b(1);
            b = a;
            a.set(8);
            expect_eq("independent", b.get(), 5);
            a = a;
            expect_eq("self assignment", a.get(), 8);
        }
        expect_eq("freed", Owned::allocations, before);
    });
    check(score, "6. Dog::speak — virtual call through an Animal*", [] {
        std::unique_ptr<Animal> pet(new Dog());
        expect_eq("speak", pet->speak(), std::string("woof"));
        expect_eq("base", Animal().speak(), std::string("..."));
    });
    check(score, "7. Rect::area — a pure virtual method, implemented", [] {
        Rect rect(3, 4);
        const Shape& shape = rect;
        expect_true("area is 12", shape.area() > 11.9 && shape.area() < 12.1);
    });
    check(score, "8. virtual destructor — derived cleanup runs", [] {
        if (!std::has_virtual_destructor<ShakyBase>::value) {
            throw NotImplemented("virtual ~ShakyBase");
        }
        Loud::died = 0;
        ShakyBase* p = new Loud();
        delete p;
        expect_eq("derived destructor", Loud::died, 1);
    });

    return score.finish();
}
