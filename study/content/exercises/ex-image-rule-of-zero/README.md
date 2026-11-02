---
title: An image under the rule of zero
chapter: rule-of-five
order: 3
---

Finish `Image` by keeping its pixels in a `std::vector<char>`, and write none of the special members.

**What to write**

- A private field `std::vector<char> _bytes`.
- `Image(int width, int height)`: store both sizes, and give `_bytes` one cell per pixel, `width * height` cells in all.
- `width()` and `height()`: return the sizes.
- `void set(int x, int y, char value)` and `char get(int x, int y) const`: change and read pixel `(x, y)`, which is cell `y * width + x`.
- `const char* pixels() const`: return `&_bytes[0]`, the address of the first cell. The tests use it to see whether the buffer changed hands.

**Rules**

- Do not write a destructor, a copy constructor, an assignment operator, or any move. The compiler's versions are already correct.

**Good to know**

- A vector owns its own buffer. Copying a vector copies the buffer, and moving it hands the buffer over.
- In the initializer list, `_bytes(n)` gives the vector `n` cells, all 0.
- `_bytes[i]` reads or changes cell `i`, the same as with an array.

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
