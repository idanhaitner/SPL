---
title: Return the larger variable itself
chapter: pointers
order: 3
---

Write `larger`, which returns a reference to the larger of its two arguments.

**Requirements**

- `int& larger(int& a, int& b)`: return a reference to whichever of `a` and `b` holds the larger value. If they are equal, return `a`.

**Background**

- A reference is another name for a variable that already exists. So `larger(x, y) = 0;` sets the caller's `x` or `y` itself.

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
