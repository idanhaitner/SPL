---
title: A ledger on the heap
chapter: bridge-memory-basics
order: 1
---

Write four small functions that create, change, read, and release an array of balances on the heap.

**Requirements**

- `int* makeLedger(int n)`: allocates an array of `n` ints on the heap, sets every cell to 0, and returns its address.
- `void deposit(int* ledger, int n, int index, int amount)`: adds `amount` to the cell at `index`. If `index` is not between 0 and `n - 1`, it changes nothing.
- `int total(const int* ledger, int n)`: returns the sum of the `n` cells. It does not change them.
- `void closeLedger(int*& ledger)`: releases the array and leaves the caller's pointer as `nullptr`.

**Background**

- A block from `new int[n]` stays on the heap after the function that made it returns, so returning its address is safe.
- A pointer passed by value is a copy of the address. Through it you can change the cells, but not the caller's pointer.
- A parameter of type `int*&` is another name for the caller's pointer.
- A block from `new[]` is released with `delete[]`.

:::example
**Input:** `int* book = makeLedger(3); deposit(book, 3, 1, 40); deposit(book, 3, 7, 5);`

**Result:** `total(book, 3)` is 40. After `closeLedger(book);`, `book` is `nullptr`.
:::

:::hint
`new int[n]` does not set its cells to anything. Either write a loop that stores 0 in each cell, or ask for zeros with `new int[n]()`.
:::

:::hint
In `deposit`, check `index` against both ends before you touch `ledger[index]`.
:::

:::hint
In `closeLedger`, the order matters: release the block first, then store `nullptr` in the pointer.
:::
