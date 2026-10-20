// Finished lesson 14. Write yours in exercise.cpp first.

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
    Rect(int w, int h) : w(w), h(h) {}

    int area() const override { return w * h; }
};

int total_area(const Shape& a, const Shape& b) {
    return a.area() + b.area();
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
    return g.hello();
}

std::string call_value(Greeter g) {
    return g.hello();
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
