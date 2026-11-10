---
title: A tank for each thread
chapter: bridge-threads-and-safety
order: 1
lang: java
---

Give a water tank a contract, write a task that respects it, and run one task per tank on its own thread.

**Requirements**

- `Tank(int capacity)`: reject a negative capacity with an `IllegalArgumentException`. A new tank has level 0.
- `void fill(int n)`: the precondition is `n >= 0 && hasRoom(n)`. Reject a call that breaks it with an `IllegalArgumentException`, and leave the level unchanged. Otherwise add `n` to the level.
- `FillTask` implements `Runnable`. `run()` fills its tank by `amount`, up to `times` times. Before each fill it checks `hasRoom(amount)`, and it stops quietly at the first fill that has no room. It never lets `fill` throw.
- `static int fillAll(Tank[] tanks, int amount, int times)`: starts one new thread per tank, each running a `FillTask` on that tank. It waits for all of them, and returns the sum of the levels.
- `level()` and `hasRoom(n)` are already written.

**Background**

- The invariant of `Tank` is `0 <= level() <= capacity`. A constructor and a `fill` that refuse illegal values are enough to keep it.
- The caller is responsible for the precondition, so the task checks `hasRoom` before it calls `fill`.
- Each thread gets a tank of its own here. No object is shared between two running threads, so no interleaving can hurt.
- `thread.join()` waits for a thread to finish. It can throw `InterruptedException`, which `fillAll` declares.

:::example
**Input:** `fillAll(new Tank[] { new Tank(10), new Tank(4) }, 2, 3)`

**Result:** 10. The first tank is filled three times to 6. The second has room for only two fills and stops at 4.
:::

:::hint
In `run`, a `for` loop over `times` with `if (!tank.hasRoom(amount)) { return; }` before the call to `fill` does it.
:::

:::hint
In `fillAll`, use two loops. The first creates and starts every thread and keeps them in an array. The second joins every thread. Joining inside the first loop would run the tasks one after the other.
:::

:::hint
Call `start()`, not `run()`. `run()` would execute the task on the thread that is calling `fillAll`.
:::
