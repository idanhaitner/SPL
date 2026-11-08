class Main {
    public static void main(String[] args) {
        Check.test("push and top", () -> {
            ListStack<String> stack = new ListStack<>();
            stack.push("a");
            stack.push("b");
            Check.eq(stack.top(), "b", "top() after pushing a and b");
            Check.eq(stack.size(), 2, "size()");
        });
        Check.test("removeTop shrinks the stack", () -> {
            ListStack<Integer> stack = new ListStack<>();
            stack.push(1);
            stack.push(2);
            stack.removeTop();
            Check.eq(stack.size(), 1, "size() after removeTop");
            Check.eq(stack.top(), 1, "top() after removeTop");
        });
        Check.test("push rejects null", () -> {
            ListStack<String> stack = new ListStack<>();
            Check.throwsA(IllegalArgumentException.class, () -> stack.push(null), "push(null) should be rejected");
            Check.eq(stack.size(), 0, "size() after a rejected push");
        });
        Check.test("top of an empty stack", () -> {
            ListStack<String> stack = new ListStack<>();
            Check.throwsA(IllegalStateException.class, () -> stack.top(), "top() on an empty stack should be rejected");
        });
        Check.test("removeTop of an empty stack", () -> {
            ListStack<String> stack = new ListStack<>();
            Check.throwsA(IllegalStateException.class, () -> stack.removeTop(), "removeTop() on an empty stack should be rejected");
        });
    }
}
