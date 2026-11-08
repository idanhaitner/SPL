class Main {
    public static void main(String[] args) {
        Check.test("echoes a message", () -> {
            Check.eq(new EchoProtocol().process("hi"), "echo: hi", "the reply to hi");
        });
        Check.test("stays open before bye", () -> {
            EchoProtocol protocol = new EchoProtocol();
            Check.isTrue(!protocol.shouldTerminate(), "a new protocol should not terminate");
            protocol.process("hi");
            Check.isTrue(!protocol.shouldTerminate(), "shouldTerminate() after an ordinary message");
        });
        Check.test("bye is answered with goodbye", () -> {
            Check.eq(new EchoProtocol().process("bye"), "goodbye", "the reply to bye");
        });
        Check.test("bye ends the conversation", () -> {
            EchoProtocol protocol = new EchoProtocol();
            protocol.process("bye");
            Check.isTrue(protocol.shouldTerminate(), "shouldTerminate() after bye");
        });
        Check.test("only an exact bye counts", () -> {
            EchoProtocol protocol = new EchoProtocol();
            Check.eq(protocol.process("goodbye"), "echo: goodbye", "the reply to goodbye");
            Check.isTrue(!protocol.shouldTerminate(), "goodbye is not bye");
        });
    }
}
