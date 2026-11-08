class Mailbox<T> {
    private T message;

    synchronized void put(T msg) throws InterruptedException {
        while (message != null) {
            wait();
        }
        message = msg;
        notifyAll();
    }

    synchronized T take() throws InterruptedException {
        while (message == null) {
            wait();
        }
        T result = message;
        message = null;
        notifyAll();
        return result;
    }

    synchronized boolean isEmpty() {
        return message == null;
    }
}
