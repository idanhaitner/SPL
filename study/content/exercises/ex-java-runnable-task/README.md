---
title: Define a task for a thread
chapter: concurrency
order: 1
lang: java
---

A thread runs a **task**, an object whose `run()` method holds the work. Finish the class `SumTask`, which adds up the numbers from 1 to `n`.

**Requirements**

- `SumTask` must implement `Runnable`.
- `SumTask(int n, long[] result)`: remember `n` and the `result` array.
- `run()`: add up `1 + 2 + ... + n` and store the total in `result[0]`.

**Background**

- `Runnable` has one method, `void run()`. A thread cannot return a value, so the task is handed somewhere to write its answer. Here that place is the one-element array `result`.
- `run()` is an ordinary method. The test below calls it directly, on this thread, so the exercise checks the work the task does. (The online Java runner cannot start threads.)
- To use the task on a real thread you would write `new Thread(new SumTask(100, out)).start();`.

:::example
**Input:** `long[] out = new long[1]; new SumTask(4, out).run();`

**Result:** `out[0]` is 10
:::

:::hint
Write `class SumTask implements Runnable`. The compiler then insists that you provide `public void run()`.
:::

:::hint
A `long` variable that starts at 0 and a `for` loop from 1 to `n` is all `run()` needs. Assign the total to `result[0]` at the end.
:::

:::case name="is a Runnable"
`SumTask` must say `implements Runnable`, so that it can be given to `new Thread(...)`.
:::

:::case name="n is zero"
For `n = 0` the sum is 0. The loop body never runs, and `result[0]` must hold 0.
:::
