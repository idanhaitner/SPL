class Main {
    public static void main(String[] args) {
        Check.test("put then take", () -> {
            Mailbox<String> box = new Mailbox<>();
            box.put("hi");
            Check.eq(box.take(), "hi", "the message taken");
        });
        Check.test("take empties the box", () -> {
            Mailbox<String> box = new Mailbox<>();
            Check.isTrue(box.isEmpty(), "a new box should be empty");
            box.put("hi");
            Check.isTrue(!box.isEmpty(), "the box should be full after put");
            box.take();
            Check.isTrue(box.isEmpty(), "the box should be empty after take");
        });
        Check.test("messages come out in turn", () -> {
            Mailbox<Integer> box = new Mailbox<>();
            box.put(1);
            Check.eq(box.take(), 1, "the first message");
            box.put(2);
            Check.eq(box.take(), 2, "the second message");
        });
        Check.test("put and take use the lock", () -> {
            Check.isTrue(java.lang.reflect.Modifier.isSynchronized(Mailbox.class.getDeclaredMethod("put", Object.class).getModifiers()), "put should be synchronized");
            Check.isTrue(java.lang.reflect.Modifier.isSynchronized(Mailbox.class.getDeclaredMethod("take").getModifiers()), "take should be synchronized");
        });
    }
}
