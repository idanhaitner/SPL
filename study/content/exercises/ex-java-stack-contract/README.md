---
title: Give a stack a contract
chapter: design-by-contract
order: 1
lang: java
---

Finish the class `ListStack`, a stack of objects. Each method must enforce its precondition, so a caller that breaks the contract is stopped at once with a clear exception.

**Requirements**

- `void push(T obj)`: the precondition is that `obj` is not `null`. Reject `null` with an `IllegalArgumentException`. Otherwise add `obj` to the top.
- `T top()`: the precondition is that the stack is not empty. If it is empty, throw an `IllegalStateException`. Otherwise return the top object without removing it.
- `void removeTop()`: the same precondition. Remove the top object.
- `int size()`: the number of objects in the stack.
- The `items` list is the stack. The end of the list is the top.

**Background**

- A precondition is the caller's duty. When it is broken, the method must not carry on and quietly corrupt the object.
- Use `IllegalArgumentException` when an argument is bad, and `IllegalStateException` when the object is in the wrong state for the call.
- `items.get(items.size() - 1)` is the last element, and `items.remove(items.size() - 1)` removes it.

:::example
**Input:** `push("a")`, `push("b")`, then `top()`

**Result:** `top()` returns `"b"`, and `size()` is 2
:::

:::hint
Check the precondition on the first line of the method, before you change anything. An `if` that throws is enough.
:::

:::hint
`throw new IllegalStateException("top of an empty stack");` stops the method on the spot. Do the same for `removeTop`.
:::

:::case name="push rejects null"
The precondition of `push` is that the argument is not `null`. Test `obj == null` first, and throw an `IllegalArgumentException`.
:::

:::case name="top of an empty stack"
`top()` has no object to return when the stack is empty. Throw an `IllegalStateException` instead of returning `null`.
:::
