/*
 * SPL practice — PS9, Java sockets
 * Slides: materials/sessions/PS9 2026.pptx
 *
 * Completed answers for PS09_Sockets.java. Try that file on your own first, then compare.
 *
 * From this folder:
 *   javac PS09_Sockets.java && java PS09_Sockets
 */

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

public class PS09_Sockets_solution {
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


    // Exercise 1. TCP is the session, the stream of bytes, the reliable one.
    // Return "TCP" or "UDP".
    static String reliableStreamProtocol() {
        return "TCP";
    }

    // Exercise 2. UDP sends a datagram without a prior connection.
    // Return "TCP" or "UDP".
    static String connectionlessProtocol() {
        return "UDP";
    }

    // Exercise 3.
    // A socket address is an IP plus a port. 127.0.0.1 is the machine
    // talking to itself. Return "127.0.0.1".
    static String loopbackAddress() {
        return "127.0.0.1";
    }

    // Exercise 4.
    // Both sides have to agree on the character set. Encode text as UTF-8
    // and return how many bytes that encoding uses.
    // 'A' is 1 byte. The Hebrew letter alef, א, is 2 bytes.
    static int utf8Size(String text) {
        return text.getBytes(StandardCharsets.UTF_8).length;
    }

    // Exercise 5.
    // The protocol object is separate from the socket. "bye" ends the
    // session. Anything else is echoed. A null response would mean
    // "send nothing"; this protocol always answers.
    static final class EchoProtocol {
        private int seen;

        String processMessage(String message) {
            seen++;
            if (isEnd(message)) return "Ok, bye bye...";
            return message;
        }

        boolean isEnd(String message) {
            return "bye".equals(message);
        }

        int seen() {
            return seen;
        }
    }

    // Exercise 6.
    // Open a TCP socket to host:port, write one line, read one line, close.
    // PrintWriter's second argument `true` turns on auto-flush, so println
    // actually leaves the process. Name the charset on both streams.
    static String sendLine(String host, int port, String line) throws IOException {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 1000);
            socket.setSoTimeout(1000);
            PrintWriter out = new PrintWriter(
                new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8), true);
            BufferedReader in = new BufferedReader(
                new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            out.println(line);
            return in.readLine();
        }
    }

    // Exercise 7.
    // An HTTP/1.0 request is a command line, headers, and a blank line.
    // Lines end with CR LF. Build GET / for the given host.
    static String httpGet(String host) {
        return "GET / HTTP/1.0\r\n" + "Host: " + host + "\r\n" + "\r\n";
    }

    public static void main(String[] args) throws Exception {
        System.out.println("""
============================================================
PS9 — Java sockets
Slides: materials/sessions/PS9 2026.pptx
============================================================

A server offers a service. A client uses it. A host is a machine on
the network. A port is a number from 0 to 65535 that picks which
service on that host you mean. A socket is one end of a connection.
Its address is an IP plus a port, such as 127.0.0.1:80.

TCP is a session: two sides, a stream of bytes, and the network
retransmits what gets lost. UDP sends a datagram and does not set
up a session first.

Characters are not bytes. UTF-8 is the encoding these sessions use.
Only the byte values 0 through 127 mean the same thing in every
common encoding. Wrap the socket's raw bytes:

    new BufferedReader(new InputStreamReader(socket.getInputStream(), "UTF-8"))
    new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), "UTF-8"), true)

The server creates a ServerSocket and accept() waits for one client.
The client creates a Socket to the host and port. A protocol object
decides what the reply means, so the socket code stays the same when
the conversation changes.

""");

        read("loopback is this machine. A real client and server can both be here.");

        System.out.println("\nExercises");
        Score score = new Score();

        check(score, "1. the reliable stream protocol", () -> {
            expectEq("name", reliableStreamProtocol(), "TCP");
        });
        check(score, "2. the connectionless protocol", () -> {
            expectEq("name", connectionlessProtocol(), "UDP");
        });
        check(score, "3. the loopback address", () -> {
            expectEq("address", loopbackAddress(), "127.0.0.1");
        });
        check(score, "4. utf8Size — bytes, not characters", () -> {
            expectEq("A", utf8Size("A"), 1);
            expectEq("alef", utf8Size("א"), 2);
            expectEq("two letters", utf8Size("אב"), 4);
        });
        check(score, "5. EchoProtocol — echo, and bye ends it", () -> {
            EchoProtocol protocol = new EchoProtocol();
            expectEq("echo", protocol.processMessage("hi"), "hi");
            expectEq("bye", protocol.processMessage("bye"), "Ok, bye bye...");
            expectTrue("bye is the end", protocol.isEnd("bye"));
            expectTrue("hi is not the end", !protocol.isEnd("hi"));
            expectEq("two messages", protocol.seen(), 2);
        });
        check(score, "6. sendLine — a real socket on this machine", () -> {
            try (ServerSocket server = new ServerSocket(0)) {
                int port = server.getLocalPort();
                Thread acceptor = new Thread(() -> {
                    try (Socket client = server.accept()) {
                        client.setSoTimeout(1000);
                        BufferedReader in = new BufferedReader(new InputStreamReader(
                            client.getInputStream(), StandardCharsets.UTF_8));
                        PrintWriter out = new PrintWriter(new OutputStreamWriter(
                            client.getOutputStream(), StandardCharsets.UTF_8), true);
                        out.println("echo:" + in.readLine());
                    } catch (IOException ignored) {
                        // the client gave up, or the exercise is still empty
                    }
                });
                acceptor.setDaemon(true);
                acceptor.start();
                expectEq("reply", sendLine("127.0.0.1", port, "hi"), "echo:hi");
                acceptor.join(1000);
            }
        });
        check(score, "7. httpGet — request line, Host, blank line", () -> {
            expectEq("request", httpGet("example.com"),
                "GET / HTTP/1.0\r\nHost: example.com\r\n\r\n");
        });

        System.exit(score.finish());
    }
}
