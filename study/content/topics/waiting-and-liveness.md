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

Operations in a program may fail (and throw an exception) for many reasons. For example, because the precondition does not hold. There are several ways to deal with an operation that fails (what is carried out in the `catch` block):

- **stop the program** (`System.exit`),
- **continue as usual** (an empty block),
- **pass the responsibility to "whoever called" the operation** (do not catch the exception, or throw it again),
- **try again.**

This chapter deals with the last option. (You already met it in the optimistic try and fail of `printAll` in [Synchronization](topic:synchronization).) Notice that this approach is relevant only to a concurrent program. In a serial program there is no point in trying again, because nobody else changes the state. In a concurrent program there is.

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

### A bounded queue

The example for the rest of the chapter is a bounded queue. One kind of thread adds to it, and another removes from it.

```java
class BoundedQueue<T> {
    List<T> lst;
    int capacity;

    BoundedQueue(int capacity) { this.capacity = capacity; this.lst = new ArrayList<T>(); }

    public void add(T obj) {
        if (lst.size() == capacity)
            throw new Exception("full queue");
        lst.add(obj);
    }

    public T remove() {
        if (lst.size() == 0)
            throw new Exception("empty queue");
        return lst.remove(0);
    }
}

```

## Trying again: busy waiting

**A first attempt: a "hard" busy wait (do not do this!).**

```java
class BoundedQueue<T> {
    List<T> lst;
    int capacity;
    ...
    public synchronized void add(T obj) {
        while (lst.size() == capacity);
        lst.add(obj);
    }

    public synchronized T remove() {
        while (lst.size() == 0);
        return lst.remove(0);
    }
}

```

Its drawbacks, in increasing order of severity:

- **The lock on the object is not released while waiting for it to change,** so no other thread can change it, as the waiter wants. (This could be solved by using a semaphore, as you will see.)
- **Needless use of the processor's time.**

**A second attempt: busy waiting with a pause.**

```java
class BoundedQueue<T> {
    ...
    public synchronized void add(T obj) {
        while (lst.size() == capacity)
            Thread.sleep(1000);
        lst.add(obj);
    }

    public synchronized T remove() {
        while (lst.size() == 0)
            Thread.sleep(1000);
        return lst.remove(0);
    }
}

```

Its drawbacks:

- **The lock on the object is still not released while waiting,** so no other thread can change it, as the waiter wants.
- **There is no indication that after the period given to `sleep`, the precondition will actually hold.**

So you need a mechanism of the run-time environment that moves a thread to the Blocked state until a change happens in some object.

## wait and notify

The run-time environment supports such a mechanism with two operations.

- **`wait(T, O)`:** the thread `T` asks to move to the Blocked state until some change happens in the object `O` (in particular, until `notify` is performed on `O`), while releasing `T`'s lock on `O`.
- **`notify(T, O)`:** the thread `T`, which is waiting for a change in the object `O`, returns to the Runnable state. Its first action is to lock `O` again.

To carry this out, the environment keeps, for every object, a list of the threads waiting for a change in it. `wait` adds a thread to the list, and `notify` removes it from the list.

In Java, the `Object` class has three methods for this mechanism.

- **`o.wait()`:** the current thread waits for a change in the object `o`. That is, it moves to the Blocked state until the method `notify` or `notifyAll` is called on `o`, and it releases its lock on `o` in the meantime.
- **`o.notify()`:** a **random choice of one** of the threads waiting for a change in `o`, which moves to the Runnable state (and asks to lock `o` again).
- **`o.notifyAll()`:** **all** of the threads waiting for a change in `o` move to the Runnable state (and each asks to lock `o` again).

**Using the mechanism**, broadly:

- **every time the precondition does not hold,** call `wait`,
- **after changes to the object,** call `notifyAll`.

On what object do you call `wait` and `notifyAll`?

### Protocol A: on `this`

This matches protocol A of [Synchronization](topic:synchronization), full synchronization.

```java
class BoundedQueue<T> {
    List<T> lst;
    int capacity;

    BoundedQueue(int capacity) {
        this.capacity = capacity;
        this.lst = new ArrayList<T>();
    }

    public synchronized void add(T obj) {
        while (lst.size() == capacity)
            this.wait();
        lst.add(obj);
        this.notifyAll();
    }

    public synchronized T remove() {
        while (lst.size() == 0)
            this.wait();
        T ret = lst.remove(0);
        this.notifyAll();
        return ret;
    }
}

```

- **The queue starts empty.** T2 calls `q.remove()`, finds the queue empty, and calls `wait`, which releases the lock on `q` and blocks T2.
- **T1 calls `q.add(1)`.** It can take the lock, adds 1, and calls `notifyAll`. T2 wakes up, takes the lock again, sees that the queue is not empty, and removes 1.

### Protocol B: on an object that represents part of `this`

This matches protocol B, partial synchronization.

```java
class Point {
    int x, y;
    final int minX, maxX, minY, maxY;
    Object lockX, lockY;

    Point(int x, int y, int minX, int maxX, int minY, int maxY) {
        this.x = x;
        this.y = y;
        this.minX = minX; this.maxX = maxX; this.minY = minY; this.maxY = maxY;
        lockX = new Object();
        lockY = new Object();
    }

    public int getY() {
        synchronized (lockY) {
            return y;
        }
    }

    public void up() {
        synchronized (lockY) {
            while (y == maxY)
                lockY.wait();
            y++;
            lockY.notifyAll();
        }
    }

    public void down() {
        synchronized (lockY) {
            while (y == minY)
                lockY.wait();
            y--;
            lockY.notifyAll();
        }
    }

    public int getX() {
        synchronized (lockX) {
            return x;
        }
    }

    public void right() {
        synchronized (lockX) {
            while (x == maxX)
                lockX.wait();
            x++;
            lockX.notifyAll();
        }
    }

    public void left() {
        synchronized (lockX) {
            while (x == minX)
                lockX.wait();
            x--;
            lockX.notifyAll();
        }
    }
}

```

- **The point is at `y == maxY`.** T1 calls `p.up()`, and waits on `lockY`. T2 calls `p.left()`, which needs only `lockX`, so it runs. T3 calls `p.down()`, which moves `y` down and calls `lockY.notifyAll()`, so T1 can now move up.

### Protocol C: on an object that represents a group of objects

This matches protocol C, locking several objects in one operation.

```java
List<Integer> l1, l2;
Object lockL1L2;
...
synchronized (lockL1L2) {
    while (!preCond())
        lockL1L2.wait();
    ... // do something with both L1 and L2
    lockL1L2.notifyAll();
}

```

### The pattern, and the two problems it prevents

Every one of the protocols has the same fixed pattern:

```java
synchronized (o) {
    while (!checkPreCond())
        o.wait();
    ... // code which changes the state
    o.notifyAll();
}

```

The difference between the protocols is only the identity of the object `o`. The pattern prevents two central problems.

**1. Running the code when the precondition does not hold.**

- **Using `if` instead of `while`:**

```java
public synchronized T remove() {
    if (lst.size() == 0)
        this.wait();
    T ret = lst.remove(0);
    this.notifyAll();
    return ret;
}

```

The queue is empty. T2 and T3 both call `q.remove()` and wait. T1 calls `q.add(1)`, and both of them wake up. The first removes the 1. The second continues after its `if`, without checking again, and removes from an empty queue.

So **you must check the precondition again after waiting**. (A thread can also wake up without being notified at all, which is another reason for the `while`.)

- **Splitting the synchronization** between checking the precondition and running the code:

```java
public void add(T obj) {
    synchronized (this) {
        while (lst.size() == capacity)
            this.wait();
    }
    synchronized (this) {
        lst.add(obj);
        this.notifyAll();
    }
}

```

The queue holds `{2, 3, 5}`, with capacity 3. T3 calls `q.remove()`, and the queue has room for one more. T1 calls `q.add(4)` and T2 calls `q.add(5)`: both pass the check in the first block, and both then add, so the queue goes over its capacity.

So **you must have one continuous synchronization block** that covers checking the precondition and the operation that follows it.

**2. Waiting in vain when the precondition does hold.**

- **Splitting the synchronization** between checking the precondition and moving to `wait` (assume, for the sake of the example, that this were technically possible, for example with a semaphore, as you will see):

```java
public void add(T obj) {
    synchronized (this) {
        while (lst.size() == capacity)
    }
    synchronized (this) {
        this.wait();
        lst.add(obj);
        this.notifyAll();
    }
}

```

The queue holds `{1, 2, 3}`, with capacity 3. T1 calls `q.add(4)`, finds the queue full, and leaves the first block. Before it reaches `wait`, T2 calls `q.remove()` and calls `notifyAll`, which nobody hears. Then T1 waits for a change that already happened.

So **you must have one continuous synchronization block** that covers checking the precondition (in the `while`), the move to `wait`, and the operation after it.

- **Calling `notify` instead of `notifyAll`:**

The queue is empty, with capacity 1. T2 and T3 call `q.remove()`, and both wait. T1 calls `q.add(4)` and wakes only T2, which removes the 4 and calls `notify`. That `notify` may wake T3, which finds the queue empty again and waits, while T1, which might want to add again, is not woken.

**Only if all the waiting threads wait for the same condition** can you use `notify` instead of `notifyAll`. You will see an example in the semaphore.

**A note:** all of this is the meaning of `wait` and `notify` in Java's run-time environment. In the operating-systems course you will see other meanings, under which `if` and `notify` can be used.

- **Always call `wait()` inside a `while` loop** that rechecks the condition. A thread can wake up without being notified (a spurious wakeup), or find that another thread already changed the condition.

## Synchronizers built on wait and notify

So far you have seen two ways to carry out a synchronization mechanism.

- **With `synchronized`,** where the waiting threads move to the Blocked state.
- **With the atomic `CompareAndSet` operation,** where the waiting threads stay in the Running state.

This section builds a third way, with the `wait` and `notify` mechanism. That mechanism is mainly used to wait until a precondition holds, but it can also be used for synchronization. In this mechanism, as in `synchronized`, the waiting threads move to the Blocked state, but it also solves several drawbacks of `synchronized`.

1. **You cannot lock or release the object dynamically at run time.** Where the lock and its release happen is already fixed at compile time (where `synchronized` is written, and where its block ends).
2. **You cannot "try" to lock the object,** so that if it is not possible, you keep running and do something else.
3. **You cannot carry out any policy other than the one in which only one thread runs the critical piece of code.**
4. **There is no fairness** in taking the needed resource.

### The semaphore

The `Semaphore` class carries out a synchronization mechanism, with `wait` and `notify`, that fixes the drawbacks of `synchronized` above.

1. **You can decide at run time,** dynamically, according to "field" conditions, when to lock the object and when to release it. In particular, define two methods, `acquire` and `release`, which carry out `lock` and `unlock`.
2. **Define a method `tryAcquire`** that "tries" to lock the object, and if it cannot, returns `false` without moving the thread to Blocked.
3. **Allow several threads at once into the critical piece of code,** according to a parameter.
4. **Fairness, with a queue,** so that the thread that takes the lock is the one that has been waiting for it longest. (That is the `FairSemaphore` below.)

```java
class Semaphore {
    protected final int permits;   // how many threads can work together
    protected int free;            // how many places are currently left for other threads

    Semaphore(int permits) { this.permits = permits; this.free = permits; }

    public synchronized void acquire() throws InterruptedException {   // implementation of lock
        while (free == 0)
            wait();
        free--;
    }

    public synchronized boolean tryAcquire() {
        if (free == 0)
            return false;
        free--;
        return true;
    }

    public synchronized void release() {   // implementation of unlock
        if (free < permits)
            free++;
        notify();
    }
}

```

- **Here `notify` is enough,** because every waiting thread waits for the same condition: a free place.

Use the semaphore to synchronize the `Even` class, for example:

```java
class Even {
    int val;
    Semaphore sem;

    Even(int val) throws Exception {
        if (val % 2 != 0)
            throw new Exception(...);
        this.val = val;
        this.sem = new Semaphore(1);
    }

    public int get() {
        sem.acquire();
        int ret = val;
        sem.release();
        return ret;
    }

    public void next() {
        sem.acquire();
        val++;
        val++;
        sem.release();
    }
}

```

- **The even number is 2, and `sem` has 1 free place out of 1.** T1 and T2 both call `e.next()`. One of them takes the only place, and the other waits in `acquire` until the first releases it.

### A fair semaphore

Extend the semaphore so that it carries out fairness.

```java
class FairSemaphore {
    protected final int permits;   // how many threads can work together
    protected int free;            // how many places are currently left for other threads
    List<Thread> waitingForLockThreads;

    FairSemaphore(int permits) {
        this.permits = permits;
        this.free = permits;
        waitingForLockThreads = new LinkedList<Thread>();
    }

    public synchronized void acquire() {   // implementation of lock
        waitingForLockThreads.add(Thread.currentThread());
        while (free == 0 || waitingForLockThreads.get(0) != Thread.currentThread())
            wait();
        free--;
        waitingForLockThreads.remove(0);
        if (free > 0 && waitingForLockThreads.size() > 0)
            notifyAll();
    }

    public synchronized boolean tryAcquire() {
        if (free == 0 || waitingForLockThreads.size() > 0)
            return false;
        free--;
        return true;
    }

    public synchronized void release() {   // implementation of unlock
        if (free < permits)
            free++;
        notifyAll();
    }
}

```

Notes:

- **`notifyAll` is needed, not `notify`,** because the waiting condition is different for each thread. In particular, a random `notify` might choose a thread whose condition does not hold, while another thread whose condition does hold stays asleep.
- **You could think of a more efficient implementation** that "wakes" only the first thread in the list (instead of all of them, with only the first continuing to run), but that is technically hard, in terms of managing the synchronization of the operations on the list.

### Reader-writer

This design pattern deals, broadly and more effectively, with the third drawback: carrying out different synchronization policies about when several threads may work together. (The `Semaphore` class could be extended simply, but that is not needed, given the accepted `ReaderWriter` pattern.)

The class regulates access to perform read and write operations according to some synchronization policy, with this skeleton:

```java
class ReaderWriter {
    public synchronized void readLock() {
        while (!allowRead())
            wait();
        ...
    }

    public synchronized void readUnlock() {
        ...
        notifyAll();
    }

    public synchronized void writeLock() {
        while (!allowWrite())
            wait();
        ...
    }

    public synchronized void writeUnlock() {
        ...
        notifyAll();
    }

    protected boolean allowRead() {
        return ...;
    }

    protected boolean allowWrite() {
        return ...;
    }
}

```

Carry out a specific synchronization policy in this skeleton:

- **threads that read** can work together without limit,
- **writing requires exclusivity:** you cannot read and write at the same time, and you cannot write and write at the same time.

To carry out the synchronization policy you need:

- **a data structure** for the decision whether entering the protected piece of code (for reading or writing) is allowed or forbidden,
- **maintaining that data structure** according to the different scenarios in the skeleton (before entering and after it),
- **carrying out the methods that allow or forbid** (`allowRead`, `allowWrite`) according to the state of the data structure.

In this case, the structure holds the number of readers and the number of writers.

```java
class ReaderWriter {
    int activeReaders = 0, activeWriters = 0;

    public synchronized void readLock() {
        while (!allowRead())
            wait();
        activeReaders++;
    }

    public synchronized void readUnlock() {
        activeReaders--;
        notifyAll();
    }

    public synchronized void writeLock() {
        while (!allowWrite())
            wait();
        activeWriters++;
    }

    public synchronized void writeUnlock() {
        activeWriters--;
        notifyAll();
    }

    protected boolean allowRead() {
        return activeWriters == 0;
    }

    protected boolean allowWrite() {
        return activeWriters == 0 && activeReaders == 0;
    }
}

```

- **The drawback:** think of a scenario in which there are reading threads all the time, so the writing thread never gets its turn (even though it arrived before many of them). The current implementation has an excessive advantage for the reading threads.

So extend the synchronization policy to take into account the number of threads waiting to write.

```java
class ReaderWriter {
    int activeReaders = 0, activeWriters = 0, waitingWriters = 0;

    public synchronized void readLock() {
        while (!allowRead())
            wait();
        activeReaders++;
    }

    public synchronized void readUnlock() {
        activeReaders--;
        notifyAll();
    }

    public synchronized void writeLock() {
        waitingWriters++;
        while (!allowWrite())
            wait();
        waitingWriters--;
        activeWriters++;
    }

    public synchronized void writeUnlock() {
        activeWriters--;
        notifyAll();
    }

    protected boolean allowRead() {
        return activeWriters == 0 && waitingWriters == 0;
    }

    protected boolean allowWrite() {
        return activeWriters == 0 && activeReaders == 0;
    }
}

```

If the writing threads now have the excessive advantage, which you want to balance, add a field `waitingReaders`, maintain it, and include it in the considerations of `allowRead` and `allowWrite`.

```java
class ReaderWriter {
    int activeReaders = 0, activeWriters = 0, waitingWriters = 0, waitingReaders = 0;

    public synchronized void readLock() {
        waitingReaders++;
        while (!allowRead())
            wait();
        waitingReaders--;
        activeReaders++;
    }

    public synchronized void readUnlock() {
        activeReaders--;
        notifyAll();
    }

    public synchronized void writeLock() {
        waitingWriters++;
        while (!allowWrite())
            wait();
        waitingWriters--;
        activeWriters++;
    }

    public synchronized void writeUnlock() {
        activeWriters--;
        notifyAll();
    }

    protected boolean allowRead() {
        return activeWriters == 0 && (waitingReaders > waitingWriters);
    }

    protected boolean allowWrite() {
        return activeWriters == 0 && activeReaders == 0;
    }
}

```

An example of using the `ReaderWriter` synchronization mechanism:

```java
class Even {
    int val;
    ReaderWriter rw;

    Even(int val) throws Exception {
        if (val % 2 != 0)
            throw new Exception(...);
        this.val = val;
        this.rw = new ReaderWriter();
    }

    public int get() {
        rw.readLock();
        int ret = val;
        rw.readUnlock();
        return ret;
    }

    public void next() {
        rw.writeLock();
        val++;
        val++;
        rw.writeUnlock();
    }
}

```

Java's library also has ready-made versions of these ideas.

- **`ReentrantLock`** is an explicit lock object. A fair `ReentrantLock` hands out the lock in the order the threads asked for it.
- **`ReadWriteLock`** allows either many readers at once, or a single writer.
- **A semaphore (סמפור)** holds a number of permits for a limited resource. `acquire` waits until a permit is free and takes it, and `release` gives one back. A semaphore with five permits lets five threads in at once.

## Cancellation

We saw that the `Thread` class includes a `stop` method that stops a thread's run abruptly. We noted that this approach is not recommended at all, and that the right way to stop a thread is to "tell" it that it must finish.

**An example: the producer-consumer pattern.** A producer thread adds to a bounded queue, and a consumer thread removes from it.

```java
abstract class Producer<T> implements Runnable {
    BoundedQueue<T> blockingQ;
    public abstract T produce();
    Producer(BoundedQueue<T> q) { blockingQ = q; }

    public void run() {
        while (true)
            blockingQ.add(produce());
    }
}

abstract class Consumer<T> implements Runnable {
    BoundedQueue<T> blockingQ;
    public abstract void consume(T obj);
    Consumer(BoundedQueue<T> q) { blockingQ = q; }

    public void run() {
        while (true)
            consume(blockingQ.remove());
    }
}

class Test {
    public static void main(String[] args) {
        BoundedQueue<Integer> q = new BoundedQueue<Integer>();
        Runnable producer = new Producer<Integer>(q) {
            public Integer produce() { return Random.nextInt(); }
        };
        Runnable consumer = new Consumer<Integer>(q) {
            public void consume(Integer i) { System.out.println(i); }
        };
        Thread tProducer = new Thread(producer);
        Thread tConsumer = new Thread(consumer);
        tProducer.start();
        tConsumer.start();
        tProducer.stop();    // ???
        tConsumer.stop();    // ???
    }
}

```

How do you "tell" the different threads that they must finish?

**Solution A:** extend the `Runnable` interface with the methods

```java
void interrupt();
boolean isInterrupted();

```

and carry them out with a boolean field that says whether the thread must finish:

- **its initial value is `false`,**
- **`interrupt`** sets the field to `true`,
- **`isInterrupted`** returns the field's current value.

```java
abstract class Interruptable implements Runnable {
    volatile boolean bInterrupted = false;
    public boolean isInterrupted() { return bInterrupted; }
    public void interrupt() { bInterrupted = true; }
}

class Producer<T> extends Interruptable implements Runnable {
    ...
    public void run() {
        while (!isInterrupted())
            blockingQ.add(produce());
    }
}

class Consumer<T> extends Interruptable implements Runnable {
    ...
    public void run() {
        while (!isInterrupted())
            consume(blockingQ.remove());
    }
}

// in main:
producer.interrupt();
consumer.interrupt();

```

- **The problem:** the producer's and consumer's threads may be in the Blocked state (because of `wait` on the queue), so they never learn of the instruction to finish.

So you need a service of the **environment**, which makes sure that if "old" threads go back to running, an `InterruptedException` is thrown, so they learn of it. That service is indeed provided by the environment, through the interface of the `Thread` class.

```java
class Producer<T> implements Runnable {
    ...
    public void run() {
        while (!Thread.currentThread().isInterrupted())
            blockingQ.add(produce());
    }
}

class Consumer<T> implements Runnable {
    ...
    public void run() {
        while (!Thread.currentThread().isInterrupted())
            consume(blockingQ.remove());
    }
}

// in main:
tProducer.interrupt();
tConsumer.interrupt();

class BoundedQueue<T> {
    ...
    public synchronized void add(T obj) {
        try {
            while (lst.size() == capacity)
                this.wait();
            lst.add(obj);
            this.notifyAll();
        } catch (InterruptedException e) {
            ... // closing actions
            Thread.currentThread().interrupt();
        }
    }

    public synchronized T remove() {
        try {
            while (lst.size() == 0)
                this.wait();
            T ret = lst.remove(0);
            this.notifyAll();
            return ret;
        } catch (InterruptedException e) {
            ... // closing actions
            Thread.currentThread().interrupt();
        }
    }
}

```

**Responding to `InterruptedException`:**

- **logical closing actions,**
- **deciding whether to pass on the information that the task was stopped.** The thread's interrupt flag is reset when `InterruptedException` is caught, meaning it goes back to `false`. So if you want to pass the information up, you must call `interrupt` on the current thread again.

## Liveness

### Measuring a concurrent system

You can evaluate the performance of a system at run time by different measures.

- **Throughput:** the number of operations per unit of time (or the time per operation).
- **Latency:** how long it takes from raising a request until it is carried out.
- **Efficiency:** how good the throughput or the latency is, relative to the resources that exist (processors, memory, ...): throughput divided by the number of resources.
- **Scalability:** how much the throughput or the latency improves if resources are added to the system.

You can check the efficiency of an existing system that runs by measures like these and others. Why would these measures not be ideal for a given system, which carries out its logic efficiently? Which factors harm them?

- **In a serial or concurrent system:**
  - waiting for I/O (input from the keyboard, from files, from the network),
  - waiting for the processor (because of scheduling policies that are not fair).
- **In a concurrent system:**
  - synchronization: moving to Blocked to try to lock (or, in the case of `CompareAndSet`, a busy wait of a kind),
  - waiting for a precondition to hold: moving to Blocked through `wait`.

In cases like these we say that the system suffers from **liveness** problems. The next sections go through a number of classic scenarios.

:::definition id=def-liveness title="Deadlock, livelock, and starvation" source="materials/lectures/Chapter 8 - Concurrency.pptx"

- **Deadlock (נעילה הדדית):** two or more threads are blocked forever, each waiting for a lock that another one holds. The usual fix is to make every thread acquire locks in the same global order.
- **Livelock:** the threads are not blocked, but they spend all their time reacting to each other, so none of them gets any work done.
- **Starvation (הרעבה):** a thread that is ready to run is passed over again and again, because other threads keep getting the resource first.
:::

### Livelock

In this scenario, a group of threads works without stopping, but the threads do not progress in their tasks, because they block each other without the preconditions holding.

**It happens when:**

- **the code of the threads' tasks is symmetric,**
- **there is a specific, repeating schedule** in which the order of operations causes the threads to cancel each other's preconditions.

**Examples:**

- **two people in a corridor,** who both step aside to the same side, again and again,
- **the dining philosophers** (below).

**A simple solution:** introduce a random dimension into the schedule (for example, by running `sleep` in the task's code for a random amount of time).

### Starvation

Since the synchronization and waiting mechanisms are not fair (at least in Java), there may be a situation in which one of the threads always manages to take the lock, or is the first to wake up from waiting, while another thread loses again and again (and so is always waiting), and so it is in practice "starved" from the point of view of getting processor time, or running.

- **Example:** the dining philosophers.
- **Solution:** use a fair synchronization or waiting mechanism, such as `FairSemaphore`.

### Deadlock

A group of threads is in the Blocked state, and no other thread can bring them out of that state, except threads from the group (which cannot, because they are in the Blocked state).

There are two scenarios.

**1. Each of the threads is in the Blocked state, waiting to lock a resource** (because of `synchronized` and the like).

```java
class Even {
    int val;
    ...
    public void swap(Even other) {
        synchronized (this) {
            synchronized (other) {
                int tmp = other.val;
                other.val = val;
                val = tmp;
            }
        }
    }
}

```

`e1` holds 2 and `e2` holds 4. T1 calls `e1.swap(e2)` and locks `e1`, and T2 calls `e2.swap(e1)` and locks `e2`. Now T1 waits for `e2`, which T2 holds, and T2 waits for `e1`, which T1 holds.

**Solutions:**

1. **Lock the two objects together,** with protocol C, in which several objects are represented by one synchronization object. That is not very efficient, because every access to one of the objects separately must lock both of them.
2. **Lock the first object, and "try" to lock the second** (with `tryAcquire` in the `Semaphore` class). If it is already locked, release the first object and try again. That risks a livelock, as in the dining philosophers below.
3. **Avoid it with a method that guarantees correctness and safety** through synchronization that does not move the waiting thread to Blocked, such as immutable objects.
4. **Resource ordering (the royal way).** Fix an order in which resources are taken, so that every one of the threads takes the resources in that order. That prevents the deadlock that is always caused by symmetry in the order resources are taken.

In our example, fix the order in which objects of type `Even` are taken by their unique identity in the system (as given by the method `identityHashCode` of the `System` class).

```java
public void swap(Even other) {
    if (System.identityHashCode(this) < System.identityHashCode(other))
        synchronized (this) {
            synchronized (other) {
                int tmp = other.val;
                other.val = val;
                val = tmp;
            }
        }
    else
        synchronized (other) {
            synchronized (this) {
                int tmp = other.val;
                other.val = val;
                val = tmp;
            }
        }
}

```

- **`e1` has identity 100, and `e2` has identity 200.** Both T1 and T2 now lock `e1` first, so whichever of them comes second waits for `e1` while holding nothing, and the first one finishes.

**2. The threads in the group are in the Blocked state because they are waiting for a precondition to hold,** when the thread that should change the precondition is waiting for its own precondition, which depends on another thread in the group.

**An example (from an exam):** a simulation of a home water-purification system. A water consumer pours dirty water into the dirty-water container and takes clean water from the clean-water container. A water purifier takes from the dirty-water container and puts into the clean-water container.

- **A deadlock can happen** when both containers are full: the consumer cannot pour dirty water, and the purifier cannot put clean water. Each of them waits for its precondition.
- **A possible solution: break the symmetry.** For example, an extra thread that wakes up from time to time, checks whether there is such a scenario (the total amount of water in the containers is full, as much as possible), and if so, "spills" water from one of the containers.

### The dining philosophers

All the scenarios above appear in the problem of the dining philosophers.

The life of a philosopher is made of thinking and eating. Eating requires taking two forks, on the philosopher's left and right.

```java
class Philosopher implements Runnable {
    Fork left, right;
    Philosopher(Fork left, Fork right) { this.left = left; this.right = right; }

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
}

```

**Problem A: deadlock.** Every philosopher takes the left fork at the same moment, and waits forever for the right one.

**Solution A1: resource ordering.**

```java
class Philosopher implements Runnable {
    Fork left, right;
    Philosopher(Fork left, Fork right) { this.left = left; this.right = right; }

    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            think();
            if (System.identityHashCode(left) < System.identityHashCode(right)) {
                synchronized (left) {
                    synchronized (right) {
                        eat();
                    }
                }
            } else {
                synchronized (right) {
                    synchronized (left) {
                        eat();
                    }
                }
            }
        }
    }
}

```

**Problem B: starvation.** A philosopher may always lose the race for a fork to a neighbor.

**Solution: use a fair semaphore.**

```java
class Fork {
    public FairSemaphore sem = new FairSemaphore(1);
    ...
}

class Philosopher implements Runnable {
    Fork left, right;

    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            think();
            if (System.identityHashCode(left) < System.identityHashCode(right)) {
                left.sem.acquire();
                right.sem.acquire();
                eat();
                right.sem.release();
                left.sem.release();
            } else {
                right.sem.acquire();
                left.sem.acquire();
                eat();
                left.sem.release();
                right.sem.release();
            }
        }
    }
}

```

**Solution A2 (to the deadlock problem):** take the first fork, try to take the second fork, and if it does not work, give up eating this time.

```java
class Philosopher implements Runnable {
    Fork left, right;

    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            think();
            left.sem.acquire();
            if (right.sem.tryAcquire()) {
                eat();
                right.sem.release();
                left.sem.release();
            } else
                left.sem.release();
        }
    }
}

```

**Problem: livelock.** All the philosophers may take the left fork, fail on the right one, release, and do it again, in step, forever.

**Solution: add a random element.**

```java
class Philosopher implements Runnable {
    Fork left, right;

    public void run() {
        while (!Thread.currentThread().isInterrupted()) {
            think();
            left.sem.acquire();
            Thread.sleep(Random.nextInt(1000));
            if (right.sem.tryAcquire()) {
                eat();
                left.sem.release();
                right.sem.release();
            } else
                left.sem.release();
        }
    }
}

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

To sum up, a thread that must wait for a precondition calls `wait` inside a `while` loop, in one synchronization block with the check and the operation, and every change ends with `notifyAll`. On top of that mechanism you can build semaphores, fair semaphores, and reader-writer locks, and you must watch for the three liveness failures: livelock, starvation, and deadlock.

This closes the concurrency part of the course.

- **Next:** [Networking](topic:networking) moves from threads inside one process to communication between processes.
