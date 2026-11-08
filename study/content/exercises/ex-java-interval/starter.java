class Interval {
    final int low;
    final int high;

    Interval(int low, int high) {
        this.low = low;
        this.high = high;
    }

    int length() {
        return 0;
    }

    boolean contains(int x) {
        return false;
    }

    Interval intersect(Interval other) {
        return this;
    }
}
