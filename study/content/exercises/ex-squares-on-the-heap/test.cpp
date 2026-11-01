static int arrayNewCalls = 0;
static int arrayDeleteCalls = 0;
static int plainDeleteCalls = 0;

void* operator new[](size_t size) {
    arrayNewCalls++;
    void* block = malloc(size == 0 ? 1 : size);
    if (block == nullptr) {
        abort();
    }
    return block;
}

void operator delete[](void* block) noexcept {
    arrayDeleteCalls++;
    free(block);
}

void operator delete[](void* block, size_t) noexcept {
    arrayDeleteCalls++;
    free(block);
}

void* operator new(size_t size) {
    void* block = malloc(size == 0 ? 1 : size);
    if (block == nullptr) {
        abort();
    }
    return block;
}

void operator delete(void* block) noexcept {
    plainDeleteCalls++;
    free(block);
}

void operator delete(void* block, size_t) noexcept {
    plainDeleteCalls++;
    free(block);
}

int main() {
    int got = sumOfSquares(3);
    CHECK("three values", got == 14, "sumOfSquares(3) should be 1 + 4 + 9, which is 14, but it returned %d", got);

    got = sumOfSquares(1);
    CHECK("one value", got == 1, "sumOfSquares(1) should be 1, but it returned %d", got);

    int size = 5;
    got = sumOfSquares(size);
    CHECK("five values", got == 55, "sumOfSquares(5) should be 55, but it returned %d", got);

    got = sumOfSquares(0);
    CHECK("no values", got == 0, "sumOfSquares(0) should be 0, but it returned %d", got);

    CHECK("allocated with new[]", arrayNewCalls == 4, "sumOfSquares ran 4 times, so new[] should have run 4 times, but it ran %d times", arrayNewCalls);
    CHECK("released with delete[]", arrayDeleteCalls == 4 && plainDeleteCalls == 0, "sumOfSquares ran 4 times, so delete[] should have run 4 times, but delete[] ran %d times and plain delete ran %d times", arrayDeleteCalls, plainDeleteCalls);
    return 0;
}
