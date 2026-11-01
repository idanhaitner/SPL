int main() {
    Bag plain(1);
    Bag7 seven(2);
    Bag12 twelve(3);
    Bag* throughBase = &seven;
    CHECK("each class has its capacity", plain.capacity() == 5 && throughBase->capacity() == 7 && twelve.capacity() == 12, "the capacities should be 5, 7, and 12, but they are %d, %d, and %d", plain.capacity(), throughBase->capacity(), twelve.capacity());
    CHECK("items are stored", plain.items() == 1 && seven.items() == 2 && twelve.items() == 3, "the bags should hold 1, 2, and 3 items, but they hold %d, %d, and %d", plain.items(), seven.items(), twelve.items());

    Bag* original = new Bag7(3);
    Bag* copy = original->clone();
    CHECK("clone of a Bag7 is a Bag7", copy != nullptr && copy->capacity() == 7, "clone through a Bag* on a Bag7 should give capacity 7, but it gave %d (-1 means clone returned a null pointer)", copy != nullptr ? copy->capacity() : -1);
    CHECK("clone keeps the items", copy != nullptr && copy->items() == 3, "a clone of a bag with 3 items should hold 3, but it holds %d (-1 means clone returned a null pointer)", copy != nullptr ? copy->items() : -1);
    CHECK("clone is a new object", copy != nullptr && copy != original, "clone should return a new object on the heap, but it returned %s", copy == nullptr ? "a null pointer" : "the same address");
    delete original;
    delete copy;

    Bag* big = new Bag12(4);
    Bag* bigCopy = big->clone();
    CHECK("clone of a Bag12 is a Bag12", bigCopy != nullptr && bigCopy->capacity() == 12, "clone through a Bag* on a Bag12 should give capacity 12, but it gave %d (-1 means clone returned a null pointer)", bigCopy != nullptr ? bigCopy->capacity() : -1);
    delete big;
    delete bigCopy;

    Locker first(new Bag7(3));
    Locker second(first);
    CHECK("a locker's copy keeps the real class", second.bag() != nullptr && second.bag()->capacity() == 7 && second.bag()->items() == 3, "a copy of a locker with a Bag7 of 3 items should have capacity 7 and 3 items, but it has capacity %d (-1 means the copy holds no bag)", second.bag() != nullptr ? second.bag()->capacity() : -1);
    CHECK("a locker's copy has its own bag", second.bag() != nullptr && second.bag() != first.bag(), "the two lockers should hold different bags, but the copy holds %s", second.bag() == nullptr ? "a null pointer" : "the same address");

    Locker third(new Bag(1));
    third = first;
    CHECK("assignment keeps the real class", third.bag() != nullptr && third.bag()->capacity() == 7 && third.bag()->items() == 3, "after third = first, third should hold a bag with capacity 7 and 3 items, but its capacity is %d (-1 means it holds no bag)", third.bag() != nullptr ? third.bag()->capacity() : -1);
    CHECK("assignment gives its own bag", third.bag() != nullptr && third.bag() != first.bag(), "after the assignment the two lockers should hold different bags, but they hold the same address");

    Locker solo(new Bag12(6));
    Locker& sameObject = solo;
    solo = sameObject;
    CHECK("self-assignment keeps the bag", solo.bag() != nullptr && solo.bag()->capacity() == 12 && solo.bag()->items() == 6, "assigning a locker to itself should keep capacity 12 and 6 items, but the capacity is %d (-1 means it holds no bag)", solo.bag() != nullptr ? solo.bag()->capacity() : -1);
    return 0;
}
