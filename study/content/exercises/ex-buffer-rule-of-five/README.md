---
title: A buffer with all five
chapter: rule-of-five
order: 1
---

`Buffer` owns an array of `int`s on the heap. Copying must make a second array, and moving must not: a move hands the same array to a new owner, and only the pointer changes hands.

Write the five special members and the small methods.

- **`Buffer(size)`** allocates `size` cells, all 0. `size()`, `get(index)`, and `set(index, value)` work as you expect.
- **`data()`** returns the address of the array, so the tests can see whether it changed hands.
- **The destructor, copy constructor, and copy assignment** follow the rule of three.
- **The move constructor** takes the other buffer's array, then leaves the other with a null pointer and a size of 0.
- **The move-assignment operator** takes the other buffer's array too. The array this object held before must be released, either right away or by the other object later. The other buffer must not be left holding the array it gave away.

After a move, the source can still be destroyed, or given a new value.

You are done when Submit shows every test passing.

:::example
**Input:** `Buffer src(3); const int* before = src.data(); Buffer dest(std::move(src));`

**Result:** `dest.data()` equals `before`, `dest.size()` is 3, `src.data()` is `nullptr`, and `src.size()` is 0
:::

:::example
**Input:** `Buffer a(1); Buffer b(4); a = b; a.set(0, 9);`

**Result:** `a.size()` is 4, `a.get(0)` is 9, and `b.get(0)` is still 0
:::

:::hint
The parameter of a move has the type `Buffer&&`. Look at which of the five allocate with `new`. Copies do. Do moves?
:::

:::hint
After the move constructor, two destructors will run on the same pointer unless you change something. What does `delete[]` do with a null pointer?
:::

:::hint
Move assignment gets shorter with `std::swap`. The other object then holds this object's old array, and its destructor releases it. How many fields are there to trade?
:::

:::case name="move constructor takes the array"
The address changed, so this constructor made a new array. A move copies the pointer and no cells.
:::

:::case name="move constructor empties the source"
The source still owns the array, so its destructor will release the same memory a second time. Set its pointer to `nullptr` and its size to 0.
:::

:::case name="move assignment leaves the source without the array"
The source still holds the array it gave away. Its destructor would release that array while the target is using it.
:::
