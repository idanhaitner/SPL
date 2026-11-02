---
title: A smart pointer by hand
chapter: rule-of-five
order: 2
---

Write `SharedInt`, a small smart pointer. Copies share one `int` on the heap, and the last copy to go deletes it.

**Requirements**

- `SharedInt(int value)`: create a new `int` holding `value`, and a new counter on the heap that starts at 1.
- `SharedInt(const SharedInt& other)`: share `other`'s `int` and counter, and add 1 to the counter.
- `~SharedInt()`: take 1 from the counter. If it reaches 0, delete both the `int` and the counter.
- `SharedInt& operator=(const SharedInt& other)`: first leave what this object shares, the same way the destructor does. Then share `other`'s `int` and counter, add 1 to that counter, and return `*this`.
- `value()`, `setValue(value)`, and `owners()`: read the `int`, change it, and read the counter.

**Constraints**

- `a = a` must change nothing, and `a = b = c` must work.
- Write no move members. A copy only adds 1 to a counter, so it is already cheap.

**Background**

- The chapter builds the same thing as `smart_ptr`.

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
