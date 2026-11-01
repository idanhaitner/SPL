---
title: A smart pointer by hand
chapter: rule-of-five
order: 2
---

`SharedInt` is a small smart pointer: an object that shares one `int` on the heap with its copies, and deletes it when the last copy goes away. Next to the `int`, on the heap too, sits a counter of how many `SharedInt`s currently share it. The chapter builds the same thing as `smart_ptr`.

Write the class. It has no move members: copying only adds 1 to a counter, so a copy is already cheap.

- **`SharedInt(value)`** creates a new `int` and a new counter that starts at 1.
- **The copy constructor** shares the other's `int` and counter, and adds 1 to the counter.
- **The destructor** takes 1 from the counter. If it reaches 0, it deletes both the `int` and the counter.
- **`a = b`** first makes `a` leave what it shared, the same way the destructor does, and then joins `b`. `a = a` must change nothing, and `a = b = c` must work.
- **`value()`, `setValue(value)`, and `owners()`** read the `int`, change it, and read the counter.

You are done when Submit shows every test passing.

:::example
**Input:** `SharedInt a(1); SharedInt b(2); SharedInt c = a; a = b;`

**Result:** `c.owners()` is 1, `a.owners()` is 2, `b.owners()` is 2, and `a.value()` is 2
:::

:::hint
The counter must be the same one for every copy. So what kind of field holds it, an `int` or an `int*`?
:::

:::hint
The destructor and the assignment operator both start with the same steps. A private method can hold those steps once.
:::

:::hint
Try `a = a` on paper when `a` has 1 owner. What happens to the counter in the first step, and what is left to join in the second?
:::

:::case name="assignment leaves the old and joins the new"
Follow the two counters. One of them should go down by 1, and the other should go up by 1.
:::
