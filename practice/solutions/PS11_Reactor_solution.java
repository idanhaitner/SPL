/*
 * SPL practice — PS11, the reactor
 * Slides: materials/sessions/SPL_PS11.pptx
 *
 * Completed answers for PS11_Reactor.java. Try that file on your own first, then compare.
 *
 * From this folder:
 *   javac PS11_Reactor.java && java PS11_Reactor
 */

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class PS11_Reactor_solution {
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


    static final int OP_READ = 1;
    static final int OP_WRITE = 4;
    static final int OP_ACCEPT = 16;

    // Exercise 1.
    // The selector stores interest as bits that do not overlap.
    // OR combines them. 1 | 4 is 5, which means "read or write".
    static int readAndWrite() {
        return OP_READ | OP_WRITE;
    }

    // Exercise 2.
    // A ready operation is present when the matching bit is set.
    // (ops & flag) != 0 is the test. Return whether flag is set in ops.
    static boolean wants(int ops, int flag) {
        return (ops & flag) != 0;
    }

    // Exercise 3 and 4.
    // The connection is not a thread. The IO thread calls onBytes when the
    // channel can be read, and interest() to decide what to ask the selector
    // for next. OP_WRITE is included only while a reply is waiting. Asking
    // for write all the time would wake the selector constantly, because a
    // TCP socket is usually ready to write.
    static final class Connection {
        private final StringBuilder incoming = new StringBuilder();
        private final ArrayDeque<String> writes = new ArrayDeque<>();

        void onBytes(String chunk) {
            incoming.append(chunk);
            int newline;
            while ((newline = incoming.indexOf("\n")) >= 0) {
                String line = incoming.substring(0, newline);
                incoming.delete(0, newline + 1);
                writes.addLast(line);
            }
        }

        int interest() {
            int ops = OP_READ;
            if (!writes.isEmpty()) ops |= OP_WRITE;
            return ops;
        }

        String pollWrite() {
            return writes.pollFirst();
        }
    }

    // Exercise 5.
    // Tasks for one client have to run in the order they arrived. A plain
    // pool may run the second message first. An actor queues them and
    // drains that queue itself, first in, first out.
    static final class Actor {
        private final ArrayDeque<Runnable> queue = new ArrayDeque<>();

        void submit(Runnable task) {
            queue.addLast(task);
        }

        void drain() {
            while (!queue.isEmpty()) queue.removeFirst().run();
        }
    }

    // Exercise 6.
    // A read lock can be held by many threads. A write lock is exclusive:
    // no other reader and no other writer. Unlock in finally so a throw
    // does not keep the lock.
    static final class Scoreboard {
        private int value;
        private final ReentrantReadWriteLock rw = new ReentrantReadWriteLock();

        int read() {
            rw.readLock().lock();
            try {
                return value;
            } finally {
                rw.readLock().unlock();
            }
        }

        void write(int next) {
            rw.writeLock().lock();
            try {
                value = next;
            } finally {
                rw.writeLock().unlock();
            }
        }
    }

    // Exercise 7.
    // One thread accepts and does the IO. A fixed pool runs the protocol.
    // Return "reactor".
    static String oneIoThreadPattern() {
        return "reactor";
    }

    public static void main(String[] args) {
        System.out.println("""
============================================================
PS11 — The reactor
Slides: materials/sessions/SPL_PS11.pptx
============================================================

A thread per client spends most of its time blocked in read, and it
costs a stack per connection. The reactor keeps one thread for the
network: accept, read, write. A fixed pool of workers runs the
protocol, and each worker handles many clients over time.

Non-blocking read returns whatever bytes are already here, often zero.
A Selector waits until one of the registered channels is ready, then
you touch only that channel.

Registration says which events you care about, and can attach the
connection object so the event hands it back. The events are bits:

    OP_READ    1
    OP_WRITE   4
    OP_ACCEPT  16

OR combines them. AND tests one of them.

Include OP_WRITE only when the connection has bytes waiting to go out.

The actor pool is the part that keeps one client's messages in order.
Two tasks for the same client must not run side by side, and the
second must not pass the first. Each client has a queue. The pool
runs that queue to the end before another task for that client starts.

A ReadWriteLock lets many readers in together. A writer waits until
the readers leave, and readers wait while a writer holds the lock.

""");

        read("OP_READ | OP_WRITE is " + (OP_READ | OP_WRITE) + ", and that value still has the read bit set: "
            + ((5 & OP_READ) != 0));

        System.out.println("\nExercises");
        Score score = new Score();

        check(score, "1. readAndWrite — OR the two interest bits", () -> {
            expectEq("bits", readAndWrite(), OP_READ | OP_WRITE);
        });
        check(score, "2. wants — test a single bit", () -> {
            int ops = OP_READ | OP_ACCEPT;
            expectEq("read", wants(ops, OP_READ), true);
            expectEq("write", wants(ops, OP_WRITE), false);
            expectEq("accept", wants(ops, OP_ACCEPT), true);
        });
        check(score, "3. interest — OP_WRITE only while a reply is queued", () -> {
            Connection connection = new Connection();
            expectEq("idle", connection.interest(), OP_READ);
        });
        check(score, "4. onBytes — a newline becomes a queued line", () -> {
            Connection connection = new Connection();
            connection.onBytes("hel");
            expectEq("no line yet", connection.pollWrite(), null);
            expectEq("still only read", connection.interest(), OP_READ);
            connection.onBytes("lo\nthere\n");
            expectEq("first line", connection.pollWrite(), "hello");
            expectEq("second line", connection.pollWrite(), "there");
            expectEq("write interest dropped", connection.interest(), OP_READ);
        });
        check(score, "5. Actor — drain in submission order", () -> {
            Actor actor = new Actor();
            List<Integer> seen = new ArrayList<>();
            actor.submit(() -> seen.add(1));
            actor.submit(() -> seen.add(2));
            actor.submit(() -> seen.add(3));
            expectTrue("nothing runs before drain", seen.isEmpty());
            actor.drain();
            expectEq("order", seen, List.of(1, 2, 3));
        });
        check(score, "6. Scoreboard — read lock and write lock", () -> {
            Scoreboard board = new Scoreboard();
            board.write(5);
            expectEq("read", board.read(), 5);
            Thread[] readers = new Thread[4];
            int[] got = new int[4];
            for (int i = 0; i < readers.length; i++) {
                int index = i;
                readers[i] = new Thread(() -> got[index] = board.read());
                readers[i].setDaemon(true);
                readers[i].start();
            }
            for (Thread reader : readers) reader.join();
            for (int value : got) expectEq("concurrent read", value, 5);
            board.write(9);
            expectEq("updated", board.read(), 9);
        });
        check(score, "7. the pattern with one network thread", () -> {
            expectEq("name", oneIoThreadPattern(), "reactor");
        });

        System.exit(score.finish());
    }
}
