int main() {
    CHECK("no shapes at the start", Shape::alive == 0, "Shape::alive should start at 0, but it is %d", Shape::alive);
    {
        Frame first(new Rect(2, 3));
        CHECK("a frame reports its shape's area", !first.empty() && first.area() == 6 && Shape::alive == 1, "a frame around Rect(2, 3) should have area 6 with one shape alive, but the area is %d and %d shapes are alive", first.area(), Shape::alive);

        Frame copy = first;
        CHECK("copy keeps the real class", copy.area() == 6, "the copy of a frame around Rect(2, 3) should have area 6, but it has %d", copy.area());
        CHECK("copy owns a new shape", Shape::alive == 2 && first.area() == 6, "after one copy there should be 2 shapes alive, but there are %d", Shape::alive);

        Frame moved = std::move(first);
        CHECK("move takes the shape", moved.area() == 6 && Shape::alive == 2, "a move should create no shape, so 2 should be alive with area 6 in the new frame, but %d are alive and the area is %d", Shape::alive, moved.area());
        CHECK("move leaves the source empty", first.empty(), "after Frame moved = std::move(first), first should be empty");

        Frame square(new Square(4));
        square = copy;
        CHECK("copy assignment replaces the shape", square.area() == 6 && Shape::alive == 3, "after square = copy, square should have area 6 and 3 shapes should be alive (the old square is deleted, a new rect is made), but the area is %d and %d are alive", square.area(), Shape::alive);

        Frame& same = square;
        square = same;
        CHECK("copy self-assignment keeps the shape", square.area() == 6 && Shape::alive == 3, "after square = square, it should still have area 6 with 3 shapes alive, but the area is %d and %d are alive", square.area(), Shape::alive);

        Frame target(new Square(5));
        target = std::move(copy);
        CHECK("move assignment takes the shape", target.area() == 6 && copy.empty(), "after target = std::move(copy), target should have area 6 and copy should be empty, but the area is %d", target.area());
        CHECK("move assignment deletes the old shape", Shape::alive == 3, "the old Square(5) should be deleted and no shape created, leaving 3 alive, but %d are alive", Shape::alive);

        Frame none(nullptr);
        Frame noneCopy = none;
        CHECK("an empty frame copies to an empty frame", noneCopy.empty() && noneCopy.area() == 0 && Shape::alive == 3, "copying an empty frame should give an empty frame and create no shape, but %d shapes are alive", Shape::alive);
    }
    CHECK("every shape is deleted exactly once", Shape::alive == 0, "after every frame is destroyed, Shape::alive should be 0, but it is %d", Shape::alive);
    return 0;
}
