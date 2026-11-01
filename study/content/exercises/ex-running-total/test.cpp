int main() {
    int got = runningTotal(5);
    CHECK("first call", got == 5, "after runningTotal(5) the total should be 5, but it returned %d", got);

    got = runningTotal(3);
    CHECK("second call keeps the total", got == 8, "the total was 5, so runningTotal(3) should return 8, but it returned %d", got);

    got = runningTotal(0);
    CHECK("adding zero", got == 8, "the total was 8, so runningTotal(0) should return 8, but it returned %d", got);

    got = runningTotal(-2);
    CHECK("negative amount", got == 6, "the total was 8, so runningTotal(-2) should return 6, but it returned %d", got);
    return 0;
}
