int main() {
    int before = bagsAlive;
    int during = 0;
    int size = 0;
    {
        Student s(5);
        during = bagsAlive - before;
        size = s.bagSize();
    }
    CHECK("constructor makes one bag", during == 1 && size == 5, "Student s(5) should make 1 bag of size 5, but it made %d and bagSize() gives %d", during, size);
    CHECK("end of block frees the bag", during == 1 && bagsAlive == before, "Student s(5) should make 1 bag, and the end of its block should release it. It made %d, and %d were still not released after the block", during, bagsAlive - before);

    before = bagsAlive;
    Student* onHeap = new Student(3);
    during = bagsAlive - before;
    delete onHeap;
    CHECK("delete frees the bag", during == 1 && bagsAlive == before, "new Student(3) should make 1 bag, and delete should release it. It made %d, and %d were still not released after delete", during, bagsAlive - before);

    before = bagsAlive;
    {
        Student s(2);
        s.changeBag(9);
        during = bagsAlive - before;
        size = s.bagSize();
    }
    CHECK("changing the bag keeps one bag", during == 1, "after changeBag the student should have 1 bag, but %d bags are alive", during);
    CHECK("changing the bag changes the size", size == 9, "after changeBag(9), bagSize() should give 9, but it gives %d", size);

    before = bagsAlive;
    int firstSize = 0;
    int secondSize = 0;
    {
        Student first(1);
        Student second(2);
        during = bagsAlive - before;
        firstSize = first.bagSize();
        secondSize = second.bagSize();
    }
    CHECK("each student has their own bag", during == 2 && firstSize == 1 && secondSize == 2, "two students should have 2 bags, of sizes 1 and 2, but %d bags are alive and their sizes are %d and %d", during, firstSize, secondSize);
    return 0;
}
