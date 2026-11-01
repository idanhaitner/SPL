int main() {
    int x = 8;
    int y = 3;
    CHECK("first is larger", &larger(x, y) == &x, "x is 8 and y is 3, so larger(x, y) should be another name for x, but it names something else");

    x = 3;
    y = 8;
    CHECK("second is larger", &larger(x, y) == &y, "x is 3 and y is 8, so larger(x, y) should be another name for y, but it names something else");

    x = 6;
    y = 6;
    CHECK("same value gives the first", &larger(x, y) == &x, "x and y are both 6, so larger(x, y) should be another name for x, but it names something else");

    x = -9;
    y = -2;
    CHECK("two negatives", &larger(x, y) == &y, "x is -9 and y is -2, so larger(x, y) should be another name for y, but it names something else");

    x = 3;
    y = 8;
    larger(x, y) = 0;
    CHECK("write through the result", x == 3 && y == 0, "after larger(x, y) = 0, x should still be 3 and y should be 0, but x is %d and y is %d", x, y);

    x = 3;
    y = 8;
    larger(x, y) = 1;
    larger(x, y) = 0;
    CHECK("write twice", x == 0 && y == 1, "the first write should change y to 1, which leaves x as the larger, so the second write should change x to 0. x should be 0 and y should be 1, but x is %d and y is %d", x, y);
    return 0;
}
