static int changeAndRead(Scores byValue) {
    byValue.set(0, -1);
    return byValue.get(0);
}

int main() {
    Scores first(3);
    CHECK("starts at zero", first.size() == 3 && first.get(0) == 0 && first.get(2) == 0, "Scores(3) should have size 3 and hold zeros, but the size is %d", first.size());

    first.set(0, 90);
    first.set(1, 75);
    first.set(2, 60);
    CHECK("set and get", first.get(0) == 90 && first.get(1) == 75 && first.get(2) == 60, "after setting 90, 75, 60, the cells should hold them, but they hold %d, %d, %d", first.get(0), first.get(1), first.get(2));

    Scores copy(first);
    CHECK("copy has the same values", copy.size() == 3 && copy.get(0) == 90 && copy.get(2) == 60, "a copy should have size 3 with cell 0 at 90, but its size is %d and cell 0 is %d", copy.size(), copy.get(0));

    copy.set(0, 11);
    CHECK("changing the copy leaves the original", first.get(0) == 90, "changing the copy should leave the original's cell 0 at 90, but it is now %d", first.get(0));

    first.set(1, 22);
    CHECK("changing the original leaves the copy", copy.get(1) == 75, "changing the original should leave the copy's cell 1 at 75, but it is now %d", copy.get(1));

    Scores target(1);
    target = first;
    CHECK("assignment copies the size and values", target.size() == 3 && target.get(0) == 90 && target.get(1) == 22, "after target = first, target should have size 3 and cell 0 at 90, but its size is %d and cell 0 is %d", target.size(), target.get(0));

    target.set(2, 33);
    CHECK("changing after assignment leaves the other", first.get(2) == 60, "changing target after the assignment should leave first's cell 2 at 60, but it is now %d", first.get(2));

    Scores a(1);
    Scores b(1);
    Scores c(2);
    c.set(1, 4);
    a = b = c;
    CHECK("chained assignment", a.size() == 2 && a.get(1) == 4 && b.size() == 2 && b.get(1) == 4, "after a = b = c, a and b should both have size 2 and cell 1 at 4, but their sizes are %d and %d", a.size(), b.size());

    Scores solo(2);
    solo.set(1, 8);
    Scores& sameObject = solo;
    solo = sameObject;
    CHECK("self-assignment keeps the values", solo.size() == 2 && solo.get(1) == 8, "assigning an object to itself should keep size 2 and cell 1 at 8, but the size is %d and cell 1 is %d", solo.size(), solo.get(1));

    int seen = changeAndRead(first);
    CHECK("passing by value makes a copy", seen == -1 && first.get(0) == 90, "a function that changes its by-value parameter should leave the caller's cell 0 at 90, but it is %d", first.get(0));
    return 0;
}
