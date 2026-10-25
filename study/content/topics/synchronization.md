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

In programming languages you can, of course, assign to variables.

```java
int i = 5;
...
i++;

Student s = new Student(...);
...
s.setNickName("jango");

```

It turns out that assignment is not essential to a programming language: every algorithm can be written in a language without assignment. These are called functional languages (you will meet them in the course on programming-language principles).

So you can design classes with no assignment operations. In such classes there are no safety problems, as long as the invariant is checked in the constructor, so you can expose such an object to several threads with no special protection.

**The design:**

- **Commands:** instead of assigning, return a new, updated copy.
- **Queries:** all the fields are final and private, so they can be reached only through queries. A query does not expose its internal fields when they are of object type, unless those are designed as immutable objects too (otherwise a user who got access to a field could change it).
- **The class cannot be inherited** (it is declared `final`).

```java
final class Even {
    private final int val;

    Even(int val) throws Exception {
        if (val % 2 != 0)
            throw new Exception("Odd number!");
        this.val = val;
    }

    public int get() { return val; }

    public Even next() {
        return new Even(val + 2);
    }
}

```

**Using it.** Usually, when you use objects like this, you must make sure of correctness (safety holds in every case).

- **Assign the new copy to the variable on every call to a command** (relevant for a serial run too), as in the `String` class, for example for the `replaceAll` command:

```java
String s = "abc";
s.replaceAll("b", "d");
System.out.print(s);   // abc
s = s.replaceAll("b", "d");
System.out.print(s);   // adc

```

- **Merge the results at the end,** for a concurrent run:

```java
class Adder implements Runnable {
    Even e;
    Adder(Even e) { this.e = e; }
    public Even getE() { return e; }
    public void run() { e = e.next(); }
}

class Test {
    public static void main(String[] args) {
        Even e = new Even(0);
        Adder adder1 = new Adder(e);
        Adder adder2 = new Adder(e);
        Thread t1 = new Thread(adder1);
        Thread t2 = new Thread(adder2);
        t1.start();
        t2.start();
        // merge the copies:
        // 1. wait for completion
        t1.join();
        t2.join();
        // 2. merge
        e = new Even(adder1.getE().get() + adder2.getE().get() - e.get());
    }
}

```

Each adder starts from the `Even` at 0 and makes its own new `Even` at 2, so the merge computes 2 + 2 − 0 = 4.

**When is it worth using objects like this?** Objects that are cheap to copy and cheap to create, such as numbers, strings, and colors. In a philosophical sense, this is a kind of type called a **value object**: an object whose identity is defined by its value, and not by its place in memory.

```java
Integer i1 = new Integer(6);
Integer i2 = new Integer(6);
if (i1.equals(i2)) ...   // true: equal by value

```

Java has quite a few classes like this: `String`, `Integer`, `Long`, `Double`, `Boolean`, ...

## Synchronizing access with a lock

The second strategy makes sure that two threads do not perform "critical" operations on the same object at the same time.

In this approach, the first thread that reaches the object gets access to it, while the threads that arrive after it move to the Blocked state.

For that, you need a service of the run-time environment: lock and unlock operations, and moving threads to the Blocked and Runnable states accordingly.

- **`lock(O)`:** the current thread tries to lock the object `O`. If the object is not yet locked, it is taken by the thread. Otherwise, the thread moves to the Blocked state, until the thread holding it releases it.
- **`unlock(O)`:** the current thread releases its lock on the object `O`, and as a result the environment returns every thread that moved to Blocked because it tried to take `O` to the Runnable state.

To carry out these operations, every object gets a data structure that includes a field (of type `Thread`) that says which thread holds it now, and a list of the threads that tried to lock it and moved to the Blocked state because it was taken.

Java has a convenient syntax, which comes from Java's own code, for these two operations.

```java
synchronized (o) {
    ...
}

// is

lock(o);
...
unlock(o);

```

:::definition id=def-critical-section title="Critical section and mutual exclusion" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A **critical section** (אזור קריטי) is a stretch of code that at most one thread may execute at a given moment.

- **Mutual exclusion (מניעה הדדית)** is the guarantee that only one thread at a time is inside the critical section. A lock, also called a mutex, enforces it.
- **A `synchronized` method** locks the object `this` for the whole method.
- **A `synchronized (obj)` block** locks the object `obj` for the length of the block.
:::

How do you use this mechanism for a given class, so that it guarantees the safety and correctness of the class, even when its instances are exposed to several threads (in other words, how do you make it "thread safe")?

### Protocol A: full synchronization

Every access to a field of the class, for reading or for writing, is done under a lock on the object.

```java
class Even {
    private int val;

    Even(int val) throws Exception {
        if (val % 2 != 0)
            throw new Exception("Odd number!");
        this.val = val;
    }

    public int get() {
        synchronized (this) {
            return val;
        }
    }

    public void next() {
        synchronized (this) {
            val++;
            val++;
        }
    }

    public void f() { System.out.println("abc"); }
}

```

- **Three threads call `e.next()`.** T1 takes the lock on `e`. T2 and T3 arrive while it holds it, so they move to Blocked and wait in `e`'s list. When T1 leaves the block, it releases the lock, and one of them takes it. Every `next` runs whole, and `e` goes from 0 to 2 to 4 to 6.
- **T1 calls `e.next()` and T2 calls `e.get()`.** `get` also needs the lock, so T2 waits until `next` has finished both increments, and never reads an odd value.
- **`f` reads no field,** so it is not synchronized, and any thread can run it at any time.

Since this is a standard and common protocol, Java has a convenient syntax (syntactic sugar) for it:

```java
public int get() {
    synchronized (this) {
        return val;
    }
}

// is the same as

public synchronized int get() {
    return val;
}

```

- **`synchronized` is not part of the method's signature,** but part of its code. For example, you cannot declare a method in an interface as "synchronized". You must declare the method as synchronized in a derived class, if you override it there.
- **A note:** in different cases you may be able to avoid locking the whole method, so that only a few lines of it run under the synchronization block. You will see examples later in the course. Either way, be careful, and know what you are doing.

### Protocol B: partial synchronization

If you can split the interface's methods into separate groups, so that a method in one group never touches the fields of the methods in another group, you can synchronize each group of methods on an object that represents that group.

```java
class Point {
    int x, y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    public int getY() { synchronized (this) { return y; } }
    public void up() { synchronized (this) { y++; } }
    public void down() { synchronized (this) { y--; } }
    public int getX() { synchronized (this) { return x; } }
    public void right() { synchronized (this) { x++; } }
    public void left() { synchronized (this) { x--; } }
}

// becomes

class Point {
    int x, y;
    Object lockX, lockY;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
        lockX = new Object();
        lockY = new Object();
    }

    public int getY() { synchronized (lockY) { return y; } }
    public void up() { synchronized (lockY) { y++; } }
    public void down() { synchronized (lockY) { y--; } }
    public int getX() { synchronized (lockX) { return x; } }
    public void right() { synchronized (lockX) { x++; } }
    public void left() { synchronized (lockX) { x--; } }
}

```

- **T1 calls `p.up()`, T2 calls `p.left()`, and T3 calls `p.right()`.** T1 locks `lockY`, and T2 locks `lockX`, so they run at the same time. Only T3 waits, for `lockX`.

### Protocol C: locking several objects in one operation

Suppose you are interested in locking two objects (this may come up in an exercise), for example removing a member from one list only if you can add it to another list in its place. You can lock both lists as one, by locking an object that represents both of them (so that every access to the lists goes through synchronization on that object).

```java
List<Integer> l1, l2;
Object lockL1L2;
...
synchronized (lockL1L2) {
    ... // do something with both L1 and L2
}

```

## More consequences of the lock

We saw that `synchronized` lets a piece of code run without other threads reaching the object at the same time. It turns out it has more consequences.

### Visibility

Remember that each processor keeps a cache memory, so that access to "popular" memory cells does not actually go to the RAM.

- **When threads run on different processors,** they may read different contents of the same cell in memory, each from its own processor's cache, even though by the concurrency model the heap is shared by all the threads.

```java
class Test {
    public static void main(String[] args) {
        Even e = new Even(0);
        Thread t1 = new Thread(() -> e.next());
        Thread t2 = new Thread(() -> e.next());
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        System.out.println(e.get());
    }
}

```

- **Assume the program runs correctly,** so each thread advances the number by 2 in turn, one after the other, with no interference.
- **The program may still print 0!** That happens when the processor of the main thread reads the value of `e` from its own cache memory, while the other threads run on another processor. So the number on the heap is 4, but the main thread's processor did not reach it.
- **Running `synchronized` code** causes the caches of all the processors to be updated with the contents of RAM.

What if you chose to keep safety and correctness without the `synchronized` mechanism? Declaring a variable `volatile` forces the processor always to read or write its value from RAM, and not from the cache.

```java
class Test {
    public static void main(String[] args) {
        volatile Even e = new Even(0);
        ...
    }
}

```

- **A note:** declaring a variable `volatile` also makes reading and writing it atomic. If it spreads over more than one cell in memory, other threads cannot reach it while another thread is reading or writing it.
- **Strictly,** Java accepts `volatile` only on fields, so in real code `e` would be a field of the class.

"Atomic" here means one read or one write. A read-modify-write is still several steps.

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

It turns out the compiler sometimes changes the order of the lines in a program, for the sake of optimization.

```java
int i = 10;
int j = 20;
i++;
j++;

// may become

int i = 10;
int j = 20;
j++;
i++;

```

In machine operations, the original order is:

```text
write [i],10
write [j],20
read R1,[i]
inc R1
write [i], R1
read R1,[j]
inc R1
write [j], R1

```

and the reordered one is:

```text
write [i],10
write [j],20
inc R1          // R1 still holds 20, so "read R1,[j]" is dropped
write [j], R1
read R1,[i]
inc R1
write [i], R1

```

The reordered version skips one read, because `R1` already holds `j`. In a serial program this changes nothing. When there are operations between the lines whose result could be affected by the change of order, the compiler does not touch the order. Such operations include `if`, a call to a procedure, `synchronized`, and so on.

## Design patterns for thread-safe classes

### 1. Adding a method to a thread-safe class

Java's `Vector` class is declared thread-safe. In other words, instances of the class can be exposed to several threads without worry.

It turns out that a class being thread-safe does not allow every use of it under several threads. For example:

```java
Vector<Integer> v;
... // some code, including thread creation over v
if (!v.contains(5))
    v.add(5);

```

The safety and correctness of the class guarantee that running each of its methods is correct, but there is no guarantee between the check whether 5 is in the vector and the add operation that another thread will not add 5 to the vector after it.

So make sure another thread cannot reach the vector between the two lines of code:

```java
Vector<Integer> v;
... // some code, including thread creation over v
synchronized (v) {
    if (!v.contains(5))
        v.add(5);
}

```

This fix is called **client-side locking**: the users of the class take the same lock that its methods use.

:::check id=chk-client-lock
`Vector.contains` and `Vector.add` each lock `this`. Why is `if (!v.contains(5)) v.add(5);` still a race?

- [ ] Because `Vector` does not lock its methods
- [x] Because the lock is released between the two methods
- [ ] Because `contains` returns a copy of the vector

- **Each method is safe on its own,** but the lock is released after `contains` returns, before `add` starts.
- **The fix:** make the pair one action, either by having the caller lock `v` around both calls, or by giving the class a single method that does both under its lock.
:::

In the case of a common operation, as always, it is better to extend the class with another method that handles this common use.

```java
class MyVector<T> extends Vector<T> {
    public synchronized void addIfAbsent(T obj) {
        if (!contains(obj))
            add(obj);
    }
}

MyVector<Integer> v;
... // some code, including thread creation over v
v.addIfAbsent(5);

```

**The problem:** who guarantees that the safety and correctness of the class are carried out in general by synchronizing threads (there are other methods), and even if so, who said they are carried out by synchronization on locks (there is another way besides `synchronized`, as you will see)? And even if the class is synchronized with `synchronized`, who said the lock is on the object `this`?

- **So make sure yourself** that all the methods are synchronized by a lock on `this`:

```java
class MyVector<T> extends Vector<T> {
    public synchronized void addIfAbsent(T obj) {
        if (!contains(obj))
            add(obj);
    }

    public synchronized boolean contains(T obj) {
        return super.contains(obj);
    }

    public synchronized void add(T obj) {
        super.add(obj);
    }

    ... // same for all methods of Vector
}

```

**The problem:** if you forget to override one of the methods, or if one is added in the future (in later versions of the JDK) to the methods of the `Vector` class, the code still compiles. In other words, one of the methods stays synchronized on another object, not `this`.

- **So instead of inheriting,** implement `Vector`'s interfaces with an inner vector (delegation, or composition):

```java
class MyVector<T> implements List<T>, Iterable<T> ... {
    Vector<T> v;

    public MyVector() { v = new Vector(); }

    public synchronized void addIfAbsent(T obj) {
        if (!v.contains(obj))
            v.add(obj);
    }

    public synchronized boolean contains(T obj) {
        return v.contains(obj);
    }

    public synchronized void add(T obj) {
        v.add(obj);
    }

    ... // same for all methods of Vector
}

```

**What this pattern teaches:**

- **Even when there is a thread-safe class,** you cannot write "ordinary" code with it (as in serial design). In particular, you must synchronize operations on the object that depend on each other (such as `if-else`).
- **If the safety and correctness mechanism of the class is not known exactly,** make sure that your extension of the class, or your use of it, works with one mechanism.

### 2. Walking over a data structure

Given a method that performs some operation on every member of a class that implements a data structure, other threads' interference with the instance during the run can break the method's correctness (whether its postcondition holds). For example, for simplicity, assume a `Vector` whose methods are synchronized on `this`:

```java
class MyVector<T> extends Vector<T> {
    public void printAll() {
        Iterator<T> it = iterator();
        while (it.hasNext())
            System.out.println(it.next());
    }
}

```

Between the check `hasNext` and the call to `next`, another thread may remove the member from the vector.

Another example is a bank algorithm that computes the bank's closing rates in the evening, from all the customers' account data, while a thread performs a transfer of money from one account to another (so the amount may be counted twice).

**Solution A:** synchronize the operation, which means locking the object for the whole run of the operation.

```java
class MyVector<T> extends Vector<T> {
    public synchronized void printAll() {
        Iterator<T> it = iterator();
        while (it.hasNext())
            System.out.println(it.next());
    }
}

```

- **The drawback:** locking for a long time, meaning preventing access to all the objects in the structure (as in the bank's no-access hours at night for its customers).

**Solution B:** perform the operation on a copy of the structure (a snapshot). Copy the structure under synchronization, then perform the operation on the copy with no synchronization (since no other thread knows it). The assumption is that copying the object takes little time, compared with the long time the operation takes.

```java
class MyVector<T> extends Vector<T> {
    public void printAll() {
        MyVector<T> copy = clone();
        Iterator<T> it = copy.iterator();
        while (it.hasNext())
            System.out.println(it.next());
    }

    public synchronized MyVector<T> clone() {
        MyVector<T> copy = new MyVector<>();
        Iterator<T> it = iterator();
        while (it.hasNext())
            copy.add(it.next().clone());
        return copy;
    }
}

```

- **The drawback:** there is still a cost in memory (storing the copy) and in time (the copy under synchronization). And if the operation changes the object, you must merge at the end, which can be complicated.

**Solution C: optimistic try and fail.** Walk over the structure's members without synchronizing it, but turn on a mechanism that detects changes made by other threads during the walk, so it throws an exception that the operation can catch, and try again. This approach fits cases in which most of the threads only read information and do not change it.

For `MyVector`:

- **A mechanism that detects changes in the object, and throws an exception:**
  - add a field to the class that says the vector's "version", so that every method that changes the vector increases its version,
  - implement the iterator so that when the version differs from the version at the time the iterator was created, `next` throws an exception.
- **A pattern of catching the exception and trying again:** when the exception is caught, perform the change again.

```java
class MyVector<T> extends Vector<T> {
    int version;

    MyVector() { ... version = 0; }

    public synchronized int getVersion() { return version; }

    public void printAll() {
        try {
            Iterator<T> it = iterator();
            while (it.hasNext())
                System.out.println(it.next());
        } catch (ConcurrentModificationException e) {
            printAll();
        }
    }

    public synchronized void add(T obj) {
        super.add(obj);
        version++;
    }

    public synchronized void remove(T obj) {
        super.remove(obj);
        version++;
    }

    // same for all commands (excluding queries)

    public Iterator<T> iterator() {
        return new Iterator<T>() {
            final int origVersion = getVersion();
            int index = 0;

            public T next() throws Exception {
                synchronized (MyVector.this) {
                    if (getVersion() != origVersion)
                        throw new ConcurrentModificationException();
                    return get(index++);
                }
            }

            // implementation of hasNext, remove
        };
    }
}

```

**A note:** you can generalize the method `printAll` into a general method that performs a given operation on the members of the array (not necessarily printing).

```java
interface Procedure<T> {
    void apply(T obj);
}

class MyVector<T> extends Vector<T> {
    ...
    public void applyAll(Procedure<T> action) {
        try {
            Iterator<T> it = iterator();
            while (it.hasNext())
                action.apply(it.next());
        } catch (ConcurrentModificationException e) {
            applyAll(action);
        }
    }
}

MyVector<Integer> v;
...
v.applyAll((Integer i) -> System.out.println(i));

```

## Lock-free synchronization

It turns out that synchronization carried out with a lock (with `synchronized`) can have a drawback. When the synchronized block of code is short (which is usually the case), the time it takes to move to Blocked and back to Runnable is longer than the time spent waiting for the object to be released.

- **So instead of moving to Blocked,** the waiting thread keeps running until the second thread finishes its short operation.

For that, use a compound memory operation of the processor called **compare-and-set** (until now the course used only two memory operations: `READ` and `WRITE`). This operation does three things, atomically: it reads the value of a cell in memory, compares it with another value, and if they are equal, writes a new value to the cell. For a value of type `int`, it is something like this (carried out as one operation in hardware):

```cpp
boolean cas(int* address, int oldVal, int newVal) {
    if ((*address) == oldVal) {
        (*address) = newVal;
        return true;
    } else
        return false;
}

```

The newer Java libraries have a number of classes that let you call this processor operation, for values of different types:

```java
AtomicInteger, AtomicBoolean, ..., AtomicReference<T>

```

You can use this operation to carry out an alternative synchronization mechanism, which does not move waiting threads to the Blocked state, for reaching information of different types.

The general pattern for changing a shared value `val`, of a type wrapped as `Atomic` (of the matching type `T`):

- **Given a shared variable (or field) of type `T`,**
- **wrap it with an `Atomic` interface,** meaning its type becomes `AtomicT` (that way it is also declared `volatile`),
- **the queries for the variable or field** use the `get` method of the `Atomic` class,
- **the pattern for every command** in the class that changes the variable or field is:

```java
T oldVal;
T newVal;
do {
    oldVal = val.get();
    newVal = ____ oldVal ____;
} while (!val.compareAndSet(oldVal, newVal));

```

Applying this pattern to the lock-free synchronization of the `Even` class:

```java
class Even {
    int val;
    Even(int val) throws Exception { ... }
    public int get() { return val; }
    public void next() { val += 2; }
}

// becomes

class Even {
    AtomicInteger val;

    Even(int val) throws Exception {
        if (val % 2 != 0)
            throw new Exception(...);
        this.val = new AtomicInteger(val);
    }

    public int get() { return val.get(); }

    public void next() {
        int oldVal;
        int newVal;
        do {
            oldVal = val.get();
            newVal = oldVal + 2;
        } while (!val.compareAndSet(oldVal, newVal));
    }
}

```

- **T1 and T2 both call `e.next()`,** and both read `oldVal = 0` and compute `newVal = 2`. Only one `compareAndSet(0, 2)` succeeds. The other finds 2 instead of 0, fails, and goes around the loop again: it reads 2, computes 4, and succeeds. `e.val` ends at 4.

**Another example: the `LinkedList` class.**

```java
class LinkedList<T> implements List<T> {
    Link<T> head = null;
    ...
    public void add(T obj) {
        Link<T> newLink = new Link<T>(obj, head);
        head = newLink;
    }
}

```

- **`lst.head` is `2 -> null`.** T1 calls `lst.add(1)` and builds `newLink = 1->2->null`, and T2 calls `lst.add(2)` and builds `newLink = 2->2->null`. Whichever assignment to `head` comes second wins, and the other link is lost.
- **The correct results** are `{1->2->2->null, 2->1->2->null}`.

```java
class LinkedList<T> implements List<T> {
    AtomicReference<Link<T>> head = new AtomicReference<Link<T>>(null);
    ...
    public void add(T obj) {
        Link<T> oldVal;
        Link<T> newVal;
        do {
            oldVal = head.get();
            newVal = new Link<T>(obj, oldVal);
        } while (!head.compareAndSet(oldVal, newVal));
    }
}

```

It is not always easy to apply this synchronization mechanism to the different methods of a given class. Java has implementations like this for classic data structures, such as `ConcurrentHashMap` and `ConcurrentLinkedQueue`.

**A discussion:** you could design a general lock-free synchronization pattern that fits any piece of code, like this. Define a field of type `AtomicBoolean`:

```java
AtomicBoolean lock = new AtomicBoolean(false);

```

and synchronize the code of every method like this:

```java
while (!lock.compareAndSet(false, true));   // instead of 'synchronized(this) {' / lock
... // code
lock.set(false);                            // instead of '}' / unlock

```

What is the difference between this pattern and the one suggested above?

- **In this pattern,** when one of the threads has "passed the barrier" (the `while` line), no other thread can pass it until that thread runs the code and does `set`. In particular, if its processor time runs out before it reaches its own code, while the other threads are Runnable or Running, none of them can make progress.
- **In the earlier pattern,** the threads are not stuck in busy-wait on a particular line, but run again and again until the first of them manages to perform the `cas`. When one of them succeeds in reaching its processor time and passing the loop, the others can continue to try, and one of them will succeed.
- **The term "lock-free synchronization" means:**
  - no thread waiting to move moves to the Blocked state,
  - other threads are not blocked on a particular line until the first thread finishes the synchronized piece of code.

- **`AtomicInteger` and `AtomicReference`** perform a whole read-modify-write as one atomic step.
- **Compare-and-swap (CAS)** writes a new value only if the variable still holds the value the thread read earlier. Otherwise it fails, and the thread can retry. No lock is involved, so it is lock-free.

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
