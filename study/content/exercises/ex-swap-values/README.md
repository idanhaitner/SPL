---
title: Swap two values through pointers
chapter: pointers
order: 1
---

Write `swapValues`, which trades the values of two variables through pointers.

**Requirements**

- `void swapValues(int* a, int* b)`: after the call, the two variables that `a` and `b` point at have traded values.

**Background**

- A function gets its own copies of the values you pass it, so changing a parameter does not change the caller's variable.
- If `p` holds the address of `x`, then writing to `*p` changes `x` itself.

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
