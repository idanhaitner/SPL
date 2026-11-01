---
title: Size an array at run time
chapter: memory-model
order: 3
---

The compiler must know the size of every local in a stack frame before the program runs. So when a size is known only at run time, the data goes on the heap with `new int[n]`, and the frame holds only a pointer to it.

Write `sumOfSquares(n)`. It does these steps, in this order.

1. Allocate an array of `n` integers on the heap.
2. Fill it with the squares 1×1, 2×2, and so on, one in each cell, up to n×n.
3. Add up the cells.
4. Release the array, and return the sum.

Two pieces of syntax are new here.

- **`cells[i]`** is cell number `i` of the array that `cells` points at. Numbering starts at 0, so an array of `n` cells runs from `cells[0]` to `cells[n - 1]`.
- **A `for` loop** repeats its braces while its condition holds. This one writes 7 into every cell:

```cpp
for (int i = 0; i < n; i = i + 1) {
    cells[i] = 7;
}
```

The `return 0;` in the starter is only there so the code compiles. Replace it.

:::example
**Input:** `sumOfSquares(3)`

**Result:** `14`, because the array holds 1, 4, and 9
:::

:::example
**Input:** `sumOfSquares(0)`

**Result:** `0`, because the array has no cells to add
:::

:::hint
Cell numbers start at 0, but the squares start at 1×1. If `i` is the cell number, which number gets squared in that cell?
:::

:::hint
For the sum, make an `int` that starts at 0, then use a second loop to add each cell to it.
:::

:::hint
The form of the release must match the form of the allocation. Which `delete` goes with `new int[n]`?
:::

:::case name="three values"
If you got 5, your squares started at 0×0. Look at what goes into cell 0.
:::

:::case name="released with delete[]"
`delete` is for one object from `new`, and `delete[]` is for an array from `new[]`. Using the wrong one is undefined behavior, and skipping it leaks the array.
:::

You are done when Submit shows every test passing.
