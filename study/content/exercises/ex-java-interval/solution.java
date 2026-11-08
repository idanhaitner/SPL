class Interval {
    final int low;
    final int high;

    Interval(int low, int high) {
        if (low > high) {
            throw new IllegalArgumentException("low > high");
        }
        this.low = low;
        this.high = high;
    }

    int length() {
        return high - low;
    }

    boolean contains(int x) {
        return low <= x && x <= high;
    }

    Interval intersect(Interval other) {
        int start = Math.max(low, other.low);
        int end = Math.min(high, other.high);
        if (start > end) {
            throw new IllegalArgumentException("the intervals do not overlap");
        }
        return new Interval(start, end);
    }
}
