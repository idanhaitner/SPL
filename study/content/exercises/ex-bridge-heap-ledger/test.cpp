int main() {
    int* book = makeLedger(4);
    CHECK("makeLedger returns a block", book != nullptr, "makeLedger(4) returned nullptr, but it should return the address of a new array");
    if (book == nullptr) return 0;

    CHECK("new ledger is all zeros", book[0] == 0 && book[1] == 0 && book[2] == 0 && book[3] == 0, "every cell should start at 0, but the cells are %d, %d, %d, %d", book[0], book[1], book[2], book[3]);

    deposit(book, 4, 1, 40);
    deposit(book, 4, 3, 15);
    deposit(book, 4, 1, 2);
    CHECK("deposit adds to one cell", book[0] == 0 && book[1] == 42 && book[2] == 0 && book[3] == 15, "after deposits of 40 and 2 at index 1 and 15 at index 3, the cells should be 0, 42, 0, 15, but they are %d, %d, %d, %d", book[0], book[1], book[2], book[3]);

    deposit(book, 4, 4, 9);
    deposit(book, 4, -1, 9);
    CHECK("deposit ignores a bad index", book[0] == 0 && book[1] == 42 && book[2] == 0 && book[3] == 15, "indexes 4 and -1 are outside a ledger of 4, so nothing should change, but the cells are %d, %d, %d, %d", book[0], book[1], book[2], book[3]);

    int sum = total(book, 4);
    CHECK("total adds every cell", sum == 57, "total should be 57, but it is %d", sum);
    CHECK("total of the first cells only", total(book, 2) == 42, "total(book, 2) should add only the first two cells and give 42, but it is %d", total(book, 2));

    closeLedger(book);
    CHECK("closeLedger nulls the caller's pointer", book == nullptr, "after closeLedger(book), book should be nullptr, but it still holds an address");

    int* second = makeLedger(2);
    deposit(second, 2, 0, 5);
    CHECK("a second ledger starts fresh", second != nullptr && total(second, 2) == 5, "a new ledger of 2 with one deposit of 5 should total 5");
    closeLedger(second);
    return 0;
}
