/*
 * SPL practice — PS10, thread-per-client, buffers, STOMP
 * Slides: Exrecises/SPL_PS10.pptx
 *
 * The C++ half of this session is PS10_CppThreads.cpp.
 *
 * Fill in every NotImplemented, then run the file again. A finished copy is in solutions/PS10_NioAndStomp_solution.java — try before you open it.
 *
 * From this folder:
 *   javac PS10_NioAndStomp.java && java PS10_NioAndStomp
 */

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

public class PS10_NioAndStomp {
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


    // Exercise 1 and 2.
    // Messages arrive one byte at a time. A newline finishes a message.
    // decodeNextByte returns the message without the newline, or null when
    // the message is still incomplete. encode puts the newline back.
    static final class LineEncDec {
        private final java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream();

        String decodeNextByte(byte next) {
            throw new NotImplemented("LineEncDec.decodeNextByte");
        }

        byte[] encode(String message) {
            throw new NotImplemented("LineEncDec.encode");
        }
    }

    // Exercise 3.
    // A ByteBuffer has position, limit, and capacity, with
    // 0 <= position <= limit <= capacity.
    // After you put bytes, flip() sets the limit to the current position
    // and the position back to 0, so a following get reads what you wrote.
    // Put 'H' and 'i', flip, and return the text you read back.
    static String flipAndRead() {
        throw new NotImplemented("flipAndRead");
    }

    // Exercise 4.
    // One connection, one thread: read a line with LineEncDec, uppercase it,
    // and encode it back. incoming includes the newline.
    //   handleOneLine("hello\n") returns "HELLO\n"
    static String handleOneLine(byte[] incoming) {
        throw new NotImplemented("handleOneLine");
    }

    // STOMP frame, as the slides draw it:
    //   COMMAND\n
    //   header:value\n
    //   \n
    //   body\0
    static String commandOf(String frame) {
        throw new NotImplemented("commandOf");
    }

    static String headerOf(String frame, String key) {
        throw new NotImplemented("headerOf");
    }

    static String bodyOf(String frame) {
        throw new NotImplemented("bodyOf");
    }

    // Exercise 8.
    // Blocking accept/read is why the simple server starts a thread per client.
    // Return "thread-per-client".
    static String blockingServerShape() {
        throw new NotImplemented("tpc");
    }

    public static void main(String[] args) {
        System.out.println("""
============================================================
PS10 — Thread-per-client, buffers, and STOMP
Slides: Exrecises/SPL_PS10.pptx
============================================================

accept() and read() block. A server that does both on one thread can
talk to one client at a time. The thread-per-client shape accepts a
socket and hands it to a new thread with its own encoder and its own
protocol object.

Java NIO adds channels and buffers so a thread can ask "is anything
ready?" instead of waiting inside read().

    ByteBuffer buf = ByteBuffer.allocate(1024);
    buf.put(aByte);     // position moves forward
    buf.flip();         // limit = position, position = 0
    buf.get();          // reads what was written

A STOMP frame is text:

    COMMAND
    header:value
    <blank line>
    body<NUL>

CONNECT / CONNECTED start a session. SUBSCRIBE names a destination.
SEND carries a body. The server turns that into MESSAGE frames for
subscribers. DISCONNECT with a receipt header gets a RECEIPT back.
ERROR describes a frame the server refused.

C++ threads, mutex, and lock_guard are in PS10_CppThreads.cpp.

""");

        ByteBuffer picture = ByteBuffer.allocate(8);
        picture.put((byte) 'A');
        read("after put, position=" + picture.position() + " limit=" + picture.limit());
        picture.flip();
        read("after flip, position=" + picture.position() + " limit=" + picture.limit());

        System.out.println("\nExercises");
        Score score = new Score();
        String frame = "SEND\ndestination:/topic/a\n\nhello\0";

        check(score, "1. decodeNextByte — a newline finishes the message", () -> {
            LineEncDec codec = new LineEncDec();
            expectEq("incomplete", codec.decodeNextByte((byte) 'h'), null);
            expectEq("still incomplete", codec.decodeNextByte((byte) 'i'), null);
            expectEq("message", codec.decodeNextByte((byte) '\n'), "hi");
            expectEq("next message", codec.decodeNextByte((byte) '\n'), "");
        });
        check(score, "2. encode — put the newline back", () -> {
            String encoded = new String(new LineEncDec().encode("hi"), StandardCharsets.UTF_8);
            expectEq("bytes", encoded, "hi\n");
        });
        check(score, "3. flipAndRead — flip between writing and reading", () -> {
            expectEq("text", flipAndRead(), "Hi");
        });
        check(score, "4. handleOneLine — the body of a connection thread", () -> {
            String reply = handleOneLine("hello\n".getBytes(StandardCharsets.UTF_8));
            expectEq("reply", reply, "HELLO\n");
        });
        check(score, "5. commandOf — the first line of a STOMP frame", () -> {
            expectEq("command", commandOf(frame), "SEND");
        });
        check(score, "6. headerOf — key:value before the blank line", () -> {
            expectEq("destination", headerOf(frame, "destination"), "/topic/a");
            expectEq("missing", headerOf(frame, "receipt"), null);
        });
        check(score, "7. bodyOf — after the blank line, before NUL", () -> {
            expectEq("body", bodyOf(frame), "hello");
        });
        check(score, "8. the blocking server gives each client a thread", () -> {
            expectEq("shape", blockingServerShape(), "thread-per-client");
        });

        System.exit(score.finish());
    }
}
