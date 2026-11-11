class SpyTank extends Tank {
    SpyTank other;
    boolean changed = false;
    boolean heldOwnLock = false;
    boolean heldOtherLock = false;
    boolean checkedUnderBothLocks = true;

    SpyTank(int id, int capacity, int level) {
        super(id, capacity, level);
    }

    private void note() {
        changed = true;
        heldOwnLock = Thread.holdsLock(this);
        heldOtherLock = Thread.holdsLock(other);
    }

    int level() {
        if (!(Thread.holdsLock(this) && Thread.holdsLock(other)) && Pump.class.getName().equals(callerClass())) {
            checkedUnderBothLocks = false;
        }
        return super.level();
    }

    private static String callerClass() {
        return new Throwable().getStackTrace()[2].getClassName();
    }

    void fill(int n) {
        note();
        super.fill(n);
    }

    void drain(int n) {
        note();
        super.drain(n);
    }
}

class Main {
    static SpyTank[] pair(int firstId, int firstLevel, int secondId, int secondLevel) {
        SpyTank first = new SpyTank(firstId, 10, firstLevel);
        SpyTank second = new SpyTank(secondId, 10, secondLevel);
        first.other = second;
        second.other = first;
        return new SpyTank[] { first, second };
    }

    public static void main(String[] args) {
        Check.test("lockOrder puts the smaller id first", () -> {
            Tank low = new Tank(3, 10, 0);
            Tank high = new Tank(7, 10, 0);
            Tank[] order = Pump.lockOrder(low, high);
            Check.isTrue(order.length == 2 && order[0] == low && order[1] == high, "lockOrder(id 3, id 7) should be the tank with id 3, then the tank with id 7");
        });
        Check.test("lockOrder ignores the order of its parameters", () -> {
            Tank low = new Tank(3, 10, 0);
            Tank high = new Tank(7, 10, 0);
            Tank[] order = Pump.lockOrder(high, low);
            Check.isTrue(order.length == 2 && order[0] == low && order[1] == high, "lockOrder(id 7, id 3) should still be the tank with id 3 first");
        });
        Check.test("transfer moves the water", () -> {
            Tank from = new Tank(7, 10, 6);
            Tank to = new Tank(3, 10, 0);
            Check.isTrue(Pump.transfer(from, to, 4), "transfer of 4 from a tank holding 6 should return true");
            Check.eq(from.level(), 2, "level() of the source after moving 4 out of 6");
            Check.eq(to.level(), 4, "level() of the target after receiving 4");
        });
        Check.test("transfer fails when the source is short", () -> {
            Tank from = new Tank(1, 10, 3);
            Tank to = new Tank(2, 10, 0);
            Check.isTrue(!Pump.transfer(from, to, 4), "transfer of 4 from a tank holding 3 should return false");
            Check.eq(from.level(), 3, "level() of the source after the failed transfer");
            Check.eq(to.level(), 0, "level() of the target after the failed transfer");
        });
        Check.test("transfer fails when the target has no room", () -> {
            Tank from = new Tank(1, 10, 8);
            Tank to = new Tank(2, 10, 7);
            Check.isTrue(!Pump.transfer(from, to, 4), "transfer of 4 into a tank with room for 3 should return false");
            Check.eq(from.level(), 8, "level() of the source after the failed transfer");
            Check.eq(to.level(), 7, "level() of the target after the failed transfer");
        });
        Check.test("transfer rejects a negative amount", () -> {
            Tank from = new Tank(1, 10, 5);
            Tank to = new Tank(2, 10, 5);
            Check.isTrue(!Pump.transfer(from, to, -2), "transfer of -2 should return false");
            Check.eq(from.level(), 5, "level() of the source after the rejected transfer");
            Check.eq(to.level(), 5, "level() of the target after the rejected transfer");
        });
        Check.test("both locks are held while the water moves", () -> {
            SpyTank[] tanks = pair(5, 6, 2, 0);
            Check.isTrue(Pump.transfer(tanks[0], tanks[1], 4), "transfer of 4 from a tank holding 6 should return true");
            Check.isTrue(tanks[0].changed && tanks[1].changed, "transfer should drain the source and fill the target");
            Check.isTrue(tanks[0].heldOwnLock && tanks[0].heldOtherLock, "the source was drained without holding both tanks' locks");
            Check.isTrue(tanks[1].heldOwnLock && tanks[1].heldOtherLock, "the target was filled without holding both tanks' locks");
        });
        Check.test("the check happens under both locks", () -> {
            SpyTank[] tanks = pair(5, 6, 2, 0);
            Pump.transfer(tanks[0], tanks[1], 4);
            Check.isTrue(tanks[0].checkedUnderBothLocks, "transfer read the source's level before it held both locks, so the check and the move are not one step");
        });
        Check.test("locks are released afterwards", () -> {
            SpyTank[] tanks = pair(5, 6, 2, 0);
            Pump.transfer(tanks[0], tanks[1], 4);
            Pump.transfer(tanks[0], tanks[1], 40);
            Check.isTrue(!Thread.holdsLock(tanks[0]) && !Thread.holdsLock(tanks[1]), "transfer should hold no lock after it returns");
        });
    }
}
