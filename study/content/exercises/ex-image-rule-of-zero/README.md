---
title: An image under the rule of zero
chapter: rule-of-five
order: 3
---

The rule of zero says to hand a resource to a member that already manages it, and then write none of the five special members. Here that member is a `std::vector<char>`, which owns its own buffer: copying a vector copies the buffer, and moving a vector hands the buffer over.

Add a field `std::vector<char> _bytes` to `Image`, and fill in the methods. Do not write a destructor, a copy constructor, an assignment operator, or any move. The compiler's versions are already correct.

A few things you need from `std::vector`. In a member-initializer list, `_bytes(n)` gives the vector `n` cells, all 0. `_bytes[i]` reads or changes cell `i`, the same as with an array.

- **`Image(width, height)`** stores the two sizes and makes one cell for each pixel, `width * height` in total.
- **`width()` and `height()`** read the sizes.
- **`set(x, y, value)` and `get(x, y)`** change and read one pixel. The pixels are stored row after row, so pixel `(x, y)` is cell `y * width + x`.
- **`pixels()`** returns the address of the first cell, `&_bytes[0]`, so the tests can see whether the buffer changed hands.

You are done when Submit shows every test passing.

:::example
**Input:** `Image a(3, 2); a.set(2, 1, 9); Image b = a; b.set(2, 1, 4);`

**Result:** `a.get(2, 1)` is 9, and `b.get(2, 1)` is 4
:::

:::hint
This exercise is small on purpose. If you find yourself writing `new` or `delete`, step back.
:::

:::hint
Members are built in the order you declare them. Both sizes are plain parameters of the constructor, so you can use `width * height` directly.
:::

:::case name="a move takes the buffer"
The buffer was copied, not moved. Did you add a destructor or a copy constructor? Declaring one stops the compiler from generating the moves, so a move falls back to a copy. Remove it.
:::

:::case name="pixels land in rows"
Two pixels ended up in the wrong cells. Try the formula `y * width + x` by hand on a 3 by 2 image.
:::
