---
title: Copying the base part too
chapter: inheritance
order: 2
---

Write `Student`, a `Person` with credits on the heap, with the rule of three, so that the `Person` part is never lost.

**Requirements**

- `Student(int id, const std::string& name, int credits)`: pass `id` and `name` to the `Person` constructor, and create the credits as an `int` on the heap.
- `credits()` and `setCredits(credits)`: read and change the credits.
- `~Student()`: release the `int`.
- `Student(const Student& other)`: copy the `Person` part too, and give the new student their own `int`.
- `Student& operator=(const Student& other)`: assign the `Person` part too, give this student `other`'s credits in an `int` of its own, and return `*this`.

**Constraints**

- `a = a` must change nothing.

**Background**

- `Person` is already written. Its empty constructor makes a person with id 0 named `nobody`.

:::example
**Input:** `Student ringo(7, "ringo", 30); Student copy(ringo);`

**Result:** `copy.id()` is 7, `copy.name()` is `ringo`, and `copy.credits()` is 30
:::

:::example
**Input:** `Student a(1, "a", 10); Student b(2, "b", 20); a = b; a.setCredits(5);`

**Result:** `a.id()` is 2, `a.name()` is `b`, `a.credits()` is 5, and `b.credits()` is still 20
:::

:::hint
A copy constructor that does not name a base constructor builds the base with its empty constructor. That is where `nobody` comes from.
:::

:::hint
The compiler does not call the base's assignment for you. The way to name it, inside the body, is in the chapter's "Assigning" paragraph.
:::

:::hint
The `Person` part is private to `Person`, so `Student` cannot set `_id` itself. It has to go through the base's functions, and a `Student` can be passed wherever a `const Person&` is expected.
:::

:::case name="copy keeps the Person part"
The id and the name came out as 0 and `nobody`, so the base was built with its empty constructor. Name the base's copy constructor in the initializer list.
:::

:::case name="assignment keeps the Person part"
The left side kept its own id and name, because the compiler does not call the base's assignment for you. Call it yourself, inside the body.
:::
