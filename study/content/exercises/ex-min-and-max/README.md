---
title: Hand back two answers through references
chapter: pointers
order: 2
---

A function can return only one value. When it has two answers, it can write them into the caller's variables instead. A reference parameter makes that possible: it is another name for the caller's variable, so writing to the parameter writes to that variable.

Write `minAndMax(a, b, c, smallest, largest)`. The three numbers `a`, `b`, and `c` only get read, so they are passed by value. After the call, the caller's `smallest` must hold the smallest of the three, and the caller's `largest` must hold the largest of the three. Whatever those two variables held before the call must not affect the answer.

You are done when Submit shows every test passing.

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
