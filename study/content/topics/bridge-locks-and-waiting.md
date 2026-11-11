---
id: bridge-locks-and-waiting
title: "Review: locks and waiting"
kind: bridge
reviews: [synchronization, waiting-and-liveness]
blurb: "A look back at synchronization and waiting: which lock makes a contract hold, how a thread waits for a precondition, and how threads get stuck."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
---

The last two chapters gave you the tools for the problems you met earlier: locks that turn several steps into one, and a way for a thread to wait until an object is ready for it. This review uses them on the same tank and the same contract, and closes the concurrency part of the course.

```java
class Tank {
    private int level = 0;
    private final int capacity;

    Tank(int capacity) { this.capacity = capacity; }

    // @inv 0 <= level() <= capacity
    public synchronized int level() { return level; }
    public synchronized boolean hasRoom(int n) { return level + n <= capacity; }

    // @pre n >= 0 && hasRoom(n)
    public synchronized void fill(int n) { level = level + n; }
}
```

## One lock, one step

- **`synchronized (o) { ... }` is a critical section.** Only the thread that holds the lock of `o` runs inside it. Any other thread that wants the same lock is blocked until it is released. See [Synchronization](topic:synchronization).
- **A `synchronized` method locks `this`** for the whole method.
- **Protocol A, full synchronization:** every access to a field, reads included, happens while holding the object's lock.
- **Protocol B:** groups of methods that touch different fields can each have a lock of their own. **Protocol C:** an operation that touches several objects uses one lock that stands for all of them.
- **A lock protects one critical section, not a sequence of them.** Two calls to synchronized methods are two critical sections, and another thread can run between them.
- **An immutable object needs no lock.** Its fields are `private final`, its class is `final`, and a command returns a new object.

:::problem id=br5-two-safe-calls title="Two safe calls, one unsafe pair" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Every method of the `Tank` above is `synchronized`. Two threads share one tank of capacity 8, and each runs:

```java
if (tank.hasRoom(5)) {
    tank.fill(5);
}
```

:::check id=br5-two-safe-calls-q1
Follow the two threads.

While thread A is inside `fill`, thread B's call to `hasRoom` {{=is blocked until A leaves fill|runs at once|throws an exception}}.

Between A's `hasRoom` returning and A's `fill` starting, the lock of the tank is {{=free, so B can run hasRoom|still held by A}}.

So both threads {{=can see room and both fill, reaching level 10|cannot both pass the check}}.

That final state {{=breaks the invariant of the tank|is a legal state of the tank}}.

- **Each method is one critical section.** Inside `fill`, the read, the add, and the write are now one step, so no update is lost.
- **The `if` is two critical sections.** The lock is released in between, so the check-then-act race from [Safety and correctness](topic:design-by-contract) is still there.
- **The precondition of `fill` was true when it was checked** and false when `fill` ran.
:::

:::check id=br5-two-safe-calls-q2
Which changes make the check and the fill one step?

- [x] The caller wraps the `if` in `synchronized (tank) { ... }`.
- [x] `Tank` gets a method `public synchronized boolean tryFill(int n)` that checks the room and fills, and the caller uses it instead.
- [ ] The caller wraps the `if` in `synchronized (this) { ... }`, where `this` is the caller's own task object.
- [ ] `hasRoom` is made unsynchronized, so that it never has to wait.

- **The lock must be the one the tank's methods use,** which is the tank itself. Then no other thread can enter any of the tank's methods between the check and the fill.
- **Each thread has its own task object,** so `synchronized (this)` in the task gives each thread a different lock, and they exclude nobody.
- **An unsynchronized read** breaks protocol A: a thread could read `level` while another is changing it.
:::
:::

## Waiting for the precondition

- **A method whose precondition is false has three choices:** throw an exception, try again in a loop (busy waiting, which wastes the processor), or wait. See [Waiting and liveness](topic:waiting-and-liveness).
- **`o.wait()` releases the lock of `o` and blocks the thread** until another thread calls `o.notifyAll()`. Before `wait` returns, the thread takes the lock again.
- **Both are called while holding the lock of `o`,** on the same object whose lock protects the condition.
- **The pattern has four parts,** and each one prevents a bug.

```java
synchronized (o) {
    while (!preCondition())
        o.wait();
    // change the state
    o.notifyAll();
}
```

| Part | Without it |
| --- | --- |
| `while`, not `if` | A woken thread goes on without rechecking, after another thread already used what it was waiting for |
| Check and action in one block | Another thread changes the object between the check and the action |
| Check and `wait` in one block | The wake-up arrives between the check and the `wait`, and is missed |
| `notifyAll`, not `notify` | The one thread that is woken may be one that cannot go on |

:::problem id=br5-drain-that-waits title="A drain that waits" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Tank` gets a `drain` that waits for water instead of failing, and `fill` now announces the change.

```java
public synchronized void drain(int n) throws InterruptedException {
    if (level < n)
        wait();
    level = level - n;
}

public synchronized void fill(int n) {
    level = level + n;
    notifyAll();
}
```

The tank is empty. Threads T2 and T3 each call `drain(5)`, and both wait. Then T1 calls `fill(5)`.

:::check id=br5-drain-that-waits-q1
Follow the three threads.

While T2 is inside `wait`, the lock of the tank is {{=free, so T3 and T1 can enter synchronized methods|held by T2, so nobody else can enter}}.

`notifyAll` in `fill` wakes {{=both T2 and T3|only T2|whichever thread waited first}}.

T2 takes the lock first and drains. The level is now {{=0|5|-5}}.

T3 then takes the lock, and because of the `if`, it {{=goes on without checking again and drains|checks again and waits}}.

The level is now {{=-5, which breaks the invariant|0|5}}.

- **`wait` releases the lock.** Otherwise no thread could ever get in to change the condition.
- **Both waiters wake, one at a time.** Each must take the lock back before it returns from `wait`.
- **With `if`, a woken thread trusts a check it made long ago.** The run is no longer safe: `level()` is negative.
:::

:::check id=br5-drain-that-waits-q2
Which single change makes `drain` correct?

- [x] Replace `if (level < n)` with `while (level < n)`.
- [ ] Replace `notifyAll()` in `fill` with `notify()`.
- [ ] Remove `synchronized` from `drain`, so that waiting threads do not hold up the tank.
- [ ] Move `wait()` after `level = level - n;`.

- **`while` rechecks the precondition** every time the thread wakes, while holding the lock. T3 finds the tank empty again and goes back to waiting.
- **`notify`** would wake only one of the two, which happens to work here but is not the cause of the bug, and it fails in other cases.
- **Without `synchronized`,** `wait()` throws `IllegalMonitorStateException`, and the check and the action are no longer one step.
:::

:::check id=br5-drain-that-waits-q3
`drain` also needs a `notifyAll()` of its own after it changes the level. Who is it for?

- [ ] Nobody. Only `fill` can make a waiting thread's condition true.
- [x] A thread that waits in a `fill` that blocks while the tank has no room.
- [ ] The thread that called `drain`, so that it wakes itself.
- [ ] The main thread.

Every method that changes the state may have made some other thread's precondition true. Draining makes room, and a `fill` written to wait for room is waiting for exactly that.
:::
:::

## When threads stop making progress

- **Safety says nothing bad happens. Liveness says something good eventually happens.** A program can keep every invariant and still be stuck.
- **Deadlock:** a group of threads is blocked, and only threads of the same group could release them.
- **Deadlock on locks:** T1 holds lock X and wants Y, while T2 holds Y and wants X. **The standard fix is resource ordering:** every thread takes the locks in the same global order, so a cycle cannot form.
- **Deadlock on preconditions:** every thread is in `wait()`, for a condition that only another waiting thread could make true.
- **Starvation:** one thread never gets its turn while the others keep going. **Livelock:** threads keep running and reacting to each other, and nothing gets done.

:::problem id=br5-two-pumps title="Two pumps, two tanks" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`move` pumps water from one tank to another, and needs both tanks to stay still while it works.

```java
static void move(Tank from, Tank to, int n) {
    synchronized (from) {
        synchronized (to) {
            if (from.level() >= n && to.hasRoom(n)) {
                from.drain(n);
                to.fill(n);
            }
        }
    }
}
```

Thread T1 runs `move(a, b, 5)` while thread T2 runs `move(b, a, 5)`.

:::check id=br5-two-pumps-q1
T1 takes its first lock, and then T2 takes its first lock. What happens next?

T1 holds the lock of {{=a|b}} and is blocked waiting for {{=b|a}}.

T2 holds the lock of {{=b|a}} and is blocked waiting for {{=a|b}}.

This is a {{=deadlock|starvation|livelock|race condition}}.

During it, the invariants of `a` and `b` {{=both hold, so the run is still safe|are broken}}.

- **A cycle of two:** each thread holds what the other needs, and neither will let go.
- **Nothing illegal has happened to any object.** No water moved. The failure is one of liveness, not of safety.
:::

:::check id=br5-two-pumps-q2
Which changes prevent the deadlock and keep `move` correct?

- [x] Lock the two tanks in a fixed global order, for example the one with the smaller `System.identityHashCode` first, whatever the order of the parameters.
- [x] Use one shared lock object for every `move` in the program.
- [ ] Remove the inner `synchronized (to)`.
- [ ] Swap the two `synchronized` lines, so that `to` is locked first.

- **Resource ordering:** if both threads lock the same tank first, the second thread waits while holding nothing, and the first one finishes.
- **One lock for both** is protocol C. It is correct, but two pumps on four unrelated tanks would now wait for each other.
- **Dropping the lock on `to`** lets another thread change `to` between `hasRoom` and `fill`.
- **Swapping the lines** only swaps which thread takes which lock. The cycle is still there.
:::
:::
