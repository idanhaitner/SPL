---
title: Hand back two answers through references
chapter: pointers
order: 2
---

Write `minAndMax`, which hands back two answers through reference parameters.

**Requirements**

- `void minAndMax(int a, int b, int c, int& smallest, int& largest)`: after the call, the caller's `smallest` holds the smallest of `a`, `b`, and `c`, and the caller's `largest` holds the largest.

**Constraints**

- Whatever `smallest` and `largest` held before the call must not affect the answer.

**Background**

- A function returns only one value. A reference parameter is another name for the caller's variable, so writing to it writes to that variable.

:::example
**Input:** `int low = 0; int high = 0; minAndMax(4, 9, 2, low, high);`

**Result:** `low` is 2 and `high` is 9
:::

:::hint
Start by writing `a` into both `smallest` and `largest`. So far, `a` is both the smallest and the largest number you have seen.
:::

:::hint
Now look at `b`. When does it replace the current `smallest`? When does it replace the current `largest`? Then ask the same two questions about `c`.
:::

:::case name="in order"
If the two results still hold what they held before the call, look at the first line of the function. Without `&`, a parameter is a copy, and the caller never sees what you write to it.
:::

:::case name="all negative"
Did you start from 0? In this test no number is as large as 0, so 0 would win. Start from a number that was passed in.
:::
