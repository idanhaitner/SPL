---
title: Count the decks that are alive
chapter: bridge-objects-and-copies
order: 1
---

Finish the class `Deck`. It owns an array of card numbers on the heap, and it keeps count of how many `Deck` objects exist right now.

**Requirements**

- `Deck(int size)`: allocates `size` cards, all 0, and adds 1 to `Deck::alive`.
- `Deck(const Deck& other)`: a deep copy. The new deck gets its own array with the same cards, and `Deck::alive` goes up by 1.
- `Deck& operator=(const Deck& other)`: makes this deck a deep copy of `other`, releases the array it had before, and is safe for `d = d;`. No deck is created or destroyed, so `Deck::alive` does not change.
- `~Deck()`: releases the array and subtracts 1 from `Deck::alive`.
- `size()`, `get(index)`, and `set(index, value)` are already written.

**Background**

- A `static` field belongs to the class, not to any one object. There is one `Deck::alive` for the whole program.
- Every object is built by exactly one constructor and destroyed by exactly one destructor. The copy constructor is a constructor too.
- The default copy only copies the address in `_cards`, so two decks would share one array.

:::example
**Input:** `Deck a(2); { Deck b = a; }`

**Result:** `Deck::alive` is 2 inside the braces and 1 after them.
:::

:::hint
Three places change the count: both constructors add 1, and the destructor subtracts 1. The assignment operator does not touch it.
:::

:::hint
In the copy constructor, allocate `new int[other._size]` and copy the cards with a loop. Copying `other._cards` itself would copy only the address.
:::

:::hint
In `operator=`, start with `if (this != &other)`. Inside it: release the old array, take the new size, allocate, and copy. Return `*this` at the end either way.
:::
