interface MessagingProtocol<T> {
    T process(T msg);

    boolean shouldTerminate();
}

class EchoProtocol implements MessagingProtocol<String> {
    private boolean terminate = false;

    public String process(String msg) {
        return null;
    }

    public boolean shouldTerminate() {
        return terminate;
    }
}
