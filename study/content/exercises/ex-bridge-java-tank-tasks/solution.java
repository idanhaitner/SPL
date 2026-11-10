class Tank {
    private int level = 0;
    private final int capacity;

    Tank(int capacity) {
        if (capacity < 0) {
            throw new IllegalArgumentException("capacity < 0");
        }
        this.capacity = capacity;
    }

    int level() {
        return level;
    }

    boolean hasRoom(int n) {
        return level + n <= capacity;
    }

    void fill(int n) {
        if (n < 0 || !hasRoom(n)) {
            throw new IllegalArgumentException("fill breaks its precondition");
        }
        level = level + n;
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
        for (int i = 0; i < times; i++) {
            if (!tank.hasRoom(amount)) {
                return;
            }
            tank.fill(amount);
        }
    }
}

class Filler {
    static Runnable[] tasksFor(Tank[] tanks, int amount, int times) {
        Runnable[] tasks = new Runnable[tanks.length];
        for (int i = 0; i < tanks.length; i++) {
            tasks[i] = new FillTask(tanks[i], amount, times);
        }
        return tasks;
    }

    static int total(Tank[] tanks) {
        int sum = 0;
        for (int i = 0; i < tanks.length; i++) {
            sum = sum + tanks[i].level();
        }
        return sum;
    }
}
