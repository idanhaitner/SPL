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
        Check.test("one task per tank, in order", () -> {
            Tank[] tanks = { new Tank(10), new Tank(4), new Tank(100) };
            Runnable[] tasks = Filler.tasksFor(tanks, 2, 3);
            Check.eq(tasks.length, 3, "the number of tasks for three tanks");
            Check.isTrue(tasks[0] instanceof FillTask && tasks[1] instanceof FillTask && tasks[2] instanceof FillTask, "every task should be a FillTask");
            tasks[1].run();
            Check.eq(tanks[0].level(), 0, "level() of the first tank after only the second task ran");
            Check.eq(tanks[1].level(), 4, "level() of the second tank after its task ran");
            Check.eq(tanks[2].level(), 0, "level() of the third tank after only the second task ran");
        });
        Check.test("total adds the levels", () -> {
            Tank[] tanks = { new Tank(10), new Tank(4), new Tank(100) };
            for (Runnable task : Filler.tasksFor(tanks, 2, 3)) {
                task.run();
            }
            Check.eq(Filler.total(tanks), 16, "total over tanks of 10, 4 and 100 after 3 fills of 2 each");
        });
        Check.test("the order of the tasks does not matter", () -> {
            Tank[] tanks = { new Tank(7), new Tank(3), new Tank(50) };
            Runnable[] tasks = Filler.tasksFor(tanks, 3, 4);
            for (int i = tasks.length - 1; i >= 0; i--) {
                tasks[i].run();
            }
            Check.eq(Filler.total(tanks), 21, "total after running the tasks in reverse order (6 + 3 + 12)");
        });
        Check.test("no tanks, no tasks", () -> {
            Check.eq(Filler.tasksFor(new Tank[0], 5, 5).length, 0, "the number of tasks for no tanks");
            Check.eq(Filler.total(new Tank[0]), 0, "total over no tanks");
        });
    }
}
