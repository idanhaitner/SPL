#include <utility>

int main() {
    Buffer first(3);
    first.set(0, 10);
    first.set(2, 30);
    CHECK("constructor and set", first.size() == 3 && first.get(0) == 10 && first.get(1) == 0 && first.get(2) == 30, "Buffer(3) after set should have size 3 and hold 10, 0, 30, but the size is %d and cell 0 is %d", first.size(), first.get(0));

    Buffer copy(first);
    CHECK("copy constructor makes a second array", copy.size() == 3 && copy.get(2) == 30 && copy.data() != first.data(), "a copy should have size 3, cell 2 at 30, and a different address, but its size is %d and cell 2 is %d", copy.size(), copy.get(2));

    copy.set(0, 11);
    CHECK("changing the copy leaves the original", first.get(0) == 10, "changing the copy should leave the original's cell 0 at 10, but it is now %d", first.get(0));

    Buffer assigned(1);
    assigned = first;
    CHECK("copy assignment makes a second array", assigned.size() == 3 && assigned.get(2) == 30 && assigned.data() != first.data(), "after assigned = first, assigned should have size 3, cell 2 at 30, and a different address, but its size is %d and cell 2 is %d", assigned.size(), assigned.get(2));

    assigned.set(1, 77);
    CHECK("copy assignment leaves the source alone", first.size() == 3 && first.get(1) == 0, "changing assigned should leave first's cell 1 at 0, but it is now %d", first.get(1));

    Buffer source(3);
    source.set(0, 5);
    const int* before = source.data();
    Buffer moved(std::move(source));
    CHECK("move constructor takes the array", before != nullptr && moved.data() == before && moved.size() == 3 && moved.get(0) == 5, "the new buffer should hold the same address as the source, with size 3 and cell 0 at 5, but its size is %d and the address %s", moved.size(), before == nullptr ? "was never set" : moved.data() == before ? "matches" : "differs");
    CHECK("move constructor empties the source", before != nullptr && source.data() == nullptr && source.size() == 0, "after the move, the source should hold a null pointer and size 0, but its size is %d and its pointer %s", source.size(), before == nullptr ? "was never set" : source.data() == nullptr ? "is null" : "is not null");

    Buffer giver(2);
    giver.set(1, 6);
    const int* giverArray = giver.data();
    Buffer receiver(5);
    receiver = std::move(giver);
    CHECK("move assignment takes the array", giverArray != nullptr && receiver.data() == giverArray && receiver.size() == 2 && receiver.get(1) == 6, "after receiver = std::move(giver), receiver should hold giver's address with size 2 and cell 1 at 6, but its size is %d and the address %s", receiver.size(), giverArray == nullptr ? "was never set" : receiver.data() == giverArray ? "matches" : "differs");
    CHECK("move assignment leaves the source without the array", giverArray != nullptr && giver.data() != giverArray, "after the move, giver should no longer hold the array it gave away, but %s", giverArray == nullptr ? "no array was ever made" : "it still holds it");

    receiver = Buffer(4);
    CHECK("a temporary moves in", receiver.size() == 4, "after receiver = Buffer(4), receiver should have size 4, but its size is %d", receiver.size());

    Buffer refill(2);
    refill.set(0, 8);
    source = refill;
    CHECK("a moved-from buffer can get a new value", source.size() == 2 && source.get(0) == 8, "assigning to a moved-from buffer should give it size 2 and cell 0 at 8, but its size is %d and cell 0 is %d", source.size(), source.get(0));

    Buffer solo(2);
    solo.set(1, 4);
    Buffer& sameObject = solo;
    solo = sameObject;
    CHECK("copy self-assignment keeps the values", solo.size() == 2 && solo.get(1) == 4, "assigning a buffer to itself should keep size 2 and cell 1 at 4, but the size is %d and cell 1 is %d", solo.size(), solo.get(1));

    solo = std::move(sameObject);
    CHECK("move self-assignment keeps the values", solo.size() == 2 && solo.get(1) == 4, "moving a buffer into itself should keep size 2 and cell 1 at 4, but the size is %d and cell 1 is %d", solo.size(), solo.get(1));
    return 0;
}
