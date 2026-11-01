---
title: Make a heap block that outlives its function
chapter: memory-model
order: 2
---

A stack local dies when its function returns, but a heap block stays until someone calls `delete`. So one function can create a block, and a different function can release it later.

Write two functions.

- `makeBox(value)` allocates one `int` on the heap, holding `value`, and returns its address.
- `openBox(box)` gets that address, releases the block, and returns the value that was inside.

You have seen `new int(9)` and `delete`. There are two more pieces of syntax here.

- **`*box`** is the `int` that the pointer `box` points at. For example, `int n = *box;` copies that `int` into `n`.
- **`nullptr`** is an address that points at nothing. The starter returns it from `makeBox` only so the code compiles. Replace it, and replace the `return 0;` too.

:::example
**Input:** `int* box = makeBox(7); int value = openBox(box);`

**Result:** `value` is 7, and the block is back with the heap
:::

:::hint
`makeBox` needs two things: a call to `new`, and a `return` of what `new` gave you. The pointer local goes away with the frame, but the address you returned does not.
:::

:::hint
In `openBox`, order matters. After `delete`, the block is no longer yours, so reading it is an error. When must you read the value?
:::

:::hint
A local `int` lives in the frame, not in the block, so a copy in a local is still there after the `delete`.
:::

:::case name="openBox releases the block"
Every `new` needs a matching `delete`. Without one, the block stays occupied after the last pointer to it is gone, which is a memory leak.
:::

You are done when Submit shows every test passing.
