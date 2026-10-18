---
id: concurrency
title: Concurrency
sources:
  - "Classes/Chapter 8 - Concurrency.pptx"
  - "Exrecises/PS6-2026-1.pptx"
  - "Exrecises/SPL_PS7.pptx"
  - "Exrecises/SPL_PS8.pptx"
  - "Exams/15-a.pdf"
  - "Exams/15-a-solution.pdf"
  - "Exams/15-b.pdf"
  - "Exams/15-b-solution.pdf"
  - "Exams/16-b.pdf"
  - "Exams/16-b-solution.pdf"
  - "Exams/17-a.pdf"
  - "Exams/17-a-solution.pdf"
  - "Exams/17-b.pdf"
  - "Exams/17-b-solution.pdf"
  - "Exams/18-b.pdf"
  - "Exams/18-b-solution.pdf"
  - "Exams/19-b.pdf"
  - "Exams/19-b-solution.pdf"
  - "Exams/20-a.pdf"
  - "Exams/20-a-solution.pdf"
  - "Exams/20-b.pdf"
  - "Exams/20-b-solution.pdf"
  - "Exams/24-b.pdf"
  - "Exams/24-b-solution.pdf"
  - "Exams/24-c.pdf"
  - "Exams/24-c-solution.pdf"
---

Clock speed stopped being the way to make a computer faster. The cheap improvement is more processors. A typical machine already runs tens or hundreds of processes at once. Inside one process, the same idea is a thread (חוט ביצוע): another stack, the same heap.

## Processes do not share a heap

Physical memory is the RAM chips. Each cell has a physical address. Virtual memory is the lie the operating system tells a process: the address space looks private, from 0 up to a huge limit, even though many processes are alive. The lecture draws that space as pages (דפים), often 4KB, mapped by the operating system onto physical frames. Two processes that both use address `0x20000` are talking about different frames. That is why one calculator cannot read another's memory, and why cooperating programs need an explicit channel.

Chapter 8 reprints the [memory-model](topic:memory-model) picture and then puts a page table under it. A load can miss: the page is not in RAM, and the operating system brings it in. None of that is visible in a Java variable. What is visible is the consequence: threads of one process share the heap and the statics, and they do not share stacks.

## A thread is a stack plus a task

:::definition id=def-thread title="Thread of execution" source="Classes/Chapter 8 - Concurrency.pptx"
A thread is an independent execution inside a process. Each thread has a private stack. The process starts with one thread and can create more. On several cores the threads run at the same time. On one core they take turns. They share the heap.
:::

`Thread` is the object that starts and joins that execution. `Runnable` is the task. Keeping them apart means one task can be handed to a pool later.

```java
public class Task implements Runnable {
    private final FileWriter fw;
    public Task(FileWriter fw) { this.fw = fw; }
    public void run() {
        try { fw.write("x"); } catch (IOException e) { throw new RuntimeException(e); }
    }
}
```

`task.run()` uses the caller's thread. `new Thread(task).start()` allocates a new one. A lambda is a `Runnable` when the interface has one method: `new Thread(() -> fw.write("x")).start()`. `join()` waits until that thread's `run` returns. Without it, `main` can finish, or read the result, before the writes happen.

`ExecutorService` decouples "please run this" from "which thread runs it." `Executors.newFixedThreadPool(3)` reuses three threads for as many tasks as you submit. Session 6's `SerialExecutor` is the opposite extreme: one thread, tasks queued.

A shared resource is any object reachable from more than one thread. Locals that never escape are not shared. That is thread confinement, the first technique in session 7: if only one thread can name the object, it needs no lock.

## Races

The session's counter is the whole bug in three instructions.

```java
public void increment() { count++; }
```

`count++` is a read, an add, and a write. Two threads can both read 0, both add 1, and both write 1. The global counter ends at 1. Nothing in the language promises an order among those six steps.

![Two threads both read 0, both add 1, and both write 1, so one increment is lost](../assets/figures/race-interleaving.svg)

:::definition id=def-critical-section title="Critical section" source="Classes/Chapter 8 - Concurrency.pptx"
A critical section (אזור קריטי) is code that at most one thread may execute at a time. The mutual exclusion that enforces it is a mutex. In Java, `synchronized` is that mutex. A synchronized method locks `this`. A synchronized block locks the object you name.

```java
public synchronized int next() { n++; n++; return n; }
```
:::

`Even.next` without the keyword can return an odd number: one thread passes the first `n++` and the other thread runs both increments. With `synchronized` on the method, the three steps happen while one thread holds `this`. A private `final Object lock = new Object()` is the monitor when you do not want to lock the whole public object. Every access to the protected fields must lock that same object. A second lock does not exclude the first.

`volatile` is a different promise. A volatile write is visible to a later volatile read in another thread. The variable is not kept quietly in a register or a private cache. It does not make `count++` atomic. The lecture says so in one line: visibility, not mutual exclusion.

An immutable object never changes after publication. Session 7's checklist: the class is `final`, every field is `final`, `this` does not escape during construction, and a field that points at a mutable object points at a copy the caller cannot reach. `String` and `Integer` qualify. `ThreeStooges` qualifies even though it contains a list, because the list is never exposed and never modified. Publishing a new object instead of mutating an old one is the lecture's alternative to locking: build the new state, then swing one reference into place.

### wait, notify, locks, atomics

`synchronized` does not wait for a condition. A loop that retests a flag burns a core (busy waiting). Sleeping between tests wastes less CPU and reacts late. `wait` and `notify` are the primitive that actually blocks.

```java
public synchronized int take() throws InterruptedException {
    while (value == null) wait();
    int v = value;
    value = null;
    notifyAll();
    return v;
}
public synchronized void put(int v) throws InterruptedException {
    while (value != null) wait();
    value = v;
    notifyAll();
}
```

The lecture's notes on this queue: `take` waits for a value, `put` stores one and wakes a waiter. If several threads wait, the order is not fair. A thread can wake early, which is why the test is a `while` and not an `if`. `wait`, `notify`, and `notifyAll` are called on the monitor you hold. `notify` wakes one waiter. `notifyAll` wakes all of them, which is required when waiters are sleeping for different conditions, as in the lecture's `Cafe`: waking the wrong customer with `notify` leaves the right one asleep.

`ReentrantLock` is a mutex you lock and unlock yourself, with `tryLock` and an optional fair ordering. `ReadWriteLock` lets many readers in, and a writer excludes everyone. `Semaphore` counts permits. `acquire` waits for a permit, `release` returns one. A semaphore of 5 is a critical section that admits five threads. The dining philosophers use two semaphores as the forks.

`AtomicInteger` and its relatives offer atomic updates without a `synchronized` block. `addAndGet(2)` is the fix for `n += 2`, which is still a race if you write it on a plain `int`. `compareAndSet` is the compare-and-swap the hardware provides: if the value is still the expected one, store the new one, as a single step. Session 8 builds a lock-free `Pair` and a lock-free linked list on `AtomicReference` by retrying the CAS. The limitation on the slide: without a lock you cannot make a thread block, so a blocking queue still needs `wait` or an equivalent. Lock-free structures are also harder to get right.

`BlockingQueue` is the producer-consumer tool. `put` waits when the queue is full. `take` waits when it is empty. `ArrayBlockingQueue` is the lecture's one-liner. The producer thread `put`s, the consumer thread `take`s.

`ExecutorService pool = Executors.newFixedThreadPool(n)` is the same idea as a pool of workers pulling tasks. Submit a `Runnable` or a `Callable`. A `Callable` returns a value; the submit call hands back a `Future` you `get()`. Session 8's completion service lets you `take` futures in the order they finish rather than the order you submitted.

### Liveness

A program is live when threads keep making progress. Three failures, with the same definitions in the lecture and in sessions 7 and 8:

:::definition id=def-liveness title="Deadlock, livelock, starvation" source="Classes/Chapter 8 - Concurrency.pptx"
Deadlock (נעילה הדדית, חבק): threads are blocked, each waiting for a lock another of them holds. The lecture's `red`/`blue` locks and the `Image.mix` that locks `this` then `other` are the pictures. One fix is a global order: every thread locks the lower address first.

Livelock: threads are not blocked, but each spends its time reacting to the other, so no work finishes. The polite grab locks the first mutex, sees the second taken, drops the first, and retries forever.

Starvation (הרעבה): a thread does not get regular access, because a greedy thread holds the resource or because scheduling always prefers others. Fair locks and a queue are the usual repairs.
:::

Interrupting a thread sets a flag. `sleep` and `wait` throw `InterruptedException` when they see it. `stop()` is the session's forbidden hammer: it unlocks nothing cleanly. A `volatile boolean shouldStop` works only if the thread actually reads it between blocking calls.

The singleton slides are a race on publication. A null check then `new` lets two threads construct two instances. Synchronizing the whole `getInstance` is correct and serializes every later call. Double-checked locking without `volatile` is broken by reordering: another thread can see the reference before the constructor's writes. The session's safe lazy form is the holder class. The JVM initializes that class, and its static field, once, on first use.

:::algorithm id=alg-synchronized-increment title="Make a read-modify-write atomic" source="Classes/Chapter 8 - Concurrency.pptx" complexity="O(1) work, but a thread may wait unbounded time for the monitor" invariant="At most one thread is inside the synchronized block on this monitor."
```java
public final class Counter {
    private int count = 0;
    public synchronized void increment() { count++; }
    public synchronized int get() { return count; }
}
```
:::

The invariant is true every time a thread enters or leaves the block, and it is true of threads that are outside: they are not in the block. It does not say anything about a second method that touches `count` without locking.

:::problem id=worked-counter-race source="Exrecises/PS6-2026-1.pptx" kind=worked solution_origin=source
Two threads call `increment` once on a counter that starts at 0. The body is the read, add, write sequence. Give an interleaving whose result is 1.

:::solution
t1 reads 0. t2 reads 0. t1 writes 1. t2 writes 1. Both calls returned, and `count` is 1. The lost update is the race. `synchronized` on `increment` forbids this interleaving because the second thread cannot read until the first has written.
:::
:::

:::check id=chk-volatile
Two threads execute `count++` on a `volatile int`. Is the increment atomic?

- [ ] Yes, volatile makes the update atomic
- [x] No, volatile only makes the reads and writes visible
- [ ] Yes, because int writes are always atomic and the increment is one write

The lecture separates visibility from mutual exclusion. The read and the write are two steps even when each of them is visible.
:::

:::trap
`if (value == null) wait();` misses a wakeup that happens after the check and before `wait`, and it misses a spurious wakeup. The lecture's queue uses `while`.
:::

:::trap
Locking `this` in one method and a private lock in another does not exclude those methods from each other. The philosophers deadlock when each holds the left fork and wants the right. Number the forks and take the lower number first.
:::

## Practice

:::problem id=ps6-counter-race source="Exrecises/PS6-2026-1.pptx" kind=exercise solution_origin=source
Session 6 asks what `cnt.increment()` does if two threads call it "at the same time" on this class, and what the three machine steps of the body are.

```java
public class Counter {
    private int count;
    public Counter() { count = 0; }
    public void increment() { count++; }
    public int getValue() { return count; }
}
```

:::hint
"At the same time" means the three steps of one call can sit between the three steps of the other.
:::
:::hint
List the steps as the session does: read into a register, add one, write back.
:::
:::hint
Start both threads from `count == 0`.
:::
:::solution
The result is not determined. One legal outcome is 2, when one call finishes before the other starts. Another is 1, when both read 0 before either writes. The body is: read `count` into a register, add 1 to the register, write the register back to `count`. `getValue` can also observe a stale `count` if there is no happens-before edge; `volatile` or the same lock fixes the visibility, and only the lock fixes the lost update.
:::
:::

:::problem id=ps6-average-safe source="Exrecises/PS6-2026-1.pptx" kind=exercise solution_origin=derived
The session's last slide asks whether a parallel average is safe. Each worker sums a slice into a shared `total` with `total += part`, then the main thread `join`s and divides by the length. Is it correct?

:::hint
`join` waits for the workers. It does not make `+=` atomic.
:::
:::hint
The shared variable is `total`. The slices of the array are not shared if each index is written by one worker.
:::
:::hint
Say what is data-race-free and what is not.
:::
:::solution
The joins make the subsequent division see the workers' writes, so visibility after `join` is fine. The updates `total += part` race with each other. Two workers can lose an addition the same way `count++` loses one. The function is not correct. Give each worker a private sum, `join`, then add those private sums in the parent. No lock is required, because the shared array is only read and the totals are confined until the joins finish.
:::
:::

:::problem id=ps7-wait-vs-spin source="Exrecises/SPL_PS7.pptx" kind=exercise solution_origin=source
Session 7 lists three ways a thread can wait for a condition: busy waiting, sleep-and-check, and `wait`/`notify`. Say what each costs, and which one can block without polling.

:::hint
Busy waiting is the one the session allows only when the wait is expected to be tiny.
:::
:::hint
Sleep lowers the CPU cost and adds a delay before the thread notices.
:::
:::hint
`wait` releases the monitor. The other two do not involve a monitor.
:::
:::solution
Busy waiting retests the condition in a tight loop. It reacts immediately and occupies a core. The session recommends it only for a very short expected wait.

Sleep-and-check does the same test with a sleep between tries. It wastes less CPU and notices the condition late, by up to the sleep interval.

`wait` parks the thread on a monitor until another thread, holding that monitor, calls `notify` or `notifyAll`. No polling. The waiter must be in a `while` loop, and it must own the monitor when it calls `wait`. That is the one that blocks.
:::
:::

:::problem id=ps7-liveness-names source="Exrecises/SPL_PS7.pptx" kind=exercise solution_origin=source
Name the failure: (1) two threads each hold one lock and wait for the other's, (2) a low-priority thread never obtains the lock because a high-priority thread keeps taking it, (3) two threads repeatedly lock, notice the other lock is taken, unlock, and try again, forever.

:::hint
Blocked versus running is the split between the first and the third.
:::
:::hint
The second thread is not stuck in a cycle with a partner. It is simply never chosen.
:::
:::hint
The session's repair for the first is a lock order.
:::
:::solution
(1) is deadlock. Both threads are blocked. A total order on the locks breaks the cycle.

(2) is starvation. The thread is runnable in principle and does not get the resource often enough. Fair locks, or not holding the resource for a long time, are the session's repairs. Priority scheduling can cause it.

(3) is livelock. The threads are not blocked. They are busy being polite. A backoff, or a lock order that does not drop the first lock, lets one of them finish.
:::
:::

:::problem id=ps8-singleton source="Exrecises/SPL_PS8.pptx" kind=exercise solution_origin=source
The session shows a lazy singleton:

```java
if (instance == null)
    instance = new ClassicSingleton();
```

Why is this wrong with two threads? Why is `synchronized` on the whole getter correct but bad for liveness? Why does the holder class work?

:::hint
Both threads can pass the null check before either assignment is visible.
:::
:::hint
A lock around the whole method is held even when `instance` is already published.
:::
:::hint
Class initialization runs once, before any thread sees the static field.
:::
:::solution
Two threads can both observe `instance == null` and both construct an object. The field ends as one of them; the other object is leaked and some callers may have observed the other. The race is on the check-then-act.

Synchronizing `getInstance` makes the check and the construction one critical section, so the instance is unique. Every later call also takes the lock, so threads queue to read a field that no longer changes. That is the liveness complaint.

The holder class is not initialized until `getInstance` first touches it. The JVM initializes its static `INSTANCE` once and publishes it safely. Later calls read the field with no lock. Eager initialization, a static field on the singleton class itself, is the other correct form, and it constructs the instance even if nobody asks.
:::
:::

:::problem id=ps8-interrupt source="Exrecises/SPL_PS8.pptx" kind=exercise solution_origin=source
A worker loops until `shouldStop` is true. Another thread sets the flag. The worker is inside `sleep`. Explain why the flag is not enough, and what `interrupt` changes.

:::hint
`sleep` does not read your boolean.
:::
:::hint
`interrupt` sets a status the blocking call is required to notice.
:::
:::hint
The session forbids `Thread.stop`.
:::
:::solution
While the worker is inside `sleep`, it is not evaluating `shouldStop`. The flag becomes true and the thread keeps sleeping until the timeout. `interrupt()` sets the thread's interrupt status. `sleep` and `wait` observe it, throw `InterruptedException`, and clear the status. The worker's catch block can then leave the loop. A worker that is not blocked must still poll `Thread.currentThread().isInterrupted()` or the flag. `stop()` is unsafe because it aborts the thread at an arbitrary instruction and releases no application invariant.
:::
:::


:::examnote
The question gives a shared structure and asks for a race, a deadlock, or a repair with `synchronized`, a semaphore, or an atomic. The trap is locking in an order that waits forever, or protecting the update and not the read that publishes it.
:::

:::problem id=exam-15a-q1 source="Exams/15-a.pdf" kind=exam solution_origin=derived
`Gear` knows its center, radius, and left and right neighbors. `move` turns this gear and both neighbors, in the opposite direction. `SimpleGear` stores a `_state` angle.

a. Define an invariant.
b. `check` validates constructor arguments against that invariant.
c. Is the class safe under every interleaving? If not, show one.
d. After `_state` is updated inside `move`, `moveLeft`, and `moveRight`, is it safe? Show a bad interleaving or argue.
e. Preconditions and postconditions of `move`.
f. A `Spinner` thread calls `move` on a gear. Is a run of several spinners correct if "correct" means the sequence of states is one that a serial order of `move` calls could produce? Repair it if not.

:::hint
The geometric invariant is about radii and centers: meshing gears have to actually touch, and a gear is not its own neighbor.
:::
:::hint
`_state = _state + delta` is a read-modify-write on a field the neighbor's thread also writes, because `move` calls into the neighbor.
:::
:::hint
A serial order means each `move` finishes before the next starts. Two spinners on adjacent gears overlap.
:::
:::solution
Invariant: radius is positive; left and right, if set, are different gears; a neighbor's center is exactly `radius + neighbor.radius` away on the x axis; `_state` stays in `[0, 360)`.

`check` rejects a non-positive radius and a center that would break the mesh when the neighbor is already set.

Without synchronization, two `move` calls on adjacent gears interleave their `_state` updates and the recursive calls into each other. One gear's angle can be applied twice or lost. That is a race, so the class is not safe.

Adding `_state` updates inside the three methods does not create safety. Thread A runs `move` on g1 and has entered g2.`moveRight`. Thread B runs `move` on g2 and writes `_state` between A's read and write. The same lost update remains.

Precondition of `move`: the invariant holds, and the neighbor chain reachable from this gear does not contain a cycle that this call would follow forever. Postcondition: this gear's angle has changed by its step, and each neighbor's angle has changed by the opposite step, and the invariant still holds.

Several `Spinner` threads do not produce a serial history, because their `move` calls overlap on shared gears. Make each public method `synchronized` on a single lock ordered along the chain, or lock a dedicated simulation lock around `move`, so each call finishes before the next begins. Per-gear locks deadlock if `move` locks this gear and then the neighbor while the neighbor locks itself and then this gear. The 2015 B solution's repair for that cycle is one ordered lock, or one semaphore for the whole mesh.
:::
:::

:::problem id=exam-15b-q1 source="Exams/15-b.pdf" kind=exam solution_origin=source
`SimpleGear`'s public methods are all `synchronized`. Neighbors call each other's `moveLeft` / `moveRight`, which also need the neighbor's lock.

a. (7) Show a deadlock of several gears.
b. (18) Remove it in three ways: narrowing the synchronization, and using a semaphore instead of `synchronized`, and one further way that keeps the program correct.
c. (5) Which way do you adopt, and why?

:::hint
Gear A locks itself and calls B, which locks itself and calls A.
:::
:::hint
A semaphore of one permit, taken in a fixed order, is a mutex that is not tied to the gear's `this`.
:::
:::hint
The official note prefers the repair that does not hold a lock the critical section does not need.
:::
:::solution
a. A.move locks A and calls B.moveRight, which tries to lock B. Concurrently B.move locks B and calls A.moveLeft, which tries to lock A. Each holds one monitor and waits for the other.

b. Three correct repairs. Narrow the synchronized regions so a gear does not call a neighbor while holding its own lock: copy the facts you need, unlock, then call. Use one `Semaphore(1)` for a whole connected mesh, acquired before any move and released after, so there is a single lock and no cycle. Take per-gear locks in address order, or in a left-to-right order, so every thread locks the earlier gear first. All three keep a single `move` atomic with respect to other moves.

c. The official solution says the narrowed synchronization is the one to adopt: the other two hold a resource the critical section does not need for the whole call. Order and the mesh semaphore are correct and coarser.
:::
:::

:::problem id=exam-16b-q1 source="Exams/16-b.pdf" kind=exam solution_origin=derived
`SynchQueue` implements `Queue` with every method synchronized on `this`. `ExtIntQueue` adds `sum()` over the integers.

a. (4) Pre- and postcondition of `sum`.
b. (6) An interleaving where the postcondition fails.
c. (10) Make `sum` correct without synchronizing the whole walk, in the optimistic style of a versioned iterator. The method must not stay locked for the whole summation.
d. (10) Mystics look at a fork while thinking, and must not look at a fork someone is eating with. Adjust the semaphore protocol from the dining philosophers.

:::hint
`sum` is a query. Its postcondition names the elements present at one instant.
:::
:::hint
A synchronized `add` in the middle of an unsynchronized walk changes the total.
:::
:::hint
A version stamp that `add` and `remove` increment lets `sum` retry when the stamp moved.
:::
:::solution
a. Precondition: the queue's invariant holds (`size` matches the chain). Postcondition: the result equals the sum of the integers that were in the queue at one moment during the call, and `sum` does not change the queue.

b. `sum` reads 1 and 2, then another thread `add`s 10 and `remove`s 1, then `sum` reads the rest. The total matches no single state of the queue.

c. Keep a `volatile int version` incremented at the end of every mutator. `sum` records the version, walks without holding the lock, adds, and retries if the version changed. A bounded number of retries can fall back to a locked walk so the method is wait-free only in the quiet case and still terminates. The walk itself is not inside `synchronized`.

d. A fork that is being eaten with is held exclusively, as in the philosopher solution. A fork that is only being looked at can be held by many mystics: a reader side of a `ReadWriteLock`, or a separate count. Eating takes the write side, so it waits until lookers leave, and lookers wait while an eater holds it. Two mystics may look at one fork together. Nobody looks at a fork an eater holds.
:::
:::

:::problem id=exam-17a-q1 source="Exams/17-a.pdf" kind=exam solution_origin=derived
A board of `N` by `N` starts with one goblet and several players. Each player has a `Strategy` that picks a `Direction`. A player who reaches the goblet ends the game. The question asks you to finish the launch in `main` and to protect the board so two players cannot occupy one cell or miss the win. Locks are required; do not rewrite the whole class.

:::hint
The board is the shared object. Each player thread calls into it.
:::
:::hint
A move that checks a cell and then writes it is a critical section on the board, not on the player.
:::
:::hint
The game ending is a flag those same critical sections must see, or a late move resurrects a finished game.
:::
:::solution
Each player is a `Runnable` whose `run` loops: ask the strategy, call `board.move(this, dir)`, stop when the result is `WIN` or `LOST`. `main` constructs the board, starts one thread per player, and joins them.

`move` is `synchronized` on the board. It returns `FAIL` if the game is over or the step would leave the board or hit another player. It returns `WIN` and sets a finished flag if the destination is the goblet. It returns `SUCCESS` and updates the player's location otherwise. Because the whole check-and-update holds one lock, two players cannot commit two writes to one cell. Strategies that only read immutable data need no lock.
:::
:::

:::problem id=exam-17b-q1 source="Exams/17-b.pdf" kind=exam solution_origin=derived
Players on an `N` by `N` board may `move` one step or `lookAhead`, which returns the distance to the nearest object or to the edge. `Segment` can test intersection and is already implemented.

a. (5) Pre- and postconditions of `lookAhead`.
The implementation must stay correct when several player threads call `move` and `lookAhead`. `Segment` is given as thread-safe only if you do not mutate it; it is an immutable value.

:::hint
`lookAhead` is a query. Say so in the postcondition.
:::
:::hint
A move that is not atomic with the look lets the distance describe a board that never existed.
:::
:::hint
Lock the board for both methods, or the look can tear a coordinate.
:::
:::solution
Precondition: `dir` is a legal direction, and the player's location is on the board. Postcondition: the result is the number of steps from the player, in `dir`, to the first other player, the goblet, or the edge, on the board state at one instant during the call. The method does not change the board.

Implement both `move` and `lookAhead` as `synchronized` on the board. `lookAhead` builds a `Segment` from the player's cell and walks until `intersect` hits another object's cell or the edge. The lock makes that walk see one layout. `move` updates a location only while holding the same lock, and it returns `WIN` when the destination is the goblet.
:::
:::

:::problem id=exam-18b-q2 source="Exams/18-b.pdf" kind=exam solution_origin=derived
A bounded `Stack` has the invariant `0 <= size() <= capacity()`. `push` and `pop` may fail their preconditions in the implementation you are given.

Show two threads `T1` and `T2`, and two stacks `S1` and `S2`, that deadlock. Each thread may call `push` and `pop` on both stacks. The methods lock the stack they belong to, and a `push` of a stack into the other stack locks both.

:::hint
Deadlock needs a cycle. Two stacks are enough if each thread takes them in a different order.
:::
:::hint
`T1` locks `S1` then tries `S2`. `T2` locks `S2` then tries `S1`.
:::
:::hint
Write the calls, not a metaphor.
:::
:::solution
`T1` calls `S1.push(x)`, which locks `S1`, and inside that call locks `S2` because the value being pushed is a structure tied to `S2` (the question's transfer locks the destination and then the source). `T2` calls `S2.push(...)` and then locks `S1`. Each thread holds one stack's monitor and waits for the other. Neither `pop` nor `push` returns.

The repair, which the question asks you to see by exhibiting the bug, is one order: lock the stack with the lower identity first, in both threads. The same cycle appears in the lecture's `Image.mix`.
:::
:::

:::problem id=exam-19b-q2 source="Exams/19-b.pdf" kind=exam solution_origin=derived
`SortedBinaryTree` publishes this invariant:

```java
//@INV: getData() != null &&
// (getLeft() == null || getData().compareTo(getLeft().getData()) > 0) &&
// (getRight() == null || getData().compareTo(getRight().getData()) < 0)
```

The implementation inserts by walking `volatile` child pointers with no lock. Show an interleaving that breaks the invariant, and give a locking scheme that preserves it. A later part asks what a readers-writer lock would change.

:::hint
Two inserts can pass the same null check on `left` and both assign it.
:::
:::hint
`volatile` publishes each write. It does not make the check and the write one step.
:::
:::hint
One lock on the node you are about to modify, held from the check through the assignment, is enough if every insert takes locks from the root downward.
:::
:::solution
Start from a node holding 5, with null children. Thread A decides to insert 3 and reads `left == null`. Thread B inserts 4 the same way and writes `left`. Thread A then writes `left` to a node of 3, orphaning 4. The tree no longer contains 4, and any later child of 3 is not ordered against the lost node. The invariant at the root fails as soon as A's write lands on top of a child that was supposed to stay.

Lock each node from the root down, and hold the lock on a node while you read its child and, if you update that child, while you write it. Two inserts then serialize on the first node they both need. A `ReadWriteLock` lets concurrent `contains` calls take the read lock, and `insert` takes the write lock. `contains` during a write waits. That is the gain the question asks you to name: readers overlap, writers still exclude the walk they mutate.
:::
:::

:::problem id=exam-20a-q2 source="Exams/20-a.pdf" kind=exam solution_origin=derived
Two threads share an object and run a method that reads a field, decides, and writes it back, with no lock. List every legal output of the program and justify each. A second part asks which outputs disappear if the method is `synchronized`.

The shape of the program on the paper is two threads calling the same unsynchronized method on one object whose field starts at a known value, each thread printing what it observed.

:::hint
List the sequential histories first. Those are always legal.
:::
:::hint
Then list the histories that tear the read-modify-write. Those are legal only while the method is not atomic.
:::
:::hint
`synchronized` on the method keeps exactly the sequential histories.
:::
:::solution
Every interleaving in which each thread's statements stay in program order is legal. If each thread prints the value it read and then writes a new one, the possible prints are the sequential ones (second thread sees the first thread's write) and the racy ones (both threads read the original value and both print it). Writes of a single `int` reference are atomic, so you will not see a torn integer; you will see a lost update.

After `synchronized`, each call holds the object's monitor for the whole method. One call finishes before the other begins. Only the two sequential outputs remain, in either order. The both-read-the-original output is gone.
:::
:::

:::problem id=exam-20b-q2 source="Exams/20-b.pdf" kind=exam solution_origin=derived
Synchronization with atomic variables. Two threads `t1` and `t2` both call `f()`. Show the races if `f` updates a plain `int`, and rewrite the update with `AtomicInteger` so the posted invariant holds. A CAS loop is the tool the question expects when the new value depends on the old one.

:::hint
`atomic++` is not a method. `addAndGet` and `compareAndSet` are.
:::
:::hint
If the new value is "old plus one", `incrementAndGet` is enough. If it depends on a neighbor in a structure, retry `compareAndSet`.
:::
:::hint
A failed `compareAndSet` means another thread won. Read again and retry. Do not retry blindly without reading.
:::
:::solution
On a plain `int`, both threads can read the same value and both write `value + 1`, so one update disappears. The set of legal results includes every number from the sequential answer down to "only one update stuck."

```java
final AtomicInteger n = new AtomicInteger(0);
int observed;
do {
    observed = n.get();
} while (!n.compareAndSet(observed, observed + 1));
```

`incrementAndGet()` is the same loop inside the library. After both threads finish, `n` is 2. `get` on a third thread sees that value once both CASes have happened; it does not need `volatile` on the side, because the atomic operations already order the writes.
:::
:::

:::problem id=exam-24b-q2 source="Exams/24-b.pdf" kind=exam solution_origin=derived
A `Barrier` lets a fixed set of threads proceed in phases. `await` says "I finished this phase." The caller blocks until every participant has finished it, then all of them enter the next phase.

Implement `await` so that a generation counter prevents a fast thread from sneaking into the following phase and releasing the previous one early. `InterruptedException` must leave the barrier usable.

:::hint
The count of arrivals has to go back to zero for the next phase, and that reset must not release a thread that has not arrived.
:::
:::hint
A generation integer, incremented when the last thread arrives, is the thing each waiter remembers.
:::
:::hint
`wait` in a `while` against that generation, and `notifyAll` from the last arriver.
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

The last thread resets `arrived` and bumps `generation` before waking anyone, so a woken thread that immediately calls `await` again waits for the new generation. A thread that wakes spuriously sees `g == generation` and waits again. On `InterruptedException`, the caller must decrement `arrived` before rethrowing, or the phase never fills. The question's four methods are this `await` plus the constructor and the queries the tests use to read the phase.
:::
:::

:::problem id=exam-24c-q2 source="Exams/24-c.pdf" kind=exam solution_origin=derived
`Set` adds `iterator()` and `clone()` to `contains` and `add`. `SetImpl` is a linked list. An iterator that walks `next` pointers races with `add`. Make `iterator` and `add` safe. Cloning must not publish a structure another thread is in the middle of changing.

:::hint
A fail-fast iterator remembers a version. `add` increments it.
:::
:::hint
`clone` must copy the nodes while holding the same lock `add` holds, or the copy tears.
:::
:::hint
`ConcurrentModificationException` is the usual signal. Returning a snapshot is the other legal design.
:::
:::solution
One lock around `add`, `contains`, `iterator`'s creation, and `clone`. `add` appends a node and increments `modCount`. The iterator copies `modCount` at creation and throws `ConcurrentModificationException` if it changes before `next`. That is the fail-fast contract.

`clone` holds the lock, walks the list, and allocates a new list with the same elements. The returned set has its own nodes and its own lock. Callers who use the clone do not share structure with the source. A snapshot iterator, which copies the elements at `iterator()` time, is the alternative that does not fail fast and also needs the lock only during the copy.
:::
:::

Threads are why a server cannot stop the world inside `accept`. [Networking](topic:networking) is the channel between processes, and [The reactor](topic:reactor) is the server that waits for many of those channels with one thread.
