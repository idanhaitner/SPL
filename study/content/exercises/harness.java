class Check {
    interface Body {
        void run() throws Throwable;
    }

    static void test(String name, Body body) {
        try {
            body.run();
            System.out.println("PASS " + name);
        } catch (Throwable error) {
            String why = error instanceof AssertionError ? error.getMessage() : error.getClass().getSimpleName() + (error.getMessage() == null ? "" : ": " + error.getMessage());
            System.out.println("FAIL " + name + ": " + String.valueOf(why).replace("\n", " "));
        }
        System.out.flush();
    }

    static void eq(Object got, Object want, String what) {
        if (!java.util.Objects.equals(got, want)) {
            throw new AssertionError(what + " should be " + want + ", but it is " + got);
        }
    }

    static void isTrue(boolean condition, String message) {
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    static void throwsA(Class<? extends Throwable> type, Body body, String message) throws Throwable {
        try {
            body.run();
        } catch (Throwable error) {
            if (type.isInstance(error)) {
                return;
            }
            throw new AssertionError(message + " (it threw " + error.getClass().getSimpleName() + " instead of " + type.getSimpleName() + ")");
        }
        throw new AssertionError(message + " (nothing was thrown)");
    }
}
