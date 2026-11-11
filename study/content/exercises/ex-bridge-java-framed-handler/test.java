class Main {
    static byte[] frames(String... messages) {
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        for (String message : messages) {
            byte[] text = message.getBytes(java.nio.charset.StandardCharsets.UTF_8);
            out.write(text.length);
            out.write(text, 0, text.length);
        }
        return out.toByteArray();
    }

    static byte[] slice(byte[] all, int from, int to) {
        return java.util.Arrays.copyOfRange(all, from, to);
    }

    public static void main(String[] args) {
        Check.test("encode puts the length first", () -> {
            byte[] framed = new FrameCodec().encode("hi");
            Check.eq(java.util.Arrays.toString(framed), "[2, 104, 105]", "encode(\"hi\") as bytes");
        });
        Check.test("encode of the empty message", () -> {
            Check.eq(java.util.Arrays.toString(new FrameCodec().encode("")), "[0]", "encode(\"\") as bytes");
        });
        Check.test("decode returns null until the last byte", () -> {
            FrameCodec codec = new FrameCodec();
            Check.eq(codec.decodeNextByte((byte) 2), null, "decodeNextByte on the length byte 2");
            Check.eq(codec.decodeNextByte((byte) 'h'), null, "decodeNextByte on the first of two text bytes");
            Check.eq(codec.decodeNextByte((byte) 'i'), "hi", "decodeNextByte on the last text byte");
        });
        Check.test("decode is ready for the next message", () -> {
            FrameCodec codec = new FrameCodec();
            String first = null;
            String second = null;
            for (byte next : frames("get", "add 12")) {
                String message = codec.decodeNextByte(next);
                if (message != null && first == null) {
                    first = message;
                } else if (message != null) {
                    second = message;
                }
            }
            Check.eq(first, "get", "the first decoded message");
            Check.eq(second, "add 12", "the second decoded message");
        });
        Check.test("an empty message is complete at its length byte", () -> {
            FrameCodec codec = new FrameCodec();
            Check.eq(codec.decodeNextByte((byte) 0), "", "decodeNextByte on the length byte 0");
            Check.eq(codec.decodeNextByte((byte) 1), null, "decodeNextByte on the next length byte");
            Check.eq(codec.decodeNextByte((byte) 'x'), "x", "decodeNextByte on the text byte after it");
        });
        Check.test("decode what encode wrote", () -> {
            FrameCodec codec = new FrameCodec();
            String decoded = null;
            for (byte next : codec.encode("add 7")) {
                decoded = codec.decodeNextByte(next);
            }
            Check.eq(decoded, "add 7", "the message decoded from encode(\"add 7\")");
        });
        Check.test("feed handles several messages in one chunk", () -> {
            Handler handler = new Handler(new FrameCodec(), new CounterProtocol());
            Check.eq(handler.feed(frames("add 5", "get", "add 2", "get")), java.util.Arrays.asList("5", "7"), "the replies to add 5, get, add 2, get");
        });
        Check.test("feed keeps a message that is split between chunks", () -> {
            Handler handler = new Handler(new FrameCodec(), new CounterProtocol());
            byte[] all = frames("add 40", "get");
            Check.eq(handler.feed(slice(all, 0, 4)), java.util.Arrays.asList(), "the replies after the first four bytes");
            Check.eq(handler.feed(slice(all, 4, 8)), java.util.Arrays.asList(), "the replies after the next four bytes, which end inside get's frame");
            Check.eq(handler.feed(slice(all, 8, all.length)), java.util.Arrays.asList("40"), "the replies after the last bytes");
        });
        Check.test("feed stops after bye", () -> {
            CounterProtocol protocol = new CounterProtocol();
            Handler handler = new Handler(new FrameCodec(), protocol);
            Check.eq(handler.feed(frames("add 1", "bye", "add 100", "get")), java.util.Arrays.asList("goodbye"), "the replies to add 1, bye, add 100, get");
            Check.isTrue(protocol.shouldTerminate(), "the protocol should be finished after bye");
            Check.eq(handler.feed(frames("get")), java.util.Arrays.asList(), "the replies to a chunk that arrives after bye");
        });
        Check.test("two clients do not share a decoder", () -> {
            Handler first = new Handler(new FrameCodec(), new CounterProtocol());
            Handler second = new Handler(new FrameCodec(), new CounterProtocol());
            byte[] a = frames("add 3", "get");
            byte[] b = frames("add 9", "get");
            first.feed(slice(a, 0, 3));
            second.feed(slice(b, 0, 5));
            Check.eq(first.feed(slice(a, 3, a.length)), java.util.Arrays.asList("3"), "the first client's reply");
            Check.eq(second.feed(slice(b, 5, b.length)), java.util.Arrays.asList("9"), "the second client's reply");
        });
    }
}
