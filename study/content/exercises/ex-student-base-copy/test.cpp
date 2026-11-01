int main() {
    Student ringo(7, "ringo", 30);
    CHECK("constructor fills both parts", ringo.id() == 7 && ringo.name() == "ringo" && ringo.credits() == 30, "the student should have id 7, the name ringo, and 30 credits, but has id %d, the name \"%s\", and %d credits", ringo.id(), ringo.name().c_str(), ringo.credits());

    Student copy(ringo);
    CHECK("copy keeps the Person part", copy.id() == 7 && copy.name() == "ringo", "a copy should have id 7 and the name ringo, but has id %d and the name \"%s\"", copy.id(), copy.name().c_str());
    CHECK("copy keeps the credits", copy.credits() == 30, "a copy should have 30 credits, but has %d", copy.credits());

    copy.setCredits(99);
    CHECK("changing the copy leaves the original", ringo.credits() == 30, "changing the copy's credits should leave the original at 30, but it is now %d", ringo.credits());

    Student jango(8, "jango", 20);
    Student target(1, "target", 10);
    target = jango;
    CHECK("assignment keeps the Person part", target.id() == 8 && target.name() == "jango", "after target = jango, target should have id 8 and the name jango, but has id %d and the name \"%s\"", target.id(), target.name().c_str());
    CHECK("assignment copies the credits", target.credits() == 20, "after target = jango, target should have 20 credits, but has %d", target.credits());

    target.setCredits(5);
    CHECK("changing after assignment leaves the other", jango.credits() == 20, "changing target's credits should leave jango at 20, but it is now %d", jango.credits());

    Student a(1, "a", 1);
    Student b(2, "b", 2);
    Student c(3, "c", 3);
    a = b = c;
    CHECK("chained assignment", a.id() == 3 && a.credits() == 3 && b.id() == 3 && b.credits() == 3, "after a = b = c, a and b should both have id 3 and 3 credits, but a has id %d and %d credits", a.id(), a.credits());

    Student solo(4, "solo", 40);
    Student& sameObject = solo;
    solo = sameObject;
    CHECK("self-assignment changes nothing", solo.id() == 4 && solo.credits() == 40, "assigning a student to itself should keep id 4 and 40 credits, but it has id %d and %d credits", solo.id(), solo.credits());

    Person* throughBase = new Student(6, "six", 60);
    int idThroughBase = throughBase->id();
    delete throughBase;
    CHECK("a student through a Person pointer", idThroughBase == 6, "a Person* pointing at a student with id 6 should read 6, but it read %d", idThroughBase);
    return 0;
}
