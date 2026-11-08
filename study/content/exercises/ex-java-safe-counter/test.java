class Main {
    static boolean isSynchronized(String method) throws Exception {
        return java.lang.reflect.Modifier.isSynchronized(SafeCounter.class.getDeclaredMethod(method).getModifiers());
    }

    public static void main(String[] args) {
        Check.test("counts add up", () -> {
            SafeCounter counter = new SafeCounter();
            for (int i = 0; i < 1000; i++) {
                counter.increment();
            }
            Check.eq(counter.get(), 1000, "get() after 1000 increments");
        });
        Check.test("starts at zero", () -> {
            Check.eq(new SafeCounter().get(), 0, "get() on a new counter");
        });
        Check.test("increment is synchronized", () -> {
            Check.isTrue(isSynchronized("increment"), "increment() should be declared synchronized");
        });
        Check.test("get is synchronized", () -> {
            Check.isTrue(isSynchronized("get"), "get() should be declared synchronized, so a read takes the same lock as a write");
        });
    }
}
