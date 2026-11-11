class Tank {
    final int id;
    private final int capacity;
    private int level;

    Tank(int id, int capacity, int level) {
        this.id = id;
        this.capacity = capacity;
        this.level = level;
    }

    int level() {
        return level;
    }

    boolean hasRoom(int n) {
        return level + n <= capacity;
    }

    void fill(int n) {
        level = level + n;
    }

    void drain(int n) {
        level = level - n;
    }
}

class Pump {
    static Tank[] lockOrder(Tank a, Tank b) {
        return a.id <= b.id ? new Tank[] { a, b } : new Tank[] { b, a };
    }

    static boolean transfer(Tank from, Tank to, int n) {
        Tank[] order = lockOrder(from, to);
        synchronized (order[0]) {
            synchronized (order[1]) {
                if (n < 0 || from.level() < n || !to.hasRoom(n)) {
                    return false;
                }
                from.drain(n);
                to.fill(n);
                return true;
            }
        }
    }
}
