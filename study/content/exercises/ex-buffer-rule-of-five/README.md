---
title: A buffer with all five
chapter: rule-of-five
order: 1
---

Write `Buffer`, which owns an array of `int`s on the heap. A copy makes a second array. A move hands the same array to a new owner.

**What to write**

- `Buffer(int size)`: allocate `size` ints, all 0.
- `size()`, `get(index)`, and `set(index, value)`: read the size, read a cell, and change a cell.
- `const int* data() const`: return the array's address. The tests use it to see whether the array changed hands.
- `~Buffer()`: release the array.
- `Buffer(const Buffer& other)`: allocate a new array with `other`'s values.
- `Buffer& operator=(const Buffer& other)`: make this buffer an independent copy of `other`, and return `*this`.
- `Buffer(Buffer&& other)`: take `other`'s array without making a new one. Then set `other`'s pointer to `nullptr` and its size to 0.
- `Buffer& operator=(Buffer&& other)`: take `other`'s array too, and return `*this`.

**Rules**

- In move assignment, the array this buffer held before must still be released, either right away or later by `other`.
- `other` must not keep the array it gave away.
- After a move, the source can still be destroyed, or given a new value.

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
