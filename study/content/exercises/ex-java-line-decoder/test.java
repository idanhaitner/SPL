class Main {
    static java.util.List<String> feed(LineDecoder decoder, String text) {
        java.util.List<String> messages = new java.util.ArrayList<>();
        for (byte b : text.getBytes(java.nio.charset.StandardCharsets.UTF_8)) {
            String message = decoder.decodeNextByte(b);
            if (message != null) {
                messages.add(message);
            }
        }
        return messages;
    }

    public static void main(String[] args) {
        Check.test("waits for the newline", () -> {
            LineDecoder decoder = new LineDecoder();
            Check.eq(decoder.decodeNextByte((byte) 'h'), null, "the result after 'h'");
            Check.eq(decoder.decodeNextByte((byte) 'i'), null, "the result after 'i'");
            Check.eq(decoder.decodeNextByte((byte) '\n'), "hi", "the result after the newline");
        });
        Check.test("the second message starts empty", () -> {
            Check.eq(feed(new LineDecoder(), "one\ntwo\nthree\n"), java.util.List.of("one", "two", "three"), "the messages found");
        });
        Check.test("an empty line", () -> {
            Check.eq(feed(new LineDecoder(), "a\n\nb\n"), java.util.List.of("a", "", "b"), "the messages found");
        });
        Check.test("encode adds the newline", () -> {
            Check.eq(new String(new LineDecoder().encode("hey"), java.nio.charset.StandardCharsets.UTF_8), "hey\n", "the encoded message");
        });
    }
}
