---
title: A mailbox that waits
chapter: waiting-and-liveness
order: 1
lang: java
---

A `Mailbox` holds at most one message. A thread that calls `put` must wait while the box is full, and a thread that calls `take` must wait while it is empty. Finish `put` and `take` with `wait` and `notifyAll`.

**Requirements**

- `synchronized void put(T msg)`: while the box is full, wait. Then store the message and wake the waiting threads.
- `synchronized T take()`: while the box is empty, wait. Then remove the message, leave the box empty, wake the waiting threads, and return the message.
- The box is empty when `message` is `null`.
- Always wait inside a `while` loop that checks the condition again, never inside an `if`.

**Background**

- `wait()` releases the lock and sleeps until another thread calls `notify` or `notifyAll` on the same object. Both must be called while holding the lock, which is why the methods are `synchronized`. Calling `notifyAll()` without the lock throws `IllegalMonitorStateException`.
- A woken thread may find that the condition is false again, because another thread got in first. That is why the check is a `while`.
- The online Java runner cannot start threads, so the test calls the methods one after the other, in the order that never needs to wait.

:::example
**Input:** `put("hi")`, then `take()`

**Result:** `take()` returns `"hi"`, and the box is empty again
:::

:::hint
The shape of `put` is: `while (message != null) wait();` then `message = msg;` then `notifyAll();`.
:::

:::hint
`take` is the mirror image: wait while `message == null`, copy the message to a local variable, set `message = null`, call `notifyAll()`, and return the local variable.
:::

:::case name="take empties the box"
After `take()` the field must be `null` again. Otherwise the next `put` would wait forever for a box that nobody empties.
:::

:::case name="put and take use the lock"
`notifyAll()` is only legal while holding the object's lock. Declare both methods `synchronized`.
:::
