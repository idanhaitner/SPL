// =============================================================================
// Lesson 14 exercises: inheritance and virtual functions
// =============================================================================
// What you practice:
//   - implementing a derived class of an abstract base (pure virtual = 0)
//   - calling through a base-class reference: the DYNAMIC type decides which
//     function runs
//   - SLICING: passing a derived object BY VALUE as the base type copies only
//     the base part, and the derived behavior is lost
//
// Replace each `throw NotImplemented(...)` with your code, then run from the
// c++ directory:   make try LESSON=14-inheritance
//
// Delete the `(void)something;` lines when you write the real code. They only
// silence "unused" warnings.
// =============================================================================

#include "check.hpp"

#include <string>

// -----------------------------------------------------------------------------
// Shape: given. An ABSTRACT base class. `= 0` means "no body here, every
// concrete subclass must provide one". You cannot create a plain Shape.
// The virtual destructor makes deleting a derived object through a Shape*
// run the right destructor.
// -----------------------------------------------------------------------------
class Shape {
public:
    virtual int area() const = 0;
    virtual ~Shape() = default;
};

// -----------------------------------------------------------------------------
// Rect: a concrete Shape with width w and height h.
// -----------------------------------------------------------------------------
class Rect : public Shape {
    int w;
    int h;

public:
    // -------------------------------------------------------------------------
    // 1. Rect constructor
    // Store the width and height.
    //
    //   width, height   the rectangle's sides, both positive
    //
    // Change the initializer list from w(0), h(0) to w(width), h(height).
    // Then delete the (void) lines and the throw, and leave the body empty: {}
    // -------------------------------------------------------------------------
    Rect(int width, int height) : w(0), h(0) {
        (void)width;
        (void)height;
        (void)w;
        (void)h;
        throw NotImplemented("Rect");
    }

    // -------------------------------------------------------------------------
    // 2. Rect::area
    // Return w * h.
    //
    // Example:   Rect(3, 4).area() == 12
    // `override` asks the compiler to check that this really overrides a
    // virtual in Shape. A typo in the name or signature then becomes an error.
    // -------------------------------------------------------------------------
    int area() const override {
        throw NotImplemented("Rect::area");
    }
};

// -----------------------------------------------------------------------------
// 3. total_area
// Add the areas of two shapes, whatever their real types are.
//
//   a, b     references to Shape. The objects behind them may be Rect or any
//            other subclass.
//   returns  a.area() + b.area()
//
// Example:   Rect(3, 4) and Rect(2, 5)  ->  12 + 10 = 22
// Because area() is virtual and a and b are references, each call runs the
// Rect version, even though this function only knows "Shape". That is dynamic
// dispatch.
// -----------------------------------------------------------------------------
int total_area(const Shape& a, const Shape& b) {
    throw NotImplemented("total_area");
}

// -----------------------------------------------------------------------------
// Greeter / Loud: given. Loud overrides hello() to shout.
// -----------------------------------------------------------------------------
class Greeter {
public:
    virtual std::string hello() const { return "hi"; }
    virtual ~Greeter() = default;
};

class Loud : public Greeter {
public:
    std::string hello() const override { return "HI"; }
};

// -----------------------------------------------------------------------------
// 4. call_ref
// Return g.hello().
//
//   g        a REFERENCE to a Greeter. The real object may be a Loud.
//   returns  whatever g.hello() returns
//
// Test: passing a Loud must give "HI". The reference refers to the whole Loud
// object, so the virtual call reaches Loud::hello.
// -----------------------------------------------------------------------------
std::string call_ref(const Greeter& g) {
    throw NotImplemented("call_ref");
}

// -----------------------------------------------------------------------------
// 5. call_value
// Same body as call_ref: return g.hello().
//
//   g        a Greeter BY VALUE (a copy)
//   returns  whatever g.hello() returns
//
// Test: passing a Loud must give "hi", NOT "HI". Why? Building a Greeter copy
// from a Loud copies only the Greeter part. The Loud part is "sliced off", and
// g really is a plain Greeter. You write the same line as in call_ref. The
// difference comes from the parameter type alone.
// Lesson: pass polymorphic objects by reference or pointer, never by value.
// -----------------------------------------------------------------------------
std::string call_value(Greeter g) {
    throw NotImplemented("call_value");
}

// The checker. You do not edit main.
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
