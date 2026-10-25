---
id: design-by-contract
title: Design by contract
sources:
  - "materials/lectures/Chapter 9 - Design by Contract.pptx"
  - "materials/sessions/SPL_PS5.pptx"
  - "materials/exams/16-a.pdf"
  - "materials/exams/16-a-solution.pdf"
  - "materials/exams/18-a.pdf"
  - "materials/exams/18-a-solution.pdf"
  - "materials/exams/19-a.pdf"
  - "materials/exams/19-a-solution.pdf"
  - "materials/exams/24-a.pdf"
  - "materials/exams/24-a-solution.pdf"
---

This chapter shows how a method and its caller agree, before any code is written, on what counts as correct use.

- **The three clauses:** a contract is made of a precondition, an invariant, and a postcondition.
- **Whose bug it is:** when a clause is broken, the contract tells you whether the caller or the implementation is at fault.
- **Practice:** you will read and write contracts for the course's examples and past exam questions.

## The three clauses of the contract

Design by contract writes that agreement down as three clauses. Each clause also says whose bug it is when the clause turns out false.

:::definition id=def-dbc title="Precondition, invariant, and postcondition" source="materials/lectures/Chapter 9 - Design by Contract.pptx"

- **Precondition:** the condition the caller must establish before the call. The method may assume it.
- **A broken precondition:** the method's behavior is undefined, and the bug belongs to the caller.
- **Invariant:** a condition on the object that holds whenever none of its public methods is running.
- **A broken invariant:** the bug belongs to the class implementation.
- **Postcondition:** what the method guarantees about the object's state and its return value when it returns, provided the precondition held.
- **A broken postcondition:** the bug belongs to the method's implementation.
:::

![The contract of crop, in the order a call meets it: precondition, invariant, postcondition](../../web/public/figures/contract-clauses.svg)

Defensive programming and a contract answer different questions.

- **Defensive programming** checks the inputs at run time and throws an exception when an input is invalid.
- **A contract** decides, at design time, who is responsible for making sure the data is valid. The method does not have to re-check what the caller already promised.

### Command-query separation (CQS)

Contracts are easier to state and to test when commands and queries are separate.

- **Query:** a method that returns information and leaves the object's state unchanged, such as `size()`.
- **Command:** a method that changes the object's state and returns no value, such as `push`.
- **Why it helps:** a postcondition can then use queries to describe what a command did, without the queries changing anything themselves.

```java
/**
 * @inv isEmpty() == (size() == 0)
 * @inv size() >= 0
 */
public interface Stack<T> {
    /**
     * @pre obj != null
     * @post size() == size()@pre + 1
     * @post top() == obj
     */
    void push(T obj);

    /**
     * @pre !isEmpty()
     * @post size() == size()@pre - 1
     */
    void removeTop();

    /**
     * @pre !isEmpty()
     */
    T top();
}

```

The notation `size()@pre` means the value that `size()` had when the method was entered, before it changed anything.

:::problem id=worked-crop-contract title="The contract for crop" source="materials/lectures/Chapter 9 - Design by Contract.pptx" kind=worked solution_origin=source
State the precondition, the invariant, and the postcondition of `crop`, an image method that keeps only the rectangle starting at (`x`, `y`) with width `w` and height `h`.

```java
/**
 * @pre x >= 0 && y >= 0 && x + w <= width && y + h <= height
 * @post width == w && height == h
 */
void crop(int x, int y, int w, int h);

```

:::solution

- **Precondition:** the coordinates `x` and `y` are non-negative, and the crop rectangle of width `w` and height `h` lies entirely inside the current image bounds.
- **Invariant:** the image dimensions are positive, and the length of the pixel buffer equals `width * height`.
- **Postcondition:** the image dimensions are updated to `w` and `h`, and the pixel buffer holds the pixels of the cropped region.
:::
:::

:::check id=chk-whose-bug
`crop` is called with a negative width. Whose bug is that?

- [ ] The implementation, because the invariant failed
- [x] The caller, because a precondition failed
- [ ] The garbage collector, because the buffer leaked

- **The caller is at fault:** a negative width breaks the precondition, and establishing the precondition is the caller's job.
- **The method owes nothing:** when the precondition does not hold, the method is not required to establish its postcondition.
:::

## Practice

:::problem id=ps5-stack-contract title="The contract for Stack" source="materials/sessions/SPL_PS5.pptx" kind=exercise solution_origin=source
`Stack` has `push`, `top`, `isEmpty`, and `size`. `push` rejects null. `top` returns the last element that was pushed and does not remove it. `size` is never negative, and an empty stack has size 0.

:::check id=ps5-stack-contract-q1
The postcondition of `push` writes the old size as {{=size()@pre|size()|capacity()}}.

The postcondition says that after `push(obj)`, `size()` equals `size()@pre + 1`, and `top()` equals `obj`.
:::

:::check id=ps5-stack-contract-q2
Which of these belong to the contract?

- [x] Invariant: `size() >= 0`, and `isEmpty()` is true exactly when `size()` is 0
- [ ] Postcondition of `top`: `size()` grows by one
- [x] Precondition of `push`: `obj != null`. Precondition of `top`: `!isEmpty()`
- [x] Postcondition of `top`: the result is the last element that was pushed and has not yet been removed, and `size()` is unchanged

`top` is a query, so its postcondition says `size()` is unchanged. Only `push` makes the size grow by one.
:::

:::check id=ps5-stack-contract-q3
Which test checks the precondition of `push`?

- [ ] Record `size()`, push `"a"`, and check that `size` grew by one and that `top` is `"a"`
- [x] Call `push(null)` and expect rejection
- [ ] Check `size` before and after, with no null argument

- **Testing the precondition:** call `push(null)`, which breaks the precondition, and expect it to be rejected.
- **Testing the postcondition:** push `"a"`, then check that the size grew by one and that `top` is `"a"`. That is the first option.
- **Testing the invariant:** check that `size` is valid before and after the call. That is the third option.
:::
:::

:::examnote
- **What the question looks like:** it shows an interface and asks you to define the invariant, plus the precondition and postcondition of one method.
- **The usual traps:** an invariant that forgets the empty case, or a postcondition that holds only if no other code touches the object at the same time.
:::

:::problem id=exam-16a-q1 title="The contract for a queue" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
`Queue<T>` has `add(T item)` and `remove()`. `createQueue()` returns the object under test. `setUp` builds a new queue.

:::check id=exam-16a-q1-q1
The contract adds the queries {{=size|lock|thread}} and `isEmpty`.

With those two queries, the invariant can say that `size() >= 0`, and that `isEmpty()` is true exactly when `size() == 0`.
:::

:::check id=exam-16a-q1-q2
Which of these belong to the contract?

- [x] The next `remove` yields the earliest `add` that has not yet been removed
- [ ] `remove` on an empty queue has the postcondition that `size()` becomes negative
- [x] `remove` has precondition `!isEmpty()`. Its postcondition is that `size()` is smaller by one and the removed element was the oldest
- [x] The postcondition of `add` is that `size()` is larger by one, and later `remove` calls still yield the old elements and then the new item

- **A queue keeps insertion order:** `remove` always returns the oldest element that is still in the queue.
- **Removing from an empty queue** is ruled out by the precondition `!isEmpty()`, so the size can never become negative.
:::

:::check id=exam-16a-q1-q3
What does `testAdd` check?

- [ ] It records `size` before the call and expects that size to stay the same
- [ ] It calls `add` and never inspects the queue
- [x] It adds one element, then checks `size() == 1` and that `remove` returns that element

`setUp` gives `testAdd` an empty queue, so there is nothing to record beforehand. The test adds one element, then checks that the size is 1 and that `remove` returns that same element.
:::

:::check id=exam-16a-q1-q4
Which of these match the tests?

- [ ] `setUp` may leave the previous test's elements in the queue
- [x] `testRemove` on an empty queue expects the precondition to fail
- [x] `testRemove` after one `add` checks that `size` returns to 0 and that the value matches
- [x] `setUp` gives every test a fresh queue, so leftovers do not look like failures of the invariant

- **`testRemove` on an empty queue** deliberately breaks the precondition and expects that to be reported.
- **`testRemove` after one `add`** expects the size to return to 0 and the removed value to match.
- **`setUp`** must create a fresh queue for every test, so that one test's leftovers cannot make another test fail.
:::
:::

:::problem id=exam-18a-q2 title="A bounded stack" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
`Stack<T>` is bounded. `push` may store null. `pop` removes an element. `size` is the current number of elements. `capacity` is the maximum.

:::check id=exam-18a-q2-q1
The precondition of `push` is {{=size() < capacity()|data != null|size() == 0}}.

Since `push` may store null, the only precondition is that the stack has room. The postcondition is that `size()` equals `size()@pre + 1`, and that the next `pop()` returns `data`.
:::

:::check id=exam-18a-q2-q2
Which of these belong to the contract?

- [x] Invariant: `0 <= size() <= capacity()`, and `capacity()` does not change
- [ ] `push` of null violates the precondition
- [x] `pop` has precondition `size() > 0`
- [x] The postcondition of `pop` is that `size()` is `size()@pre - 1`, and the result is the last element that was pushed and is still on the stack

- **The invariant** bounds the size: it is never negative and never exceeds the fixed capacity.
- **Pushing null** does not break anything, because the question explicitly allows it.
:::

:::check id=exam-18a-q2-q3
Which implementation breaks the postcondition even when a lock was held?

- [x] `size` grows past `capacity`, or `push` returns without storing `data`
- [ ] `capacity()` stays constant across calls
- [ ] `pop` returns the last element that is still on the stack

- **A lock does not make code correct:** holding a lock only stops other threads from interfering. If the code itself lets `size` pass `capacity`, or forgets to store `data`, the contract is still broken.
- **The other two options** describe correct behavior, so they break nothing.
:::
:::

:::problem id=exam-19a-q2 title="The invariant of a tree" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
`SortedBinaryTree<T extends Comparable<T>>` has `getData`, `getLeft`, `getRight`, and `insert`. The implementation stores `data`, `left`, and `right` in `volatile` fields. The invariant describes the tree when no method is running on it.

:::check id=exam-19a-q2-q1
Which claims belong to the invariant?

- [x] For every node, `getData() != null`
- [ ] A child may hold a datum equal to its parent
- [x] If `getLeft()` is not null, `getData().compareTo(getLeft().getData()) > 0`, and the left child satisfies the same invariant
- [x] If `getRight()` is not null, `getData().compareTo(getRight().getData()) < 0`, and the right child satisfies the same invariant

- **No duplicates:** `insert` does not add a value that is already present, so no child holds a value equal to its parent's.
- **Recursive invariant:** every subtree must satisfy the same invariant, not just the root.
:::

:::check id=exam-19a-q2-q2
The precondition of `insert` is a {{=non-null|duplicate|volatile}} argument.

`insert` compares the new value with `compareTo`, which fails on null, and the invariant forbids null data. So the caller must pass a non-null value.
:::

:::check id=exam-19a-q2-q3
What does `volatile` guarantee for this tree?

- [ ] The three field updates inside `insert` are atomic
- [x] A write of a single reference is visible to other threads
- [ ] Two threads can no longer break the invariant

- **What `volatile` gives:** each single write to a `volatile` field is immediately visible to other threads.
- **What it does not give:** it does not make the several field updates inside `insert` one atomic step, so two threads inserting at once can still break the invariant.
- **Whose problem that is:** that is a concurrency bug in the implementation. The invariant itself is still correctly stated.
:::

:::check id=exam-19a-q2-q4
Which postcondition does `insert` establish?

- [ ] The three field writes are one atomic update
- [ ] An equal key is stored under both children
- [x] The value is in the tree, the tree is still sorted, and a value that was already present is still present once

- **After `insert(v)`**, `v` is in the tree, and the tree is still sorted.
- **If `v` was already present**, it still appears exactly once, because duplicates are never added.
:::
:::

:::problem id=exam-24a-q2 title="The contract for a set" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
`Set<T>` has `contains` and `add`. `SetImpl` is a linked list with a `volatile` head. `add` walks the list and returns if `equals` matches an element. Otherwise it links a new node at the end.

:::check id=exam-24a-q2-q1
The precondition of `add` is {{=obj != null|head == null|already present}}.

The implementation calls `equals` on the elements. Calling a method on null throws an exception, so unless the contract handles null, the caller must not pass it.
:::

:::check id=exam-24a-q2-q2
Which of these belong to the invariant?

- [x] No two nodes are `equals`
- [ ] `add` of an element that is already present appends another node
- [x] `contains(x)` is true exactly when some node reachable from `head` holds an element equal to `x`
- [x] The list has no cycle

- **No duplicates:** `add` returns early when an equal element exists, so no two nodes are ever `equals`, and adding an existing element leaves the number of nodes unchanged.
- **`contains` agrees with the list:** it is true exactly for the elements stored in the list.
- **No cycle:** otherwise walking the list would never end.
:::

:::check id=exam-24a-q2-q3
Which postcondition does `add` establish?

- [ ] The number of nodes always grows by one
- [ ] The contract requires `add` to be safe for two threads at once
- [x] `contains(obj)` holds, every previous member is still present, and the node count grows only when `obj` was not already a member

After `add(obj)`, `contains(obj)` is true. Every `y` that was a member before the call is still a member, and the list grows by one node only if `obj` was new.
:::

:::check id=exam-24a-q2-q4
What is true of the published `add` when two threads run it?

- [ ] The contract says `add` is synchronized
- [x] The contract says nothing about threads. Two threads can both link a node, or both assign `head`, and an element is lost
- [ ] `volatile` head makes the `equals` walk and the link atomic

- **The contract is silent about threads**, so the published `add` meets its postcondition only when one thread runs it at a time.
- **What goes wrong:** two threads can both walk to the end and link a node in the same place, so one element is lost.
- **Who must fix it:** keeping the contract under concurrency is the implementation's job, for example by synchronizing `add`. `volatile` alone is not enough.
:::
:::

A contract still applies when several threads call the object, and the implementation must keep it true.

- **The invariant under concurrency** is still a fact about the data that holds whenever no public method is running.
- **Interleaving** of threads, which you saw in [Concurrency](topic:concurrency), is what can break it.
- **How to write an invariant:** state it as a fact about the data. A sentence that only says "the method is `synchronized`" describes the implementation and leaves the actual fact unstated.
- **Next:** [Networking](topic:networking) moves from threads inside one process to communication between processes.
