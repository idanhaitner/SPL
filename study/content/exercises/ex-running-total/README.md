---
title: Keep a running total in a static variable
chapter: memory-model
order: 1
---

An ordinary local variable lives in the function's stack frame, so it is gone when the function returns, and the next call gets a brand-new one. A local declared `static` lives in the static region instead. It is initialized once, and it keeps its value from one call to the next.

Write `runningTotal(amount)`. It adds `amount` to a total that stays between calls, and returns the new total. The total starts at 0.

The `return 0;` in the starter is only there so the code compiles. Replace it.

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

You are done when Submit shows every test passing.
