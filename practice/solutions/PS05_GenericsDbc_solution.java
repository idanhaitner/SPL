/*
 * SPL practice — PS5, generics, design by contract, lambdas, exceptions
 * Slides: materials/sessions/SPL_PS5.pptx
 *
 * Completed answers for PS05_GenericsDbc.java. Try that file on your own first, then compare.
 *
 * From this folder:
 *   javac PS05_GenericsDbc.java && java PS05_GenericsDbc
 */

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class PS05_GenericsDbc_solution {
    static class NotImplemented extends RuntimeException {
        NotImplemented(String exercise) { super(exercise); }
    }

    interface Task { void run() throws Exception; }

    static class Score {
        int passed, failed, todo;

        void pass(String name) {
            System.out.println("  [pass] " + name);
            passed++;
        }
        void fail(String name, String why) {
            System.out.println("  [fail] " + name);
            System.out.println("         " + why);
            failed++;
        }
        void skip(String name) {
            System.out.println("  [todo] " + name);
            todo++;
        }
        int finish() {
            System.out.println();
            System.out.println(passed + " passed, " + failed + " failed, " + todo + " still to do.");
            if (failed == 0 && todo == 0) {
                System.out.println("All exercises complete. Nice work.");
            } else if (failed == 0 && passed == 0) {
                System.out.println("Every exercise is still open. Fill one in and run again.");
            } else if (failed == 0) {
                System.out.println("The finished ones are correct. Fill in each [todo].");
            }
            return failed == 0 ? 0 : 1;
        }
    }

    static void expectEq(String label, Object got, Object want) {
        if (!java.util.Objects.equals(got, want)) {
            throw new RuntimeException(label + "\n         expected: " + want + "\n         got:      " + got);
        }
    }

    static void expectNear(String label, double got, double want) {
        if (Double.isNaN(got) || Math.abs(got - want) > 1e-9) {
            throw new RuntimeException(label + "\n         expected: " + want + "\n         got:      " + got);
        }
    }

    static void expectTrue(String label, boolean cond) {
        if (!cond) throw new RuntimeException(label);
    }

    static void expectArray(String label, int[] got, int[] want) {
        if (!java.util.Arrays.equals(got, want)) {
            throw new RuntimeException(label
                + "\n         expected: " + java.util.Arrays.toString(want)
                + "\n         got:      " + java.util.Arrays.toString(got));
        }
    }

    static void check(Score score, String name, Task task) {
        try {
            task.run();
            score.pass(name);
        } catch (NotImplemented ex) {
            score.skip(name);
        } catch (Exception ex) {
            String msg = ex.getMessage();
            score.fail(name, msg == null ? ex.getClass().getSimpleName() : msg);
        }
    }

    static void read(String line) {
        System.out.println("  [read] " + line);
    }


    /**
     * A stack contract, in the words the slides use.
     *
     * Invariant: size() is never negative, and an empty stack has size 0.
     * push: afterwards the stack is not empty, and top() is the pushed object.
     * top: the stack is not empty. Asking an empty stack is a failure.
     * removeTop: the stack is not empty, and size drops by one.
     * pop is a command built from the queries: it returns the old top and removes it.
     * isEmpty is a query derived from size.
     */
    interface Stack<T> {
        void push(T obj);
        T top();
        void removeTop();
        int size();

        // Exercise 1. Derived query: empty means the size is 0.
        default boolean isEmpty() {
            return size() == 0;
        }

        // Exercise 2. pop is top, then removeTop. Separate the query from the command.
        default T pop() {
            T value = top();
            removeTop();
            return value;
        }
    }

    // A finished stack you can read. The exercises below reuse it.
    static final class ListStack<T> implements Stack<T> {
        private final ArrayList<T> items = new ArrayList<>();

        public void push(T obj) {
            if (obj == null) throw new IllegalArgumentException("push rejects null");
            items.add(obj);
        }

        public T top() {
            if (size() == 0) throw new IllegalStateException("top of an empty stack");
            return items.get(items.size() - 1);
        }

        public void removeTop() {
            if (size() == 0) throw new IllegalStateException("removeTop of an empty stack");
            items.remove(items.size() - 1);
        }

        public int size() {
            return items.size();
        }
    }

    static final class Cow {
        final String name;
        final int age;
        Cow(String name, int age) {
            this.name = name;
            this.age = age;
        }
    }

    // Exercise 3.
    // A generic method. <T> is the type of this call, chosen by the compiler
    // from the arguments. Walk the list and return the element that compares
    // as the greatest. Comparator.compare returns a positive number when the
    // first argument is greater.
    static <T> T maxOf(List<T> items, Comparator<T> order) {
        if (items.isEmpty()) throw new IllegalArgumentException("empty");
        T best = items.get(0);
        for (int i = 1; i < items.size(); i++) {
            if (order.compare(items.get(i), best) > 0) best = items.get(i);
        }
        return best;
    }

    // Exercise 4.
    // A lambda is an anonymous class with one method, written without the
    // class boilerplate. (a, b) -> expression  is a Comparator.
    // Older cows compare as smaller. Return a negative number when a is younger.
    static Comparator<Cow> byAge() {
        return (a, b) -> a.age - b.age;
    }

    // Exercise 5.
    // Every object has a Class, the runtime description of its type.
    // obj.getClass().getName() is the full name, such as java.lang.String.
    static String classNameOf(Object obj) {
        return obj.getClass().getName();
    }

    // Exercise 6 and 7.
    // Preconditions are the caller's job to meet, and the method rejects a call
    // that breaks them. Postcondition of deposit: balance grows by amount.
    // Precondition of withdraw: amount is positive and the balance can cover it.
    static final class Account {
        private int balance;

        Account(int balance) {
            this.balance = balance;
        }

        int balance() {
            return balance;
        }

        void deposit(int amount) {
            if (amount <= 0) throw new IllegalArgumentException("amount must be positive");
            balance += amount;
        }

        void withdraw(int amount) {
            if (amount <= 0 || amount > balance) {
                throw new IllegalArgumentException("amount is not allowed");
            }
            balance -= amount;
        }
    }

    // Exercise 8.
    // NumberFormatException is unchecked. Catch it and return -1 when text
    // is not an integer. "42" returns 42. "nope" returns -1.
    static int parseOrMinusOne(String text) {
        try {
            return Integer.parseInt(text);
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    static final class Door implements AutoCloseable {
        boolean closed;

        public void close() {
            closed = true;
        }
    }

    // Exercise 9.
    // try-with-resources calls close() when the block ends, including when
    // the block throws. Declare the door in the try parentheses, throw
    // IllegalStateException inside, catch it, and return whether close() ran.
    static boolean closesOnFailure() {
        Door door = new Door();
        try (door) {
            throw new IllegalStateException("boom");
        } catch (IllegalStateException ex) {
            return door.closed;
        }
    }

    // Exercise 10. FileNotFoundException is a condition a careful program
    // anticipates. Return "checked" or "unchecked".
    static String fileNotFoundKind() {
        return "checked";
    }

    // Exercise 11. ArithmeticException extends RuntimeException.
    // Return "checked" or "unchecked".
    static String arithmeticKind() {
        return "unchecked";
    }

    // Exercise 12.
    // try-with-resources: the body throws, then close() throws too.
    // The exception from close() is attached, and the body's exception
    // is the one that propagates. Return "suppressed".
    static String closeFailureIs() {
        return "suppressed";
    }

    public static void main(String[] args) {
        System.out.println("""
============================================================
PS5 — Generics, contracts, lambdas, exceptions
Slides: materials/sessions/SPL_PS5.pptx
============================================================

A generic type carries its element type with it. Stack<Cow> accepts a
Cow and returns a Cow. The compiler rejects a String. One piece of
code still serves every element type.

A default method is a method with a body, written in the interface.
isEmpty can be written from size(), so every stack gets it for free.
pop can be written from top() and removeTop().

A lambda fits where an interface has a single abstract method:

    (a, b) -> a.age - b.age

Class objects describe types at run time. "hi".getClass().getName()
is java.lang.String.

Design by contract uses three words:
    precondition   true on the way in
    postcondition  true on the way out
    invariant      true between calls, and just after construction

Separate commands (they change something) from queries (they answer).
isEmpty is a basic query. top is a derived query: it uses isEmpty
to decide that an empty stack has no top.

Unchecked exceptions extend RuntimeException. The compiler does not
make you catch them. Checked exceptions are part of the method's
type: the method says throws, or the caller uses try/catch.

finally runs on the way out of try/catch, including after return.
try-with-resources is the form that closes an AutoCloseable for you.
If the body and close() both throw, the close exception is suppressed.

""");

        Stack<String> demo = new ListStack<>();
        demo.push("first");
        demo.push("second");
        read("ListStack top is " + demo.top() + ", size is " + demo.size());

        StringBuilder trace = new StringBuilder();
        try {
            trace.append("try ");
            throw new IllegalStateException("x");
        } catch (IllegalStateException ex) {
            trace.append("catch ");
        } finally {
            trace.append("finally");
        }
        read("block order: " + trace);

        System.out.println("\nExercises");
        Score score = new Score();

        check(score, "1. isEmpty — derived from size", () -> {
            Stack<String> stack = new ListStack<>();
            expectTrue("a new stack is empty", stack.isEmpty());
            stack.push("a");
            expectTrue("after push it is not empty", !stack.isEmpty());
        });
        check(score, "2. pop — return the top, then remove it", () -> {
            Stack<String> stack = new ListStack<>();
            stack.push("a");
            stack.push("b");
            expectEq("first pop", stack.pop(), "b");
            expectEq("second pop", stack.pop(), "a");
            expectTrue("empty again", stack.isEmpty());
            boolean threw = false;
            try {
                stack.pop();
            } catch (IllegalStateException ex) {
                threw = true;
            }
            expectTrue("pop on an empty stack fails", threw);
        });
        check(score, "3. maxOf — generic method plus a Comparator", () -> {
            int max = maxOf(List.of(3, 1, 4, 2), (a, b) -> a - b);
            expectEq("max int", max, 4);
        });
        check(score, "4. byAge — a lambda Comparator", () -> {
            Cow calf = new Cow("calf", 1);
            Cow elder = new Cow("elder", 9);
            Cow mid = new Cow("mid", 4);
            Cow eldest = maxOf(List.of(calf, mid, elder), byAge());
            expectEq("eldest", eldest.name, "elder");
            expectEq("age order", byAge().compare(elder, calf) > 0, true);
        });
        check(score, "5. classNameOf — the Class object", () -> {
            expectEq("String", classNameOf("hi"), "java.lang.String");
            expectEq("Cow", classNameOf(new Cow("a", 1)), PS05_GenericsDbc_solution.class.getName() + "$Cow");
        });
        check(score, "6. deposit — reject a non-positive amount", () -> {
            Account account = new Account(10);
            account.deposit(5);
            expectEq("balance", account.balance(), 15);
            boolean threw = false;
            try {
                account.deposit(0);
            } catch (IllegalArgumentException ex) {
                threw = true;
            }
            expectTrue("zero is rejected", threw);
            expectEq("balance unchanged", account.balance(), 15);
        });
        check(score, "7. withdraw — the balance has to cover the amount", () -> {
            Account account = new Account(10);
            account.withdraw(4);
            expectEq("balance", account.balance(), 6);
            boolean threw = false;
            try {
                account.withdraw(7);
            } catch (IllegalArgumentException ex) {
                threw = true;
            }
            expectTrue("overdraft is rejected", threw);
            expectEq("balance unchanged", account.balance(), 6);
        });
        check(score, "8. parseOrMinusOne — catch NumberFormatException", () -> {
            expectEq("number", parseOrMinusOne("42"), 42);
            expectEq("word", parseOrMinusOne("nope"), -1);
        });
        check(score, "9. closesOnFailure — try-with-resources", () -> {
            expectEq("closed", closesOnFailure(), true);
        });
        check(score, "10. FileNotFoundException is checked", () -> {
            expectEq("kind", fileNotFoundKind(), "checked");
        });
        check(score, "11. ArithmeticException is unchecked", () -> {
            expectEq("kind", arithmeticKind(), "unchecked");
        });
        check(score, "12. a second failure from close() is suppressed", () -> {
            expectEq("word", closeFailureIs(), "suppressed");
        });

        System.exit(score.finish());
    }
}
