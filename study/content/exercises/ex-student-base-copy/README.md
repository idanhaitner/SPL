---
title: Copying the base part too
chapter: inheritance
order: 2
---

A `Student` is a `Person`, so a `Student` object starts with a `Person` part: an id and a name. `Person` is already written. Its empty constructor makes a person with id 0 named `nobody`. The `Student` part adds a number of credits, in an `int` on the heap.

Write `Student`, with the rule of three, so that the `Person` part is never lost.

- **`Student(id, name, credits)`** passes the id and the name to the `Person` constructor, and creates the `int` on the heap.
- **`credits()` and `setCredits(credits)`** read and change the credits.
- **The destructor** releases the `int`.
- **The copy constructor** copies the `Person` part too, and gives the new student their own `int`.
- **`a = b`** assigns the `Person` part too, and gives `a` the credits of `b`, in an `int` of its own. `a = a` must change nothing.

You are done when Submit shows every test passing.

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
