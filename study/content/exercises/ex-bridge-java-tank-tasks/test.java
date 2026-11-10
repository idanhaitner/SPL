class SpyTank extends Tank {
    volatile Thread filledBy = null;

    SpyTank(int capacity) {
        super(capacity);
    }

    void fill(int n) {
        filledBy = Thread.currentThread();
        super.fill(n);
    }
}

class Main {
    public static void main(String[] args) {
        Check.test("fill adds to the level", () -> {
            Tank tank = new Tank(10);
            tank.fill(4);
            tank.fill(0);
            tank.fill(6);
            Check.eq(tank.level(), 10, "level() after fills of 4, 0 and 6");
        });
        Check.test("constructor rejects a negative capacity", () -> {
            Check.throwsA(IllegalArgumentException.class, () -> new Tank(-1), "new Tank(-1) should be rejected");
        });
        Check.test("fill rejects an overflow and changes nothing", () -> {
            Tank tank = new Tank(5);
            tank.fill(3);
            Check.throwsA(IllegalArgumentException.class, () -> tank.fill(3), "fill(3) with room for only 2 should be rejected");
            Check.eq(tank.level(), 3, "level() after the rejected fill");
        });
        Check.test("fill rejects a negative amount", () -> {
            Tank tank = new Tank(5);
            tank.fill(3);
            Check.throwsA(IllegalArgumentException.class, () -> tank.fill(-1), "fill(-1) should be rejected");
            Check.eq(tank.level(), 3, "level() after the rejected fill");
        });
        Check.test("task fills the given number of times", () -> {
            Tank tank = new Tank(100);
            new FillTask(tank, 3, 4).run();
            Check.eq(tank.level(), 12, "level() after a task of 4 fills of 3");
        });
        Check.test("task stops when there is no room", () -> {
            Tank tank = new Tank(10);
            new FillTask(tank, 3, 5).run();
            Check.eq(tank.level(), 9, "level() of a tank of 10 after a task of 5 fills of 3");
        });
        Check.test("fillAll returns the sum of the levels", () -> {
            Tank[] tanks = { new Tank(10), new Tank(4), new Tank(100) };
            Check.eq(Filler.fillAll(tanks, 2, 3), 16, "fillAll over tanks of 10, 4 and 100 with 3 fills of 2");
            Check.eq(tanks[0].level(), 6, "level() of the tank of 10");
            Check.eq(tanks[1].level(), 4, "level() of the tank of 4");
            Check.eq(tanks[2].level(), 6, "level() of the tank of 100");
        });
        Check.test("fillAll runs each task on a new thread", () -> {
            SpyTank first = new SpyTank(10);
            SpyTank second = new SpyTank(10);
            Filler.fillAll(new Tank[] { first, second }, 1, 2);
            Check.isTrue(first.filledBy != null && second.filledBy != null, "each tank should have been filled");
            Check.isTrue(first.filledBy != Thread.currentThread() && second.filledBy != Thread.currentThread(), "the tasks ran on the calling thread: use start(), not run()");
            Check.isTrue(first.filledBy != second.filledBy, "each tank should be filled by a thread of its own");
        });
        Check.test("fillAll waits for every thread", () -> {
            SpyTank first = new SpyTank(1000);
            SpyTank second = new SpyTank(1000);
            Filler.fillAll(new Tank[] { first, second }, 1, 1000);
            Check.isTrue(!first.filledBy.isAlive() && !second.filledBy.isAlive(), "fillAll returned while a thread was still running: join every thread");
            Check.eq(first.level() + second.level(), 2000, "the sum of the levels once both threads have finished");
        });
        Check.test("fillAll with no tanks", () -> {
            Check.eq(Filler.fillAll(new Tank[0], 5, 5), 0, "fillAll over no tanks");
        });
    }
}
