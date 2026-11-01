---
title: Return the larger variable itself
chapter: pointers
order: 3
---

A function that returns a plain value hands back a copy. A function that returns a reference hands back another name for a variable that already exists, so the caller can write through it.

Write `larger(a, b)`. It returns a reference to whichever parameter holds the larger value. If they hold the same value, it returns `a`. The call can then stand on the left of an `=`, and that assignment changes the caller's variable.

You are done when Submit shows every test passing.

:::example
**Input:** `int x = 3; int y = 8; larger(x, y) = 0;`

**Result:** `x` is still 3 and `y` is 0
:::

:::hint
The starter always returns `a`. When should it return `b` instead? Check that your answer also gives `a` when the two values are equal.
:::

:::hint
A returned reference is safe only if the thing it names lives longer than the function. Look at the first line of the function and ask who `a` and `b` belong to.
:::

:::case name="second is larger"
If the first test passes and this one fails, the function may still be returning `a` every time.
:::

:::case name="write through the result"
Writing through the result should change exactly one variable, the larger one. The test prints both, so you can see which one changed.
:::
