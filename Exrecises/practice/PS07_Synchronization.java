/*
 * SPL practice — PS7, synchronization and liveness
 * Slides: Exrecises/SPL_PS7.pptx
 *
 * Fill in every NotImplemented, then run the file again. A finished copy is in solutions/PS07_Synchronization_solution.java — try before you open it.
 *
 * From this folder:
 *   javac PS07_Synchronization.java && java PS07_Synchronization
 *
 * The queue test gives up after a few seconds if a wait() never wakes,
 * so a first attempt cannot freeze the program forever.
 */

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class PS07_Synchronization {
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


    // Exercise 1.
    // synchronized on a method locks `this` for the whole call.
    // Two increments can no longer interleave their read-add-write.
    static final class Counter {
        private int count;

                void increment() {
            throw new NotImplemented("Counter.increment");
        }
        
                int get() {
            throw new NotImplemented("Counter.get");
        }
            }

    // Exercise 2.
    // AtomicInteger.incrementAndGet() is one atomic step, built on
    // compare-and-set. No synchronized keyword in this class.
    static final class AtomicCounter {
        private final AtomicInteger count = new AtomicInteger();

        void increment() {
            throw new NotImplemented("AtomicCounter.increment");
        }

        int get() {
            throw new NotImplemented("AtomicCounter.get");
        }
    }

    // Exercise 3.
    // An immutable object publishes its state in the constructor and then
    // never changes it. moved() returns a new point. x and y stay as they were.
    static final class FrozenPoint {
        private final int x;
        private final int y;

        FrozenPoint(int x, int y) {
            this.x = x;
            this.y = y;
        }

        int x() { return x; }
        int y() { return y; }

        FrozenPoint moved(int dx, int dy) {
            throw new NotImplemented("FrozenPoint.moved");
        }
    }

    // Exercise 4.
    // The list handed to the constructor, and the list returned to a caller,
    // are both mutable. Copy on the way in and copy on the way out, so a
    // caller cannot change the roster's own list.
    static final class Roster {
        private final List<String> names;

        Roster(List<String> incoming) {
            throw new NotImplemented("Roster constructor");
        }

        List<String> names() {
            throw new NotImplemented("Roster.names");
        }
    }

    // Exercise 5.
    // put waits while the queue is full. take waits while it is empty.
    // wait() and notifyAll() belong to the same monitor as the method,
    // which is why the methods are synchronized. Use while, so a wakeup
    // that was not meant for you goes back to sleep.
    static final class SimpleQueue<E> {
        private final java.util.ArrayDeque<E> items = new java.util.ArrayDeque<>();
        private final int capacity;

        SimpleQueue(int capacity) {
            this.capacity = capacity;
        }

        synchronized void put(E value) throws InterruptedException {
            throw new NotImplemented("SimpleQueue.put");
        }

        synchronized E take() throws InterruptedException {
            throw new NotImplemented("SimpleQueue.take");
        }
    }

    // Exercise 6.
    // The Escape example calls out.readEscape(this) before x = 7.
    // The other object therefore observes x at its default. Return that value.
    static int valueSeenDuringConstruction() {
        throw new NotImplemented("escape");
    }

    // Exercise 7.
    // A write to a volatile field is visible to the next read in another thread.
    // Return "volatile".
    static String visibilityKeyword() {
        throw new NotImplemented("volatile");
    }

    // Exercise 8. t1 holds A and waits for B. t2 holds B and waits for A.
    // Return "deadlock", "starvation", or "livelock".
    static String nestedLocks() {
        throw new NotImplemented("deadlock");
    }

    // Exercise 9. The thread is runnable, and it keeps reacting to the other
    // thread, so the work itself never starts. Return "livelock".
    static String tooPolite() {
        throw new NotImplemented("livelock");
    }

    // Exercise 10. Other threads keep grabbing the lock, so this one rarely
    // enters. Return "starvation".
    static String neverMyTurn() {
        throw new NotImplemented("starvation");
    }

    static void hammer(Counter counter, int times) throws InterruptedException {
        Thread[] threads = new Thread[8];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int n = 0; n < times; n++) counter.increment();
            });
            threads[i].setDaemon(true);
            threads[i].start();
        }
        for (Thread thread : threads) thread.join();
    }

    static void hammer(AtomicCounter counter, int times) throws InterruptedException {
        Thread[] threads = new Thread[8];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int n = 0; n < times; n++) counter.increment();
            });
            threads[i].setDaemon(true);
            threads[i].start();
        }
        for (Thread thread : threads) thread.join();
    }

    public static void main(String[] args) {
        System.out.println("""
============================================================
PS7 — Synchronization and liveness
Slides: Exrecises/SPL_PS7.pptx
============================================================

If only one thread can ever reach a variable, it needs no lock.
That is thread confinement. A local variable that is not published
is confined.

An immutable object is safe to share for reading. The usual shape:
fields are final, the class is final, and the constructor does not
hand `this` to anyone. A final field is fixed; the object it points
at can still change, unless you copy that object on the way in and
on the way out.

synchronized (the method, or a block on a lock object) makes one
thread the only thread inside that region. The region is the
critical section. A synchronized method locks `this`.

volatile is the small tool: each read and write of that field is
visible across threads. It does not make count++ atomic.

AtomicInteger does. incrementAndGet loops on compare-and-set: read
the current value, compute the next, and publish it only if nobody
else published in between.

A guarded method waits until a condition is true.
    busy-wait     keep checking
    sleep-check   check, sleep, check
    wait/notify   sleep inside the monitor until another thread signals

wait() releases the monitor. It belongs in a while loop, on the same
object you synchronized on. notifyAll() wakes every waiter.

Liveness is the program's ability to keep making progress.
    deadlock     threads stuck, each waiting for a lock the other holds
    starvation   a thread rarely gets the resource
    livelock     threads are moving, and the work still does not happen

""");

        read("synchronized, a private lock, and AtomicInteger are three ways to publish a counter");

        System.out.println("\nExercises");
        Score score = new Score();

        check(score, "1. Counter — synchronized increment and get", () -> {
            Counter counter = new Counter();
            counter.increment();
            expectEq("one", counter.get(), 1);
            hammer(counter, 2000);
            expectEq("8 threads x 2000", counter.get(), 1 + 8 * 2000);
        });
        check(score, "2. AtomicCounter — incrementAndGet", () -> {
            AtomicCounter counter = new AtomicCounter();
            counter.increment();
            expectEq("one", counter.get(), 1);
            hammer(counter, 2000);
            expectEq("8 threads plus the first", counter.get(), 1 + 8 * 2000);
        });
        check(score, "3. FrozenPoint.moved — return a new point", () -> {
            FrozenPoint start = new FrozenPoint(1, 2);
            FrozenPoint next = start.moved(3, 4);
            expectEq("old x", start.x(), 1);
            expectEq("new x", next.x(), 4);
            expectEq("new y", next.y(), 6);
        });
        check(score, "4. Roster — copy the list in, and copy it out", () -> {
            List<String> incoming = new ArrayList<>();
            incoming.add("Shaked");
            Roster roster = new Roster(incoming);
            incoming.add("Matan");
            expectEq("constructor copied", roster.names(), List.of("Shaked"));
            roster.names().add("Linoy");
            expectEq("getter copied", roster.names(), List.of("Shaked"));
        });
        check(score, "5. SimpleQueue — wait while full, wait while empty", () -> {
            Thread watchdog = new Thread(() -> {
                try {
                    Thread.sleep(3000);
                    System.err.println("blocking queue test is stuck; giving up");
                    Runtime.getRuntime().halt(2);
                } catch (InterruptedException ignored) {
                    // the test finished
                }
            });
            watchdog.setDaemon(true);
            watchdog.start();
            try {
                SimpleQueue<Integer> queue = new SimpleQueue<>(1);
                queue.put(1);
                Thread producer = new Thread(() -> {
                    try {
                        queue.put(2);
                    } catch (InterruptedException ex) {
                        throw new RuntimeException(ex);
                    }
                });
                producer.setDaemon(true);
                producer.start();
                Thread.sleep(80);
                expectTrue("the second put waits while the queue is full", producer.isAlive());
                expectEq("first out", queue.take(), 1);
                producer.join(1000);
                expectTrue("the producer woke up", !producer.isAlive());
                expectEq("second out", queue.take(), 2);
            } finally {
                watchdog.interrupt();
            }
        });
        check(score, "6. this escapes before the constructor assigns x", () -> {
            expectEq("seen value", valueSeenDuringConstruction(), 0);
        });
        check(score, "7. the keyword that publishes a field to other threads", () -> {
            expectEq("keyword", visibilityKeyword(), "volatile");
        });
        check(score, "8. each thread holds the lock the other needs", () -> {
            expectEq("name", nestedLocks(), "deadlock");
        });
        check(score, "9. both threads keep reacting and neither works", () -> {
            expectEq("name", tooPolite(), "livelock");
        });
        check(score, "10. one thread rarely enters the critical section", () -> {
            expectEq("name", neverMyTurn(), "starvation");
        });

        System.exit(score.finish());
    }
}
