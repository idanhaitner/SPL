---
title: A class that owns an array
chapter: rule-of-three
order: 1
---

Write the class `Scores`. It keeps an array of `int`s on the heap, and every copy must get an array of its own.

**Requirements**

- `Scores(int size)`: allocate an array of `size` ints, all set to 0.
- `int size() const`: return the number of cells.
- `int get(int index) const`: return the value in cell `index`.
- `void set(int index, int value)`: put `value` in cell `index`.
- `~Scores()`: release the array.
- `Scores(const Scores& other)`: allocate a new array, and copy `other`'s values into it.
- `Scores& operator=(const Scores& other)`: make this object an independent copy of `other`, and return `*this`.

**Constraints**

- In `a = b`, the two objects may have different sizes.
- `a = a` must leave `a` unchanged.
- `a = b = c` must work.

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
