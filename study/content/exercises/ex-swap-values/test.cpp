int main() {
    int x = 3;
    int y = 8;
    swapValues(&x, &y);
    CHECK("two positives", x == 8 && y == 3, "x should be 8 and y should be 3, but x is %d and y is %d", x, y);

    x = -4;
    y = 9;
    swapValues(&x, &y);
    CHECK("negative and positive", x == 9 && y == -4, "x should be 9 and y should be -4, but x is %d and y is %d", x, y);

    x = 6;
    y = 6;
    swapValues(&x, &y);
    CHECK("same value", x == 6 && y == 6, "x and y should both still be 6, but x is %d and y is %d", x, y);
    return 0;
}
