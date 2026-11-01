---
title: A student who owns a bag
chapter: rule-of-three
order: 2
---

A `Student` has a name and a `Bag` on the heap, and it is responsible for that bag. `Bag` is already written. Its constructors add 1 to the global variable `bagsAlive` and its destructor takes 1 away, so the tests can count how many bags exist right now. A leak shows up as too many bags, and sharing as too few.

Write the `Student` class.

- **`Student(name, capacity)`** stores the name and creates a new `Bag` with that capacity.
- **`name()`, `bagCapacity()`, and `setBagCapacity(capacity)`** read the name, read the bag's capacity, and change it.
- **The destructor** deletes the bag.
- **The copy constructor** gives the new student a bag of their own, which is a copy of the other's.
- **`a = b`** releases the bag `a` held, and gives `a` a copy of `b`'s bag and `b`'s name. `a = a` must change nothing, and `a = b = c` must work.

You are done when Submit shows every test passing.

:::example
**Input:** `Student ringo("ringo", 7); Student jango("jango", 5); ringo = jango;`

**Result:** `ringo.bagCapacity()` is 5, and `bagsAlive` is 2: ringo's old bag is gone, and each student has a bag of their own
:::

:::hint
`Bag` already has a copy constructor. What does `new Bag(*something)` build, if `something` is a `Bag*`?
:::

:::hint
`std::string` manages its own memory, so `_name` needs no special care. Only the pointer does.
:::

:::hint
In the assignment operator, count the bags. Before the line, `ringo` and `jango` hold two. After it, there should still be two, but the one `ringo` held must be a different one.
:::

:::case name="assignment releases the old bag"
More bags than students means the old bag was never deleted. Fewer means two students share one bag.
:::
