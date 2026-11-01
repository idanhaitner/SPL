---
title: Swap two values through pointers
chapter: pointers
order: 1
---

A function gets its own copies of the values you pass it, so changing a parameter does not change the caller's variable. A pointer gets around that: if `p` holds the address of `x`, then writing to `*p` changes `x` itself.

Write `swapValues(a, b)`. Both parameters are pointers to `int`. After the call, the two variables they point at must have traded values.

You are done when Submit shows every test passing.

:::example
**Input:** `int x = 3; int y = 8; swapValues(&x, &y);`

**Result:** `x` is 8 and `y` is 3
:::

:::hint
Write `*a = *b;` and look at what is left in `*a`. What did that line just overwrite?
:::

:::hint
You need one more variable, a plain `int`, to hold one value while the other moves.
:::
