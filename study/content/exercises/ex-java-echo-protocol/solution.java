interface MessagingProtocol<T> {
    T process(T msg);

    boolean shouldTerminate();
}

class EchoProtocol implements MessagingProtocol<String> {
    private boolean terminate = false;

    public String process(String msg) {
        if (msg.equals("bye")) {
            terminate = true;
            return "goodbye";
        }
        return "echo: " + msg;
    }

    public boolean shouldTerminate() {
        return terminate;
    }
}
