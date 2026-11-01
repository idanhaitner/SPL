---
title: A student who owns a bag
chapter: classes-and-objects
order: 2
---

A `Bag` on the heap stays there until someone calls `delete` on it. When an object holds the address of something it is responsible for, its destructor must release it. The destructor is the member function that runs when the object's life ends, and it is written `~Student()`.

The class `Bag` is finished, so leave it as it is. It adds 1 to `bagsAlive` when a bag is made and takes 1 away when a bag is destroyed. The tests read that number to see whether your bags were released.

Finish the class `Student`.

- Add a private field of type `Bag*`.
- The constructor makes a new `Bag` on the heap with the given size.
- `bagSize()` gives the size of the student's bag.
- `changeBag(size)` replaces the student's bag with a new one of the given size. The old bag must not be left behind.
- The destructor releases the student's bag.

The tests never copy a `Student`. Copying an object like this one needs more care, and that comes in the next chapter.

You are done when Submit shows every test passing.

:::example
**Input:** `Student s(5); s.changeBag(9);`

**Result:** `s.bagSize()` is 9 and `bagsAlive` is 1. When `s` is destroyed, `bagsAlive` goes back to 0.
:::

:::hint
Each `new` needs one matching `delete`. Count how many times your class calls `new`, and find where each of those bags gets released.
:::

:::hint
`_bag` holds an address, not a `Bag`. Which operator reaches a member through a pointer?
:::

:::hint
In `changeBag`, you are about to overwrite the only copy of the old bag's address. What has to happen to that bag first?
:::

:::case name="end of block frees the bag"
A student on the stack is destroyed at the end of its block, and its destructor runs by itself. The bag on the heap is released only if the destructor does it.
:::

:::case name="changing the bag keeps one bag"
If `bagsAlive` is 2 here, the old bag was never released. Once the field holds the new address, nothing can reach the old bag any more.
:::
