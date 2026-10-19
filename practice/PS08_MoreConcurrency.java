/*
 * SPL practice — PS8, more concurrency
 * Slides: materials/sessions/SPL_PS8.pptx
 *
 * Fill in every NotImplemented, then run the file again. A finished copy is in solutions/PS08_MoreConcurrency_solution.java — try before you open it.
 *
 * From this folder:
 *   javac PS08_MoreConcurrency.java && java PS08_MoreConcurrency
 */

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

public class PS08_MoreConcurrency {
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


    static final class CasCounter {
        private final AtomicInteger count = new AtomicInteger();

        // Exercise 1.
        // compareAndSet(current, next) publishes next only when the field
        // is still current. Loop until that succeeds. This is incrementAndGet,
        // written out by hand.
        void increment() {
            throw new NotImplemented("CasCounter.increment");
        }

        int get() {
            return count.get();
        }
    }

    static final class Pair {
        final int first;
        final int second;
        Pair(int first, int second) {
            this.first = first;
            this.second = second;
        }
    }

    // Exercise 2.
    // The two numbers move together. Wrap them in one object and swap the
    // reference with compareAndSet, so a reader never sees a half-updated pair.
    static final class AtomicPair {
        private final AtomicReference<Pair> ref = new AtomicReference<>(new Pair(0, 0));

        void addToFirst(int delta) {
            throw new NotImplemented("AtomicPair.addToFirst");
        }

        Pair get() {
            return ref.get();
        }
    }

    // Exercise 3.
    // The holder class is loaded the first time getInstance() mentions it.
    // Class initialization runs once, and the static field is published safely.
    // Return the single Config.
    static final class Config {
        private Config() {}

        private static class Holder {
            static final Config INSTANCE = new Config();
        }

        static Config getInstance() {
            throw new NotImplemented("Config.getInstance");
        }
    }

    // Exercise 4.
    // Double-checked locking publishes the instance safely only when the
    // field is volatile. Return "volatile".
    static String doubleCheckedLockingNeeds() {
        throw new NotImplemented("volatile");
    }

    // Exercise 5.
    // An eager singleton builds the instance while the class is loaded,
    // even if nobody asks for it. Return "eager".
    static String createdDuringClassLoading() {
        throw new NotImplemented("eager");
    }

    // Exercise 6.
    // Callable returns a value. submit gives you a Future. get() waits for
    // that value. Split the array in half, submit two callables, and add
    // the two futures.
    static int sumCallable(int[] data) throws Exception {
        throw new NotImplemented("sumCallable");
    }

    // Exercise 7.
    // Thread.stop() is unsafe. interrupt() raises a flag. If the thread is
    // inside sleep or wait, it wakes with InterruptedException.
    static void requestStop(Thread worker) {
        throw new NotImplemented("requestStop");
    }

    // Exercise 8.
    // Return "interrupt" — the cancellation tool from this session.
    static String safeCancellationTool() {
        throw new NotImplemented("interrupt");
    }

    public static void main(String[] args) {
        System.out.println("""
============================================================
PS8 — More concurrency
Slides: materials/sessions/SPL_PS8.pptx
============================================================

compare-and-set is one atomic step: "if the field is still this value,
store that value". A counter can be built from it with no lock. Under
contention the loser of the race loops and tries again.

AtomicReference applies the same idea to a whole object. A Pair with
two ints is replaced in one step, so no reader observes a new first
next to an old second.

A singleton is one instance with a global way to reach it.
    eager          the instance is built when the class loads
    locking        getInstance is synchronized, so every call may wait
    holder class   the nested class is loaded on the first call, once

Double-checked locking needs volatile. Without it, another thread can
see the reference before the constructor's writes are visible.

Callable is Runnable that returns a value. Future.get() waits for it.
An ExecutorService.submit(callable) hands you that Future.

Cancellation: Thread.stop() is unsafe. interrupt() sets a flag. sleep
and wait throw InterruptedException when the flag is raised, and
throwing it clears the flag.

""");

        read("AtomicInteger is the library form of the compare-and-set loop");

        System.out.println("\nExercises");
        Score score = new Score();

        check(score, "1. CasCounter — a compare-and-set loop", () -> {
            CasCounter counter = new CasCounter();
            counter.increment();
            expectEq("one", counter.get(), 1);
            Thread[] threads = new Thread[8];
            for (int i = 0; i < threads.length; i++) {
                threads[i] = new Thread(() -> {
                    for (int n = 0; n < 2000; n++) counter.increment();
                });
                threads[i].setDaemon(true);
                threads[i].start();
            }
            for (Thread thread : threads) thread.join();
            expectEq("total", counter.get(), 1 + 8 * 2000);
        });
        check(score, "2. AtomicPair — publish both fields together", () -> {
            AtomicPair pair = new AtomicPair();
            pair.addToFirst(2);
            expectEq("first", pair.get().first, 2);
            expectEq("second stays 0", pair.get().second, 0);
            Thread[] threads = new Thread[4];
            for (int i = 0; i < threads.length; i++) {
                threads[i] = new Thread(() -> {
                    for (int n = 0; n < 250; n++) pair.addToFirst(1);
                });
                threads[i].setDaemon(true);
                threads[i].start();
            }
            for (Thread thread : threads) thread.join();
            expectEq("added", pair.get().first, 2 + 4 * 250);
        });
        check(score, "3. Config — the holder-class singleton", () -> {
            Config first = Config.getInstance();
            expectTrue("same instance", first == Config.getInstance());
            Config[] seen = new Config[2];
            Thread a = new Thread(() -> seen[0] = Config.getInstance());
            Thread b = new Thread(() -> seen[1] = Config.getInstance());
            a.setDaemon(true);
            b.setDaemon(true);
            a.start();
            b.start();
            a.join();
            b.join();
            expectTrue("threads share it", seen[0] == first && seen[1] == first);
        });
        check(score, "4. double-checked locking needs volatile", () -> {
            expectEq("keyword", doubleCheckedLockingNeeds(), "volatile");
        });
        check(score, "5. a singleton built while the class loads", () -> {
            expectEq("kind", createdDuringClassLoading(), "eager");
        });
        check(score, "6. sumCallable — Future.get waits for the result", () -> {
            expectEq("sum", sumCallable(new int[]{1, 2, 3, 4, 5}), 15);
        });
        check(score, "7. requestStop — interrupt a sleeping thread", () -> {
            java.util.concurrent.atomic.AtomicBoolean saw = new java.util.concurrent.atomic.AtomicBoolean();
            Thread worker = new Thread(() -> {
                try {
                    Thread.sleep(30_000);
                } catch (InterruptedException ex) {
                    saw.set(true);
                }
            });
            worker.setDaemon(true);
            worker.start();
            requestStop(worker);
            worker.join(1000);
            expectTrue("the sleeper woke up", saw.get());
        });
        check(score, "8. the cancellation tool to use", () -> {
            expectEq("tool", safeCancellationTool(), "interrupt");
        });

        System.exit(score.finish());
    }
}
