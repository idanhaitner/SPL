int sumOfSquares(int n) {
    int* squares = new int[n];
    for (int i = 0; i < n; i = i + 1) {
        squares[i] = (i + 1) * (i + 1);
    }
    int sum = 0;
    for (int i = 0; i < n; i = i + 1) {
        sum = sum + squares[i];
    }
    delete[] squares;
    return sum;
}
