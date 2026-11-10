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
    static int fillAll(Tank[] tanks, int amount, int times) throws InterruptedException {
        return 0;
    }
}
