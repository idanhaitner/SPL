---
title: A pump that cannot deadlock
chapter: bridge-locks-and-waiting
order: 1
lang: java
---

Finish the class `Pump`, which moves water between two tanks. It has to hold both tanks' locks while it works, and it has to take them in an order that can never deadlock.

**Requirements**

- `static Tank[] lockOrder(Tank a, Tank b)`: returns the two tanks in the order their locks must be taken: the tank with the smaller `id` first. The answer is the same for `lockOrder(a, b)` and `lockOrder(b, a)`.
- `static boolean transfer(Tank from, Tank to, int n)`: takes both locks, in the order `lockOrder` gives. While holding both, it checks the preconditions of the move: `n >= 0`, `from` has at least `n`, and `to` has room for `n`. If one is false it changes nothing and returns `false`. Otherwise it drains `from`, fills `to`, and returns `true`.
- `Tank` is already written. Its methods are not synchronized: the caller must hold the tank's lock when it calls them.

**Background**

- The check and the two changes must be one step, so they all sit inside the same two `synchronized` blocks.
- Two threads that lock the same two tanks in opposite orders can deadlock. A fixed global order makes that cycle impossible.
- Returning `false` instead of throwing is "try and fail": the caller decides whether to try again.
- The online Java runner cannot start threads, so the test calls `transfer` on one thread and checks which locks were held at the moment the water moved.

:::example
**Input:** `Tank a = new Tank(7, 10, 6); Tank b = new Tank(3, 10, 0); Pump.transfer(a, b, 4);`

**Result:** `true`. `a` holds 2 and `b` holds 4. The lock of `b` was taken first, because its id is smaller.
:::

:::hint
`lockOrder` is one comparison: `a.id <= b.id ? new Tank[] { a, b } : new Tank[] { b, a }`.
:::

:::hint
In `transfer`, call `lockOrder(from, to)` and nest two blocks: `synchronized (order[0]) { synchronized (order[1]) { ... } }`. The order of the locks comes from `lockOrder`. The direction of the water still comes from `from` and `to`.
:::

:::hint
Do all three checks before the first change. If you drain first and then find there is no room, the water is already gone.
:::
