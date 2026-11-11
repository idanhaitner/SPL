---
title: A tank for each task
chapter: bridge-threads-and-safety
order: 1
lang: java
---

Give a water tank a contract, write a task that respects it, and build one task per tank so that no two tasks share an object.

**Requirements**

- `Tank(int capacity)`: reject a negative capacity with an `IllegalArgumentException`. A new tank has level 0.
- `void fill(int n)`: the precondition is `n >= 0 && hasRoom(n)`. Reject a call that breaks it with an `IllegalArgumentException`, and leave the level unchanged. Otherwise add `n` to the level.
- `FillTask` implements `Runnable`. `run()` fills its tank by `amount`, up to `times` times. Before each fill it checks `hasRoom(amount)`, and it stops quietly at the first fill that has no room. It never lets `fill` throw.
- `static Runnable[] tasksFor(Tank[] tanks, int amount, int times)`: returns one `FillTask` per tank, in the same order as the tanks. Each task fills its own tank.
- `static int total(Tank[] tanks)`: returns the sum of the levels.
- `level()` and `hasRoom(n)` are already written.

**Background**

- The invariant of `Tank` is `0 <= level() <= capacity`. A constructor and a `fill` that refuse illegal values are enough to keep it.
- The caller is responsible for the precondition, so the task checks `hasRoom` before it calls `fill`.
- With a tank for each task, no object is shared between two tasks. Each task could run on a thread of its own, in any interleaving, and the result would be the same as running them one after the other.
- `run()` is an ordinary method. The test calls it directly, in more than one order, because the online Java runner cannot start threads. On real threads you would write `new Thread(task).start()` for each task and `join()` them before calling `total`.

:::example
**Input:** `Tank[] tanks = { new Tank(10), new Tank(4) };` then every task from `tasksFor(tanks, 2, 3)` is run.

**Result:** `total(tanks)` is 10. The first tank is filled three times to 6. The second has room for only two fills and stops at 4.
:::

:::hint
In `run`, a `for` loop over `times` with `if (!tank.hasRoom(amount)) { return; }` before the call to `fill` does it.
:::

:::hint
In `tasksFor`, make an array with `new Runnable[tanks.length]` and store `new FillTask(tanks[i], amount, times)` in cell `i`.
:::

:::hint
`fill` has two ways to break its precondition: a negative `n`, and an `n` that does not fit. Check both before you change `level`.
:::
