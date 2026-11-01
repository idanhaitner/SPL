#include <utility>

int main() {
    Image image(3, 2);
    CHECK("sizes and zeros", image.width() == 3 && image.height() == 2 && image.pixels() != nullptr && image.get(2, 1) == 0, "Image(3, 2) should have width 3, height 2, and a buffer of zeros, but the width is %d and the height is %d", image.width(), image.height());

    image.set(2, 0, 5);
    image.set(0, 1, 6);
    image.set(2, 1, 9);
    CHECK("pixels land in rows", image.get(2, 0) == 5 && image.get(0, 1) == 6 && image.get(2, 1) == 9, "pixels (2,0), (0,1), and (2,1) should hold 5, 6, and 9, but they hold %d, %d, and %d", image.get(2, 0), image.get(0, 1), image.get(2, 1));

    Image copy = image;
    CHECK("copy has the same pixels", copy.width() == 3 && copy.get(2, 1) == 9, "a copy should have width 3 and pixel (2,1) at 9, but the width is %d and the pixel is %d", copy.width(), copy.get(2, 1));

    copy.set(2, 1, 4);
    CHECK("changing the copy leaves the original", image.get(2, 1) == 9 && copy.get(2, 1) == 4, "changing the copy should leave the original at 9 and the copy at 4, but they hold %d and %d", image.get(2, 1), copy.get(2, 1));

    Image assigned(1, 1);
    assigned = image;
    assigned.set(0, 1, 7);
    CHECK("assignment makes its own copy", assigned.width() == 3 && assigned.get(0, 1) == 7 && image.get(0, 1) == 6, "after the assignment, changing assigned should leave the original at 6, but assigned holds %d and the original holds %d", assigned.get(0, 1), image.get(0, 1));

    Image source(4, 4);
    source.set(3, 3, 2);
    const char* before = source.pixels();
    Image moved(std::move(source));
    CHECK("a move takes the buffer", before != nullptr && moved.pixels() == before && moved.get(3, 3) == 2, "moving an image should keep the same buffer address, with pixel (3,3) at 2, but the address %s and the pixel is %d", before == nullptr ? "was never set" : moved.pixels() == before ? "matches" : "differs", moved.get(3, 3));

    Image target(1, 1);
    const char* movedBuffer = moved.pixels();
    target = std::move(moved);
    CHECK("move assignment takes the buffer", movedBuffer != nullptr && target.pixels() == movedBuffer && target.width() == 4, "move assignment should keep the same buffer address and width 4, but the address %s and the width is %d", movedBuffer == nullptr ? "was never set" : target.pixels() == movedBuffer ? "matches" : "differs", target.width());
    return 0;
}
