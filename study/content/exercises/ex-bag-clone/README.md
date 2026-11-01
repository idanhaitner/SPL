---
title: Copy through a base pointer
chapter: inheritance
order: 3
---

A `Locker` owns one `Bag`, through a `Bag*`. The bag may really be a `Bag7` or a `Bag12`, and `Locker` does not know which. So `new Bag(*other._bag)` is not enough here: it always builds a plain `Bag`, and the copy forgets what kind of bag it was.

The fix is a virtual method `clone`, where each class makes a copy of itself on the heap and returns its address.

- **`Bag(items)`** stores how many items are in the bag. `items()` and `setItems(items)` read and change that number.
- **`capacity()`** gives 5 for a plain `Bag`, 7 for a `Bag7`, and 12 for a `Bag12`.
- **`clone()`** in each of the three classes returns a new object of that same class, a copy of this one.
- **`Locker`'s copy constructor** gives the new locker its own bag, of the same real class.
- **`Locker`'s assignment operator** releases the bag the locker held, and takes its own copy of the other's bag. `a = a` must change nothing.

The rest of `Locker` is already written: its constructor takes ownership of the bag it receives, and its destructor deletes it.

You are done when Submit shows every test passing.

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
