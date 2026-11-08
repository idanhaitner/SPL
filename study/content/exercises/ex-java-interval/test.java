class Main {
    public static void main(String[] args) {
        Check.test("length and contains", () -> {
            Interval interval = new Interval(2, 9);
            Check.eq(interval.length(), 7, "length() of [2, 9]");
            Check.isTrue(interval.contains(2) && interval.contains(9) && interval.contains(5), "2, 5 and 9 are inside [2, 9]");
            Check.isTrue(!interval.contains(1) && !interval.contains(10), "1 and 10 are outside [2, 9]");
        });
        Check.test("constructor rejects reversed ends", () -> {
            Check.throwsA(IllegalArgumentException.class, () -> new Interval(5, 1), "new Interval(5, 1) should be rejected");
        });
        Check.test("one-point interval is allowed", () -> {
            Check.eq(new Interval(4, 4).length(), 0, "length() of [4, 4]");
        });
        Check.test("intersect overlap", () -> {
            Interval overlap = new Interval(1, 10).intersect(new Interval(6, 20));
            Check.eq(overlap.low, 6, "low of the overlap");
            Check.eq(overlap.high, 10, "high of the overlap");
        });
        Check.test("intersect of disjoint intervals", () -> {
            Check.throwsA(IllegalArgumentException.class, () -> new Interval(1, 2).intersect(new Interval(5, 6)), "disjoint intervals should be rejected");
        });
    }
}
