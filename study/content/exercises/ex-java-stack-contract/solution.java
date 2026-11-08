import java.util.ArrayList;

class ListStack<T> {
    private final ArrayList<T> items = new ArrayList<>();

    void push(T obj) {
        if (obj == null) {
            throw new IllegalArgumentException("push rejects null");
        }
        items.add(obj);
    }

    T top() {
        if (items.isEmpty()) {
            throw new IllegalStateException("top of an empty stack");
        }
        return items.get(items.size() - 1);
    }

    void removeTop() {
        if (items.isEmpty()) {
            throw new IllegalStateException("removeTop of an empty stack");
        }
        items.remove(items.size() - 1);
    }

    int size() {
        return items.size();
    }
}
