// Lesson 14 exercises.
// From the c++ directory:  make try LESSON=14-inheritance

#include "check.hpp"

#include <string>

class Shape {
public:
    virtual int area() const = 0;
    virtual ~Shape() = default;
};

class Rect : public Shape {
    int w;
    int h;

public:
    Rect(int width, int height) : w(0), h(0) {
        (void)width;
        (void)height;
        (void)w;
        (void)h;
        throw NotImplemented("Rect");
    }

    int area() const override {
        throw NotImplemented("Rect::area");
    }
};

int total_area(const Shape& a, const Shape& b) {
    throw NotImplemented("total_area");
}

class Greeter {
public:
    virtual std::string hello() const { return "hi"; }
    virtual ~Greeter() = default;
};

class Loud : public Greeter {
public:
    std::string hello() const override { return "HI"; }
};

std::string call_ref(const Greeter& g) {
    throw NotImplemented("call_ref");
}

std::string call_value(Greeter g) {
    throw NotImplemented("call_value");
}

int main() {
    Score score;

    task(score, "a rect reports its area", [] {
        Rect r(3, 4);
        expect_eq(r.area(), 12);
        const Shape& as_shape = r;
        expect_eq(as_shape.area(), 12);
    });

    task(score, "total_area uses the dynamic type", [] {
        Rect a(3, 4);
        Rect b(2, 5);
        expect_eq(total_area(a, b), 22);
    });

    task(score, "a reference stays Loud, a value slices to Greeter", [] {
        Loud loud;
        expect_eq(call_ref(loud), std::string("HI"));
        expect_eq(call_value(loud), std::string("hi"));
    });

    return score.finish();
}
