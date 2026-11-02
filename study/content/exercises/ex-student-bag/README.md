---
title: A student who owns a bag
chapter: classes-and-objects
order: 2
---

Finish `Student`, which owns one `Bag` on the heap and must release it.

**Requirements**

- A private field of type `Bag*`.
- `Student(int bagSize)`: make a new `Bag` on the heap with that size.
- `int bagSize() const`: return the size of the student's bag.
- `void changeBag(int size)`: replace the bag with a new one of that size. The old bag must be released.
- `~Student()`: release the bag.

**Constraints**

- Leave `Bag` as it is. It counts the bags alive in `bagsAlive`, and the tests read that number to catch bags that were never released.
- The tests never copy a `Student`. Copying comes in the next chapter.

**Background**

- The destructor `~Student()` runs when the object's life ends.

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
