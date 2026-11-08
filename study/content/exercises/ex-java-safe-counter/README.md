---
title: Make a counter thread-safe
chapter: synchronization
order: 1
lang: java
---

`count++` is really three steps: read the value, add one, write it back. Two threads can interleave those steps and lose an update. Finish the class `SafeCounter` so that only one thread at a time can run inside it.

**Requirements**

- `void increment()`: add 1 to `count`.
- `int get()`: return `count`.
- Both methods must be marked `synchronized`, so that every call locks the same object (`this`). This is the course's Protocol A: all access goes through one lock, reads included.

**Background**

- `synchronized` on a method locks `this` for the length of the call. A second thread that calls any synchronized method of the same object waits its turn.
- A **read** must be locked too. Without the lock, a reader can see a stale value, because there is no guarantee that another thread's write is visible to it.
- The online Java runner cannot start threads, so the test checks your code in two ways: the counts must add up, and both methods must carry the `synchronized` modifier.

:::example
**Input:** `increment()` called 3 times

**Result:** `get()` returns 3, and `increment` and `get` are both `synchronized`
:::

:::hint
Put the word `synchronized` before the return type, as in `synchronized void increment()`.
:::

:::hint
`get()` needs it as well. A lock that only the writers use protects nothing from a reader.
:::

:::case name="increment is synchronized"
The test reads the method's modifiers. `increment` must be declared `synchronized`.
:::

:::case name="get is synchronized"
Reads need the same lock as writes. Mark `get` as `synchronized` too.
:::
