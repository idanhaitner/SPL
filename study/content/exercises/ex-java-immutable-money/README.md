---
title: Build an immutable object
chapter: synchronization
order: 2
lang: java
---

An object that never changes after it is built needs no lock at all: no thread can ever see it half-updated. Finish the class `Money` so that it is **immutable**.

**Requirements**

- The class `Money` is `final`, so nobody can subclass it and add changing state.
- Its fields `amount` and `currency` are `final` and set once in the constructor.
- `Money plus(Money other)`: return a **new** `Money` with the two amounts added and the same currency. The two objects being added are not changed.
- Adding two amounts in different currencies is a mistake. Reject it with an `IllegalArgumentException`.

**Background**

- The recipe for an immutable class: `final` class, `final` fields, no setters, and every "change" returns a new object.
- Compare `String`: `"a".concat("b")` gives a new string and never alters the first one.
- The test reads the class with reflection to check the `final` modifiers, so it does not rely on you remembering them.

:::example
**Input:** `new Money(5, "USD").plus(new Money(7, "USD"))`

**Result:** a new `Money` of 12 USD. The two originals still hold 5 and 7.
:::

:::hint
Write `final class Money` and `private final int amount;`. The compiler will then refuse any later assignment to the field.
:::

:::hint
`plus` builds a result with `new Money(amount + other.amount, currency)`. Compare the currencies with `.equals`, not `==`.
:::

:::case name="class is final"
The class itself must be `final`, so that no subclass can add mutable state to it.
:::

:::case name="plus rejects different currencies"
5 USD plus 5 EUR has no meaning. `plus` should throw an `IllegalArgumentException`.
:::
