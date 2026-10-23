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

In this course, **concurrency** (מקביליות) is about shared mutable state inside one process.

- **Goals** — safety (a serial history) and liveness (ready threads make progress).
- **Failures** — races, deadlock, livelock, and starvation.
- **Tools** — threads, locks, and the memory picture that makes sharing possible.

## The memory model under concurrency

- **Shared state:** Several threads execute in that process and read and write the same objects on the heap.
- **Process (תהליך):** Owns an isolated address space.
- **Thread (חוט):** A sequential flow of execution inside that process, with its own stack.
- **Sharing:** Threads share the process heap and the static variables with the other threads.
- **Physical memory (RAM):** A sequence of cells with physical addresses.
- **Virtual memory:** Gives each process a private, contiguous address space; the operating system maps virtual pages to physical frames.
- **Cross-process sharing:** Two processes that use the same virtual address share physical memory only when an explicit shared-memory mapping has been set up.

Each thread keeps its own call stack; threads of the same process share the heap and the static variables.

## Threads in Java

:::definition id=def-thread title="Thread" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A thread is the basic unit of execution inside a process.

- **Call stack:** Each thread has its own call stack.
- **Scheduling:** Distinct threads run at the same time on different processor cores, or the scheduler switches from one to another by a context switch.
:::

In Java, **`Thread`** represents one thread of execution and **`Runnable`** is the task.

- **`Thread.start`:** Begins a new thread—it allocates that thread's stack and then runs the task's `run` on the new thread.
- **Direct `run`:** Runs the task on the caller's thread.
- **`join()`:** Waits until that thread's `run` returns.

```java
public class Task implements Runnable {
    private final FileWriter fw;
    public Task(FileWriter fw) { this.fw = fw; }
    public void run() {
        try { fw.write("x"); } catch (IOException e) { throw new RuntimeException(e); }
    }
}

```

- **`task.run()`:** Runs the body on the current thread.
- **`new Thread(task).start()`:** Runs the same body on a separate thread.

- **Thread confinement:** A local variable that lives on one thread's stack is confined to that thread; only that thread can reach it, so the variable needs no lock.

## Race conditions

- **Safety (היסטוריה טורית):** A concurrent execution is a serial history—equivalent to some sequential order of the same calls.
- **Liveness:** A thread that is ready to run eventually makes progress.
- **Liveness failures:** Deadlock, livelock, and starvation are failures of that condition.

A **data race** (מרוץ) occurs when several threads access a shared location concurrently, at least one access is a write, and the result depends on the interleaving of the operations.

```java
public void increment() { count++; }

```

- **`count++`:** A read-modify-write of three hardware steps—read the value, add 1, and write the new value.
- **Lost update:** Two threads that both read 0 both write 1, and one increment is lost.

![Two threads both read 0, both add 1, and both write 1, so one increment is lost](../../web/public/figures/race-interleaving.svg)

:::definition id=def-critical-section title="Critical section and mutual exclusion" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A **critical section** (אזור קריטי) is a stretch of code that at most one thread may execute at a given moment.

- **Mutual exclusion (מניעה הדדית):** Enforced by a lock (a mutex).
- **`synchronized` method:** Locks the object `this`.
- **`synchronized (obj)` block:** Locks the object `obj`.
:::

- **`volatile`:** Establishes memory visibility for that variable and limits instruction reordering around the access.
- **Visibility** means a later read by another thread observes the write.
- **That read** takes the value from memory and refreshes any older copy held in a register or a private cache.
- **Atomic compound update** such as `count++` is one synchronized action, or one compare-and-swap, covering the read, the modification, and the write.

An **immutable object** is safe for concurrent use because its state is fixed after construction, so no thread can observe it in the middle of a change.

### Synchronization, locks, and atomic variables

- **`wait()`** releases the monitor and waits until another thread calls `notify()` or `notifyAll()`.
- **`notify()`** wakes one waiter. **`notifyAll()`** wakes every waiter.
- **`while` loop** rechecks the condition. A thread can wake early (a spurious wakeup), and the condition may still be false.
- **`ReentrantLock`** is an explicit lock. A fair one grants the lock in the order threads asked for it.
- **`ReadWriteLock`** admits several readers at once, or a single writer.
- **Semaphore (סמפור)** counts permits for a bounded resource.
- **`acquire`** waits until a permit is available and takes it. **`release`** returns a permit.
- **Five permits** admit five threads.
- **Dining philosophers** treat the two forks as semaphores. A philosopher calls `acquire` on each fork, and `release` on each fork when the meal is over.
- **`AtomicInteger` and `AtomicReference`** perform a read-modify-write as one hardware step.
- **Compare-and-swap (CAS)** stores a new value only when the value still equals the one the thread observed. That update is lock-free.

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

- **`volatile`:** Leaves the three machine steps as three steps.
- **Atomic increment:** The increment is one atomic action when those steps run under one lock, or as one compare-and-swap.
:::

## Client-side locking

A **thread-safe class** such as `Vector` in Java promises that each individual method is atomic; a sequence of methods is a separate story.

- **Interleaving gap:** The lock is taken and released inside each method, so the sequence itself is open to interleaving:

```java
if (!v.contains(5))
    v.add(5);

```

- **Race:** Between the call to `contains` and the call to `add`, another thread can insert the element.
- **Client-side locking:** The caller holds the same lock the methods use, across both calls:

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

- **Per-method safety:** Each method is safe on its own.
- **Repair:** The pair becomes one action when the caller locks `v` around both calls, or when the class offers one method that performs both under the same lock.
:::

## Practice

:::problem id=ps6-counter-race title="A counter without a lock" source="materials/sessions/PS6-2026-1.pptx" kind=exercise solution_origin=source
Two threads call `cnt.increment()` on this class. The constructor leaves `count` at 0.

```java
public class Counter {
    private int count;
    public Counter() { count = 0; }
    public void increment() { count++; }
    public int getValue() { return count; }
}
```

:::check id=ps6-counter-race-q1
Which results can two completed calls to `increment` leave in `count`?

- [x] 2, when one call finishes before the other starts
- [ ] 0, because the two writes cancel
- [x] 1, when both threads read 0 before either of them writes

- **Legal results:** Two results are legal—2 from a serial execution, or 1 when both threads read 0 before either writes.
:::

:::check id=ps6-counter-race-q2
The body is {{=read count into a register|lock the object|call wait}}, then {{=add 1 to that register|notify a waiter|call join}}, then {{=write the register back to count|delete count|allocate a new counter}}.

Those are the three steps of `count++`: a read into a register, an add of one, and a write of that register back to `count`.
:::

:::check id=ps6-counter-race-q3
Which repairs match the two failures?

- [ ] `volatile` makes the three steps of `count++` mutually exclusive
- [x] `volatile`, or the same lock on the write and on the read, repairs a stale `getValue`
- [ ] A lock only around `getValue` repairs the lost update
- [x] A lock that makes the three steps mutually exclusive repairs the lost update

- **Stale `getValue`:** `getValue` can observe a stale `count` when no happens-before edge orders a write before that read.
- **Lost update:** The lost update is repaired only by making the three steps mutually exclusive.
:::

:::

:::problem id=ps6-average-safe title="A parallel average" source="materials/sessions/PS6-2026-1.pptx" kind=exercise solution_origin=derived
Each worker adds its slice into a shared `total`. The main thread then calls `join` on every worker and divides by the length.

```java
int total = 0;
// each worker, on its own slice:
total += part;
// main, after every worker has been started:
for (Thread worker : workers) worker.join();
return total / data.length;
```

:::check id=ps6-average-safe-q1
Which verdict matches this function?

- [ ] It is correct, because each `join` makes `total += part` mutually exclusive
- [x] It is incorrect, because `total += part` can lose an addition
- [ ] It is incorrect, because the shared array has a data race
- [ ] It is correct, because the division runs inside each worker

Two workers can lose an addition the same way `count++` loses an increment. The function is incorrect.
:::

:::check id=ps6-average-safe-q2
Which claims hold for this program and for the private-sum repair?

- [x] After every `join` returns, the division observes the workers' writes
- [ ] The shared array is written by more than one worker
- [x] The parent can add each worker's private sum with no lock
- [ ] The private-sum repair still needs a lock in the parent

- **`join` visibility:** Each `join` waits until that worker's `run` returns, so visibility after `join` holds.
- **Private sums:** Each private sum stays confined to its worker until that `join` returns, and the shared array is only read.
:::

:::check id=ps6-average-safe-q3
Give each worker {{=a private sum|the shared total|a lock on the array}}, call {{=join|notify|wait}}, then {{=add the private sums in the parent|divide inside each worker|lock total for the division}}.

Each private sum stays confined to its worker until that worker's `join` returns, so the parent adds the sums with no lock.
:::

:::

:::problem id=ps7-wait-vs-spin title="Three ways to wait" source="materials/sessions/SPL_PS7.pptx" kind=exercise solution_origin=source
A thread can wait for a condition in three ways: busy-waiting, sleep-and-check, and `wait` / `notify`.

:::check id=ps7-wait-vs-spin-q1
The way that blocks, without polling, is {{=wait|busy-waiting|sleep-and-check}}.

- **`wait`:** Parks the thread until `notify` or `notifyAll`.
- **Alternatives:** Busy-waiting keeps testing in a tight loop, and sleep-and-check sleeps between the same tests.
:::

:::check id=ps7-wait-vs-spin-q2
Which claims match the three ways?

- [ ] Busy-waiting spends less processor time than a sleep between attempts
- [x] Busy-waiting reacts at once and occupies a core
- [x] Sleep-and-check notices the condition late, by as much as the sleep interval
- [ ] `wait` keeps testing the condition in a tight loop while it holds the monitor

- **Busy-waiting:** Appropriate only for a wait that is expected to be very short.
- **Sleep-and-check:** Spends less processor time and notices the condition late.
:::

:::check id=ps7-wait-vs-spin-q3
Which fact makes the thread recheck the condition in a `while` loop after `wait`?

- [ ] `wait` returns only when a timeout expires
- [ ] `notifyAll` is illegal on the monitor the thread holds
- [x] A thread can wake early, and `notifyAll` wakes every waiter
- [ ] The thread does not hold the monitor when it calls `wait`

It rechecks the condition in a `while` loop, because it can wake early and because `notifyAll` wakes every waiter. It holds the monitor when it calls `wait`.
:::

:::

:::problem id=ps7-liveness-names title="Names for liveness failures" source="materials/sessions/SPL_PS7.pptx" kind=exercise solution_origin=source
Name each liveness failure:

- **(1):** Two threads each hold one lock and wait for the lock the other holds.
- **(2):** A low-priority thread never obtains the lock, because a high-priority thread keeps taking it.
- **(3):** Two threads lock, notice that the other lock is taken, release, and try again, forever.

:::check id=ps7-liveness-names-q1
(1) is {{=deadlock|livelock|starvation}}. (2) is {{=starvation|deadlock|a data race}}. (3) is {{=livelock|deadlock|mutual exclusion}}.

- **(1):** Both threads are blocked, and each is waiting for a lock the other holds.
- **(2):** The thread is ready to run and the scheduler passes over it indefinitely.
- **(3):** The threads are not blocked.
:::

:::check id=ps7-liveness-names-q2
Which repairs are the right ones?

- [x] A total order on the locks breaks the cycle in (1)
- [ ] Stopping the threads repairs (3), because those threads are blocked
- [x] Fair locks, and holding the resource only for a short time, repair (2)
- [ ] Priority scheduling is the repair for (2)

- **Livelock (3):** Backing off, or a lock order that holds the first lock until the second is acquired, lets one livelocked thread finish.
- **Starvation (2):** Priority scheduling can cause starvation.
:::

:::check id=ps7-liveness-names-q3
Which description of the three failures is right?

- [x] Deadlock leaves both threads blocked, and livelock leaves them running
- [ ] Livelock is the failure in which the threads are blocked
- [ ] Starvation means the thread is blocked inside `wait`
- [ ] All three failures are the same cycle of two locks

- **Deadlock:** Waits for a lock the other thread holds.
- **Livelock:** Spends its time reacting, releasing, and trying again, so no work finishes.
- **Starvation:** Passes over a thread that is ready to run.
:::

:::

:::problem id=ps8-singleton title="A lazy singleton" source="materials/sessions/SPL_PS8.pptx" kind=exercise solution_origin=source
A lazy singleton is written like this:

```java
if (instance == null)
    instance = new ClassicSingleton();
```

Two threads can call the getter. One repair synchronizes the whole getter. Another uses a holder class.

:::check id=ps8-singleton-q1
Which description of the unsynchronized getter is right?

- [ ] The null check and the assignment are one step, so the second thread sees the first object
- [x] Both threads can observe `instance == null` and both construct an object
- [ ] The field keeps every object the threads construct
- [ ] The two threads deadlock on the class lock

- **Outcome:** The field ends as one of those objects; the other object is dropped from the field, and a reader may already have observed it.
- **Pattern:** The race is check-then-act.
:::

:::check id=ps8-singleton-q2
Which claims about synchronizing `getInstance` are true?

- [x] The check and the construction become one critical section, so there is a single instance
- [ ] Later calls skip the lock, because the field no longer changes
- [x] Later calls also take the lock, and threads queue to read a field that no longer changes
- [ ] The queue of later calls is a safety failure, and the check-then-act race remains

Synchronizing the getter removes the race. The queue on later calls is the liveness complaint.
:::

:::check id=ps8-singleton-q3
The holder class stays uninitialized until `getInstance` touches it. The JVM initializes its static `INSTANCE` {{=once|on every call|under the caller's lock}}, and later calls read the field {{=with no lock of their own|inside synchronized|after notifyAll}}.

The initialization happens-before any thread reads the field, so the reference is published safely.
:::

:::check id=ps8-singleton-q4
Which other form is correct?

- [ ] The holder class builds the instance even when no caller asks for it
- [ ] Eager initialization leaves a check-then-act race on the static field
- [x] Eager initialization, a static field on the singleton class itself
- [ ] Dropping the extra object from the field, so a reader cannot have observed it

- **Eager initialization:** Builds the instance even when no caller asks for it.
- **Holder class:** Waits until the first call.
:::

:::

:::problem id=ps8-interrupt title="A stop flag and interrupt" source="materials/sessions/SPL_PS8.pptx" kind=exercise solution_origin=source
A worker loops until `shouldStop` is true. Another thread sets the flag. The worker is inside `sleep`.

:::check id=ps8-interrupt-q1
What does the flag do to a worker that is inside `sleep`?

- [ ] `sleep` returns as soon as `shouldStop` becomes true
- [x] The loop that reads `shouldStop` is suspended, so the thread stays asleep until the timeout
- [ ] The flag sets the interrupt status
- [ ] `sleep` throws `InterruptedException` when the flag changes

While the worker is inside `sleep`, the loop body that reads `shouldStop` does not run. The flag becomes true and the thread stays asleep until the timeout expires.
:::

:::check id=ps8-interrupt-q2
`interrupt` sets the thread's {{=interrupt status|stop flag|monitor}}. `sleep` and `wait` then {{=throw InterruptedException and clear the status|return normally and leave the status set|call stop}}.

The worker's catch block can then leave the loop. A worker that is still executing its loop polls `Thread.currentThread().isInterrupted()` or the flag on each iteration.
:::

:::check id=ps8-interrupt-q3
Which claim about `stop` is right?

- [ ] `stop` is safe, because it sets the interrupt status the way `interrupt` does
- [ ] A running worker calls `stop` on each iteration of its loop
- [ ] The catch block of `sleep` is required to call `stop`
- [x] `stop` cuts the thread off at an arbitrary instruction and can leave an invariant unrestored

`stop()` is unsafe. It leaves an application invariant unrestored, because the thread stops at an arbitrary instruction.
:::

:::

:::examnote
The question gives a shared structure and asks for a race, a deadlock, or a repair that uses `synchronized`, a semaphore, or an atomic variable. The trap is a lock order in which each thread waits forever for a lock the other holds, or a lock that covers the update and leaves the read that publishes the value outside the critical section.
:::

:::problem id=exam-15a-q1 title="Gears" source="materials/exams/15-a.pdf" kind=exam solution_origin=derived
- **`Gear`:** Knows its center, its radius, and its neighbors on the left and on the right; `move` rotates this gear and both neighbors, in the opposite direction.
- **`SimpleGear`:** Stores an angle `_state`; `check` validates constructor arguments.
- **`Spinner`:** A thread calls `move` on a gear.
- **Correct:** The sequence of states is one that a serial history of `move` calls could have produced.

:::check id=exam-15a-q1-q1
Which of these belong to the invariant?

- [x] The radius is positive
- [ ] Left and right may be the same gear
- [x] A neighbor's center lies at a distance of exactly `radius + neighbor.radius` on the x-axis
- [x] `_state` stays in `[0, 360)`

Left and right, when they are set, are distinct gears. `check` rejects a radius of zero or less, and it rejects a center that would break the mesh when the neighbor is already set.
:::

:::check id=exam-15a-q1-q2
Which descriptions of the unsynchronized class are right?

- [x] Two calls to `move` on adjacent gears can apply one gear's angle twice, or lose it
- [ ] Moving the `_state` updates inside `move`, `moveLeft`, and `moveRight` makes the class safe
- [x] Thread A can be inside `g2.moveRight` while thread B writes `_state` between A's read and A's write
- [ ] The class is safe once each gear writes only its own `_state`

Without synchronization the class is unsafe, because the `_state` updates and the recursive calls interleave. Moving those updates inside the three methods still leaves the same lost update.
:::

:::check id=exam-15a-q1-q3
The precondition of `move` requires that the neighbor chain {{=contains no cycle this call would follow forever|is empty|is locked once per gear}}. The postcondition says this gear's angle {{=has changed by its own step|is unchanged|equals the neighbor's angle}} and each neighbor's angle {{=has changed by the opposite step|has changed by the same step|stays at 0}}.

The precondition also requires that the invariant holds. The postcondition includes that the invariant still holds.
:::

:::check id=exam-15a-q1-q4
Several `Spinner` threads overlap their `move` calls, so the run matches no serial history. Which repair does?

- [ ] A lock per gear, taken as this gear and then the neighbor
- [x] One ordered lock along the chain, or one semaphore for the whole mesh
- [ ] Making only `_state` volatile
- [ ] Synchronizing the constructor and leaving `move` unsynchronized

- **Mesh semaphore:** `acquire` takes the mesh permit before the move, and `release` returns it after, so the mesh has one mutual-exclusion permit and no cycle of locks.
- **Per-gear lock:** A lock per gear deadlocks when each `move` locks this gear and then the neighbor.
:::

:::

:::problem id=exam-15b-q1 title="Deadlock among gears" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
The public methods of `SimpleGear` are all `synchronized`. Neighbors call one another's `moveLeft` and `moveRight`, and those calls also need the neighbor's lock.

:::check id=exam-15b-q1-q1
Which interleaving is the deadlock?

- [ ] `A.move` locks A and B, returns, and then `B.move` locks B
- [x] `A.move` locks A and calls `B.moveRight`, which waits for B, while `B.move` locks B and calls `A.moveLeft`, which waits for A
- [ ] Both threads release their own lock before calling the neighbor
- [ ] A and B both wait for a semaphore that neither of them acquired

Each thread is blocked. Each holds one monitor and waits for the lock the other holds.
:::

:::check id=exam-15b-q1-q2
Which repairs keep one `move` atomic with respect to other moves?

- [x] Copy the facts the neighbor call needs, release this gear's lock, and then call the neighbor
- [x] One `Semaphore(1)` for the mesh, with `acquire` before every move and `release` after it
- [ ] A lock per gear, taken in whichever order the call reaches the gears
- [x] A lock per gear in address order, or in left-to-right order

- **Mesh semaphore:** Gives the mesh a single permit and no cycle.
- **Ordered locks:** Make every thread lock the earlier gear first.
:::

:::check id=exam-15b-q1-q3
Which repair does the official solution adopt?

- [ ] The mesh semaphore, because a gear holds the permit only while it copies the facts it needs
- [ ] The address order, because it is finer than narrowing the synchronized regions
- [ ] None of the three, because each of them drops the atomicity of `move`
- [x] Narrowing the synchronization

The lock order and the mesh semaphore are correct, and they are coarser: each holds a resource for the whole call, past the work the critical section needs that resource for.
:::

:::

:::problem id=exam-16b-q1 title="A synchronized queue" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
`SynchQueue` implements `Queue` with every method `synchronized` on `this`. `ExtIntQueue` adds `sum()` over the integers. Mystics look at a fork while they think, and a look is allowed only while nobody is eating with that fork.

:::check id=exam-16b-q1-q1
Which claims belong to the contract of `sum`?

- [x] The precondition is that `size` matches the chain
- [x] The result equals the sum of the integers present at one moment during the call
- [ ] `sum` may add or remove an element while it walks
- [x] `sum` leaves the queue unchanged

The queue's invariant is that `size` matches the chain. `sum` is a query of the integers that were in the queue at one moment.
:::

:::check id=exam-16b-q1-q2
Which interleaving makes the postcondition fail?

- [ ] `sum` holds the lock, so `add` cannot land in the middle of the walk
- [ ] `sum` reads every element, then `add` and `remove` run, so the sum matches the later state
- [x] `sum` reads 1 and 2, another thread adds 10 and removes 1, then `sum` reads the rest
- [ ] `sum` is not synchronized, so it never sees the elements that are already in the queue

The sum matches no single state of the queue. An `add` and a `remove` landed in the middle of a walk that held no lock.
:::

:::check id=exam-16b-q1-q3
`sum` records a {{=volatile version|lock on this|copy of every node}} that grows at the end of every mutator, walks {{=without holding the lock|inside synchronized|under a semaphore}}, and {{=tries again when the version has changed|returns the partial sum|calls notifyAll}}.

- **Termination:** A bounded number of attempts can fall back to a locked walk, so the method is wait-free only in the quiet case and still terminates when writers keep arriving.
- **Version field:** Tells the walker that the structure moved under it.
:::

:::check id=exam-16b-q1-q4
Which claims match the adapted dining-philosophers protocol?

- [ ] A looker may hold a fork while an eater holds that same fork
- [x] A fork someone is eating with is held exclusively
- [x] Two mystics can look at one fork together
- [ ] Eating and looking both take one exclusive permit, so two mystics cannot look at the same fork

Looking can use the read side of a `ReadWriteLock`, or a separate counter of lookers. Eating takes the write side, so the eater waits until the lookers leave, and a looker waits while an eater holds the fork.
:::

:::

:::problem id=exam-17a-q1 title="A board with a cup" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
- **Board:** An `N` by `N` board starts with one cup and several players.
- **Players:** Each player has a `Strategy` that chooses a `Direction`; a player who reaches the cup ends the game.
- **Requirement:** Locks are required.

:::check id=exam-17a-q1-q1
Each player's `run` asks the strategy, calls {{=board.move|Thread.stop|board.notify}}, and stops when the result is {{=WIN or LOST|SUCCESS|FAIL only}}. `main` starts each player with {{=Thread.start|run|wait}} and then calls {{=join|notifyAll|sleep}}.

Each player is a `Runnable`. Each `join` waits until that player's `run` returns.
:::

:::check id=exam-17a-q1-q2
Which of these make `move` return `FAIL`?

- [x] The game has already ended
- [x] The step would leave the board
- [x] The step would land on another player
- [ ] The destination is the cup

The destination cup returns `WIN` and sets the end flag. Otherwise the method returns `SUCCESS` and updates the player's position.
:::

:::check id=exam-17a-q1-q3
Which description of the board lock is right?

- [x] `move` is synchronized on the board, and the check and the update hold that lock for the whole critical section
- [ ] `move` is unsynchronized, and only the end flag is volatile
- [ ] Each cell has its own lock, taken after the strategy runs
- [ ] A strategy that reads only immutable data must lock the board

Two players cannot both write the same cell. A strategy that reads only immutable data needs no lock.
:::

:::

:::problem id=exam-17b-q1 title="Looking ahead on the board" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
- **Board:** Players on a board of `N` by `N` can `move` one step, or call `lookAhead`, which returns the distance to the nearest object or to the edge.
- **`Segment`:** Can test intersection, and it is already implemented; it is thread-safe when the caller leaves it unchanged and is an immutable value.
- **Concurrency:** Several player threads call `move` and `lookAhead`.

:::check id=exam-17b-q1-q1
Which claims belong to the contract of `lookAhead`?

- [ ] The method may move the player while it measures the distance
- [x] `dir` is a legal direction, and the player's position is on the board
- [x] The result counts steps along `dir` until the first other player, the cup, or the edge
- [x] The distance comes from the board state at one moment during the call, and the method leaves the board unchanged

The precondition is a legal direction and a position on the board. The postcondition is that distance on one board state, and the call does not change the board.
:::

:::check id=exam-17b-q1-q2
Which locking is right?

- [ ] `lookAhead` is synchronized and `move` is not, because a query needs the lock and an update does not
- [x] Both `move` and `lookAhead` are synchronized on the board
- [ ] Neither method takes a lock, because `Segment` is immutable
- [ ] `lookAhead` locks the `Segment`, and `move` locks the player

The lock makes the walk observe one layout. `move` updates a position only while it holds the same lock, and it returns `WIN` when the destination is the cup.
:::

:::check id=exam-17b-q1-q3
`lookAhead` builds a {{=Segment|Semaphore|Barrier}} from the player's cell and walks until {{=intersect|wait|compareAndSet}} hits another object's cell or the edge. `move` returns {{=WIN|FAIL|LOST}} when the destination is the cup.

The walk follows `intersect` to another object's cell or the edge. The same board lock covers that walk and the position update in `move`.
:::

:::

:::problem id=exam-18b-q2 title="Two stacks in deadlock" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
- **Invariant:** A bounded `Stack` has `0 <= size() <= capacity()`; `push` and `pop` can fail their preconditions.
- **Locking:** The methods lock the `Stack` they belong to, and a `push` that moves a value from one `Stack` into the other locks both.
- **Threads:** `T1` and `T2` use stacks `S1` and `S2`.

:::check id=exam-18b-q2-q1
Which pair enters deadlock?

- [ ] `T1` calls `S1.pop` and `T2` calls `S1.pop`, and both then wait for `S2`
- [ ] Both threads lock the lower identity first, then wait for each other
- [x] `T1` locks `S1` inside `S1.push` and then waits for `S2`, while `T2` locks `S2` inside `S2.push` and then waits for `S1`
- [ ] `T1` locks `S1` and `S2`, returns, and then `T2` locks `S2` and `S1`

The value pushed from `S1` is a structure tied to `S2`, so the transfer locks the destination and then the source. Each thread is blocked.
:::

:::check id=exam-18b-q2-q2
Which claims describe that deadlock?

- [ ] The thread that locked its stack first returns from `pop`
- [x] Each thread holds the monitor of one `Stack` and waits for the lock the other holds
- [ ] The cycle is avoided, because each `push` locks only one `Stack`
- [x] Neither `pop` nor `push` returns

Each thread holds one monitor and waits for the other. The calls do not return.
:::

:::check id=exam-18b-q2-q3
The repair is one order. In both threads, lock the `Stack` with the {{=lower identity|higher capacity|lock already held}} first.

That order removes the cycle. The same cycle appears when `Image.mix` locks two images in opposite orders.
:::

:::

:::problem id=exam-19b-q2 title="A sorted tree" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
`SortedBinaryTree` states this invariant:

```java
//@INV: getData() != null &&
// (getLeft() == null || getData().compareTo(getLeft().getData()) > 0) &&
// (getRight() == null || getData().compareTo(getRight().getData()) < 0)
```

- **Insertion:** Walks the child pointers; those pointers are `volatile`, and the walk takes no lock.
- **Alternative:** A readers-writer lock is available for the same tree.

:::check id=exam-19b-q2-q1
Start from a node that holds 5, with null children. Which interleaving breaks the invariant?

- [ ] Both threads lock the root, so the second insert waits and the tree keeps 4
- [x] A reads `left == null` to insert 3, B writes the node 4 into `left`, then A overwrites `left` with the node 3
- [ ] A and B both write `right`, and the `compareTo` order stays true
- [ ] The `volatile` pointers make the null check and the assignment one step, so the second insert sees the first child

4 is left with no parent, so the tree no longer contains 4. The invariant at the root fails when A's write lands on top of a child that should have stayed.
:::

:::check id=exam-19b-q2-q2
Lock every node from the {{=root downward|leaf upward|left child only}}. Hold the lock on a node while the insertion {{=reads that node's child|calls wait|releases the parent}}, and, when the insertion updates that child, hold the same lock while it {{=writes the child|calls notifyAll|reads the root}}.

Two insertions then run one after another on the first node that both of them need.
:::

:::check id=exam-19b-q2-q3
What does a `ReadWriteLock` change?

- [ ] `insert` takes the read lock, and `contains` takes the write lock
- [ ] A `contains` that arrives during a write proceeds, because the read lock is shared with the writer
- [ ] Readers and a writer all run together on the node being changed
- [x] Concurrent `contains` calls take the read lock and overlap, and `insert` takes the write lock

A `contains` that arrives during a write waits. Readers overlap with one another, and a writer excludes the walk it is modifying.
:::

:::

:::problem id=exam-20a-q2 title="Output of two threads" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
Two threads run this program.

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

:::check id=exam-20a-q2-q1
Which output is possible?

- [ ] 23
- [ ] 32
- [x] 22
- [ ] 33

Both threads hold the `A` whose `i` is 2. The only output is `22`.
:::

:::check id=exam-20a-q2-q2
Which fact keeps 3 out of the output?

- [x] Each `Task` stores the object it received, and `a = new A(3)` updates only `main`'s local variable
- [ ] `t2` starts after that assignment, so `t2` prints 3
- [ ] Both threads read `main`'s variable `a` inside `run`
- [ ] The constructor writes 3 into the object passed to both tasks

No thread reads that local variable. Both threads hold the `A` whose `i` is 2.
:::

:::check id=exam-20a-q2-q3
The constructor's write happens before {{=start|the assignment a = new A(3)|join}}, and `start` happens before {{=run|main assigns 3|notify}}, so both threads print {{=2|3|23}}.

The line `a = new A(3)` stores a different object in `main`'s local variable. The constructor's write of 2 happens before `start`, and `start` happens before `run`.
:::

:::

:::problem id=exam-20b-q2 title="An atomic update" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
Two threads, `t1` and `t2`, both call `f()`. One version of `f` updates a plain `int`. Another uses `AtomicInteger` when the new value depends on the old one.

:::check id=exam-20b-q2-q1
Which outcomes are possible when both threads update a plain `int` by storing the value they read, plus one?

- [x] The result of a serial history of the two calls
- [ ] A result in which both updates are stored twice
- [x] The case in which only one update is stored
- [ ] No result, because a plain `int` forbids concurrent reads

Both threads can read the same value and both can write that value plus one, so one update disappears. The legal results run from a serial history down to the case in which only one update is stored.
:::

:::check id=exam-20b-q2-q2
Which body is the compare-and-swap loop?

```java
final AtomicInteger n = new AtomicInteger(0);
int observed;
do {
    observed = n.{{=get|incrementAndGet|notify}}();
} while (!n.compareAndSet(observed, {{=observed + 1|observed|1}}));
```

`incrementAndGet` is that same loop inside the library. A thread that loses the compare-and-swap reads again and retries.
:::

:::check id=exam-20b-q2-q3
After both threads finish that loop, which claim holds?

- [ ] `n` is 1, because a failed compare-and-swap drops that thread's update
- [ ] The field still needs a separate `volatile` modifier
- [x] `n` is 2, and a thread that loses the compare-and-swap retries without waiting on a lock
- [ ] A third thread's `get` observes the value only after `notifyAll`

- **Final value:** A `get` on a third thread observes 2 once both compare-and-swap operations have completed.
- **Ordering:** The atomic operations already order the writes, so the field needs no separate `volatile` modifier, and no thread waits on a lock.
:::

:::

:::problem id=exam-24b-q2 title="A thread barrier" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
- **`Barrier`:** Lets a fixed group of threads advance in phases.
- **`await`:** Means the caller has finished this phase; the caller blocks until every participant has finished the phase, and then every participant enters the next phase.
- **Generation counter:** Stops a fast thread from entering the next phase and releasing the previous phase early.
- **`InterruptedException`:** Must leave the barrier usable for the threads that remain.

:::check id=exam-24b-q2-q1
`arrived` counts threads that have reached this phase, and `parties` is the size of the group. Which body is correct for the last arrival?

```java
if (arrived == parties) {
    arrived = 0;
    {{=generation++|notifyAll()|wait()}};
    {{=notifyAll()|generation++|arrived++}};
    return 0;
}
```

The last thread resets `arrived` and advances `generation` before it wakes anyone. A thread that woke and immediately calls `await` again waits for the new generation.
:::

:::check id=exam-24b-q2-q2
On `InterruptedException`, the caller {{=decrements arrived|increments generation|calls notifyAll}} before it rethrows. Otherwise {{=the phase never fills|the generation wraps|the lock is released twice}}.

The caller decrements `arrived` before it rethrows. Otherwise the phase never fills, and the remaining threads wait forever.
:::

:::check id=exam-24b-q2-q3
The caller stored the generation it saw in `g`. A waiter that wakes early, or because `notifyAll` woke every waiter, does which of these?

- [ ] Returns 1, because `notifyAll` means this phase is done
- [x] Sees `g == generation` and waits again
- [ ] Calls `notifyAll` itself
- [ ] Decrements `arrived` and leaves the barrier

The waiter remembered generation `g`. While `g == generation`, it calls `wait` again.
:::

:::

:::problem id=exam-24c-q2 title="A thread-safe set" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived
- **`Set`:** Adds `iterator()` and `clone()` to `contains` and `add`; `SetImpl` is a linked list.
- **Iterator:** Walks `next` pointers and can run at the same time as `add`.
- **`clone`:** Publishes a private structure, and every node in that structure is one the clone finished copying.

:::check id=exam-24c-q2-q1
Which of these run under the one lock?

- [ ] Every later `next` on a snapshot iterator, after the elements were copied
- [x] `add`, which links a new node and increments `modCount`
- [x] `contains`
- [x] `clone`

The same lock also covers creation of the iterator. A snapshot iterator needs the lock only for the duration of the copy, then serves that copy.
:::

:::check id=exam-24c-q2-q2
`add` increments {{=modCount|the iterator cursor|the list capacity}}. The iterator copies that value when it is created and throws {{=ConcurrentModificationException|InterruptedException|the copied nodes}} if the value changes before {{=next|clone|wait}}.

That is the fail-fast contract. The version tells the walker that a mutator changed the list under it.
:::

:::check id=exam-24c-q2-q3
Which description of `clone` is right?

- [ ] `clone` copies the nodes without the lock, because the new list is private
- [ ] The copy shares nodes with the original and shares its lock
- [x] `clone` holds the lock, and the set it returns has its own nodes and its own lock
- [ ] `clone` may publish a node the copy has not finished writing

`clone` walks the list and allocates a new list with the same elements. Callers of the copy share no structure with the original, so the copy publishes only state that the clone finished writing.
:::

:::

A server that blocks inside **`accept`** stalls every other client for the length of that call, which is why the wait is handed to another thread.

- **[Networking](topic:networking):** The channel between processes.
- **[The reactor](topic:reactor):** The server that waits on many such channels with one thread.

Chapter 8 reprints the figure from the [memory model](topic:memory-model) and places a page table under it.

- **Page fault:** A reference can miss when its page is absent from RAM, and the operating system brings the page in.
- **Java load:** A Java variable shows the value after that load.
- **Thread layout:** Threads of one process share the heap and the static variables, and each thread keeps its own stack.
