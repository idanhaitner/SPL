---
id: concurrency
title: Concurrency
sources:
  - "materials/lectures/Chapter 8 - Concurrency.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/PS6-2026-1.pptx"
  - "materials/sessions/SPL_PS7.pptx"
  - "materials/sessions/SPL_PS8.pptx"
  - "materials/exams/15-a.pdf"
  - "materials/exams/15-a-solution.pdf"
  - "materials/exams/15-b.pdf"
  - "materials/exams/15-b-solution.pdf"
  - "materials/exams/16-b.pdf"
  - "materials/exams/16-b-solution.pdf"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
  - "materials/exams/18-b.pdf"
  - "materials/exams/18-b-solution.pdf"
  - "materials/exams/19-b.pdf"
  - "materials/exams/19-b-solution.pdf"
  - "materials/exams/20-a.pdf"
  - "materials/exams/20-a-solution.pdf"
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
  - "materials/exams/24-b.pdf"
  - "materials/exams/24-b-solution.pdf"
  - "materials/exams/24-c.pdf"
  - "materials/exams/24-c-solution.pdf"
---

In this course, concurrency (מקביליות) is about shared mutable state inside one process. Several threads execute in that process and read and write the same objects on the heap. The run-time environment expects two conditions on those accesses. Safety means a concurrent execution is a serial history (היסטוריה טורית): it is equivalent to some sequential order of the same calls. Liveness means a thread that is ready to run eventually makes progress. Deadlock, livelock, and starvation are the failures of that condition.

A process (תהליך) owns an isolated address space. A thread (חוט) is a sequential flow of execution inside that process. The thread has its own stack. It shares the process heap and the static variables with the other threads.

## The memory model under concurrency

Physical memory (RAM) is a sequence of cells with physical addresses. Virtual memory gives each process a private, contiguous address space. The operating system maps virtual pages to physical frames. Two processes that use the same virtual address share physical memory only when an explicit shared-memory mapping has been set up.

Threads of the same process share the heap and the static variables. Each thread keeps its own call stack.

## Threads in Java

:::definition id=def-thread title="Thread" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A thread is the basic unit of execution inside a process. Each thread has its own call stack. Distinct threads run at the same time on different processor cores, or the scheduler switches from one to another by a context switch.
:::

In Java, the class `Thread` represents one thread of execution. `Runnable` is the task. `Thread.start` begins a new thread: it allocates that thread's stack and then runs the task's `run` on the new thread. A direct call to `run` runs the task on the caller's thread. `join()` waits until that thread's `run` returns.

```java
public class Task implements Runnable {
    private final FileWriter fw;
    public Task(FileWriter fw) { this.fw = fw; }
    public void run() {
        try { fw.write("x"); } catch (IOException e) { throw new RuntimeException(e); }
    }
}

```

Calling `task.run()` runs the body on the current thread. Calling `new Thread(task).start()` runs the same body on a separate thread.

A local variable that lives on one thread's stack is confined to that thread. Only that thread can reach it, so the variable needs no lock. That confinement is called thread confinement.

## Race conditions

A data race (מרוץ) occurs when several threads access a shared location concurrently, at least one of the accesses is a write, and the result depends on the interleaving of the operations.

```java
public void increment() { count++; }

```

The statement `count++` is a read-modify-write of three hardware steps: read the value, add 1, and write the new value. Two threads that both read 0 both write 1, and one increment is lost.

![Two threads both read 0, both add 1, and both write 1, so one increment is lost](../assets/figures/race-interleaving.svg)

:::definition id=def-critical-section title="Critical section and mutual exclusion" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A critical section (אזור קריטי) is a stretch of code that at most one thread may execute at a given moment. Mutual exclusion (מניעה הדדית) is enforced by a lock (a mutex).

In Java, the keyword `synchronized` guards a critical section. A `synchronized` method locks the object `this`. A block `synchronized (obj)` locks the object `obj`.
:::

The keyword `volatile` establishes memory visibility for that variable and limits instruction reordering around the access. After one thread writes the variable, a later read by another thread observes that write. The read takes the value from memory and refreshes any older copy held in a register or a private cache. A compound update such as `count++` becomes atomic when the read, the modification, and the write run as one synchronized action, or as one compare-and-swap.

An immutable object is safe for concurrent use. Its state is fixed after construction, so no thread can observe it in the middle of a change.

### Synchronization, locks, and atomic variables

- **`wait()`, `notify()`, and `notifyAll()`:** These are the basic operations of a Java monitor. The thread that calls `wait()` releases the monitor and waits until another thread calls `notify()` or `notifyAll()`. The condition is rechecked in a `while` loop. A thread can wake early (a spurious wakeup), and `notifyAll` wakes every waiter, so the condition may still be false when the thread runs again.
- **`ReentrantLock` and `ReadWriteLock`:** These are explicit locks. A `ReentrantLock` can be fair, so the lock is granted in the order threads asked for it. A `ReadWriteLock` admits several readers at once, or a single writer.
- **`Semaphore`:** A semaphore (סמפור) counts permits for a bounded resource. `acquire` waits until a permit is available and takes it. `release` returns a permit. A semaphore of 5 admits five threads. In the dining philosophers, the two forks are semaphores: a philosopher calls `acquire` on each fork and `release` on each fork when the meal is over.
- **Atomic classes (`AtomicInteger`, `AtomicReference`):** These classes perform a read-modify-write as one hardware step. Compare-and-swap (CAS) stores a new value only when the value still equals the one the thread observed, and that update is lock-free.

### Liveness hazards

:::definition id=def-liveness title="Deadlock, livelock, and starvation" source="materials/lectures/Chapter 8 - Concurrency.pptx"

- **Deadlock (נעילה הדדית):** Two or more threads are blocked, each waiting for a lock that another of them holds. A common repair is one global order for acquiring locks.
- **Livelock:** The threads are not blocked. Each spends its time reacting to the others, so no work finishes.
- **Starvation (הרעבה):** A thread that is ready to run is passed over indefinitely, because other threads keep taking the resource ahead of it.
:::

:::problem id=worked-counter-race title="An interleaving that loses an update" source="materials/sessions/PS6-2026-1.pptx" kind=worked solution_origin=source
Show an interleaving in which two calls to `increment()` lose an update.

```java
public void increment() {
    int tmp = count;   // read
    tmp = tmp + 1;     // add
    count = tmp;       // write
}

```

:::solution

1. Thread t1 reads `count` (0).
2. Thread t2 reads `count` (0).
3. Thread t1 computes `tmp = 1` and writes `count` (1).
4. Thread t2 computes `tmp = 1` and writes `count` (1).

At the end, `count` holds 1 where a serial execution would hold 2. Declaring `increment` `synchronized` makes the three steps one critical section, so this interleaving cannot occur.
:::
:::

:::check id=chk-volatile
Two threads execute `count++` on a field declared `volatile int`. Is the increment atomic?

- [ ] Yes. `volatile` makes the operation atomic
- [x] No. `volatile` guarantees memory visibility only, and a read-modify-write needs synchronization
- [ ] Yes. Writes of an `int` are atomic in hardware

`volatile` leaves the three machine steps as three steps. The increment is one atomic action when those steps run under one lock, or as one compare-and-swap.
:::

## Client-side locking

A thread-safe class, such as `Vector` in Java, promises that each individual method is atomic. A sequence of methods, such as a check followed by an update, is a separate story. The lock is taken and released inside each method, so the sequence itself is open to interleaving:

```java
if (!v.contains(5))
    v.add(5);

```

Between the call to `contains` and the call to `add`, another thread can insert the element. The repair is client-side locking. The caller holds the same lock the methods use, across both calls:

```java
synchronized (v) {
    if (!v.contains(5))
        v.add(5);
}

```

:::check id=chk-client-lock
`Vector.contains` and `Vector.add` each lock `this`. Why is `if (!v.contains(5)) v.add(5);` still a race?

- [ ] Because `Vector` does not lock its methods
- [x] Because the lock is released between the two methods
- [ ] Because `contains` returns a copy of the vector

Each method is safe on its own. The pair becomes one action when the caller locks `v` around both calls, or when the class offers one method that performs both under the same lock.
:::

## Practice

:::problem id=ps6-counter-race title="A counter without a lock" source="materials/sessions/PS6-2026-1.pptx" kind=exercise solution_origin=source
Two threads call `cnt.increment()` on this class. What can happen, and what are the three machine steps of the body?

```java
public class Counter {
    private int count;
    public Counter() { count = 0; }
    public void increment() { count++; }
    public int getValue() { return count; }
}
```

:::hint
"At the same time" means that the three steps of one call can sit between the three steps of the other.
:::
:::hint
Spell the steps out the way the session does: a read into a register, an add of one, and a write back.
:::
:::hint
Start both threads from `count == 0`.
:::
:::solution
Two results are legal. One is 2, when one call finishes before the other starts. The other is 1, when both threads read 0 before either of them writes. The body is three steps: read `count` into a register, add 1 to that register, and write the register back to `count`. `getValue` can also observe a stale `count` when no happens-before edge orders a write before that read. `volatile`, or the same lock on both the write and the read, repairs the visibility. The lost update is repaired only by making the three steps mutually exclusive, which the lock does.
:::
:::

:::problem id=ps6-average-safe title="A parallel average" source="materials/sessions/PS6-2026-1.pptx" kind=exercise solution_origin=derived
Each worker adds its slice into a shared `total`. The main thread then calls `join` on every worker and divides by the length. Is this correct?

```java
int total = 0;
// each worker, on its own slice:
total += part;
// main, after every worker has been started:
for (Thread worker : workers) worker.join();
return total / data.length;
```

:::hint
`join` waits until that worker's `run` returns. The `+=` on the shared `total` is still a read-modify-write that can lose an update.
:::
:::hint
The shared variable is `total`. The slices of the array are disjoint when each index is written by one worker.
:::
:::hint
Name the part that is free of a data race and the part that still has one.
:::
:::solution
Each `join` waits until that worker's `run` returns, and the division after the loop therefore observes the workers' writes. Visibility after `join` holds. The updates `total += part` run against each other. Two workers can lose an addition in the same way that `count++` loses an increment. The function is incorrect. Give each worker a private sum, call `join`, and then add the private sums in the parent. The shared array is only read, and each private sum stays confined to its worker until that worker's `join` returns, so the parent can add those sums with no lock.
:::
:::

:::problem id=ps7-wait-vs-spin title="Three ways to wait" source="materials/sessions/SPL_PS7.pptx" kind=exercise solution_origin=source
A thread can wait for a condition in three ways: busy-waiting, sleep-and-check, and `wait` / `notify`. Say what each one costs, and which of them can block without polling.

:::hint
Busy-waiting is the one the session allows only when the wait is expected to be tiny.
:::
:::hint
A sleep lowers the CPU cost and adds a delay before the thread notices the condition.
:::
:::hint
`wait` releases the monitor. Busy-waiting and sleep-and-check leave the monitor alone.
:::
:::solution
Busy-waiting tests the condition again in a tight loop. It reacts at once and occupies a core. The session recommends it only for a wait that is expected to be very short.

Sleep-and-check performs the same test with a sleep between attempts. It spends less processor time, and it notices the condition late, by as much as the sleep interval.

`wait` parks the thread on a monitor until another thread, which holds that same monitor, calls `notify` or `notifyAll`. The thread stays parked until `notify` or `notifyAll`. It rechecks the condition in a `while` loop, because it can wake early and because `notifyAll` wakes every waiter, and it holds the monitor when it calls `wait`. `wait` is the one that blocks.
:::
:::

:::problem id=ps7-liveness-names title="Names for liveness failures" source="materials/sessions/SPL_PS7.pptx" kind=exercise solution_origin=source
Name the failure. (1) Two threads each hold one lock and wait for the lock the other holds. (2) A low-priority thread never obtains the lock, because a high-priority thread keeps taking it. (3) Two threads lock, notice that the other lock is taken, release, and try again, forever.

:::hint
In the first failure the threads are blocked. In the third they are still running.
:::
:::hint
The second thread is ready to run. The scheduler passes over it indefinitely.
:::
:::hint
The session's repair for the first failure is a lock order.
:::
:::solution
(1) is deadlock. Both threads are blocked, and each is waiting for a lock the other holds. A total order on the locks breaks the cycle.

(2) is starvation. The thread is ready to run, and the scheduler passes over it indefinitely, so the resource stays with the other threads. Fair locks, and holding the resource only for a short time, are the repairs from the session. Priority scheduling can cause this.

(3) is livelock. The threads are not blocked. Each spends its time reacting to the other, releasing and trying again, so no work finishes. Backing off, or a lock order that holds the first lock until the second lock is acquired, lets one of them finish.
:::
:::

:::problem id=ps8-singleton title="A lazy singleton" source="materials/sessions/SPL_PS8.pptx" kind=exercise solution_origin=source
A lazy singleton is written like this:

```java
if (instance == null)
    instance = new ClassicSingleton();
```

Why is this wrong with two threads? Why is `synchronized` on the whole getter correct for safety and bad for liveness? Why does the holder class work?

:::hint
Both threads can pass the null check before either assignment is visible to the other.
:::
:::hint
A lock around the whole method is still held on later calls, after `instance` has already been published.
:::
:::hint
Class initialization runs once, before any thread sees the static field.
:::
:::solution
Two threads can both observe `instance == null` and both construct an object. The field ends as one of those objects. The other object is dropped from the field, and a reader may already have observed it. The race is check-then-act.

Synchronizing `getInstance` makes the check and the construction one critical section, so there is a single instance. Every later call also takes the lock, and threads queue to read a field that no longer changes. That queue is the liveness complaint.

The holder class stays uninitialized until `getInstance` touches it for the first time. The JVM initializes its static `INSTANCE` once and publishes that reference safely: the initialization happens-before any thread reads the field. Later calls read the field with no lock of their own. Eager initialization, a static field on the singleton class itself, is the other correct form. It builds the instance even when no caller asks for it.
:::
:::

:::problem id=ps8-interrupt title="A stop flag and interrupt" source="materials/sessions/SPL_PS8.pptx" kind=exercise solution_origin=source
A worker loops until `shouldStop` is true. Another thread sets the flag. The worker is inside `sleep`. Explain why the flag leaves the sleeping worker asleep, and what `interrupt` changes.

:::hint
`sleep` returns when its time expires, or when the thread is interrupted. The loop tests `shouldStop` only after `sleep` returns.
:::
:::hint
`interrupt` sets a status that the blocking call is required to notice.
:::
:::hint
The session forbids `Thread.stop`.
:::
:::solution
While the worker is inside `sleep`, the loop body that reads `shouldStop` is suspended. The flag becomes true and the thread stays asleep until the timeout expires. `interrupt()` sets the thread's interrupt status. `sleep` and `wait` observe that status, throw `InterruptedException`, and clear the status. The worker's catch block can then leave the loop. A worker that is still executing its loop polls `Thread.currentThread().isInterrupted()` or the flag on each iteration. `stop()` is unsafe: it cuts the thread off at an arbitrary instruction and leaves an application invariant unrestored.
:::
:::

:::examnote
The question gives a shared structure and asks for a race, a deadlock, or a repair that uses `synchronized`, a semaphore, or an atomic variable. The trap is a lock order in which each thread waits forever for a lock the other holds, or a lock that covers the update and leaves the read that publishes the value outside the critical section.
:::

:::problem id=exam-15a-q1 title="Gears" source="materials/exams/15-a.pdf" kind=exam solution_origin=derived
`Gear` knows its center, its radius, and its neighbors on the left and on the right. `move` rotates this gear and both neighbors, in the opposite direction. `SimpleGear` stores an angle `_state`.

a. State an invariant.
b. `check` validates constructor arguments against that invariant.
c. Is the class safe under every interleaving? If it is not, show one interleaving that breaks it.
d. After `_state` is updated inside `move`, `moveLeft`, and `moveRight`, is the class safe? Show a bad interleaving, or argue that none exists.
e. State the precondition and the postcondition of `move`.
f. A `Spinner` thread calls `move` on a gear. Is a run of several spinners correct, if correct means that the sequence of states is one that a serial history of `move` calls could have produced? Repair the class if it is not.

:::hint
The geometric invariant is about radii and centers. Gears that mesh actually touch, and each neighbor is a different gear.
:::
:::hint
`_state = _state + delta` is a read-modify-write on a field that the neighbor's thread also writes, because `move` calls into the neighbor.
:::
:::hint
A serial history means each `move` finishes before the next `move` starts. Two spinners on adjacent gears overlap.
:::
:::solution
Invariant: the radius is positive; left and right, when they are set, are distinct gears; a neighbor's center lies at a distance of exactly `radius + neighbor.radius` on the x-axis; `_state` stays in `[0, 360)`.

`check` rejects a radius of zero or less, and it rejects a center that would break the mesh when the neighbor is already set.

Without synchronization, two calls to `move` on adjacent gears interleave their `_state` updates and interleave the recursive calls into each other. One gear's angle can be applied twice, or it can be lost. That is a race, so the class is unsafe.

Moving the `_state` updates inside the three methods still leaves the class unsafe. Thread A runs `move` on g1 and enters g2.`moveRight`. Thread B runs `move` on g2 and writes `_state` between A's read and A's write. The same lost update remains.

Precondition of `move`: the invariant holds, and the neighbor chain reachable from this gear contains no cycle that this call would follow forever. Postcondition: this gear's angle has changed by its own step, each neighbor's angle has changed by the opposite step, and the invariant still holds.

Several `Spinner` threads overlap their `move` calls on shared gears, so the run matches no serial history. Make every public method `synchronized` on a single lock ordered along the chain, or take a dedicated simulation lock around `move`, so that each call finishes before the next call starts. A lock per gear deadlocks when `move` locks this gear and then the neighbor, while the neighbor locks itself and then this gear. The repair for that cycle is one ordered lock, or one semaphore for the whole mesh. `acquire` takes that permit before the move, and `release` returns it after the move, so the mesh has a single mutual-exclusion permit and no cycle of locks.
:::
:::

:::problem id=exam-15b-q1 title="Deadlock among gears" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
The public methods of `SimpleGear` are all `synchronized`. Neighbors call one another's `moveLeft` and `moveRight`, and those calls also need the neighbor's lock.

a. Show a deadlock of several gears.
b. Remove it in three ways: narrowing the synchronization, using a semaphore for the same mutual exclusion, and one further way that preserves the correctness of the program.
c. Which way do you choose, and why?

:::hint
Gear A locks itself and calls B. B locks itself and calls A.
:::
:::hint
A semaphore with one permit, taken in a fixed order, is a mutual-exclusion lock that is separate from the gear's `this`.
:::
:::hint
The official note prefers the repair that holds a lock only for the work the critical section actually performs.
:::
:::solution
a. `A.move` locks A and calls `B.moveRight`, which tries to lock B. At the same time `B.move` locks B and calls `A.moveLeft`, which tries to lock A. Each thread is blocked. Each holds one monitor and waits for the lock the other holds.

b. Three repairs keep the program correct. Narrow the synchronized regions so that a gear calls a neighbor only after it has released its own lock: copy the facts the call needs, release, and then call. Use one `Semaphore(1)` for a whole connected mesh, with `acquire` before every move and `release` after it, so the mesh has a single permit and there is no cycle. Take a lock per gear in address order, or in left-to-right order, so that every thread locks the earlier gear first. All three keep one `move` atomic with respect to other moves.

c. The official solution adopts the narrowing of the synchronization. The lock order and the mesh semaphore are correct, and they are coarser: each of them holds a resource for the whole call, past the work the critical section needs that resource for.
:::
:::

:::problem id=exam-16b-q1 title="A synchronized queue" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
`SynchQueue` implements `Queue` with every method `synchronized` on `this`. `ExtIntQueue` adds `sum()` over the integers.

a. State the precondition and the postcondition of `sum`.
b. Show an interleaving in which the postcondition fails.
c. Make `sum` correct without synchronizing the whole walk, in the optimistic style of a versioned iterator. The method stays unlocked for the duration of the summation.
d. Mystics look at a fork while they think, and a look is allowed only while nobody is eating with that fork. Adapt the semaphore protocol of the dining philosophers.

:::hint
`sum` is a query. Its postcondition names the elements that were present at one moment.
:::
:::hint
An `add` that is `synchronized`, landing in the middle of a walk that holds no lock, changes the sum.
:::
:::hint
A version stamp that `add` and `remove` increment lets `sum` try again when the stamp moves.
:::
:::solution
a. Precondition: the queue's invariant holds (`size` matches the chain). Postcondition: the result equals the sum of the integers that were in the queue at one moment during the call, and `sum` leaves the queue unchanged.

b. `sum` reads 1 and 2. Another thread then calls `add` of 10 and `remove` of 1. `sum` then reads the rest. The sum matches no single state of the queue.

c. Keep a `volatile int version` that grows at the end of every mutator. `sum` records the version, walks the chain without holding the lock, adds the values, and tries again when the version has changed. A bounded number of attempts can fall back to a locked walk, so the method is wait-free only in the quiet case and still terminates when writers keep arriving. The walk itself sits outside `synchronized`. This is a versioned iterator: the version is what tells the walker that the structure moved under it.

d. In the dining philosophers, each fork is a semaphore, and a philosopher acquires two of them in order to eat. A fork that someone is eating with is held exclusively, by one `acquire` that waits for that fork's permit. A fork that mystics are only looking at can be held by many of them at once: the read side of a `ReadWriteLock`, or a separate counter of lookers. Eating takes the write side, so the eater waits until the lookers leave, and a looker waits while an eater holds the fork. Two mystics can look at one fork together. A mystic looks at a fork only while no eater holds it.
:::
:::

:::problem id=exam-17a-q1 title="A board with a cup" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
A board of `N` by `N` starts with one cup and several players. Each player has a `Strategy` that chooses a `Direction`. A player who reaches the cup ends the game. Finish the launch in `main`, and protect the board so that two players cannot occupy one cell or miss the win. Locks are required. Do not rewrite the whole class.

:::hint
The board is the shared object. Every player thread calls into it.
:::
:::hint
A move that checks a cell and then writes that cell is a critical section on the board.
:::
:::hint
The end of the game is a flag that those same critical sections must observe. A later move otherwise revives a game that has already ended.
:::
:::solution
Each player is a `Runnable`. Its `run` loops: ask the strategy, call `board.move(this, dir)`, and stop when the result is `WIN` or `LOST`. `main` builds the board, starts one thread for each player with `Thread.start`, and calls `join` on every player thread. Each `join` waits until that player's `run` returns.

`move` is `synchronized` on the board. It returns `FAIL` when the game has already ended, when the step would leave the board, or when the step would land on another player. It returns `WIN` and sets the end flag when the destination is the cup. Otherwise it returns `SUCCESS` and updates the player's position. The check and the update hold one lock for the whole critical section, so two players cannot both write the same cell. A strategy that reads only immutable data needs no lock.
:::
:::

:::problem id=exam-17b-q1 title="Looking ahead on the board" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
Players on a board of `N` by `N` can `move` one step, or call `lookAhead`, which returns the distance to the nearest object or to the edge. `Segment` can test intersection, and it is already implemented.

a. State the precondition and the postcondition of `lookAhead`.
The implementation must stay correct when several player threads call `move` and `lookAhead`. `Segment` is thread-safe when the caller leaves it unchanged. It is an immutable value.

:::hint
`lookAhead` is a query. Say so in the postcondition.
:::
:::hint
A move that is interleaved with the look lets the distance describe a board that never existed.
:::
:::hint
Lock the board for both methods. An unlocked look can tear a coordinate.
:::
:::solution
Precondition: `dir` is a legal direction, and the player's position is on the board. Postcondition: the result is the number of steps from the player, along `dir`, until the first other player, the cup, or the edge, on the board state at one moment during the call. The method leaves the board unchanged.

Implement `move` and `lookAhead` as `synchronized` on the board. `lookAhead` builds a `Segment` from the player's cell and walks until `intersect` hits another object's cell or the edge. The lock makes that walk observe one layout. `move` updates a position only while it holds the same lock, and it returns `WIN` when the destination is the cup.
:::
:::

:::problem id=exam-18b-q2 title="Two stacks in deadlock" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
A bounded `Stack` has the invariant `0 <= size() <= capacity()`. In the implementation you are given, `push` and `pop` can fail their preconditions.

Show two threads, `T1` and `T2`, and two stacks, `S1` and `S2`, that enter deadlock. Each thread may call `push` and `pop` on both stacks. The methods lock the `Stack` they belong to, and a `push` that moves a value from one `Stack` into the other locks both.

:::hint
Deadlock needs a cycle. Two stacks are enough when each thread takes them in a different order.
:::
:::hint
`T1` locks `S1` and then tries `S2`. `T2` locks `S2` and then tries `S1`.
:::
:::hint
Write the calls the two threads make.
:::
:::solution
`T1` calls `S1.push(x)`. That call locks `S1`, and inside the call it locks `S2`, because the value being pushed is a structure tied to `S2`. The transfer in the question locks the destination and then the source. `T2` calls `S2.push(...)` and then locks `S1`. Each thread is blocked. Each holds the monitor of one `Stack` and waits for the lock the other holds. Neither `pop` nor `push` returns.

The repair, which the question asks you to see by exhibiting the bug, is one order: in both threads, lock the `Stack` with the lower identity first. The same cycle appears in `Image.mix` from the lecture.
:::
:::

:::problem id=exam-19b-q2 title="A sorted tree" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
`SortedBinaryTree` states this invariant:

```java
//@INV: getData() != null &&
// (getLeft() == null || getData().compareTo(getLeft().getData()) > 0) &&
// (getRight() == null || getData().compareTo(getRight().getData()) < 0)
```

The implementation inserts by walking the child pointers. Those pointers are `volatile`, and the walk takes no lock. Show an interleaving that breaks the invariant, and give a locking scheme that preserves it. A later part asks what a readers-writer lock would change.

:::hint
Two insertions can both pass the same null check on `left`, and both can then assign `left`.
:::
:::hint
`volatile` makes each write visible. The check and the assignment remain two steps, so both threads can pass the check.
:::
:::hint
One lock on the node about to change, held from the check through the assignment, is enough when every insertion takes locks from the root downward.
:::
:::solution
Start from a node that holds 5, with null children. Thread A decides to insert 3 and reads `left == null`. Thread B inserts 4 in the same way and writes `left`. Thread A then writes `left` to the node that holds 3, and 4 is left with no parent. The tree no longer contains 4, and any later child of 3 is unordered against the node that was lost. The invariant at the root fails at the moment A's write lands on top of a child that should have stayed.

Lock every node from the root downward. Hold the lock on a node while the insertion reads that node's child, and, when the insertion updates that child, hold the same lock while it writes the child. Two insertions then run one after another on the first node that both of them need. A `ReadWriteLock` lets concurrent `contains` calls take the read lock, and `insert` takes the write lock. A `contains` that arrives during a write waits. That is the gain the question asks you to name: readers overlap with one another, and a writer excludes the walk it is modifying.
:::
:::

:::problem id=exam-20a-q2 title="Output of two threads" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
Write every possible output, and justify the list.

```java
public class A {
    public int i;
    public A(int i) { this.i = i; }
}

public class Task implements Runnable {
    public A a;
    public Task(A a) { this.a = a; }

    public void run() {
        System.out.print(a.i);
    }

    public static void main(String[] args) {
        A a = new A(2);
        Thread t1 = new Thread(new Task(a));
        Thread t2 = new Thread(new Task(a));
        t1.start();
        t2.start();
        a = new A(3);
    }
}
```

:::hint
Each `Task` stores the object it received in its constructor. An assignment to the local variable `a` in `main` leaves that field as it was.
:::
:::hint
`Thread.start` runs after the constructor that wrote `i = 2`, so the read in `run` observes 2.
:::
:::hint
The two prints are the same digit. The threads hold no third value.
:::
:::solution
Both threads hold the `A` whose `i` is 2. The line `a = new A(3)` stores a different object in `main`'s local variable. No thread reads that variable. The constructor's write happens before `start`, and `start` happens before `run`, so both threads print 2. The only output is `22`.
:::
:::

:::problem id=exam-20b-q2 title="An atomic update" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
Synchronization with atomic variables. Two threads, `t1` and `t2`, both call `f()`. Show the races when `f` updates a plain `int`, and rewrite the update with `AtomicInteger` so that the stated invariant holds. A CAS loop is the tool the question expects when the new value depends on the old one.

:::hint
`AtomicInteger` provides `addAndGet` and `compareAndSet`. It has no `++` operator.
:::
:::hint
When the new value is the old value plus one, `incrementAndGet` is enough. When the new value depends on a neighbor in a structure, read again and call `compareAndSet`.
:::
:::hint
A failed `compareAndSet` means another thread stored its value first. Read the new value and try again. A retry that reuses the old observation writes the wrong successor.
:::
:::solution
On a plain `int`, both threads can read the same value and both can write `value + 1`, so one update disappears. The legal results run from the result of a serial history of the two calls down to the case in which only one update is stored.

```java
final AtomicInteger n = new AtomicInteger(0);
int observed;
do {
    observed = n.get();
} while (!n.compareAndSet(observed, observed + 1));
```

`incrementAndGet()` is that same loop inside the library. After both threads finish, `n` is 2. A `get` on a third thread observes that value once both compare-and-swap operations have completed. The atomic operations already order the writes, so the field needs no separate `volatile` modifier. The update is lock-free: a thread that loses the compare-and-swap retries, and no thread waits on a lock.
:::
:::

:::problem id=exam-24b-q2 title="A thread barrier" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
A `Barrier` lets a fixed group of threads advance in phases. `await` means "I have finished this phase." The caller blocks until every participant has finished the phase, and then every participant enters the next phase.

Implement `await` so that a generation counter stops a fast thread from entering the next phase and releasing the previous phase early. An `InterruptedException` must leave the barrier usable for the threads that remain.

:::hint
The arrival count returns to zero for the next phase, and that reset must leave a thread that has not yet arrived still waiting.
:::
:::hint
A generation, which grows when the last thread arrives, is the value every waiter remembers.
:::
:::hint
Call `wait` inside a `while` that tests this generation, and call `notifyAll` from the last arrival.
:::
:::solution
```java
public class Barrier {
    private final int parties;
    private int arrived;
    private int generation;
    public Barrier(int parties) { this.parties = parties; }
    public synchronized int await() throws InterruptedException {
        int g = generation;
        arrived++;
        if (arrived == parties) {
            arrived = 0;
            generation++;
            notifyAll();
            return 0;
        }
        while (g == generation) wait();
        return 1;
    }
}
```

The last thread resets `arrived` and advances `generation` before it wakes anyone, so a thread that woke and immediately calls `await` again waits for the new generation. A thread that wakes early, or that wakes because `notifyAll` woke every waiter, sees `g == generation` and waits again. On `InterruptedException`, the caller decrements `arrived` before it rethrows. Otherwise the phase never fills, and the remaining threads wait forever. The four methods of the question are this `await`, the constructor, and the queries the tests use to read the phase.
:::
:::

:::problem id=exam-24c-q2 title="A thread-safe set" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived
`Set` adds `iterator()` and `clone()` to `contains` and `add`. `SetImpl` is a linked list. An iterator that walks `next` pointers runs at the same time as `add`. Make `iterator` and `add` safe. A clone publishes a private structure, and every node in that structure is one the clone finished copying.

:::hint
A fail-fast iterator remembers a version. `add` increments that version.
:::
:::hint
`clone` copies the nodes while it holds the same lock that `add` holds. Otherwise the copy is torn.
:::
:::hint
`ConcurrentModificationException` is the usual signal. Returning a snapshot is the other legal design.
:::
:::solution
Take one lock around `add`, `contains`, creation of the iterator, and `clone`. `add` links a new node and increments `modCount`. The iterator copies `modCount` when it is created, and it throws `ConcurrentModificationException` if `modCount` changes before `next`. That is the fail-fast contract. The version is the same idea as a versioned iterator: the walker detects that a mutator changed the list under it.

`clone` holds the lock, walks the list, and allocates a new list with the same elements. The set it returns has its own nodes and its own lock. Callers that use the copy share no structure with the original, so the copy publishes only state that the clone finished writing. A snapshot iterator copies the elements inside `iterator()` and then serves that copy. It needs the lock only for the duration of the copy.
:::
:::

A server that blocks inside `accept` stalls every other client for the length of that call, which is why the wait is handed to another thread. [Networking](topic:networking) is the channel between processes, and [the reactor](topic:reactor) is the server that waits on many such channels with one thread.

Chapter 8 reprints the figure from the [memory model](topic:memory-model) and places a page table under it. A reference can miss when its page is absent from RAM, and the operating system brings the page in. A Java variable shows the value after that load. Threads of one process share the heap and the static variables, and each thread keeps its own stack.
