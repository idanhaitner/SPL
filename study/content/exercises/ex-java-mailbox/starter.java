class Mailbox<T> {
    private T message;

    synchronized void put(T msg) throws InterruptedException {
    }

    synchronized T take() throws InterruptedException {
        return null;
    }

    synchronized boolean isEmpty() {
        return message == null;
    }
}
