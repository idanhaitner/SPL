---
id: concurrency
title: Threads
blurb: "Why concurrency, what a thread is, and how Java defines a task and runs it on a thread."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 8 - Concurrency.pptx"
  - "materials/sessions/PS6-2026-1.pptx"
  - "materials/exams/20-a.pdf"
  - "materials/exams/20-a-solution.pdf"
---

In this course, **concurrency** (מקביליות) means several tasks running at the same time inside one process, sharing its memory. This chapter explains why you would want that, what a thread is, and how Java starts one.

- **Why concurrency:** three ways to run the tasks of one program, and why threads in one process are usually the best.
- **Threads:** what a thread is made of, and how the run-time environment switches between threads.
- **Threads in Java:** defining a task, running it on a new thread, and the other operations of the `Thread` class.

The next chapters ask what can go wrong when threads share data ([Safety and correctness](topic:design-by-contract)), how to prevent it ([Synchronization](topic:synchronization)), and how threads wait for each other ([Waiting and liveness](topic:waiting-and-liveness)).

## Why concurrency

Go back to the example from the start of the course: playing a video file. Playing is made of three steps: **read**, **decode**, and **play**. How do you run those three steps?

**Serially.** The program calls the three functions `read`, `decode`, and `play` one after another, and each function uses the value returned by the previous one.

- **The drawback:** a long wait until you see the first second of the film. The processor is not used well, because it keeps moving to the Blocked state during these operations (many I/O accesses). The process gets the processor for only a small part of the time it runs. And if the computer has several processors, they are not used at all.

**Concurrently, as three different processes.** Run the three operations at the same time, in different processes: one program reads, a second decodes, and a third plays. In this model, when one process is stuck (moves to Blocked), the processor moves to another process.

- **The drawback:** switching between processes is expensive. It has several steps, and while they run, the processor does nothing for these processes.
  - Stop the current process.
  - Save the state (the context) of the current process in memory, including the program's code, its stack and heap, and the operating system's data structures for managing the process.
  - Choose the process to run.
  - Restore its state into memory.
  - Update the processor's cache memory.
  - Run the chosen process.
- **This switch is called a context switch.**
- **On the other hand,** the switch is not needed here at all, because the different tasks share the same data (the film).

**Concurrently, as three tasks in one process.** Run the three tasks at the same time, on the same memory. Switching between tasks is then much simpler for the processor: when the processor is stuck on one task (because of I/O), it can move to another task in the same process, on the same memory.

- **The drawback:** you will see it in the rest of the chapter.

Another example of the same idea is a production line in a car factory, where every station works on its own part of every car at the same time.

## The memory of a process with threads

Threads can work on the same data because of where they live in memory. Start from the difference between a process and a thread.

- **A process (תהליך)** has its own address space, which no other process can see.
- **A thread (חוט)** is one sequential flow of execution inside a process. Each thread has its own stack.
- **What threads share:** all the threads of a process share its heap and its static variables, so they can read and write the same objects.
- **Physical memory (RAM)** is a sequence of cells, each with a physical address.
- **Virtual memory** gives each process its own private address space. The operating system maps the process's virtual pages onto physical frames in RAM.
- **Between processes:** two processes share no memory, even at the same virtual address, unless a shared-memory mapping is set up explicitly.

In short, each thread keeps its own call stack, while the threads of one process share the heap and the static variables.

## What a thread is

A **thread** is the basic unit of execution on the processor. It contains:

- **a program counter,** the task to run,
- **registers,** the state of the processor while it runs the task's code,
- **a stack,** the relevant memory: the variables needed to run the current code.

Switching from one thread to another, from one task to another on the same processor, comes down to swapping only these three. That is easy compared with the heavy switch from one process to another.

:::definition id=def-thread title="Thread" source="materials/lectures/Chapter 8 - Concurrency.pptx"
A thread is the basic unit of execution inside a process.

- **Its own stack:** each thread has its own call stack. All the threads of a process share its heap.
- **How threads run:** different threads either run truly at the same time on different processor cores, or share one core, with the scheduler switching between them.
:::

**An operating-system question:** are threads "entities" in the run-time environment, meaning, does the operating system know the threads, create them, schedule them, and close them? Or are threads managed internally by the process's code? In this chapter, assume that the run-time environment manages the threads.

There are two scheduling modes.

- **Preemptive scheduling:** the decision to move from one thread to another lies with the run-time environment, according to its scheduling policy. After every atomic operation, the run may move to another thread or process.
- **Non-preemptive scheduling:** the move to another process or thread happens only on the program's initiative, through a call to the system asking to move to another process or thread.

## Threads in Java

When a program runs, the run-time environment runs one thread, whose task is the `main` method. While the program runs, it can run more tasks at the same time, on more threads. To run a task concurrently on a thread inside the process, you need:

1. **a definition of the task,**
2. **a request to the run-time environment to create a thread that runs the task.** When the task ends, the thread is closed by the environment.

### 1. Defining a task

A task in Java is defined by implementing the `Runnable` interface, which has one method, `run`.

```java
interface Runnable {
    void run();
}

```

For example, a task that prints a string:

```java
class MsgPrinter implements Runnable {
    String msg;
    PrintStream out;

    MsgPrinter(String msg, PrintStream out) { this.msg = msg; this.out = out; }

    public void run() { out.print(msg); }
}

```

An instance of this class can be a task for a thread. For example, define two instances, one that prints `Hello` and one that prints `Goodbye`.

```java
class Test {
    public static void main(String[] args) {
        Runnable taskHello = new MsgPrinter("Hello", System.out);
        Runnable taskGoodbye = new MsgPrinter("Goodbye", System.out);
        ...
    }
}

```

### 2. Running the task on a thread

What happens if `main` calls `run` on each task? The two tasks run serially, on the program's main (and so far only) thread, so the output is `Hello Goodbye`.

To run the tasks concurrently, you must ask the environment to create a thread for each one. In Java, such requests go through convenient interfaces of classes, in particular the `Thread` class.

- **Define an object of type `Thread`,** which receives the task to run in its constructor.
- **Call its `start` method,** which the JVM translates into a request to the operating system to create a thread. (The JVM might manage the thread without involving the operating system.)

```java
class Test {
    public static void main(String[] args) {
        Runnable taskHello = new MsgPrinter("Hello", System.out);
        Runnable taskGoodbye = new MsgPrinter("Goodbye", System.out);
        Thread threadHello = new Thread(taskHello);
        Thread threadGoodbye = new Thread(taskGoodbye);
        threadHello.start();
        threadGoodbye.start();
    }
}

```

| Heap address | Object |
| --- | --- |
| 100 | the `MsgPrinter` with `Hello` and `System.out` |
| 200 | the `MsgPrinter` with `Goodbye` and `System.out` |
| 300 | the `Thread` for the task at 100 |
| 400 | the `Thread` for the task at 200 |

Following these requests, the run-time environment creates two new threads, one for the `taskHello` task and one for the `taskGoodbye` task.

- **Each thread gets a stack of its own.** `main`'s thread, T0, holds the four local variables, and the new threads T1 and T2 start with empty stacks.
- **The `pc` field of each thread** points at the first line of the `run` method of its task.
- **Moving from one thread to the other on the same processor** means swapping the `pc`, the `sp`, and the contents of the processor's registers.

What will the program print? In a serial run there is one output: `Hello Goodbye`. In a concurrent run, several outputs are possible, according to the scheduling policies of the environment.

- **Run all of `Hello`'s `run`, then all of `Goodbye`'s:** `Hello Goodbye`.
- **Run all of `Goodbye`'s `run`, then all of `Hello`'s:** `Goodbye Hello`.
- **Run part of `Hello`'s `run`, then part of `Goodbye`'s, and so on:** `HelGoodbyelo`, `GHeoloodlbye`, ...

[Safety and correctness](topic:design-by-contract) asks what output we expect from such a program, and how to guarantee a legal result.

### Other operations of Thread

Besides asking the environment to run a task on a new thread with `start`, the `Thread` class allows more operations.

- **`sleep`:** the thread moves to the Blocked state for the given time, so it stops running for at least that long. After that time it returns to the Runnable state.

```java
threadHello.sleep(1000);

```

- **`join`:** the calling thread moves to the Blocked state until the other thread finishes its task, meaning its `run` method ends.

```java
threadHello.join();

```

- **`stop`:** stops the run of the thread. **Using this method is strictly forbidden!** Use the `interrupt` mechanism instead.
- **`interrupt`:** tells the thread that it is being asked to stop working. The thread's code decides what to do in such a case. [Waiting and liveness](topic:waiting-and-liveness) shows how a thread is told to stop.

- **Thread confinement:** a local variable lives on its own thread's stack, so no other thread can reach it, and it never needs a lock.

**A note: concurrency is not absolute.** At any given moment, not all the tasks really run.

- **There are usually more threads than processors.**
- **Even if there is a processor for each thread,** some operations can be done by only one processor at a time, such as reading or writing memory.

So concurrency means that the tasks do not run one after another, but **between any two atomic operations, the run may move from one thread to another**.

## When to design a program with threads

Running tasks concurrently can be heavy (as you will see), and designing the code is not trivial, and neither is debugging it. So do not design a program with threads unless you need to. There are three main scenarios that call for running tasks on threads.

- **A heavy computation, with several processors:** design the program as several tasks that run concurrently on different threads, to make use of the run time.
- **A program with many I/O accesses:** design it as several tasks running concurrently on different threads, so that when one task is blocked (moves to Blocked) on an I/O access, the processor can move to another task.
- **A program that gives service to clients:** design the handling of each client as a separate task, run by its own thread. That gives fair and equal service to every client.

Besides that, even if you decide not to run a program concurrently, it is still better to design the program as a set of tasks wherever possible, as in the first design principle.

## Practice

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
The constructor's write happens before {{=start|the assignment a = new A(3)|join}}, and `start` happens before {{=run|main assigns 3|join}}, so both threads print {{=2|3|23}}.

Java guarantees that everything a thread did before calling `start` is visible to the new thread. The constructor wrote 2 before `start`, so both threads are guaranteed to see 2. The later assignment changes only `main`'s local variable, not the object.
:::

:::

:::problem id=prac-threads-run-start title="Calling run or calling start" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Printer` is a task that prints one short message.

```java
class Printer implements Runnable {
    private final String msg;

    Printer(String msg) { this.msg = msg; }

    public void run() { System.out.print(msg); }
}
```

:::check id=prac-threads-run-start-q1
`main` runs these lines. What does the program print?

```java
Runnable a = new Printer("A");
Runnable b = new Printer("B");
a.run();
b.run();
```

- [x] Always `AB`, with both tasks running on `main`'s thread
- [ ] `AB` or `BA`, because the scheduler picks the order
- [ ] Nothing, because no thread was started

- **Why always `AB`:** `run` is an ordinary method here. `main`'s thread calls `a.run()`, finishes it, and only then calls `b.run()`.
- **Why the scheduler has no choice:** there is only one thread, so the two tasks run serially.
- **Why it still prints:** a task does not need a new thread. `main`'s thread can run it like any other method.
:::

:::check id=prac-threads-run-start-q2
Now `main` runs these lines instead. Which outputs are possible?

```java
Runnable a = new Printer("A");
Runnable b = new Printer("B");
new Thread(a).start();
new Thread(b).start();
```

- [x] `AB`
- [x] `BA`
- [ ] `AA`
- [ ] `A`

- **`AB` and `BA`:** each task runs on its own thread, and the order depends on the scheduling policies of the environment. Starting `a` first does not mean it runs first.
- **Why not `AA`:** each task prints its own message once, and only one task holds `A`.
- **Why not `A` alone:** both threads were started, and each one runs its task to the end.
:::

:::check id=prac-threads-run-start-q3
Calling `a.run()` yourself runs the task on {{=the thread that made the call|a new thread|the operating system}}. To run it on a new thread, you create a `Thread` with the task and call {{=start|run|join}}.

`run` only defines what the task does. `start` is the request to the run-time environment to create a thread, and that new thread then runs the task's `run` method.
:::
:::

:::problem id=prac-threads-memory title="Who shares what" source="materials/lectures/Chapter 8 - Concurrency.pptx" kind=exercise solution_origin=derived
Two threads run tasks that were given the same `Counter`. These questions are only about where each variable lives. What `shared.value` ends up holding is a question for the next chapters.

```java
class Counter {
    int value = 0;
}

class Task implements Runnable {
    private final Counter shared;

    Task(Counter shared) { this.shared = shared; }

    public void run() {
        int local = 0;
        for (int i = 0; i < 1000; i++) {
            local++;
            shared.value++;
        }
        System.out.println(local);
    }
}

public class Shared {
    public static void main(String[] args) {
        Counter c = new Counter();
        Thread t1 = new Thread(new Task(c));
        Thread t2 = new Thread(new Task(c));
        t1.start();
        t2.start();
    }
}
```

:::check id=prac-threads-memory-q1
While both threads run, which statements about their variables and the shared `Counter` are true?

- [x] Each thread has its own `local`, on its own stack
- [x] Both threads reach the same `Counter` object on the heap
- [ ] Each thread has its own `Counter`, because each one has its own `Task`
- [ ] Both threads share one `local`, because they run the same `run` method

- **`local`:** it is a local variable, and each thread has its own stack. Each thread's call to `run` gets its own `local`.
- **The `Counter`:** there is one `new Counter()`, and both tasks received its address. All the threads of a process share the heap.
- **Two tasks, one `Counter`:** there are two `Task` objects, but each only holds a reference to that same `Counter`.
- **The same code is not the same variable:** both threads run the same method, but each one runs it on its own stack.
:::

:::check id=prac-threads-memory-q2
Each thread always prints 1000. Why?

- [x] `local` lives on its own thread's stack, so no other thread can reach it
- [ ] The threads run one after the other, with no switch between them
- [ ] `shared` is `final`, and that protects everything inside `run`
- [ ] `println` makes the loop before it atomic

- **The reason:** this is thread confinement. No other thread can touch this `local`, so switching threads cannot change the count.
- **Why not "one after the other":** the run may move to the other thread between any two atomic operations.
- **Why not `final`:** it says only that the field `shared` keeps referring to the same `Counter`. It does nothing for `local`, which is safe for its own reason.
- **Why not `println`:** it runs after the loop, and it has no effect on how the loop runs.
:::

:::check id=prac-threads-memory-q3
If these two tasks ran in two separate processes instead, they {{=would not share a Counter|would still share one Counter|would share only local}}, because each process has {{=its own private address space|one stack for both|the same physical memory for all its objects}}.

Threads of one process share the heap. Two processes share no memory, unless a shared-memory mapping is set up explicitly, so each would need its own `Counter`.
:::
:::

:::problem id=prac-threads-join title="Waiting for a result" source="materials/sessions/PS6-2026-1.pptx" kind=exercise solution_origin=derived
A task writes its result into an array that `main` created.

```java
class Filler implements Runnable {
    private final int[] result;

    Filler(int[] result) { this.result = result; }

    public void run() { result[0] = 42; }
}

public class Join {
    public static void main(String[] args) throws InterruptedException {
        int[] result = new int[1];
        Thread t = new Thread(new Filler(result));
        t.start();
        t.join();
        System.out.println(result[0]);
    }
}
```

:::check id=prac-threads-join-q1
What does this program print?

- [x] Always `42`
- [ ] Always `0`, because `Filler` writes to its own copy of the array
- [ ] `0` or `42`, depending on the scheduler
- [ ] Nothing, because `main` is blocked forever

- **Why always `42`:** `join` keeps `main`'s thread Blocked until the `run` method of `t` ends, so the write has already happened when `main` prints.
- **Why there is no copy:** `new int[1]` runs once. `main` and `Filler` each hold a reference to that same array on the heap.
- **Why the scheduler does not matter:** whichever thread runs first, the print comes after `join`, and `join` waits for the task.
- **Why `main` is not stuck:** `run` ends after one assignment, and then `join` returns.
:::

:::check id=prac-threads-join-q2
Now delete the line `t.join();`. What can the program print?

- [x] `0` or `42`, depending on what the scheduler runs first
- [ ] Always `42`, because `t.start()` comes before the print
- [ ] Always `0`, because `main`'s thread must finish before `t` can run
- [ ] Nothing, because `main` ends before `t` finishes

- **Two possible orders:** if the print runs first, the array still holds its first value, 0. If `t` runs first, it holds 42.
- **Why `start` is not enough:** it only asks for a new thread. It does not wait for the task to run.
- **Why `main` need not finish first:** between any two atomic operations, the run may move from one thread to the other.
- **Why it still prints:** `main`'s thread reaches the print whatever `t` is doing, because nothing blocks it now.
:::

:::check id=prac-threads-join-q3
`t.join()` moves {{=the thread that called it|the thread t|every thread in the process}} to the Blocked state, until {{=the run method of t ends|t has started|main ends}}.

The caller is the one that waits. Here that is `main`'s thread, and `t` keeps running its task as usual.
:::
:::

:::problem id=prac-threads-design title="When threads are worth it" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Threads are not free: they can be heavy, and they make a program harder to design and to debug. So each design needs a reason.

:::check id=prac-threads-design-q1
Which of these programs fit a scenario that calls for threads?

- [x] A server where each connected client is handled as its own task
- [x] A heavy computation on a computer with eight processors
- [x] A program that reads thousands of files, and is often Blocked on I/O
- [ ] A small program that reads two numbers once and prints their sum

- **The server:** a task per client gives fair and equal service to every client.
- **The computation:** several tasks on different threads make use of the processors.
- **The file reader:** when one task is Blocked on I/O, the processor can move to another task.
- **The small program:** it fits none of the three scenarios. Threads do not make every program better, and the rule is not to use them unless you need to.
:::

:::check id=prac-threads-design-q2
A video player reads, decodes, and plays one film. Why are three tasks in one process usually better than three processes?

- [x] The tasks share the film in one memory, and switching between them is much simpler
- [ ] Three processes would share all their memory automatically, so threads add nothing new
- [ ] Threads never move to the Blocked state, so the processor never waits for I/O
- [ ] Threads are guaranteed to run at the same moment, each on its own processor

- **The reason:** switching threads swaps only the program counter, the registers, and the stack. A switch between processes is a full context switch, and these tasks share the same data anyway.
- **Why not automatic sharing:** each process has its own address space, which no other process can see.
- **Why not "never Blocked":** a thread does get stuck on I/O. The gain is that the processor can then move to another task.
- **Why not "guaranteed":** threads may share one core, with the scheduler switching between them.
:::

:::check id=prac-threads-design-q3
Switching between threads of one process swaps only {{=the program counter, the registers, and the stack|the whole heap|the code of the program}}. The heap stays where it is, because {{=all the threads share it|each thread has its own copy|threads do not use the heap}}.

That is why a thread switch is easy compared with the heavy switch from one process to another, which saves and restores much more.
:::
:::

To sum up, a thread is a program counter, registers, and a stack, and the threads of one process share its heap. Java defines a task as a `Runnable`, and runs it on a new thread with `Thread.start`.

- **Next:** [Safety and correctness](topic:design-by-contract) asks which results of a concurrent run are legal, and defines safety and correctness formally.
