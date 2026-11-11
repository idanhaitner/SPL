---
id: bridge-threads-and-safety
title: "Review: threads and safe objects"
kind: bridge
reviews: [concurrency, design-by-contract]
blurb: "A look back at threads and at safety and correctness: what two threads share, what a contract promises, and how to judge a concurrent run."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
---

The last two chapters started the concurrency part: one introduced threads, and the other gave you the words to say what a run of threads is allowed to do. This review uses them together, before the next chapter starts fixing the problems.

One class runs through every step: a water tank with a contract.

```java
class Tank {
    private int level = 0;
    private final int capacity;

    Tank(int capacity) { this.capacity = capacity; }

    int level() { return level; }
    boolean hasRoom(int n) { return level + n <= capacity; }

    /**
     * @inv  0 <= level() <= capacity
     * @pre  n >= 0 && hasRoom(n)
     * @post level() == @pre(level()) + n
     */
    void fill(int n) {
        int tmp = level;    // read
        tmp = tmp + n;      // add
        level = tmp;        // write
    }
}
```

## Threads, and what they share

- **A task is a `Runnable`.** Its one method, `run`, is the code a thread will execute. See [Threads](topic:concurrency).
- **`start` makes a new thread. `run` does not.** `new Thread(task).start()` asks for a new thread that runs the task. Calling `task.run()` yourself runs it on the current thread, like any other method.
- **Each thread has its own stack.** Parameters and local variables live there, so no other thread can see them.
- **All threads share the heap and the static variables.** Two threads that hold a reference to the same object read and write the same fields. This is the stack and heap of [The memory model](topic:memory-model), with one stack per thread.
- **The scheduler chooses the interleaving.** Between any two steps of one thread, another thread may run. `join` makes the calling thread wait until the other thread has finished.

:::problem id=br4-what-main-prints title="What can main print?" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`FillTask` fills one tank by 5. Both tasks are given the same tank, whose capacity is 20.

```java
class FillTask implements Runnable {
    private final Tank tank;
    FillTask(Tank tank) { this.tank = tank; }
    public void run() {
        int amount = 5;
        if (tank.hasRoom(amount)) {
            tank.fill(amount);
        }
    }
}

Tank tank = new Tank(20);
Thread a = new Thread(new FillTask(tank));
Thread b = new Thread(new FillTask(tank));
```

:::check id=br4-what-main-prints-q1
Place each piece while both threads are inside `run`.

The `Tank` object, with its `level` and `capacity`, lives {{=on the heap, shared by both threads|on the stack of the main thread|on the stack of each thread}}.

The variable `amount` exists {{=once on each thread's own stack|once, shared by both threads|on the heap}}.

The variable `tmp` inside `fill` exists {{=once on each thread's own stack|once, as part of the Tank|once, shared by both threads}}.

The field `tank` of the two `FillTask` objects holds {{=the same reference in both|two different tanks}}.

Locals and parameters belong to the frame of a call, and each thread has its own stack of frames. Objects made with `new` are on the heap. Both tasks were given a reference to the one `Tank`, so both threads reach the same `level`.
:::

:::check id=br4-what-main-prints-q2
Choose every value that the last line can print in each version of `main`.

`a.run(); b.run(); System.out.println(tank.level());` can print {{=only 10|5 or 10|0, 5, or 10}}.

`a.start(); b.start(); System.out.println(tank.level());` can print {{=0, 5, or 10|only 10|5 or 10}}.

`a.start(); b.start(); a.join(); b.join(); System.out.println(tank.level());` can print {{=5 or 10|only 10|0, 5, or 10}}.

- **`run` called directly** runs both tasks on the main thread, one after the other. It is a serial run, so the result is always 10.
- **`start` without `join`:** the main thread does not wait, so it may print before either thread has written, after one, or after both.
- **`start` with `join`:** both threads have finished, but they may have interleaved inside `fill`. If both read `level` as 0, both write 5, and one fill is lost.
:::
:::

## The contract of an object

- **The invariant** is a condition on the object that holds whenever none of its public methods is running. It defines the object's legal states. See [Safety and correctness](topic:design-by-contract).
- **The precondition** is what the caller must make true before the call. The method may assume it. If it is false, the bug belongs to the caller.
- **The postcondition** is what the method guarantees when it returns, provided the precondition held. If it is false, the bug belongs to the method.
- **A contract is a design decision** about who is responsible. Defensive programming is a run-time check that throws when an input is invalid.

| Clause | Who must make it true | For `fill(n)` |
| --- | --- | --- |
| Precondition | The caller | `n >= 0 && hasRoom(n)` |
| Postcondition | The method | `level() == @pre(level()) + n` |
| Invariant | The class, after every public method | `0 <= level() <= capacity` |

:::problem id=br4-a-contract-for-drain title="A contract for drain" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Tank` gets a new method, `void drain(int n)`, which takes `n` units of water out.

:::check id=br4-a-contract-for-drain-q1
Which precondition and postcondition belong to `drain`?

The precondition is {{=n >= 0 && n <= level()|n >= 0 && hasRoom(n)|level() >= 0}}.

The postcondition is {{=level() == @pre(level()) - n|level() == 0|level() <= capacity}}.

With that precondition, `drain` {{=cannot break the invariant in a serial run|must check the invariant itself before it returns|can leave level() below zero}}.

- **The precondition is what keeps the invariant possible.** If the caller never asks for more water than there is, `level()` cannot go below zero.
- **The postcondition describes the change,** not just a state. `level() <= capacity` is part of the invariant, which is already promised after every method.
:::

:::check id=br4-a-contract-for-drain-q2
In a program with one thread, the code runs `tank.drain(3);` while `level()` is 2, and the tank ends at level -1. Whose bug is it?

- [x] The caller's: it called `drain` without making the precondition true.
- [ ] The method's: it broke its postcondition.
- [ ] The class's: it broke its invariant, so the implementation of `Tank` is wrong.
- [ ] Nobody's: the contract does not cover this call.

- **A false precondition frees the method from its promises.** The method did exactly what its contract says for a legal call.
- **The invariant is broken,** but the cause is outside the class. The contract tells you where to look.
:::
:::

## Safe, correct, or neither

- **A run is safe** if the invariants of all its objects hold throughout the run.
- **A serial run is correct** if every method met its postcondition.
- **A concurrent run is correct** if its result could have come from some serial order of the same calls.
- **A race condition** needs three things: several threads, the same data, and at least one of them writing. `level = level + n` is a read, an add, and a write, and another thread can run between them.
- **Safe does not imply correct.** A lost update can leave every invariant true and still give a result that no serial order gives.

:::problem id=br4-one-tank-two-threads title="One tank, two threads" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Two threads run the `FillTask` from the first question on one shared tank, and `main` joins both. Each thread runs these steps:

```java
if (tank.hasRoom(5)) {   // check
    tank.fill(5);        // act: read, add, write
}
```

:::check id=br4-one-tank-two-threads-q1
The capacity is 20. Both threads check, then both read `level` as 0, then both write 5. Judge the run.

In a serial run, in either order, the final level is {{=10|5|20}}.

The invariant `0 <= level() <= capacity` {{=holds at every moment of this run|is broken during this run}}.

So the run is {{=safe but not correct|safe and correct|neither safe nor correct|correct but not safe}}.

- **Safe:** the level only ever holds 0 or 5, and both are legal states.
- **Not correct:** the set of results that a serial run can give is {10}, and this run ended at 5.
:::

:::check id=br4-one-tank-two-threads-q2
Now the capacity is 8. Thread A checks `hasRoom(5)` and gets true. Thread B checks and gets true. A fills, then B fills. Judge the run.

In a serial run, the second thread's check is {{=false, so the final level is 5|true, so the final level is 10|false, so the final level is 0}}.

In this run the final level is {{=10|5|8}}.

So the run is {{=neither safe nor correct|safe but not correct|safe and correct}}.

- **Serial:** the first thread fills to 5. The second thread finds no room for 5 more and does nothing.
- **Here:** both threads checked before either one wrote, so both saw room. The level reaches 10, above the capacity of 8, so the invariant is broken.
- **Not correct either:** 10 is not a result that any serial order gives.
:::

:::check id=br4-one-tank-two-threads-q3
In the capacity-8 run, thread B called `fill(5)` when there was no room. B did check the precondition first. What went wrong?

- [ ] Nothing. B checked, so the contract was kept.
- [x] The check and the call are two separate steps, and A changed the tank between them, so the precondition was no longer true when `fill` ran.
- [ ] `fill` should have checked the precondition again and thrown an exception.
- [ ] `hasRoom` returned a wrong answer.

- **`hasRoom` told the truth** at the moment it ran.
- **A contract assumes the object does not change between the check and the call.** With one thread that is always so. With two threads on one object, another thread can run in between.
- **The cure is to make check and act one step** that no other thread can split. That is the subject of the next chapter.
:::
:::

:::problem id=br4-a-tank-each title="A tank for each thread" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
No locks yet. Someone suggests changing the design so that the problem cannot happen at all.

:::check id=br4-a-tank-each-q1
Which designs make every run of two filling threads safe and correct?

- [x] Give each thread a `Tank` of its own, `join` both threads, and add the two levels on the main thread.
- [x] Call `a.run()` and then `b.run()` on the main thread, without starting any thread.
- [ ] Keep one shared `Tank`, but copy `tank.level()` into a local variable at the start of `run`.
- [ ] Keep one shared `Tank`, and call `a.join()` right after `b.start()`.

- **No shared object, no race.** With a tank each, every tank is touched by one thread only. The main thread reads the levels after `join`, when both threads are finished.
- **No threads, no race.** The run is serial. It is also no longer concurrent, which may defeat the purpose.
- **A local copy of the level** is exactly what `tmp` already is, and it is the cause of the lost update.
- **`join` after both threads have started** only makes `main` wait. The two threads still interleave with each other.
:::
:::
