int main() {
    int aliveInside = 0;
    {
        Student solo("solo", 3);
        aliveInside = bagsAlive;
        CHECK("constructor makes one bag", aliveInside == 1 && solo.name() == "solo" && solo.bagCapacity() == 3, "one new student should mean 1 bag, the name solo, and capacity 3, but there are %d bags, the name is \"%s\", and the capacity is %d", aliveInside, solo.name().c_str(), solo.bagCapacity());
    }
    CHECK("destructor deletes the bag", aliveInside == 1 && bagsAlive == 0, "there should be 1 bag while the student lives and 0 after, but there were %d and then %d", aliveInside, bagsAlive);

    bagsAlive = 0;
    {
        Student ringo("ringo", 7);
        Student copy(ringo);
        CHECK("copy makes a second bag", bagsAlive == 2, "two students should mean 2 bags, but there are %d", bagsAlive);
        CHECK("copy has the same name and capacity", copy.name() == "ringo" && copy.bagCapacity() == 7, "the copy should be ringo with capacity 7, but it is \"%s\" with capacity %d", copy.name().c_str(), copy.bagCapacity());

        copy.setBagCapacity(9);
        CHECK("changing the copy's bag leaves the original", ringo.bagCapacity() == 7, "changing the copy's bag should leave ringo's at 7, but it is now %d", ringo.bagCapacity());

        Student jango("jango", 5);
        int before = bagsAlive;
        ringo = jango;
        CHECK("assignment releases the old bag", bagsAlive == before, "ringo = jango should leave the number of bags at %d, but there are now %d", before, bagsAlive);
        CHECK("assignment copies the name and capacity", ringo.name() == "jango" && ringo.bagCapacity() == 5, "after ringo = jango, ringo should be named jango with capacity 5, but the name is \"%s\" and the capacity is %d", ringo.name().c_str(), ringo.bagCapacity());

        ringo.setBagCapacity(1);
        CHECK("changing after assignment leaves the other", jango.bagCapacity() == 5, "changing ringo's bag after the assignment should leave jango's at 5, but it is now %d", jango.bagCapacity());

        Student a("a", 1);
        Student b("b", 2);
        Student c("c", 3);
        a = b = c;
        CHECK("chained assignment", a.bagCapacity() == 3 && b.bagCapacity() == 3 && a.name() == "c", "after a = b = c, a and b should both have capacity 3, but they have %d and %d", a.bagCapacity(), b.bagCapacity());

        before = bagsAlive;
        Student& sameObject = jango;
        jango = sameObject;
        CHECK("self-assignment keeps the bag", bagsAlive == before && jango.bagCapacity() == 5, "assigning jango to itself should keep capacity 5 and %d bags, but the capacity is %d and there are %d bags", before, jango.bagCapacity(), bagsAlive);
    }
    CHECK("every bag is gone at the end", bagsAlive == 0, "after all the students are destroyed there should be 0 bags, but there are %d", bagsAlive);
    return 0;
}
