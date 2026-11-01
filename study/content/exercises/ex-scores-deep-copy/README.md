---
title: A class that owns an array
chapter: rule-of-three
order: 1
---

`Scores` keeps a row of `int`s in an array on the heap. It holds a pointer to that array, so the copies the compiler writes for you would share one array between two objects.

Write the whole class, with the rule of three: the destructor, the copy constructor, and the assignment operator.

- **`Scores(size)`** allocates an array of `size` cells, and sets every cell to 0.
- **`size()`, `get(index)`, and `set(index, value)`** read the size, read a cell, and change a cell.
- **The destructor** releases the array.
- **The copy constructor** gives the new object an array of its own, with the same values.
- **`a = b`** makes `a` an independent copy of `b`, even if the two had different sizes. `a = a` must leave `a` as it was, and `a = b = c` must work.

You are done when Submit shows every test passing.

:::example
**Input:** `Scores first(3); first.set(0, 90); Scores copy(first); copy.set(0, 11);`

**Result:** `copy.get(0)` is 11, and `first.get(0)` is still 90
:::

:::example
**Input:** `Scores a(1); Scores b(4); b.set(3, 7); a = b;`

**Result:** `a.size()` is 4, and `a.get(3)` is 7
:::

:::hint
Think about what `_values` holds right after a copy. Should the new object hold the same address as the other one, or a new one?
:::

:::hint
The assignment operator has two jobs, and an object that already exists is the difference from the copy constructor. It holds an array already. What has to happen to that array?
:::

:::hint
Walk through `a = a` line by line with your operator. If it releases the array and then reads `other`, what does it read? A one-line test on two addresses protects it.
:::

:::case name="changing the copy leaves the original"
The two objects share one array. A copy needs its own `new int[...]`, and then a loop over the values.
:::

:::case name="self-assignment keeps the values"
Without a check for `this != &other`, the operator releases its own array and then copies from that released array.
:::
