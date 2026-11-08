class Main {
    public static void main(String[] args) {
        Check.test("is a Runnable", () -> {
            Object task = new SumTask(3, new long[1]);
            Check.isTrue(task instanceof Runnable, "SumTask should implement Runnable");
        });
        Check.test("sum of 1 to 4", () -> {
            long[] out = new long[1];
            new SumTask(4, out).run();
            Check.eq(out[0], 10L, "the sum of 1..4");
        });
        Check.test("sum of 1 to 100", () -> {
            long[] out = new long[1];
            new SumTask(100, out).run();
            Check.eq(out[0], 5050L, "the sum of 1..100");
        });
        Check.test("n is zero", () -> {
            long[] out = new long[]{99};
            new SumTask(0, out).run();
            Check.eq(out[0], 0L, "the sum for n = 0");
        });
    }
}
