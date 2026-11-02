---
title: Make a heap block that outlives its function
chapter: memory-model
order: 2
---

Write two functions: one puts an `int` on the heap, and the other takes it back off.

**What to write**

- `int* makeBox(int value)`: allocate one `int` on the heap holding `value`, and return its address.
- `int openBox(int* box)`: read the value that `box` points at, release the block, and return that value.

**Rules**

- Replace the starter's `return nullptr;` and `return 0;`. They are only there so the code compiles.

**Good to know**

- `new int(9)` allocates one `int` holding 9, and gives back its address. `delete` releases it.
- `*box` is the `int` that `box` points at. `int n = *box;` copies it into `n`.
- `nullptr` is an address that points at nothing.
- A heap block stays until someone calls `delete`, so one function can create it and another can release it.

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
