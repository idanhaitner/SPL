---
id: waiting-and-liveness
title: Waiting and liveness
blurb: "wait and notify, semaphores, the reader-writer lock, cancellation, and livelock, starvation, and deadlock."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 7 - Back to Java.pptx"
  - "materials/lectures/Chapter 8 - Concurrency.pptx"
  - "materials/sessions/SPL_PS5.pptx"
  - "materials/sessions/SPL_PS7.pptx"
  - "materials/sessions/SPL_PS8.pptx"
  - "materials/exams/15-b.pdf"
  - "materials/exams/15-b-solution.pdf"
  - "materials/exams/16-b.pdf"
  - "materials/exams/16-b-solution.pdf"
  - "materials/exams/18-b.pdf"
  - "materials/exams/18-b-solution.pdf"
  - "materials/exams/24-b.pdf"
  - "materials/exams/24-b-solution.pdf"
---

Operations in a program can fail, for example because their precondition does not hold yet. In a concurrent program it is often worth waiting until another thread makes the precondition true. This chapter shows how to wait correctly, and what happens when threads wait for each other forever.

- **Waiting:** handling a failed operation, busy waiting, and the `wait` and `notify` mechanism.
- **Synchronizers built on waiting:** the semaphore, the fair semaphore, and the reader-writer lock.
- **Cancellation and liveness:** how to tell a thread to stop, how to measure a concurrent system, and the scenarios of livelock, starvation, and deadlock.

## When an operation fails

An operation may fail, for example because its precondition does not hold. A program can react in four ways, in its `catch` block:

- **stop the program** (`System.exit`),
- **carry on as if nothing happened** (an empty `catch`),
- **pass the problem up** to whoever called it (do not catch, or throw again),
- **try again.**

This chapter is about the last one. In a serial program, trying again is pointless, because nothing else will change the state. In a concurrent program it makes sense: another thread may make the precondition true. (You already saw one form of it, the optimistic try-and-fail walk in [Synchronization](topic:synchronization).)

### Exceptions in Java

When something goes wrong at run time, a Java method throws an exception. The compiler treats the kinds of exception differently.

:::definition id=def-exception title="How Java classifies exceptions" source="materials/lectures/Chapter 7 - Back to Java.pptx"

- **Checked exceptions:** these inherit from `java.lang.Exception` but not from `RuntimeException`. They stand for failures a correct program should still expect, such as a missing file. The compiler requires the method to catch each one with `try-catch` or to declare it with `throws`.
- **Unchecked exceptions:** these inherit from `RuntimeException`. They stand for bugs in the program, such as `NullPointerException` and `IndexOutOfBoundsException`. A method may leave them undeclared.
- **Errors:** these inherit from `java.lang.Error`. They stand for severe failures of the JVM, such as `OutOfMemoryError`. Ordinary application code leaves them uncaught.
:::


- **`finally`:** this block runs whenever control leaves the `try` block, whether the block finished normally or an exception was thrown.
- **`try-with-resources`:** this form closes every resource that implements `AutoCloseable`, on every exit from the block, so you do not have to write the `finally` yourself.

:::check id=chk-checked
A method calls an API that throws `java.io.FileNotFoundException`, a checked exception. What does the compiler require?

- [ ] Nothing, because only `Error` is mandatory
- [x] A `try/catch` for this exception, or a `throws` clause
- [ ] A `finally` block and no `catch`

Checked exceptions are part of the method's type. Unchecked exceptions and `Error` stay outside that type.
:::


### The running example: a bounded queue

One thread adds to a queue of limited size, and another removes from it. In a serial program, a full or empty queue is simply an error.

```java
public void add(T obj) {
    if (lst.size() == capacity)
        throw new Exception("full queue");
    lst.add(obj);
}
```

With threads, a full queue is usually temporary: the remover will soon make room. So instead of failing, `add` should **wait** until there is room. How?

## Trying again: busy waiting

**First attempt: spin in a loop. Do not do this.**

```java
public synchronized void add(T obj) {
    while (lst.size() == capacity);    // spin until there is room
    lst.add(obj);
}
```

- **It can never succeed.** The spinning thread holds the queue's lock the whole time, so the remover can never get in to make room.
- **It burns the processor** while waiting.

**Second attempt: spin, but sleep between checks.**

```java
public synchronized void add(T obj) {
    while (lst.size() == capacity)
        Thread.sleep(1000);
    lst.add(obj);
}
```

- **Still holds the lock while sleeping,** so still nobody can make room.
- **No reason to believe** the condition will hold after exactly one second.

What is needed is a way to say: "block me, **release the lock** while I am blocked, and wake me when someone changes this object."

## wait and notify

The run-time environment provides exactly that, through two operations on an object `O`.

- **`wait`:** the current thread moves to Blocked, waiting for a change in `O`, and releases its lock on `O` meanwhile.
- **`notify`:** a thread waiting on `O` becomes Runnable again. Its first action is to take the lock on `O` back.

To support this, every object keeps a list of the threads waiting on it. In Java, every `Object` has these three methods:

| Method | What it does |
| --- | --- |
| `o.wait()` | Release `o`'s lock and block until someone notifies `o` |
| `o.notify()` | Wake **one** waiting thread, chosen at random |
| `o.notifyAll()` | Wake **all** the waiting threads |

The rule of use: **call `wait` whenever the precondition does not hold, and `notifyAll` after every change.**

### The bounded queue with wait and notify

```java
public synchronized void add(T obj) throws InterruptedException {
    while (lst.size() == capacity)
        wait();                   // releases the lock while waiting
    lst.add(obj);
    notifyAll();                  // the queue changed: wake the waiters
}

public synchronized T remove() throws InterruptedException {
    while (lst.size() == 0)
        wait();
    T ret = lst.remove(0);
    notifyAll();
    return ret;
}
```

Follow it on an empty queue.

1. **T2 calls `remove()`.** The queue is empty, so it calls `wait()`, which releases the lock and blocks T2.
2. **T1 calls `add(1)`.** The lock is free, so T1 gets in, adds 1, and calls `notifyAll()`.
3. **T2 wakes up,** takes the lock back, checks the `while` again, finds 1, and removes it.

### On which object to wait

`wait` and `notifyAll` are called on the same object whose lock protects the condition. That gives one version for each lock protocol from [Synchronization](topic:synchronization).

- **Protocol A, the whole object:** `this.wait()` and `this.notifyAll()`, as in the queue above.
- **Protocol B, one group of fields:** wait on that group's lock. A `Point` that may not leave a box waits on `lockY` for moves in `y`:

```java
public void up() throws InterruptedException {
    synchronized (lockY) {
        while (y == maxY)
            lockY.wait();
        y++;
        lockY.notifyAll();
    }
}
```

A thread stuck in `up` never blocks moves in `x`, which use `lockX`.

- **Protocol C, several objects:** wait on the one lock object that stands for all of them.

```java
synchronized (lockL1L2) {
    while (!preCond())
        lockL1L2.wait();
    ... // work on both lists
    lockL1L2.notifyAll();
}
```

### The pattern, and why every part of it matters

All three are the same pattern; only the object `o` changes.

```java
synchronized (o) {
    while (!preCondition())
        o.wait();
    ... // change the state
    o.notifyAll();
}
```

Each part prevents a specific bug. Here they are, one at a time.

**1. `while`, not `if`.** With `if`, a thread does not recheck after it wakes up.

The queue is empty, and T2 and T3 both wait in `remove`. T1 adds one item and calls `notifyAll`, which wakes both. T2 removes the item. T3, with `if`, continues past the check and removes from an empty queue. With `while`, T3 checks again, finds the queue empty, and goes back to waiting. (A thread can also wake up without any notify at all, which is one more reason to recheck.)

**2. The check and the action in one `synchronized` block.**

```java
synchronized (this) { while (lst.size() == capacity) wait(); }
synchronized (this) { lst.add(obj); notifyAll(); }      // bug: two blocks
```

The queue has one free place. T1 and T2 both pass the check in the first block, both leave it, and then both add. Now the queue is over capacity. The check is only meaningful if nothing can change between it and the action.

**3. The check and the `wait` in one `synchronized` block.** Suppose the check and the `wait` were in separate blocks. The queue is full. T1 checks, finds it full, and leaves the block on its way to `wait`. Before it gets there, T2 removes an item and calls `notifyAll`, but nobody is waiting yet, so the notification is lost. Then T1 waits for a change that has already happened, possibly forever. (Java does not even let you write it: `wait` must be called while holding the lock.)

**4. `notifyAll`, not `notify`.** `notify` wakes one thread at random, and it may be the wrong one.

The queue has capacity 1 and is empty. T2 and T3 wait in `remove`. T1 adds an item and calls `notify`, which wakes T2. T2 removes it and calls `notify`, which may wake T3, also a remover, which finds the queue empty and waits again. Meanwhile, a thread waiting in `add` was never woken. Use `notify` only when every waiting thread waits for the same condition, so any of them can proceed. You will see one in the semaphore.

(This is how `wait` and `notify` behave in Java. The operating-systems course shows other semantics, in which `if` and `notify` can be correct.)

## Synchronizers built on wait and notify

So far there are two ways to protect a critical section: `synchronized` (waiters are Blocked) and CAS (waiters keep running). `wait` and `notify` give a third, and with them you can fix four limits of `synchronized`:

1. **The lock is fixed in the code.** It is taken at the start of the block and released at its end. You cannot take it in one method and release it in another.
2. **You cannot *try* to lock,** and do something else if it is taken.
3. **Only one thread at a time** may be inside. There is no way to allow, say, five.
4. **There is no fairness:** the thread that waited longest is not necessarily the next to get in.

### The semaphore

A semaphore holds a number of **permits**. Up to that many threads can be inside at once.

```java
class Semaphore {
    private final int permits;    // how many may be inside together
    private int free;             // how many places are left right now

    Semaphore(int permits) { this.permits = permits; this.free = permits; }
    ...
}
```

`acquire` takes a place, waiting if there is none. It replaces `lock`.

```java
public synchronized void acquire() throws InterruptedException {
    while (free == 0)
        wait();
    free--;
}
```

`release` gives a place back. It replaces `unlock`.

```java
public synchronized void release() {
    if (free < permits)
        free++;
    notify();      // every waiter waits for the same thing: a free place
}
```

`tryAcquire` takes a place if one is free, and otherwise returns `false` at once instead of waiting.

```java
public synchronized boolean tryAcquire() {
    if (free == 0) return false;
    free--;
    return true;
}
```

That fixes limits 1, 2, and 3: `acquire` and `release` can be called anywhere, `tryAcquire` tries, and `permits` sets how many get in. With one permit, a semaphore is a lock:

```java
Semaphore sem = new Semaphore(1);

public void next() throws InterruptedException {
    sem.acquire();
    val++; val++;
    sem.release();
}
```

### A fair semaphore

Limit 4 is fairness. Keep a queue of the waiting threads, and let a thread in only when it is first in line.

```java
List<Thread> waiting = new LinkedList<>();

public synchronized void acquire() throws InterruptedException {
    waiting.add(Thread.currentThread());
    while (free == 0 || waiting.get(0) != Thread.currentThread())
        wait();
    waiting.remove(0);
    free--;
    if (free > 0 && !waiting.isEmpty())
        notifyAll();     // let the next in line check too
}
```

- **`release` must use `notifyAll`, not `notify`:** now each thread waits for a different condition ("am I first?"), and a random `notify` might wake a thread that is not first, while the first one sleeps on.
- **`tryAcquire` must also respect the line:** it returns `false` if anyone is already waiting, even if there is a free place.

### The reader-writer lock

The semaphore lets in a fixed number of threads. Often the right rule depends on **what** each thread does. The classic case: any number of threads may **read** at once, but a thread that **writes** needs the object to itself.

The class has a lock and unlock for each kind of access, and two methods that decide who may enter.

```java
class ReaderWriter {
    int activeReaders = 0, activeWriters = 0;

    public synchronized void readLock() throws InterruptedException {
        while (!allowRead()) wait();
        activeReaders++;
    }
    public synchronized void readUnlock() { activeReaders--; notifyAll(); }

    // writeLock and writeUnlock are the same, with activeWriters and allowWrite
    ...
}
```

The policy lives in the two decision methods.

```java
protected boolean allowRead()  { return activeWriters == 0; }
protected boolean allowWrite() { return activeWriters == 0 && activeReaders == 0; }
```

**A problem: writers can starve.** If readers keep arriving, there is always at least one active reader, so `allowWrite` is never true. Fix it by counting the writers who are **waiting**, and making new readers wait for them.

```java
public synchronized void writeLock() throws InterruptedException {
    waitingWriters++;
    while (!allowWrite()) wait();
    waitingWriters--;
    activeWriters++;
}

protected boolean allowRead() { return activeWriters == 0 && waitingWriters == 0; }
```

Now writers may get too much advantage. To balance, count `waitingReaders` the same way, and let readers in when more readers than writers are waiting:

```java
protected boolean allowRead() {
    return activeWriters == 0 && waitingReaders > waitingWriters;
}
```

Using it:

```java
public int get() throws InterruptedException {
    rw.readLock();
    int ret = val;
    rw.readUnlock();
    return ret;
}

public void next() throws InterruptedException {
    rw.writeLock();
    val++; val++;
    rw.writeUnlock();
}
```

Java's library also has ready-made versions of these ideas.

- **`ReentrantLock`** is an explicit lock object. A fair `ReentrantLock` hands out the lock in the order the threads asked for it.
- **`ReadWriteLock`** allows either many readers at once, or a single writer.

## Cancellation

`Thread.stop()` kills a thread on the spot, possibly in the middle of changing an object, leaving it broken. Never use it. Instead, **tell** the thread to finish, and let it finish cleanly.

**The example: producer and consumer.** One thread produces items into a bounded queue, and another consumes them, forever.

```java
// the producer's run
while (true)
    queue.add(produce());

// the consumer's run
while (true)
    consume(queue.remove());
```

How do you stop them?

**Attempt: a flag.** Give each task a `volatile boolean` that says "please stop", and check it in the loop.

```java
volatile boolean stopRequested = false;

public void run() {
    while (!stopRequested)
        queue.add(produce());
}
```

**The problem:** the producer may be **blocked** inside `queue.add`, in `wait()`, because the queue is full. It never gets back to the loop to see the flag.

**The solution: `interrupt`.** The run-time environment provides the flag, and also wakes a blocked thread: when a thread is interrupted while in `wait()` (or `sleep`, or `join`), that call throws `InterruptedException`.

```java
public void run() {
    while (!Thread.currentThread().isInterrupted())
        queue.add(produce());
}

tProducer.interrupt();     // in main: ask it to stop
```

Inside the queue, catch the exception, clean up, and pass the request on.

```java
public synchronized void add(T obj) {
    try {
        while (lst.size() == capacity)
            wait();
        lst.add(obj);
        notifyAll();
    } catch (InterruptedException e) {
        ... // any cleanup
        Thread.currentThread().interrupt();
    }
}
```

**Why call `interrupt()` again?** Catching `InterruptedException` clears the thread's interrupted flag. Calling `interrupt()` sets it again, so the loop in `run` sees it and stops.

## Liveness

### Measuring a concurrent system

How well does a system perform? Four measures:

- **Throughput:** operations per unit of time.
- **Latency:** the time from a request until it is done.
- **Efficiency:** throughput (or latency) relative to the resources used, such as processors and memory.
- **Scalability:** how much throughput or latency improves when you add resources.

Even a system whose logic is perfectly efficient can score badly, because its threads spend time waiting:

- **in any system:** waiting for I/O, or for the processor because the scheduler is not fair,
- **in a concurrent system:** waiting for a lock (Blocked, or spinning on CAS), or waiting for a precondition (in `wait`).

When that waiting gets out of hand, the system has a **liveness** problem. There are three classic ones.

:::definition id=def-liveness title="Deadlock, livelock, and starvation" source="materials/lectures/Chapter 8 - Concurrency.pptx"

- **Deadlock (נעילה הדדית):** two or more threads are blocked forever, each waiting for a lock that another one holds. The usual fix is to make every thread acquire locks in the same global order.
- **Livelock:** the threads are not blocked, but they spend all their time reacting to each other, so none of them gets any work done.
- **Starvation (הרעבה):** a thread that is ready to run is passed over again and again, because other threads keep getting the resource first.
:::


### Livelock

The threads are running, but none of them makes progress, because each keeps undoing the other's chance.

- **The everyday example:** two people meet in a corridor. Both step to the same side, then both step to the other side, again and again.
- **When it happens:** the threads run symmetric code, and the schedule keeps repeating in the same rhythm.
- **The fix:** break the symmetry with randomness, for example `sleep` for a random time before trying again.

### Starvation

A thread is ready to run, but always loses: another thread always gets the lock first, or is always the one that `notify` wakes. Java's locks and `wait`/`notify` make no promise of fairness, so this can happen.

- **The fix:** a fair mechanism, such as the `FairSemaphore` above.

### Deadlock

A group of threads is Blocked, and only threads from the same group could release them, which they cannot, because they are blocked too. There are two kinds.

**1. Waiting for each other's locks.** Swapping the values of two `Even` objects needs both locks.

```java
public void swap(Even other) {
    synchronized (this) {
        synchronized (other) {
            int tmp = other.val; other.val = val; val = tmp;
        }
    }
}
```

T1 calls `e1.swap(e2)` and locks `e1`. At the same moment, T2 calls `e2.swap(e1)` and locks `e2`. Now T1 waits for `e2`, which T2 holds, and T2 waits for `e1`, which T1 holds. Forever.

Four ways out:

1. **One lock for both** (protocol C). Correct, but every access to either object now locks both.
2. **Lock the first, *try* the second** (`tryAcquire`), and if it fails, release the first and start over. Risks livelock.
3. **Avoid locks altogether,** for example with immutable objects.
4. **Resource ordering, the standard fix.** All threads take the locks in the same global order. Deadlock needs a cycle, and a fixed order makes a cycle impossible.

For the order, use each object's identity number, `System.identityHashCode`:

```java
public void swap(Even other) {
    Even first  = System.identityHashCode(this) < System.identityHashCode(other) ? this : other;
    Even second = (first == this) ? other : this;
    synchronized (first) {
        synchronized (second) {
            int tmp = other.val; other.val = val; val = tmp;
        }
    }
}
```

Now both T1 and T2 lock the same object first. Whichever comes second waits while holding nothing, and the first finishes.

**2. Waiting for each other's preconditions.** Each thread waits in `wait()` for a condition that only another waiting thread could make true.

**An exam example:** a home water purifier. A consumer pours dirty water into the dirty-water tank and takes clean water from the clean-water tank. A purifier takes dirty water and puts clean water.

- **The deadlock:** if both tanks are full, the consumer cannot pour (the dirty tank is full) and the purifier cannot put (the clean tank is full). Each waits for the other.
- **A fix: break the symmetry.** An extra thread wakes up now and then, detects that state, and spills some water from one tank.

### The dining philosophers

All three problems meet in one classic example. Philosophers sit around a table, with one fork between each pair. A philosopher thinks, then eats, and eating needs both neighboring forks.

```java
public void run() {
    while (!Thread.currentThread().isInterrupted()) {
        think();
        synchronized (left) {
            synchronized (right) {
                eat();
            }
        }
    }
}
```

**Problem 1: deadlock.** Everyone picks up the left fork at the same time, and waits forever for the right one.

**Fix: resource ordering.** Each philosopher picks up the lower-numbered fork first.

```java
Fork first  = System.identityHashCode(left) < System.identityHashCode(right) ? left : right;
Fork second = (first == left) ? right : left;
synchronized (first) {
    synchronized (second) {
        eat();
    }
}
```

**Problem 2: starvation.** A philosopher may always lose the race for a fork to a neighbor. **Fix:** make each fork a `FairSemaphore(1)`, so forks are handed out in order of arrival.

```java
first.sem.acquire();
second.sem.acquire();
eat();
second.sem.release();
first.sem.release();
```

**Another fix for the deadlock: give up instead of waiting.** Take the left fork, *try* the right one, and if it is taken, put the left one back.

```java
left.sem.acquire();
if (right.sem.tryAcquire()) {
    eat();
    right.sem.release();
}
left.sem.release();
```

**Problem 3: livelock.** Now everyone may take the left fork, fail on the right, put it back, and repeat, all in step, forever. **Fix:** add randomness, so the rhythm breaks.

```java
left.sem.acquire();
Thread.sleep(Random.nextInt(1000));    // a random pause
if (right.sem.tryAcquire()) { ... }
```

## Practice

:::problem id=ps5-checked-exception title="A checked exception" source="materials/sessions/SPL_PS5.pptx" kind=exercise solution_origin=source
`FileNotFoundException` is checked. `ArithmeticException` is unchecked.

:::check id=ps5-checked-exception-q1
A method that can throw `FileNotFoundException` must catch it or declare {{=throws|finally|assert}} `FileNotFoundException`.

A method that neither catches nor declares `FileNotFoundException` does not compile. Once the method declares it, every caller has the same choice to make.
:::

:::check id=ps5-checked-exception-q2
Which of these hold?

- [x] Ignoring `ArithmeticException` still compiles
- [ ] Ignoring `FileNotFoundException` still compiles
- [x] The caller of a method that declares `throws FileNotFoundException` has the same obligation
- [x] Catching `ArithmeticException` is usually the wrong response when the exception marks a bug the program should fix

- **`ArithmeticException`:** it is unchecked, so handling it is optional, and the code compiles without it.
- **`FileNotFoundException`:** it is checked, so the method must catch it or declare `throws FileNotFoundException`.
- **The caller:** a method that calls one declaring `throws FileNotFoundException` must itself catch or declare it.
- **Catching a bug:** `ArithmeticException` usually signals a bug, such as dividing by zero, so the right fix is to correct the code, not to catch the exception.
:::

:::check id=ps5-checked-exception-q3
If no frame from the throw site through `main` has a matching `catch`, what happens?

- [ ] `main` returns normally and the exception is discarded
- [ ] `finally` blocks along that walk are skipped
- [x] The JVM terminates the program and reports the exception

The exception unwinds every frame up to and including `main`. The JVM then terminates the thread and prints the exception with its stack trace.
:::

:::check id=ps5-checked-exception-q4
Which of these hold on that path?

- [x] `finally` blocks along the walk still run
- [ ] A second failure thrown by `close` replaces the original exception
- [x] `try-with-resources` closes the resource. A second failure from `close` is suppressed, and the original exception remains the one that propagates

- **`finally`:** every `finally` block on the way out still runs.
- **The original exception:** with `try-with-resources`, it stays the exception that propagates. A second failure thrown by `close` is attached to it as a suppressed exception instead of replacing it.
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

To sum up, a thread that must wait for a precondition calls `wait` inside a `while` loop, in one synchronization block with the check and the operation, and every change ends with `notifyAll`. On top of that mechanism you can build semaphores, fair semaphores, and reader-writer locks, and you must watch for the three liveness failures: livelock, starvation, and deadlock.

- **Next:** [Networking](topic:networking) moves from threads inside one process to communication between processes.
