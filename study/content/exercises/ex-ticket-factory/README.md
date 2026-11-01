---
title: Make tickets through a factory
chapter: classes-and-objects
order: 3
---

Sometimes a constructor is not enough. A ticket for a seat that does not exist should never be made at all, and a constructor has no way to hand back `nullptr`. The factory pattern solves this. The constructor becomes private, so nobody outside the class can call it, and a `static` member function makes each object on the heap and returns its address. A `static` member function belongs to the class rather than to one object, so you call it as `Ticket::create(...)`.

Change the class `Ticket` to follow this pattern.

- Make the constructor private, and have it store the seat number in a private field.
- `create(seat)` makes a new `Ticket` on the heap and returns its address. Seat numbers start at 1, so for a seat below 1 it makes nothing and returns `nullptr`.
- `seat()` gives the ticket's seat number.

Whoever calls `create` becomes responsible for calling `delete` on the ticket.

You are done when Submit shows every test passing.

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
