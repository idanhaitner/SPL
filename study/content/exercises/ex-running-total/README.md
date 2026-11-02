---
title: Keep a running total in a static variable
chapter: memory-model
order: 1
---

Write `runningTotal`, which keeps a total from one call to the next.

**Requirements**

- `int runningTotal(int amount)`: add `amount` to the total, and return the new total. The total starts at 0.

**Constraints**

- The total must be kept between calls.
- Replace the starter's `return 0;`. It is only there so the code compiles.

**Background**

- An ordinary local lives in the function's stack frame, so every call gets a brand-new one.
- A local declared `static` lives in the static region. It is initialized only once, and keeps its value between calls.

:::example
**Input:** `runningTotal(5);` and then `runningTotal(3);`

**Result:** the first call returns `5` and the second returns `8`
:::

:::hint
You need one variable that survives the return. Where must it live, and which word puts it there?
:::

:::hint
Think about what happens on each line during the second call. Which line must not reset the total, and which line must change it?
:::

:::case name="second call keeps the total"
If this returns 3, your total started over. An ordinary local is a new variable on every call.
:::

:::case name="first call"
A `static` local takes its first value only once, so start the total at 0 and then add `amount` to it.
:::
