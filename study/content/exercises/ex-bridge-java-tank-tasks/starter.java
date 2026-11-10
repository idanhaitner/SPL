class Tank {
    private int level = 0;
    private final int capacity;

    Tank(int capacity) {
        this.capacity = capacity;
    }

    int level() {
        return level;
    }

    boolean hasRoom(int n) {
        return level + n <= capacity;
    }

    void fill(int n) {
    }
}

class FillTask implements Runnable {
    private final Tank tank;
    private final int amount;
    private final int times;

    FillTask(Tank tank, int amount, int times) {
        this.tank = tank;
        this.amount = amount;
        this.times = times;
    }

    public void run() {
    }
}

class Filler {
    static Runnable[] tasksFor(Tank[] tanks, int amount, int times) {
        return new Runnable[0];
    }

    static int total(Tank[] tanks) {
        return 0;
    }
}
