static int newCalls = 0;
static int deleteCalls = 0;

void* operator new(size_t size) {
    newCalls++;
    void* block = malloc(size == 0 ? 1 : size);
    if (block == nullptr) {
        abort();
    }
    return block;
}

void operator delete(void* block) noexcept {
    deleteCalls++;
    free(block);
}

void operator delete(void* block, size_t) noexcept {
    deleteCalls++;
    free(block);
}

void* operator new[](size_t size) {
    void* block = malloc(size == 0 ? 1 : size);
    if (block == nullptr) {
        abort();
    }
    return block;
}

void operator delete[](void* block) noexcept {
    free(block);
}

void operator delete[](void* block, size_t) noexcept {
    free(block);
}

int main() {
    int* first = makeBox(7);
    CHECK("makeBox returns an address", first != nullptr, "makeBox(7) should return the address of a new block, but it returned nullptr");
    CHECK("makeBox calls new", newCalls == 1, "makeBox(7) should call new one time, but new ran %d times", newCalls);

    int* second = makeBox(-2);
    int firstValue = first != nullptr ? *first : 0;
    int secondValue = second != nullptr ? *second : 0;
    CHECK("each box has its own block", firstValue == 7 && secondValue == -2, "the boxes should hold 7 and -2, but they hold %d and %d", firstValue, secondValue);

    int opened = first != nullptr ? openBox(first) : 0;
    CHECK("openBox returns the value", opened == 7, "opening the box that holds 7 should return 7, but openBox returned %d", opened);
    CHECK("openBox releases the block", deleteCalls == 1, "openBox should call delete one time, but delete ran %d times", deleteCalls);

    opened = second != nullptr ? openBox(second) : 0;
    CHECK("second box still opens", opened == -2, "opening the box that holds -2 should return -2, but openBox returned %d", opened);
    return 0;
}
