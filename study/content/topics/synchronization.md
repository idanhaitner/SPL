---
id: synchronization
title: Synchronization
blurb: "Immutable objects, locks and their protocols, visibility, thread-safe class patterns, and lock-free compare-and-set."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 8 - Concurrency.pptx"
  - "materials/sessions/PS6-2026-1.pptx"
  - "materials/sessions/SPL_PS8.pptx"
  - "materials/sessions/SPL_PS10.pptx"
  - "materials/exams/15-a.pdf"
  - "materials/exams/15-a-solution.pdf"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
  - "materials/exams/24-c.pdf"
  - "materials/exams/24-c-solution.pdf"
---

This chapter goes through the ways to keep a concurrent run safe and correct. The methods differ, and so do their costs.

- **Avoiding shared state:** immutable objects, which no thread can change, and copies that are merged at the end.
- **Locks:** `synchronized` and the protocols for using it, what it does to visibility and to the order of instructions, and the patterns for thread-safe classes.
- **Lock-free updates:** the compare-and-swap operation, which updates a value without ever blocking a thread.

## Three strategies

Broadly, there are three strategies for safety and correctness, which you will meet in many forms in this chapter.

- **Prevent shared state of memory:**
  - make sure an object is reached by only one thread, so every thread works "modularly" on different objects,
  - make sure every thread reaches only part of an object (every thread reaches different fields of the object),
  - give every thread its own copies of the objects, and merge the results at the end.
- **Synchronize the threads' access** to the objects.
- **Let the threads work on the shared object as usual,** and when a problem occurs in safety or correctness, detect it and try again.

## Immutable objects

The first strategy removes the problem at its root: if no thread can change an object, there is nothing to protect.

It turns out that assignment is not essential to programming. Every algorithm can be written without it, in a functional language. So you can design classes with no assignment at all.

- **Every field is `private final`,** so it is set once, in the constructor, and the constructor checks the invariant.
- **A command does not change the object.** It returns a new object with the new value.
- **The class is `final`,** so no subclass can add a field that changes.
- **A getter never exposes a field that could be changed,** so object fields must be immutable too.

```java
final class Even {
    private final int val;

    Even(int val) throws Exception {
        if (val % 2 != 0) throw new Exception("Odd number!");
        this.val = val;
    }

    public int get() { return val; }
    public Even next() { return new Even(val + 2); }   // a new object
}
```

Such an object can be shared by any number of threads with no locking, because nobody can catch it in the middle of a change.

**The catch: you must use the returned copy.** Java's `String` works this way, and forgetting it is a classic bug.

```java
String s = "abc";
s.replaceAll("b", "d");       // returns "adc", which is thrown away
System.out.print(s);          // abc
s = s.replaceAll("b", "d");
System.out.print(s);          // adc
```

**With threads, each thread gets its own new copy,** and the results are merged at the end. Two threads that each advance the same `Even` by 2:

```java
class Adder implements Runnable {
    Even e;
    Adder(Even e) { this.e = e; }
    public void run() { e = e.next(); }     // its own new Even
}
```

```java
Even e = new Even(0);
Adder a1 = new Adder(e), a2 = new Adder(e);
// run a1 and a2 on two threads, then join both
e = new Even(a1.e.get() + a2.e.get() - e.get());   // 2 + 2 - 0 = 4
```

Each adder ended with its own `Even` holding 2. The merge adds what each one contributed.

**When is this worth it?** For objects that are cheap to copy and cheap to create, such as numbers, strings, dates, and colors. These are **value objects**: what matters is their value, not their place in memory. Java's `String`, `Integer`, `Long`, `Double`, and `Boolean` are all immutable.

## Synchronizing access with a lock

The second strategy makes sure that two threads never run a "critical" piece of code on the same object at the same time. The first thread to arrive gets in; the others move to the Blocked state and wait.

The run-time environment provides two operations for this.

- **`lock(O)`:** if nobody holds `O`, the current thread takes it. Otherwise the thread is blocked until `O` is released.
- **`unlock(O)`:** the current thread releases `O`, and the threads waiting for it become Runnable again.

To support this, every object carries a record of which thread holds it, and a list of the threads waiting for it. Java writes the pair as a block:

```java
synchronized (o) {     // lock(o)
    ...
}                      // unlock(o)
```

:::definition id=def-critical-section title="Critical section and mutual exclusion" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A **critical section** (אזור קריטי) is a stretch of code that at most one thread may execute at a given moment.

- **Mutual exclusion (מניעה הדדית)** is the guarantee that only one thread at a time is inside the critical section. A lock, also called a mutex, enforces it.
- **A `synchronized` method** locks the object `this` for the whole method.
- **A `synchronized (obj)` block** locks the object `obj` for the length of the block.
:::

How do you use locks to make a whole class safe for many threads ("thread-safe")? The notes give three protocols.

### Protocol A: full synchronization

**Every** access to a field, reading or writing, happens while holding the lock on the object.

```java
public int get() {
    synchronized (this) { return val; }
}

public void next() {
    synchronized (this) { val++; val++; }
}
```

- **Three threads call `e.next()`:** one gets in, the other two wait. Each `next` runs whole, so `e` goes 0, 2, 4, 6.
- **One thread calls `next` while another calls `get`:** `get` also needs the lock, so it can never see the odd value in the middle of `next`.

Locking the whole method is so common that Java has a shortcut. These two are the same:

```java
public int get() { synchronized (this) { return val; } }
public synchronized int get() { return val; }
```

`synchronized` belongs to the method's code, not its signature. An interface cannot declare a method synchronized, and a subclass that overrides a synchronized method must write `synchronized` again.

### Protocol B: partial synchronization

If the methods split into groups that touch **different fields**, each group can have its own lock. Then threads working on different groups do not wait for each other.

A `Point` has `x` and `y`. The methods that use `x` never touch `y`, and the other way around.

```java
class Point {
    int x, y;
    Object lockX = new Object(), lockY = new Object();

    public void up()    { synchronized (lockY) { y++; } }
    public int getY()   { synchronized (lockY) { return y; } }

    public void right() { synchronized (lockX) { x++; } }
    public int getX()   { synchronized (lockX) { return x; } }
}
```

If T1 calls `p.up()` and T2 calls `p.right()`, they run at the same time. With one lock on `this`, one of them would wait for no reason.

### Protocol C: one lock for several objects

Sometimes one operation must touch two objects together, for example moving an item from list `l1` to list `l2`. Create one lock object that stands for both, and use it for every access to either list.

```java
Object lockL1L2 = new Object();

synchronized (lockL1L2) {
    l2.add(l1.remove(0));
}
```

## More consequences of the lock

`synchronized` does more than keep threads apart.

### Visibility

Each processor has its own cache. Two threads on different processors can each read an old copy of the same field from their own cache, even though the heap is "shared".

```java
Even e = new Even(0);
// two threads each call e.next(), and main joins them
System.out.println(e.get());    // can print 0!
```

Even if the two threads ran perfectly in turn and left 4 in memory, the main thread's processor might still be reading 0 from its cache.

- **Entering or leaving a `synchronized` block** brings the processor's cache up to date with RAM, so a synchronized `get` always sees 4.
- **Without `synchronized`,** declare the field `volatile`. That forces every read and write of it to go to RAM, not the cache.

```java
volatile Even e;    // a field: every access goes to RAM
```

`volatile` also makes a single read or write of the field atomic, even when the value takes more than one cell, such as a `long`. It does **not** make a read-modify-write atomic.

- **`volatile`** guarantees visibility for a variable, and limits how the compiler and processor may reorder instructions around it.
- **Visibility** means that once one thread writes the variable, a later read by another thread sees the new value, rather than an old copy kept in a register or cache.
- **`volatile` does not make `count++` atomic.** For that, the read, the change, and the write must happen as one action: inside one `synchronized` block, or as one compare-and-swap.

:::check id=chk-volatile
Two threads execute `count++` on a field declared `volatile int`. Is the increment atomic?

- [ ] Yes. `volatile` makes the operation atomic
- [x] No. `volatile` guarantees memory visibility only, and a read-modify-write needs synchronization
- [ ] Yes. Writes of an `int` are atomic in hardware

- **`volatile` only affects visibility:** `count++` is still three separate steps, and another thread can still slip in between them.
- **To make the increment atomic,** run the three steps under one lock, or use a compare-and-swap, for example with `AtomicInteger`.
:::


### Code reordering

The compiler may also change the order of lines, when the result looks the same to one thread.

```java
i++;            // may run as:   j++;
j++;            //               i++;
```

In machine terms, after `j = 20` the value 20 may still be in a register, so incrementing `j` first saves one read from memory. In a serial program nobody can tell. Between threads, another thread might see `j` change before `i`.

The compiler does not move code across operations whose result could change, such as an `if`, a call to a procedure, or a `synchronized` block.

## Design patterns for thread-safe classes

### 1. Adding a method to a thread-safe class

Java's `Vector` is thread-safe: every method is safe by itself. That is not enough for two calls in a row.

```java
if (!v.contains(5))
    v.add(5);
```

Between `contains` and `add`, another thread can add 5, so 5 ends up in the vector twice. The two calls must run as one, under the same lock the vector uses:

```java
synchronized (v) {
    if (!v.contains(5))
        v.add(5);
}
```

This is called **client-side locking**: the users of the class take the same lock that its methods use.

:::check id=chk-client-lock
`Vector.contains` and `Vector.add` each lock `this`. Why is `if (!v.contains(5)) v.add(5);` still a race?

- [ ] Because `Vector` does not lock its methods
- [x] Because the lock is released between the two methods
- [ ] Because `contains` returns a copy of the vector

- **Each method is safe on its own,** but the lock is released after `contains` returns, before `add` starts.
- **The fix:** make the pair one action, either by having the caller lock `v` around both calls, or by giving the class a single method that does both under its lock.
:::


If this operation is common, it belongs inside the class. A first try extends `Vector`:

```java
class MyVector<T> extends Vector<T> {
    public synchronized void addIfAbsent(T obj) {
        if (!contains(obj)) add(obj);
    }
}
```

**The problem:** `addIfAbsent` locks `this`. Who promised that `Vector`'s own methods lock `this` too? They might use another lock, or another mechanism altogether. If so, `add` from another thread can still slip into the middle.

A second try overrides every method of `Vector`, each `synchronized` and calling `super`. That fixes the lock, but if one method is forgotten, or a new one is added to `Vector` in a future JDK, it still compiles and silently uses the old lock.

**The solution: delegation.** Do not inherit. Keep a `Vector` inside, and implement its interfaces yourself, every method synchronized on `this`.

```java
class MyVector<T> implements List<T> {
    private Vector<T> v = new Vector<>();

    public synchronized boolean contains(T obj) { return v.contains(obj); }
    public synchronized void add(T obj)         { v.add(obj); }
    public synchronized void addIfAbsent(T obj) {
        if (!v.contains(obj)) v.add(obj);
    }
    ...   // the same for every method of List
}
```

Nobody outside can reach the inner vector, so every access goes through your lock.

**What the pattern teaches:**

- **A thread-safe class still cannot be used like serial code.** Operations that depend on each other, such as a check and an action, must be locked together.
- **If you do not know exactly how a class protects itself,** make sure your code and the class use one and the same mechanism.

### 2. Walking over a data structure

A walk over all the items takes a long time, and other threads may change the structure in the middle.

```java
public void printAll() {
    Iterator<T> it = iterator();
    while (it.hasNext())
        System.out.println(it.next());
}
```

Between `hasNext` and `next`, another thread may remove the last item. A bank has the same problem: summing all the accounts at night while a transfer moves money from one account to another can count the money twice.

There are three solutions, each with its own cost.

**Solution A: lock the whole walk.**

```java
public synchronized void printAll() { ... }
```

Correct, but nobody else can touch the structure for the whole walk, like a bank that closes its accounts to customers every night.

**Solution B: walk over a copy (a snapshot).** Lock only to copy, then walk the copy with no lock, because no other thread knows the copy.

```java
public void printAll() {
    MyVector<T> copy;
    synchronized (this) { copy = clone(); }   // short: just the copy
    for (T item : copy)
        System.out.println(item);             // long: no lock needed
}
```

This costs memory and time for the copy. And if the walk changes the items, the copy has to be merged back at the end, which can get complicated.

**Solution C: optimistic try and fail.** Walk with no lock at all, but **detect** when someone changed the structure during the walk, and start again. This fits structures that are read far more often than they are changed.

The detection uses a **version number**: every command that changes the vector increases it.

```java
int version = 0;

public synchronized void add(T obj) {
    super.add(obj);
    version++;
}
// the same for remove, and every other command
```

The iterator remembers the version it started with, and every `next` checks it.

```java
public T next() {
    synchronized (MyVector.this) {
        if (version != origVersion)
            throw new ConcurrentModificationException();
        return get(index++);
    }
}
```

The walk catches the exception and tries again.

```java
public void printAll() {
    try {
        for (T item : this)
            System.out.println(item);
    } catch (ConcurrentModificationException e) {
        printAll();      // someone changed it: start over
    }
}
```

The same idea works for any action, not only printing: pass the action as a parameter, for example `v.applyAll(i -> System.out.println(i))`, and retry the whole walk on the exception.

## Lock-free synchronization

A lock has a cost: moving a thread to Blocked and back takes time, often more than the short critical section it waits for. The third approach never blocks a thread. A waiting thread simply keeps trying.

It relies on a processor operation called **compare-and-set** (CAS). In one atomic step, it reads a cell, compares it with an expected value, and writes a new value only if they match.

```cpp
boolean cas(int* address, int oldVal, int newVal) {   // done by the hardware, atomically
    if (*address == oldVal) { *address = newVal; return true; }
    return false;
}
```

Java exposes it through `AtomicInteger`, `AtomicBoolean`, `AtomicReference<T>`, and so on. The pattern for every command is a retry loop:

1. Read the current value.
2. Compute the new value from it.
3. `compareAndSet(old, new)`. If someone changed the value in between, it fails, so go back to step 1.

The `Even` class with CAS:

```java
private AtomicInteger val = new AtomicInteger(0);

public int get() { return val.get(); }

public void next() {
    int oldVal, newVal;
    do {
        oldVal = val.get();
        newVal = oldVal + 2;
    } while (!val.compareAndSet(oldVal, newVal));
}
```

- **T1 and T2 both read 0** and both compute 2.
- **Only one `compareAndSet(0, 2)` succeeds.** The other finds 2 instead of 0, so it fails.
- **The loser loops:** it reads 2, computes 4, and succeeds. The result is 4, and no thread was ever blocked.

**The same pattern on a linked list.** Adding at the head is "read the head, build a link pointing at it, make it the new head". Two threads can both read the same head, and one link is lost. With CAS, the loser simply retries.

```java
AtomicReference<Link<T>> head = new AtomicReference<>(null);

public void add(T obj) {
    Link<T> oldHead, newHead;
    do {
        oldHead = head.get();
        newHead = new Link<>(obj, oldHead);
    } while (!head.compareAndSet(oldHead, newHead));
}
```

This is not always easy to apply to a whole class. Java has ready-made lock-free structures, such as `ConcurrentHashMap` and `ConcurrentLinkedQueue`.

**What "lock-free" really means.** You could also write a lock out of CAS:

```java
AtomicBoolean lock = new AtomicBoolean(false);

while (!lock.compareAndSet(false, true));   // spin until you get the lock
... // critical code
lock.set(false);                            // release it
```

No thread is ever Blocked here, but it is **not** lock-free in the full sense. If the thread holding the lock loses the processor in the middle, every other thread spins uselessly until it comes back. In the retry pattern above, by contrast, some thread always succeeds and moves on. Lock-free means both:

- **no waiting thread is moved to Blocked,**
- **no thread is stuck behind another thread that has not finished its critical code.**

## The same lock in C++

The practical session translates the Java lock and thread into C++.

- **`std::lock_guard<std::mutex>`** locks the mutex when it is created, and unlocks it automatically when it goes out of scope, even on an early return. It is the RAII version of `synchronized (mutex)`.
- **`std::thread`** runs a function on a new thread, and `join` waits until that function returns.
- **A common mistake:** if a `std::thread` object is destroyed while it is still joinable, meaning neither `join` nor `detach` was called, the program calls `std::terminate`.

## Practice

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

To sum up, there are three ways to keep a concurrent run safe and correct: avoid shared changing state (immutable objects, copies merged at the end), lock it (`synchronized`, with protocols A, B, and C), or let threads work and retry when a change is detected (the versioned iterator, and the compare-and-swap loop).

- **Next:** [Waiting and liveness](topic:waiting-and-liveness) handles operations that cannot run yet, and what happens when threads wait for each other forever.
