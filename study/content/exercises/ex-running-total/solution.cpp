int runningTotal(int amount) {
    static int total = 0;
    total = total + amount;
    return total;
}
