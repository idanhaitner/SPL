---
title: Copy through a base pointer
chapter: inheritance
order: 3
---

Give every bag a `clone` method, and use it so that copying a `Locker` copies its bag as the right class.

**What to write**

- `Bag(int items)`: store the number of items.
- `int items() const` and `void setItems(int items)`: read and change that number.
- `capacity()`: return 5 in `Bag`, 7 in `Bag7`, and 12 in `Bag12`.
- `clone()`, in all three classes: make a new object of that same class on the heap, a copy of this one, and return its address.
- `Locker(const Locker& other)`: give the new locker its own copy of `other`'s bag, of the same real class.
- `Locker& operator=(const Locker& other)`: delete the bag this locker holds, take a copy of `other`'s bag, and return `*this`.

**Rules**

- `a = a` must change nothing.
- The rest of `Locker` is already written. Its constructor takes ownership of the bag it gets, and its destructor deletes it.

**Good to know**

- A `Locker`'s `Bag*` may really point at a `Bag7` or a `Bag12`.
- `new Bag(*other._bag)` always builds a plain `Bag`, so the copy would forget its real class. A virtual `clone` builds the right one.

:::example
**Input:** `Bag* original = new Bag7(3); Bag* copy = original->clone();`

**Result:** `copy->capacity()` is 7, `copy->items()` is 3, and `copy` is a different address from `original`
:::

:::example
**Input:** `Locker a(new Bag12(2)); Locker b(a);`

**Result:** `b.bag()->capacity()` is 12, and `b.bag()` is a different address from `a.bag()`
:::

:::hint
Inside `Bag7`, `*this` has the type `Bag7`. What does `new Bag7(*this)` build, and which constructor does it call?
:::

:::hint
`Locker` holds a `Bag*`, and it must not name `Bag7` anywhere. Which call on that pointer finds the right class at run time?
:::

:::case name="a locker's copy keeps the real class"
A capacity of 5 means the copy became a plain `Bag`. Call `clone` on the other locker's bag, instead of `new Bag(...)`.
:::

:::case name="clone of a Bag7 is a Bag7"
A capacity of 5 means `Bag7` is still using the `clone` of `Bag`. Each class needs its own.
:::
