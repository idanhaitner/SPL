void minAndMax(int a, int b, int c, int& smallest, int& largest) {
    smallest = a;
    largest = a;
    if (b < smallest) {
        smallest = b;
    }
    if (b > largest) {
        largest = b;
    }
    if (c < smallest) {
        smallest = c;
    }
    if (c > largest) {
        largest = c;
    }
}
