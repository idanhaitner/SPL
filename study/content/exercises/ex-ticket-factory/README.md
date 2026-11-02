---
title: Make tickets through a factory
chapter: classes-and-objects
order: 3
---

Turn `Ticket` into a factory: only `Ticket::create` can make tickets, and it refuses seats below 1.

**What to write**

- Make the constructor private, and have it store the seat number in a private field.
- `static Ticket* create(int seat)`: if `seat` is below 1, make nothing and return `nullptr`. Otherwise make a new `Ticket` on the heap and return its address.
- `int seat() const`: return the ticket's seat number.

**Good to know**

- A constructor cannot hand back `nullptr`, so a factory function decides whether to make the object at all.
- A `static` member function belongs to the class rather than to one object, so you call it as `Ticket::create(...)`.
- Whoever calls `create` is responsible for calling `delete` on the ticket.

:::example
**Input:** `Ticket* t = Ticket::create(12);`

**Result:** `t->seat()` is 12. `Ticket::create(0)` gives `nullptr`.
:::

:::hint
A class's members are private unless you say otherwise. In the starter, the constructor is below `public:`. Where does it need to move?
:::

:::hint
A private constructor can still be called from inside the class, and `create` is inside the class.
:::

:::hint
A ticket made as a local variable inside `create` is destroyed when `create` returns. What do you use to make an object that outlives the function?
:::

:::case name="constructor is private"
This test checks that code outside the class cannot call `Ticket(5)` directly. It passes once the constructor is no longer in the public part of the class.
:::

:::case name="each call makes a new ticket"
Each ticket needs its own object on the heap. If two tickets share one address, they cannot hold different seats, and deleting both would release the same memory twice.
:::
