int* makeBox(int value) {
    int* box = new int(value);
    return box;
}

int openBox(int* box) {
    int value = *box;
    delete box;
    return value;
}
