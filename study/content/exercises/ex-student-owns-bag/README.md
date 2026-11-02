---
title: A student who owns a bag
chapter: rule-of-three
order: 2
---

Write `Student`, which has a name and owns a `Bag` on the heap, with the rule of three.

**What to write**

- `Student(const std::string& name, int capacity)`: store the name, and create a new `Bag` with that capacity.
- `name()`, `bagCapacity()`, and `setBagCapacity(capacity)`: read the name, read the bag's capacity, and change it.
- `~Student()`: delete the bag.
- `Student(const Student& other)`: give the new student a bag of their own, a copy of `other`'s.
- `Student& operator=(const Student& other)`: release the bag this student held, take a copy of `other`'s bag and `other`'s name, and return `*this`.

**Rules**

- `a = a` must change nothing, and `a = b = c` must work.

**Good to know**

- `Bag` is already written. It counts the bags alive in the global `bagsAlive`, so a leak shows up as too many bags, and sharing as too few.

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
