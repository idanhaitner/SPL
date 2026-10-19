/*
 * SPL practice — PS6, threads and concurrency
 * Slides: Exrecises/PS6-2026-1.pptx
 *
 * Completed answers for PS06_Threads.java. Try that file on your own first, then compare.
 *
 * From this folder:
 *   javac PS06_Threads.java && java PS06_Threads
 */

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

public class PS06_Threads_solution {
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


    interface Callback {
        void call(String message);
    }

    // Exercise 1.
    // A callback is a piece of work you hand to someone else. In Java that
    // piece of work is an object with one method. Call cb with the text "done".
    static void finish(Callback callback) {
        callback.call("done");
    }

    // Exercise 2.
    // A lambda may read a local variable when that variable is final, or
    // never assigned again after it is initialized (effectively final).
    // The loop variable i changes every iteration, so copy it:
    //     int index = i;
    // Start n threads. Thread k stores k into ids[k]. Join every thread
    // before you return, so the array is finished when the caller sees it.
    static int[] threadIds(int n) throws InterruptedException {
        int[] ids = new int[n];
        Thread[] threads = new Thread[n];
        for (int i = 0; i < n; i++) {
            int index = i;
            threads[i] = new Thread(() -> ids[index] = index);
            threads[i].start();
        }
        for (Thread thread : threads) thread.join();
        return ids;
    }

    // Exercise 3.
    // Split data into numThreads contiguous chunks. The last chunk runs
    // through the end of the array, so a leftover element is included.
    // Each thread writes its sum into its own slot of partial. After every
    // join, add the slots up and divide by data.length.
    //   arrAverage(new int[]{1, 2, 3, 4}, 2) is 2.5
    static double arrAverage(int[] data, int numThreads) throws InterruptedException {
        Thread[] threads = new Thread[numThreads];
        long[] partial = new long[numThreads];
        int chunk = data.length / numThreads;
        for (int i = 0; i < numThreads; i++) {
            int index = i;
            int start = i * chunk;
            int end = (i == numThreads - 1) ? data.length : start + chunk;
            threads[i] = new Thread(() -> {
                long sum = 0;
                for (int j = start; j < end; j++) sum += data[j];
                partial[index] = sum;
            });
            threads[i].start();
        }
        long total = 0;
        for (int i = 0; i < numThreads; i++) {
            threads[i].join();
            total += partial[i];
        }
        return total / (double) data.length;
    }

    // Exercise 4.
    // ExecutorService runs tasks on a fixed set of threads that get reused.
    // shutdown() refuses new tasks. awaitTermination waits until the ones
    // you already submitted are finished. Add every element into an
    // AtomicInteger from a pool of 3 threads, and return the total.
    static int sumWithPool(int[] data) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        AtomicInteger total = new AtomicInteger();
        for (int value : data) {
            int item = value;
            pool.execute(() -> total.addAndGet(item));
        }
        pool.shutdown();
        if (!pool.awaitTermination(2, TimeUnit.SECONDS)) {
            pool.shutdownNow();
            throw new RuntimeException("pool did not finish");
        }
        return total.get();
    }

    // Exercise 5.
    // Two threads both execute count++. count++ is three steps: read, add,
    // write. Both threads can read 0, and both can write 1.
    // The object does not crash. The number can still be wrong.
    // Return "safe-but-not-correct", "correct", or "deadlock".
    static String sharedCounterRace() {
        return "safe-but-not-correct";
    }

    // Exercise 6.
    // In arrAverage each thread writes a different slot, and the main
    // thread joins before it reads any slot. Return "correct" or
    // "safe-but-not-correct".
    static String averageVerdict() {
        return "correct";
    }

    // Exercise 7.
    // Why does the loop copy i into index before building the lambda?
    // Return "effectively-final".
    static String whyCopyTheLoopIndex() {
        return "effectively-final";
    }

    public static void main(String[] args) throws Exception {
        System.out.println("""
============================================================
PS6 — Threads, callbacks, and safety
Slides: Exrecises/PS6-2026-1.pptx
============================================================

A thread is a second stream of execution inside the same process.
Threads share the heap. A local variable in a method is private to
the call that created it.

Two ways to describe the work:

    class PrimeThread extends Thread {
        public void run() { /* the work */ }
    }
    new PrimeThread().start();

    Runnable work = () -> { /* the work */ };
    new Thread(work).start();

start() is the call that creates the new stream. run() alone would
do the work on the current thread.

join() waits until that thread's run() returns.

An ExecutorService is a pool. You submit work; the pool decides which
thread runs it. shutdown() means "no more submissions".

A lambda can capture a local variable that is never written again.
Copy the loop index:

    int index = i;

count++ on a field looks like one step and runs as three. Two threads
can both read the same number. The program keeps running, and the
result can still be short. The slides call that safe, and not correct.

A shared object is anything more than one thread can reach: a field,
a static, an array you handed to both. A local variable that never
escapes is private to its thread.

""");

        int[] box = {0};
        Thread worker = new Thread(() -> box[0] = 42);
        worker.start();
        worker.join();
        read("after join, the thread's write is visible: " + box[0]);

        System.out.println("\nExercises");
        Score score = new Score();

        check(score, "1. finish — call the callback", () -> {
            StringBuilder seen = new StringBuilder();
            finish(seen::append);
            expectEq("message", seen.toString(), "done");
        });
        check(score, "2. threadIds — one thread per index, then join", () -> {
            expectArray("ids", threadIds(4), new int[]{0, 1, 2, 3});
        });
        check(score, "3. arrAverage — partial sums, then join", () -> {
            expectNear("even split", arrAverage(new int[]{1, 2, 3, 4}, 2), 2.5);
            expectNear("leftover element", arrAverage(new int[]{1, 2, 3, 4, 5}, 2), 3.0);
            expectNear("one thread", arrAverage(new int[]{8}, 1), 8.0);
        });
        check(score, "4. sumWithPool — a fixed pool of 3", () -> {
            expectEq("sum", sumWithPool(new int[]{1, 2, 3, 4, 5}), 15);
        });
        check(score, "5. two threads calling count++", () -> {
            expectEq("verdict", sharedCounterRace(), "safe-but-not-correct");
        });
        check(score, "6. the average function from the slides", () -> {
            expectEq("verdict", averageVerdict(), "correct");
        });
        check(score, "7. why the loop copies i into index", () -> {
            expectEq("reason", whyCopyTheLoopIndex(), "effectively-final");
        });

        System.exit(score.finish());
    }
}
