---
id: concurrency
title: Concurrency
sources:
  - "materials/lectures/Chapter 8 - Concurrency.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/PS6-2026-1.pptx"
  - "materials/sessions/SPL_PS7.pptx"
  - "materials/sessions/SPL_PS8.pptx"
  - "materials/sessions/SPL_PS10.pptx"
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

In this course, **concurrency** (מקביליות) means several threads inside one process that read and change the same data.

- **The two goals:** safety, meaning the result is as if the calls ran one after another, and liveness, meaning threads that are ready to run eventually make progress.
- **What can go wrong:** race conditions, deadlock, livelock, and starvation.
- **The tools:** threads, locks, and other synchronization tools, built on the memory picture that lets threads share data.

## The memory model under concurrency

- **A process (תהליך)** has its own address space, which no other process can see.
- **A thread (חוט)** is one sequential flow of execution inside a process. Each thread has its own stack.
- **What threads share:** all the threads of a process share its heap and its static variables, so they can read and write the same objects.
- **Physical memory (RAM)** is a sequence of cells, each with a physical address.
- **Virtual memory** gives each process its own private address space. The operating system maps the process's virtual pages onto physical frames in RAM.
- **Between processes:** two processes share no memory, even at the same virtual address, unless a shared-memory mapping is set up explicitly.

In short, each thread keeps its own call stack, while the threads of one process share the heap and the static variables.

## Threads in Java

:::definition id=def-thread title="Thread" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A thread is the basic unit of execution inside a process.

- **Its own stack:** each thread has its own call stack.
- **How threads run:** different threads either run truly at the same time on different processor cores, or share one core, with the scheduler switching between them (a context switch).
:::

In Java, a **`Thread`** object represents one thread of execution, and a **`Runnable`** is the task it runs.

- **`thread.start()`** creates a new thread, with its own stack, and runs the task's `run` method on it.
- **Calling `run()` directly** does not create a thread. It just runs the task on the current thread, like any other method call.
- **`thread.join()`** waits until that thread's `run` has returned.

```java
public class Task implements Runnable {
    private final FileWriter fw;
    public Task(FileWriter fw) { this.fw = fw; }
    public void run() {
        try { fw.write("x"); } catch (IOException e) { throw new RuntimeException(e); }
    }
}

```

- **`task.run()`** runs the body on the current thread.
- **`new Thread(task).start()`** runs the same body on a new, separate thread.
- **Thread confinement:** a local variable lives on its own thread's stack, so no other thread can reach it, and it never needs a lock.

## Race conditions

- **Safety (היסטוריה טורית):** a concurrent run is safe if its result equals some serial history, that is, the result of running the same calls one after another in some order.
- **Liveness:** every thread that is ready to run eventually makes progress.
- **Liveness failures:** deadlock, livelock, and starvation are the ways liveness can fail.

A **race condition** (מרוץ) happens when several threads access the same data at the same time, at least one of them writes it, and the result depends on how their steps happen to interleave.

```java
public void increment() { count++; }

```

- **`count++` is not one step.** It is a read-modify-write made of three steps: read the value, add 1, and write the new value back.
- **The lost update:** if two threads both read 0, both compute 1 and both write 1, so one of the two increments is lost.

![Two threads both read 0, both add 1, and both write 1, so one increment is lost](../../web/public/figures/race-interleaving.svg)

:::definition id=def-critical-section title="Critical section and mutual exclusion" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A **critical section** (אזור קריטי) is a stretch of code that at most one thread may execute at a given moment.

- **Mutual exclusion (מניעה הדדית)** is the guarantee that only one thread at a time is inside the critical section. A lock, also called a mutex, enforces it.
- **A `synchronized` method** locks the object `this` for the whole method.
- **A `synchronized (obj)` block** locks the object `obj` for the length of the block.
:::

- **`volatile`** guarantees visibility for a variable, and limits how the compiler and processor may reorder instructions around it.
- **Visibility** means that once one thread writes the variable, a later read by another thread sees the new value, rather than an old copy kept in a register or cache.
- **`volatile` does not make `count++` atomic.** For that, the read, the change, and the write must happen as one action: inside one `synchronized` block, or as one compare-and-swap.

An **immutable object** is always safe to share between threads. Its state never changes after construction, so no thread can ever see it in the middle of a change.

### Synchronization, locks, and atomic variables

- **`wait()`** releases the object's lock (its monitor) and sleeps until another thread calls `notify()` or `notifyAll()` on the same object.
- **`notify()`** wakes one waiting thread, and **`notifyAll()`** wakes all of them.
- **Always call `wait()` inside a `while` loop** that rechecks the condition. A thread can wake up without being notified (a spurious wakeup), or find that another thread already changed the condition.
- **`ReentrantLock`** is an explicit lock object. A fair `ReentrantLock` hands out the lock in the order the threads asked for it.
- **`ReadWriteLock`** allows either many readers at once, or a single writer.
- **A semaphore (סמפור)** holds a number of permits for a limited resource. `acquire` waits until a permit is free and takes it, and `release` gives one back. A semaphore with five permits lets five threads in at once.
- **Dining philosophers:** each fork can be a semaphore with one permit. A philosopher calls `acquire` on both forks before eating, and `release` on both afterward.
- **`AtomicInteger` and `AtomicReference`** perform a whole read-modify-write as one atomic step.
- **Compare-and-swap (CAS)** writes a new value only if the variable still holds the value the thread read earlier. Otherwise it fails, and the thread can retry. No lock is involved, so it is lock-free.

### Liveness hazards

:::definition id=def-liveness title="Deadlock, livelock, and starvation" source="materials/lectures/Chapter 8 - Concurrency.pptx"

- **Deadlock (נעילה הדדית):** two or more threads are blocked forever, each waiting for a lock that another one holds. The usual fix is to make every thread acquire locks in the same global order.
- **Livelock:** the threads are not blocked, but they spend all their time reacting to each other, so none of them gets any work done.
- **Starvation (הרעבה):** a thread that is ready to run is passed over again and again, because other threads keep getting the resource first.
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

At the end, `count` holds 1, although any serial order of the two calls would give 2. Declaring `increment` `synchronized` makes the three steps one critical section, so this interleaving can no longer happen.
:::
:::

:::check id=chk-volatile
Two threads execute `count++` on a field declared `volatile int`. Is the increment atomic?

- [ ] Yes. `volatile` makes the operation atomic
- [x] No. `volatile` guarantees memory visibility only, and a read-modify-write needs synchronization
- [ ] Yes. Writes of an `int` are atomic in hardware

- **`volatile` only affects visibility:** `count++` is still three separate steps, and another thread can still slip in between them.
- **To make the increment atomic,** run the three steps under one lock, or use a compare-and-swap, for example with `AtomicInteger`.
:::

## Client-side locking

A **thread-safe class**, such as Java's `Vector`, promises that each individual method is atomic. It promises nothing about a sequence of several calls.

- **The gap between calls:** each method takes and releases the lock by itself, so another thread can run between two calls, as in this code.

```java
if (!v.contains(5))
    v.add(5);

```

- **The race:** between `contains` and `add`, another thread can add 5, so 5 ends up in the vector twice.
- **The fix, client-side locking:** the caller holds the same lock that the methods use, here the vector itself, around both calls.

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

- **Each method is safe on its own,** but the lock is released after `contains` returns, before `add` starts.
- **The fix:** make the pair one action, either by having the caller lock `v` around both calls, or by giving the class a single method that does both under its lock.
:::


## The same lock in C++

The practical session translates the Java lock and thread into C++.

- **`std::lock_guard<std::mutex>`** locks the mutex when it is created, and unlocks it automatically when it goes out of scope, even on an early return. It is the RAII version of `synchronized (mutex)`.
- **`std::thread`** runs a function on a new thread, and `join` waits until that function returns.
- **A common mistake:** if a `std::thread` object is destroyed while it is still joinable, meaning neither `join` nor `detach` was called, the program calls `std::terminate`.

## Practice

:::problem id=ps6-counter-race title="A counter without a lock" source="materials/sessions/PS6-2026-1.pptx" kind=exercise solution_origin=source
Two threads each call `cnt.increment()` once on the same object of this class. The constructor starts `count` at 0.

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

- **The result can be 2:** when one call finishes before the other starts, as in a serial run.
- **The result can be 1:** when both threads read 0 before either one writes, so one increment is lost.
- **The result cannot be 0:** each thread writes at least the value 1.
:::

:::check id=ps6-counter-race-q2
The body is {{=read count into a register|lock the object|call wait}}, then {{=add 1 to that register|notify a waiter|call join}}, then {{=write the register back to count|delete count|allocate a new counter}}.

Those are the three steps of `count++`: read `count` into a register, add 1 to the register, and write the register back to `count`.
:::

:::check id=ps6-counter-race-q3
Which repairs match the two failures?

- [ ] `volatile` makes the three steps of `count++` mutually exclusive
- [x] `volatile`, or the same lock on the write and on the read, repairs a stale `getValue`
- [ ] A lock only around `getValue` repairs the lost update
- [x] A lock that makes the three steps mutually exclusive repairs the lost update

- **The class has two separate failures.** `increment` can lose updates, and `getValue` can return a stale value that another thread has already changed.
- **Fixing the stale read:** make `count` `volatile`, or use the same lock for both the write and the read, so that the write is guaranteed to be visible (it "happens before" the read).
- **Fixing the lost update:** only making the three steps of `count++` mutually exclusive helps. `volatile` does not, and a lock around `getValue` alone does not.
:::

:::

:::problem id=ps6-average-safe title="A parallel average" source="materials/sessions/PS6-2026-1.pptx" kind=exercise solution_origin=derived
Each worker sums its own slice of an array and adds the result into a shared `total`. The main thread then waits for every worker with `join`, and divides by the array's length.

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

`total += part` is a read-modify-write, just like `count++`, so two workers can lose an addition. `join` only waits for the workers; it does not make their updates mutually exclusive. The function is incorrect.
:::

:::check id=ps6-average-safe-q2
Which claims hold for this program and for the private-sum repair?

- [x] After every `join` returns, the division observes the workers' writes
- [ ] The shared array is written by more than one worker
- [x] The parent can add each worker's private sum with no lock
- [ ] The private-sum repair still needs a lock in the parent

- **`join` guarantees visibility:** once `join` returns, everything that worker wrote is visible to the main thread.
- **The private-sum fix:** each worker keeps its sum in a private variable, so no other thread touches it until the worker ends. The parent then adds the sums after the `join`s, with no lock.
- **The shared array is only read,** never written, so reading it needs no lock.
:::

:::check id=ps6-average-safe-q3
Give each worker {{=a private sum|the shared total|a lock on the array}}, call {{=join|notify|wait}}, then {{=add the private sums in the parent|divide inside each worker|lock total for the division}}.

Each worker writes only its own private sum, and the parent reads those sums only after `join`, so no two threads ever touch the same variable at the same time. No lock is needed.
:::

:::

:::problem id=ps7-wait-vs-spin title="Three ways to wait" source="materials/sessions/SPL_PS7.pptx" kind=exercise solution_origin=source
A thread can wait for a condition to become true in three ways: busy-waiting, sleep-and-check, or `wait` and `notify`.

:::check id=ps7-wait-vs-spin-q1
The way that blocks, without polling, is {{=wait|busy-waiting|sleep-and-check}}.

- **`wait`** puts the thread to sleep until another thread calls `notify` or `notifyAll`, so it uses no CPU while waiting.
- **Busy-waiting** keeps testing the condition in a tight loop.
- **Sleep-and-check** tests the condition, sleeps for a while, and tests again.
:::

:::check id=ps7-wait-vs-spin-q2
Which claims match the three ways?

- [ ] Busy-waiting spends less processor time than a sleep between attempts
- [x] Busy-waiting reacts at once and occupies a core
- [x] Sleep-and-check notices the condition late, by as much as the sleep interval
- [ ] `wait` keeps testing the condition in a tight loop while it holds the monitor

- **Busy-waiting** notices the change immediately, but keeps a CPU core fully busy, so it suits only very short waits.
- **Sleep-and-check** uses much less CPU time, but may notice the change late, by up to one sleep interval.
- **`wait`** does not loop at all. It releases the monitor and sleeps until it is notified.
:::

:::check id=ps7-wait-vs-spin-q3
Which fact makes the thread recheck the condition in a `while` loop after `wait`?

- [ ] `wait` returns only when a timeout expires
- [ ] `notifyAll` is illegal on the monitor the thread holds
- [x] A thread can wake early, and `notifyAll` wakes every waiter
- [ ] The thread does not hold the monitor when it calls `wait`

The thread must recheck the condition in a `while` loop, because it can wake up without the condition being true: spuriously, or because `notifyAll` woke every waiter and another thread got there first. Note that a thread must hold the monitor when it calls `wait`.
:::

:::

:::problem id=ps7-liveness-names title="Names for liveness failures" source="materials/sessions/SPL_PS7.pptx" kind=exercise solution_origin=source
Name each of these liveness failures.

- **(1)** Two threads each hold one lock, and each waits for the lock the other holds.
- **(2)** A low-priority thread never gets the lock, because a high-priority thread keeps taking it first.
- **(3)** Two threads each take one lock, see that the other lock is taken, release their own, and try again, forever.

:::check id=ps7-liveness-names-q1
(1) is {{=deadlock|livelock|starvation}}. (2) is {{=starvation|deadlock|a data race}}. (3) is {{=livelock|deadlock|mutual exclusion}}.

- **(1) is deadlock:** both threads are blocked, each waiting for a lock the other holds.
- **(2) is starvation:** the thread is ready to run, but it is passed over indefinitely.
- **(3) is livelock:** the threads are not blocked; they keep running, but make no progress.
:::

:::check id=ps7-liveness-names-q2
Which repairs are the right ones?

- [x] A total order on the locks breaks the cycle in (1)
- [ ] Stopping the threads repairs (3), because those threads are blocked
- [x] Fair locks, and holding the resource only for a short time, repair (2)
- [ ] Priority scheduling is the repair for (2)

- **Deadlock (1):** if every thread takes the locks in the same order, no cycle of waiting can form.
- **Starvation (2):** fair locks, and holding the resource only briefly, give every thread its turn. Priority scheduling is not the fix; it is what caused the starvation here.
- **Livelock (3):** the threads are running, not blocked, so stopping them is not a repair. Waiting a random time before retrying (backing off), or a lock order, lets one of them finish.
:::

:::check id=ps7-liveness-names-q3
Which description of the three failures is right?

- [x] Deadlock leaves both threads blocked, and livelock leaves them running
- [ ] Livelock is the failure in which the threads are blocked
- [ ] Starvation means the thread is blocked inside `wait`
- [ ] All three failures are the same cycle of two locks

- **In a deadlock,** the threads are blocked, each waiting for a lock the other holds.
- **In a livelock,** the threads keep running, reacting, releasing, and retrying, but no work finishes.
- **In starvation,** one ready thread is repeatedly passed over. It is not necessarily blocked inside `wait`.
:::

:::

:::problem id=ps8-singleton title="A lazy singleton" source="materials/sessions/SPL_PS8.pptx" kind=exercise solution_origin=source
A lazy singleton creates its single instance only on first use. It is written like this.

```java
if (instance == null)
    instance = new ClassicSingleton();
```

Two threads may call the getter at the same time. One fix makes the whole getter `synchronized`. Another uses a holder class.

:::check id=ps8-singleton-q1
Which description of the unsynchronized getter is right?

- [ ] The null check and the assignment are one step, so the second thread sees the first object
- [x] Both threads can observe `instance == null` and both construct an object
- [ ] The field keeps every object the threads construct
- [ ] The two threads deadlock on the class lock

- **What goes wrong:** both threads can see `instance == null` before either assigns it, so both create an object.
- **The result:** the field ends up holding one of the two objects. The other is lost, but a caller may already be using it, so the program has two "single" instances.
- **The name of this pattern:** a check-then-act race.
:::

:::check id=ps8-singleton-q2
Which claims about synchronizing `getInstance` are true?

- [x] The check and the construction become one critical section, so there is a single instance
- [ ] Later calls skip the lock, because the field no longer changes
- [x] Later calls also take the lock, and threads queue to read a field that no longer changes
- [ ] The queue of later calls is a safety failure, and the check-then-act race remains

Synchronizing the getter fixes the race, so there is exactly one instance. The cost is performance: every later call still takes the lock, so threads wait in line just to read a field that never changes again.
:::

:::check id=ps8-singleton-q3
The holder class stays uninitialized until `getInstance` touches it. The JVM initializes its static `INSTANCE` {{=once|on every call|under the caller's lock}}, and later calls read the field {{=with no lock of their own|inside synchronized|after notifyAll}}.

The JVM guarantees that a class is initialized exactly once, and that the initialization is complete before any thread can use the class. So `INSTANCE` is created once and is safely visible to every thread, without any lock in `getInstance`.
:::

:::check id=ps8-singleton-q4
Which other form is correct?

- [ ] The holder class builds the instance even when no caller asks for it
- [ ] Eager initialization leaves a check-then-act race on the static field
- [x] Eager initialization, a static field on the singleton class itself
- [ ] Dropping the extra object from the field, so a reader cannot have observed it

- **Eager initialization** is also correct: the singleton class itself has a static field holding the instance, which the JVM creates once when the class is initialized. There is no check-then-act race.
- **The difference:** eager initialization builds the instance even if no one ever asks for it, while the holder class waits until the first call.
:::

:::

:::problem id=ps8-interrupt title="A stop flag and interrupt" source="materials/sessions/SPL_PS8.pptx" kind=exercise solution_origin=source
A worker thread loops until a flag, `shouldStop`, becomes true. Another thread sets the flag while the worker is sleeping inside `sleep`.

:::check id=ps8-interrupt-q1
What does the flag do to a worker that is inside `sleep`?

- [ ] `sleep` returns as soon as `shouldStop` becomes true
- [x] The loop that reads `shouldStop` is suspended, so the thread stays asleep until the timeout
- [ ] The flag sets the interrupt status
- [ ] `sleep` throws `InterruptedException` when the flag changes

Setting a flag does not wake anyone. While the worker is inside `sleep`, its loop is not running, so nothing reads `shouldStop`. The worker sleeps until the timeout expires, and only then sees the flag.
:::

:::check id=ps8-interrupt-q2
`interrupt` sets the thread's {{=interrupt status|stop flag|monitor}}. `sleep` and `wait` then {{=throw InterruptedException and clear the status|return normally and leave the status set|call stop}}.

`interrupt` does wake a sleeping thread: `sleep` or `wait` throws `InterruptedException`, and the worker's catch block can leave the loop. A worker that is busy running, not sleeping, should check `Thread.currentThread().isInterrupted()` (or the flag) on every iteration.
:::

:::check id=ps8-interrupt-q3
Which claim about `stop` is right?

- [ ] `stop` is safe, because it sets the interrupt status the way `interrupt` does
- [ ] A running worker calls `stop` on each iteration of its loop
- [ ] The catch block of `sleep` is required to call `stop`
- [x] `stop` cuts the thread off at an arbitrary instruction and can leave shared state half-updated

`stop()` is deprecated because it is unsafe. It kills the thread at whatever instruction it happens to be on, possibly in the middle of updating shared data, and leaves that data half-updated.
:::

:::

:::problem id=ps10-lock-guard title="A lock in C++" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
This Java code locks a mutex around a print, then starts a worker thread and waits for it. The exercise translates it into C++.

```java
synchronized (mutex) {
    System.out.println(taskId);
}
Thread worker = new Thread(task);
worker.start();
worker.join();
```

:::check id=ps10-lock-guard-q1
Which body is the lock inside `Task::run`?

- [ ] `mutex.lock();` at the start of `run`, with no unlock
- [x] `std::lock_guard<std::mutex> guard(mutex);`
- [ ] `std::thread guard(mutex);`

`std::lock_guard<std::mutex> guard(mutex);` locks the mutex when `guard` is created and unlocks it automatically when `guard` goes out of scope, even on return. That makes it the RAII replacement for `synchronized`. Calling `mutex.lock()` with no unlock would leave the mutex locked forever.
:::

:::check id=ps10-lock-guard-q2
Which body starts the thread and waits for it?

- [x] `std::thread th1(&Task::run, &task1);` then `th1.join();`
- [ ] `task1.run();` then `task1.join();`
- [ ] `std::thread th1(task1);` then `th1.detach();`

The translation creates `Task task1(1, mutex);`, then starts `std::thread th1(&Task::run, &task1);`, which runs `task1.run()` on a new thread, and finally waits with `th1.join();`. Calling `task1.run()` directly would not create a thread at all.
:::

:::check id=ps10-lock-guard-q3
If the destructor of `th1` runs while the thread is still joinable, the program calls {{=std::terminate|std::exit|std::join}}.

Every `std::thread` must be joined or detached before its destructor runs. If it is destroyed while still joinable, the program calls `std::terminate` and ends.
:::

:::check id=ps10-lock-guard-q4
Which of these hold?

- [ ] The `lock_guard` stays locked after `run` returns
- [x] The `lock_guard` unlocks when `guard` leaves the scope, including on return
- [x] Every `std::thread` is joined or detached before its destructor runs

The guard unlocks automatically when it goes out of scope, including on return, so it never stays locked after `run` returns. And every `std::thread` must be joined or detached before its destructor runs.
:::
:::

:::examnote
- **What the question looks like:** it shows a shared data structure, and asks you to find a race or a deadlock, or to fix it with `synchronized`, a semaphore, or an atomic variable.
- **The usual traps:** taking locks in an order where each thread waits forever for a lock the other holds, or locking the update but leaving the read that returns the value outside the critical section.
:::

:::problem id=exam-15a-q1 title="Gears" source="materials/exams/15-a.pdf" kind=exam solution_origin=derived
The question models a row of meshed gears.

- **`Gear`** knows its center, its radius, and its left and right neighbors. `move` rotates this gear, and rotates both neighbors in the opposite direction.
- **`SimpleGear`** stores the gear's angle in `_state`, and its `check` method validates the constructor's arguments.
- **`Spinner`** is a thread that calls `move` on a gear.
- **The meaning of "correct":** the sequence of states must be one that some serial history of `move` calls could have produced.

:::check id=exam-15a-q1-q1
Which of these belong to the invariant?

- [x] The radius is positive
- [ ] Left and right may be the same gear
- [x] A neighbor's center lies at a distance of exactly `radius + neighbor.radius` on the x-axis
- [x] `_state` stays in `[0, 360)`

- **The radius must be positive,** so `check` rejects a radius of zero or less.
- **Meshed gears must touch:** a neighbor's center must lie exactly `radius + neighbor.radius` away, and `check` rejects a center that breaks that.
- **The angle stays in `[0, 360)`.**
- **Left and right must be different gears,** so the second option is not part of the invariant.
:::

:::check id=exam-15a-q1-q2
Which descriptions of the unsynchronized class are right?

- [x] Two calls to `move` on adjacent gears can apply one gear's angle twice, or lose it
- [ ] Moving the `_state` updates inside `move`, `moveLeft`, and `moveRight` makes the class safe
- [x] Thread A can be inside `g2.moveRight` while thread B writes `_state` between A's read and A's write
- [ ] The class is safe once each gear writes only its own `_state`

Without synchronization, two `move` calls on neighboring gears can interleave their reads and writes of the same `_state`, so a rotation is applied twice or lost. Moving the updates into other methods, or having each gear write only its own `_state`, does not help: the neighbor's `_state` is still updated by two threads at once.
:::

:::check id=exam-15a-q1-q3
Before `move` runs, the neighbor chain {{=contains no cycle this call would follow forever|is empty|is locked once per gear}}. After `move` returns, this gear's angle {{=has changed by its own step|is unchanged|equals the neighbor's angle}} and each neighbor's angle {{=has changed by the opposite step|has changed by the same step|stays at 0}}.

- **The precondition:** the chain of neighbors must not contain a cycle, or the call would follow it forever.
- **The postcondition:** this gear has turned by its own step, and each neighbor has turned by the same step in the opposite direction.
:::

:::check id=exam-15a-q1-q4
Several `Spinner` threads overlap their `move` calls, so the run matches no serial history. Which repair does?

- [ ] A lock per gear, taken as this gear and then the neighbor
- [x] One ordered lock along the chain, or one semaphore for the whole mesh
- [ ] Making only `_state` volatile
- [ ] Synchronizing the constructor and leaving `move` unsynchronized

- **One semaphore for the whole mesh works:** every `move` calls `acquire` before it starts and `release` when it ends. There is a single permit, so moves run one at a time, and with only one lock there can be no cycle.
- **A lock per gear, in a fixed order along the chain, also works.**
- **A lock per gear taken as "this gear, then the neighbor" deadlocks:** two neighbors moving at once each hold their own lock and wait for the other's.
:::

:::

:::problem id=exam-15b-q1 title="Deadlock among gears" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
Now every public method of `SimpleGear` is `synchronized`. Since a gear's `move` calls its neighbors' `moveLeft` and `moveRight`, it must also take each neighbor's lock while still holding its own.

:::check id=exam-15b-q1-q1
Which interleaving is the deadlock?

- [ ] `A.move` locks A and B, returns, and then `B.move` locks B
- [x] `A.move` locks A and calls `B.moveRight`, which waits for B, while `B.move` locks B and calls `A.moveLeft`, which waits for A
- [ ] Both threads release their own lock before calling the neighbor
- [ ] A and B both wait for a semaphore that neither of them acquired

A's thread holds A's lock and waits for B's, while B's thread holds B's lock and waits for A's. Each holds one lock and waits for the other, so both are blocked forever.
:::

:::check id=exam-15b-q1-q2
Which repairs keep one `move` atomic with respect to other moves?

- [x] Copy the facts the neighbor call needs, release this gear's lock, and then call the neighbor
- [x] One `Semaphore(1)` for the mesh, with `acquire` before every move and `release` after it
- [ ] A lock per gear, taken in whichever order the call reaches the gears
- [x] A lock per gear in address order, or in left-to-right order

- **Narrowing the lock:** copy what the neighbor call needs, release this gear's lock, and only then call the neighbor. No thread ever holds two locks at once, so no cycle can form.
- **One semaphore for the mesh** has a single permit, so there is no cycle either.
- **Locks in a fixed order,** by address or from left to right, make every thread lock the earlier gear first, so the cycle cannot close.
- **Locks in whatever order the call happens to reach them** are exactly what caused the deadlock.
:::

:::check id=exam-15b-q1-q3
Which repair does the official solution adopt?

- [ ] The mesh semaphore, because a gear holds the permit only while it copies the facts it needs
- [ ] The address order, because it is finer than narrowing the synchronized regions
- [ ] None of the three, because each of them drops the atomicity of `move`
- [x] Narrowing the synchronization

The official solution narrows the synchronized regions. The lock order and the mesh semaphore are also correct, but they are coarser: they hold a lock for the whole call, longer than the critical section really needs it, so they allow less concurrency.
:::

:::

:::problem id=exam-16b-q1 title="A synchronized queue" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
The question has two parts.

- **The queue:** `SynchQueue` implements `Queue`, and every method is `synchronized` on `this`. `ExtIntQueue` extends it with a `sum()` method that adds up all the integers in the queue.
- **The mystics:** a variation on the dining philosophers. Mystics look at a fork while they think, and a fork may be looked at only while nobody is eating with it.

:::check id=exam-16b-q1-q1
Which claims are true of `sum`?

- [x] `size` matches the length of the chain
- [x] The result equals the sum of the integers present at one moment during the call
- [ ] `sum` may add or remove an element while it walks
- [x] `sum` leaves the queue unchanged

- **The invariant:** `size` always matches the actual number of nodes in the chain.
- **The postcondition of `sum`:** the result is the sum of the integers that were in the queue at one moment during the call.
- **`sum` is a query,** so it must leave the queue unchanged and never add or remove anything.
:::

:::check id=exam-16b-q1-q2
Which interleaving makes the returned sum wrong?

- [ ] `sum` holds the lock, so `add` cannot land in the middle of the walk
- [ ] `sum` reads every element, then `add` and `remove` run, so the sum matches the later state
- [x] `sum` reads 1 and 2, another thread adds 10 and removes 1, then `sum` reads the rest
- [ ] `sum` is not synchronized, so it never sees the elements that are already in the queue

`sum` holds no lock while it walks, so an `add` and a `remove` can happen in the middle. The result, which includes 1 and 10 together, matches no single state the queue was ever in.
:::

:::check id=exam-16b-q1-q3
`sum` records a {{=volatile version|lock on this|copy of every node}} that grows at the end of every mutator, walks {{=without holding the lock|inside synchronized|under a semaphore}}, and {{=tries again when the version has changed|returns the partial sum|calls notifyAll}}.

- **How the version works:** every method that changes the queue increments a `volatile` version number at its end. `sum` reads the version, walks the queue without a lock, then reads the version again. If it changed, the queue moved during the walk, so `sum` tries again.
- **Making sure it ends:** if writers keep arriving, `sum` could retry forever. So after a limited number of attempts, it falls back to walking the queue while holding the lock.
:::

:::check id=exam-16b-q1-q4
Which claims match the adapted dining-philosophers protocol?

- [ ] A looker may hold a fork while an eater holds that same fork
- [x] A fork someone is eating with is held exclusively
- [x] Two mystics can look at one fork together
- [ ] Eating and looking both take one exclusive permit, so two mystics cannot look at the same fork

This is exactly a readers-writer problem. Looking takes the read side of a `ReadWriteLock` (or uses a counter of lookers), so many mystics can look at once. Eating takes the write side, so an eater waits until all lookers leave, and lookers wait while someone eats.
:::

:::

:::problem id=exam-17a-q1 title="A board with a cup" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
A game is played on a board.

- **The board** is `N` by `N`, and starts with one cup and several players.
- **Each player** is a thread with a `Strategy` that chooses a `Direction` to move. The first player to reach the cup wins, and the game ends.
- **The requirement:** the solution must use locks.

:::check id=exam-17a-q1-q1
Each player's `run` asks the strategy, calls {{=board.move|Thread.stop|board.notify}}, and stops when the result is {{=WIN or LOST|SUCCESS|FAIL only}}. `main` starts each player with {{=Thread.start|run|wait}} and then calls {{=join|notifyAll|sleep}}.

Each player is a `Runnable`. Its `run` loops: ask the strategy for a direction, call `board.move`, and stop when the result is `WIN` or `LOST`. `main` starts each player's thread with `Thread.start`, then `join`s them all, so it waits until every player has finished.
:::

:::check id=exam-17a-q1-q2
Which of these make `move` return `FAIL`?

- [x] The game has already ended
- [x] The step would leave the board
- [x] The step would land on another player
- [ ] The destination is the cup

`move` fails if the game is already over, if the step would leave the board, or if the destination cell holds another player. Reaching the cup is not a failure: it returns `WIN` and ends the game. Any other legal step returns `SUCCESS` and updates the player's position.
:::

:::check id=exam-17a-q1-q3
Which description of the board lock is right?

- [x] `move` is synchronized on the board, and the check and the update hold that lock for the whole critical section
- [ ] `move` is unsynchronized, and only the end flag is volatile
- [ ] Each cell has its own lock, taken after the strategy runs
- [ ] A strategy that reads only immutable data must lock the board

`move` must check the destination and then update the position as one action, so the whole method is `synchronized` on the board. Otherwise two players could both see a free cell and both move into it. A strategy that reads only immutable data needs no lock at all.
:::

:::

:::problem id=exam-17b-q1 title="Looking ahead on the board" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
This question extends the board game.

- **Players** on the `N` by `N` board can `move` one step, or call `lookAhead`, which returns the distance in a given direction to the nearest object or to the edge.
- **`Segment`** is an existing, immutable class that can test whether two segments intersect. Because it is immutable, it is thread-safe.
- **Several player threads** call `move` and `lookAhead` at the same time.

:::check id=exam-17b-q1-q1
Which claims are true of `lookAhead`?

- [ ] The method may move the player while it measures the distance
- [x] `dir` is a legal direction, and the player's position is on the board
- [x] The result counts steps along `dir` until the first other player, the cup, or the edge
- [x] The distance comes from the board state at one moment during the call, and the method leaves the board unchanged

- **The precondition:** `dir` is a legal direction, and the player is on the board.
- **The postcondition:** the result is the number of steps along `dir` to the first other player, the cup, or the edge, measured on the board as it was at one moment during the call.
- **`lookAhead` is a query,** so it must not move the player or change the board.
:::

:::check id=exam-17b-q1-q2
Which locking is right?

- [ ] `lookAhead` is synchronized and `move` is not, because a query needs the lock and an update does not
- [x] Both `move` and `lookAhead` are synchronized on the board
- [ ] Neither method takes a lock, because `Segment` is immutable
- [ ] `lookAhead` locks the `Segment`, and `move` locks the player

Both methods must lock the board. `lookAhead` needs the lock so that its walk sees one consistent layout, and `move` needs the same lock so that no position changes during that walk. A query needs the lock just as much as an update does.
:::

:::check id=exam-17b-q1-q3
`lookAhead` builds a {{=Segment|Semaphore|Barrier}} from the player's cell and walks until {{=intersect|wait|compareAndSet}} hits another object's cell or the edge. `move` returns {{=WIN|FAIL|LOST}} when the destination is the cup.

`lookAhead` builds a `Segment` from the player's cell in direction `dir`, and walks along it until `intersect` reports another object's cell or the edge. The same board lock covers that walk and the position update in `move`.
:::

:::

:::problem id=exam-18b-q2 title="Two stacks in deadlock" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
Two bounded stacks are used by two threads.

- **The rule:** a bounded `Stack` always has `0 <= size() <= capacity()`, so `push` and `pop` may refuse a call that would break it.
- **The locking:** each method locks its own `Stack`. A `push` that moves a value from one stack into the other locks both stacks.
- **The threads:** `T1` and `T2` both use the stacks `S1` and `S2`.

:::check id=exam-18b-q2-q1
Which pair enters deadlock?

- [ ] `T1` calls `S1.pop` and `T2` calls `S1.pop`, and both then wait for `S2`
- [ ] Both threads lock the lower identity first, then wait for each other
- [x] `T1` locks `S1` inside `S1.push` and then waits for `S2`, while `T2` locks `S2` inside `S2.push` and then waits for `S1`
- [ ] `T1` locks `S1` and `S2`, returns, and then `T2` locks `S2` and `S1`

Each transfer locks the stack it is called on first, and then the other one. `T1` holds `S1` and waits for `S2`, while `T2` holds `S2` and waits for `S1`. That is a cycle of waiting, so both threads are blocked forever.
:::

:::check id=exam-18b-q2-q2
Which claims describe that deadlock?

- [ ] The thread that locked its stack first returns from `pop`
- [x] Each thread holds the monitor of one `Stack` and waits for the lock the other holds
- [ ] The cycle is avoided, because each `push` locks only one `Stack`
- [x] Neither `pop` nor `push` returns

Each thread holds the lock of one stack and waits for the lock the other thread holds. Neither call can ever return.
:::

:::check id=exam-18b-q2-q3
The repair is one order. In both threads, lock the `Stack` with the {{=lower identity|higher capacity|lock already held}} first.

If both threads always lock the stack with the lower identity first (for example, by `System.identityHashCode`), they can never hold the locks in opposite orders, so the cycle cannot form. The same fix applies to any method that locks two objects of the same class, such as an `Image.mix` that locks two images.
:::

:::

:::problem id=exam-19b-q2 title="A sorted tree" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
`SortedBinaryTree` states this invariant:

```java
//@INV: getData() != null &&
// (getLeft() == null || getData().compareTo(getLeft().getData()) > 0) &&
// (getRight() == null || getData().compareTo(getRight().getData()) < 0)
```

- **Insertion** walks down the child pointers to find the right place. The pointers are `volatile`, but the walk takes no lock.
- **An alternative design** protects the same tree with a readers-writer lock.

:::check id=exam-19b-q2-q1
Start from a node that holds 5, with null children. Which interleaving breaks the invariant?

- [ ] Both threads lock the root, so the second insert waits and the tree keeps 4
- [x] A reads `left == null` to insert 3, B writes the node 4 into `left`, then A overwrites `left` with the node 3
- [ ] A and B both write `right`, and the `compareTo` order stays true
- [ ] The `volatile` pointers make the null check and the assignment one step, so the second insert sees the first child

Both threads saw `left == null` before either wrote it, so A's write replaced B's. The node 4 is now disconnected, and the tree has lost a value. `volatile` makes each single write visible, but it does not make "check, then write" one step.
:::

:::check id=exam-19b-q2-q2
Lock every node from the {{=root downward|leaf upward|left child only}}. Hold the lock on a node while the insertion {{=reads that node's child|calls wait|releases the parent}}, and, when the insertion updates that child, hold the same lock while it {{=writes the child|calls notifyAll|reads the root}}.

This technique is called hand-over-hand locking. Because a node stays locked from the moment its child is read until the child is written, two insertions that reach the same node take turns on it, and neither can overwrite the other's child.
:::

:::check id=exam-19b-q2-q3
What does a `ReadWriteLock` change?

- [ ] `insert` takes the read lock, and `contains` takes the write lock
- [ ] A `contains` that arrives during a write proceeds, because the read lock is shared with the writer
- [ ] Readers and a writer all run together on the node being changed
- [x] Concurrent `contains` calls take the read lock and overlap, and `insert` takes the write lock

With a `ReadWriteLock`, many `contains` calls can take the read lock and run at the same time, while `insert` takes the write lock and runs alone. A `contains` that arrives during an insert waits until the insert finishes.
:::

:::

:::problem id=exam-20a-q2 title="Output of two threads" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
Two threads run this program. What can it print?

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

Both tasks were given the first `A` object, whose `i` is 2, so both threads print 2. The only possible output is `22`.
:::

:::check id=exam-20a-q2-q2
Which fact keeps 3 out of the output?

- [x] Each `Task` stores the object it received, and `a = new A(3)` updates only `main`'s local variable
- [ ] `t2` starts after that assignment, so `t2` prints 3
- [ ] Both threads read `main`'s variable `a` inside `run`
- [ ] The constructor writes 3 into the object passed to both tasks

`a = new A(3)` creates a new object and stores it only in `main`'s local variable `a`. Each `Task` already holds its own reference to the first object, whose `i` is still 2, and no thread ever reads `main`'s variable.
:::

:::check id=exam-20a-q2-q3
The constructor's write happens before {{=start|the assignment a = new A(3)|join}}, and `start` happens before {{=run|main assigns 3|notify}}, so both threads print {{=2|3|23}}.

Java guarantees that everything a thread did before calling `start` is visible to the new thread. The constructor wrote 2 before `start`, so both threads are guaranteed to see 2. The later assignment changes only `main`'s local variable, not the object.
:::

:::

:::problem id=exam-20b-q2 title="An atomic update" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
Two threads, `t1` and `t2`, both call `f()`. One version of `f` updates a plain `int`. The other uses an `AtomicInteger`, because the new value depends on the old one.

:::check id=exam-20b-q2-q1
Which outcomes are possible when both threads update a plain `int` by storing the value they read, plus one?

- [x] The result of a serial history of the two calls
- [ ] A result in which both updates are stored twice
- [x] The case in which only one update is stored
- [ ] No result, because a plain `int` forbids concurrent reads

The result may be the same as a serial run, with both updates applied. But both threads can also read the same value and both write that value plus one, so one update disappears. Those are the only two possibilities.
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

The loop reads the current value with `get`, then tries `compareAndSet(observed, observed + 1)`. If another thread changed the value in between, the compare-and-swap fails, and the thread reads again and retries. `incrementAndGet` is this same loop, built into the library.
:::

:::check id=exam-20b-q2-q3
After both threads finish that loop, which claim holds?

- [ ] `n` is 1, because a failed compare-and-swap drops that thread's update
- [ ] The field still needs a separate `volatile` modifier
- [x] `n` is 2, and a thread that loses the compare-and-swap retries without waiting on a lock
- [ ] A third thread's `get` observes the value only after `notifyAll`

- **The final value is 2:** a failed compare-and-swap does not drop the update; that thread simply retries until it succeeds.
- **No lock is involved,** so the losing thread retries instead of waiting.
- **No `volatile` is needed:** `AtomicInteger`'s operations already guarantee visibility, so any thread that calls `get` afterward sees 2.
:::

:::

:::problem id=exam-24b-q2 title="A thread barrier" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
A `Barrier` lets a fixed group of threads advance together, in phases.

- **`await`** means "I have finished this phase". The caller blocks until every thread in the group has called `await`, and then all of them continue into the next phase together.
- **A generation counter** numbers the phases, so that a fast thread that starts the next phase cannot release threads still waiting in the previous one.
- **An `InterruptedException`** in one thread must leave the barrier usable for the remaining threads.

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

The last thread to arrive resets `arrived`, advances `generation`, and only then calls `notifyAll()`. Because the generation has already changed, every woken thread knows its phase is over, and a fast thread that immediately calls `await` again waits correctly in the new phase.
:::

:::check id=exam-24b-q2-q2
On `InterruptedException`, the caller {{=decrements arrived|increments generation|calls notifyAll}} before it rethrows. Otherwise {{=the phase never fills|the generation wraps|the lock is released twice}}.

An interrupted thread is leaving the phase, so it must decrement `arrived` before rethrowing. Otherwise `arrived` would count a thread that is gone, the phase could never fill up, and the other threads would wait forever.
:::

:::check id=exam-24b-q2-q3
The caller stored the generation it saw in `g`. A waiter that wakes early, or because `notifyAll` woke every waiter, does which of these?

- [ ] Returns 1, because `notifyAll` means this phase is done
- [x] Sees `g == generation` and waits again
- [ ] Calls `notifyAll` itself
- [ ] Decrements `arrived` and leaves the barrier

The waiter compares the generation it saved, `g`, with the current one. If they are still equal, its phase has not finished, so the wakeup was early, and it calls `wait` again. It leaves only once the generation has changed.
:::

:::

:::problem id=exam-24c-q2 title="A thread-safe set" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived
A thread-safe set is implemented as a linked list.

- **`Set`** has `contains` and `add`, plus `iterator()` and `clone()`. `SetImpl` stores the elements in a linked list.
- **The iterator** walks the `next` pointers, and may run at the same time as an `add`.
- **`clone`** returns a new, separate set, and every node in it must be fully copied before the set is returned.

:::check id=exam-24c-q2-q1
Which of these run under the one lock?

- [ ] Every later `next` on a snapshot iterator, after the elements were copied
- [x] `add`, which links a new node and increments `modCount`
- [x] `contains`
- [x] `clone`

`add`, `contains`, and `clone` all run under the set's single lock, and so does creating an iterator. A snapshot iterator copies the elements while holding the lock, then serves its later `next` calls from that private copy, with no lock.
:::

:::check id=exam-24c-q2-q2
`add` increments {{=modCount|the iterator cursor|the list capacity}}. The iterator copies that value when it is created and throws {{=ConcurrentModificationException|InterruptedException|the copied nodes}} if the value changes before {{=next|clone|wait}}.

This is a fail-fast iterator. `modCount` is a version number: if it changes after the iterator was created, the iterator knows the list was modified under it, and throws `ConcurrentModificationException` instead of returning wrong results.
:::

:::check id=exam-24c-q2-q3
Which description of `clone` is right?

- [ ] `clone` copies the nodes without the lock, because the new list is private
- [ ] The copy shares nodes with the original and shares its lock
- [x] `clone` holds the lock, and the set it returns has its own nodes and its own lock
- [ ] `clone` may publish a node the copy has not finished writing

`clone` must hold the lock while it walks, or it could copy a half-modified list. It allocates a new list with the same elements, and gives the copy its own nodes and its own lock, so the copy shares nothing with the original. The copy is returned only after it is complete.
:::

:::

Lecture 8 also revisits the picture from [the memory model](topic:memory-model), with a page table added underneath.

- **Page tables:** the operating system maps each process's virtual pages onto physical memory.
- **Page faults:** when a page is not in RAM, accessing it causes a page fault, and the operating system loads the page before the access continues. The program never notices, except as a delay.
- **Threads:** the threads of one process share the heap and the static variables, and each thread keeps its own stack.

Threads are also the first tool for building servers, since a server that blocks inside **`accept`** stalls every other client.

- **Next:** [Networking](topic:networking) covers the channels between processes.
- **After that:** [The reactor](topic:reactor) shows how a server can wait on many channels with only one thread.
