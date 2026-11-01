#include <type_traits>

static int probesDestroyed = 0;

class Probe : public Shape {
public:
    ~Probe() {
        probesDestroyed++;
    }

    int area() const {
        return 1;
    }
};

int main() {
    Rectangle rectangle(2, 3);
    Square square(4);
    CHECK("area of the object itself", rectangle.area() == 6 && square.area() == 16, "a 2 by 3 rectangle should have area 6 and a square of side 4 should have area 16, but they have %d and %d", rectangle.area(), square.area());

    Shape* throughBase = &rectangle;
    CHECK("a rectangle through a Shape pointer", throughBase->area() == 6, "a Shape* pointing at a 2 by 3 rectangle should give 6, but it gave %d. A 0 means the call stopped at Shape", throughBase->area());

    throughBase = &square;
    CHECK("a square through a Shape pointer", throughBase->area() == 16, "a Shape* pointing at a square of side 4 should give 16, but it gave %d. A 0 means the call stopped at Shape", throughBase->area());

    Shape* shapes[] = {&rectangle, &square};
    CHECK("total area of a mixed array", totalArea(shapes, 2) == 22, "an array of a 2 by 3 rectangle and a square of side 4 should total 22, but totalArea gave %d", totalArea(shapes, 2));

    CHECK("total area of no shapes", totalArea(shapes, 0) == 0, "an empty array should total 0, but totalArea gave %d", totalArea(shapes, 0));

    CHECK("Shape is abstract", std::is_abstract<Shape>::value, "Shape should have a pure virtual function, so no plain Shape can be created, but it can still be created");

    Shape* probe = new Probe();
    delete probe;
    CHECK("delete through a base pointer", probesDestroyed == 1, "delete through a Shape* should run the derived destructor once, but it ran %d times", probesDestroyed);
    return 0;
}
