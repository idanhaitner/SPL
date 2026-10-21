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

Design by contract states the agreement between a method and its caller before any implementation is written. The caller must establish the precondition (תנאי קדם), and the method may assume that the precondition holds. When the method returns, it establishes the postcondition (תנאי סיום), provided the precondition held. The invariant (תנאי פנימי) holds whenever no public method of the object is running. A failure of one of these three statements names whose bug it is.

## The three clauses of the contract

:::definition id=def-dbc title="Precondition, invariant, and postcondition" source="materials/lectures/Chapter 9 - Design by Contract.pptx"

- **Precondition:** the condition the caller must establish before the call. The method may assume it. If the precondition does not hold, the method's behavior is undefined. A broken precondition is **the caller's bug**.
- **Invariant:** a condition that holds whenever no public method of the object is running. A broken invariant is **a bug in the class implementation**.
- **Postcondition:** what the method establishes about the object's state and the return value when it returns, provided the precondition held. A broken postcondition is **a bug in the method implementation**.
:::

![The contract of crop, in the order a call meets it: precondition, invariant, postcondition](../assets/figures/contract-clauses.svg)

Defensive programming checks inputs at run time and throws when an input is invalid. A contract, at the level of the design, assigns who is responsible for the validity of the data.

### Command-query separation (CQS)

Contracts are easier to state and to test when commands and queries are separate.

- **Query:** returns information and leaves the object's state unchanged.
- **Command:** changes the object's state and returns no value.

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

The notation `size()@pre` is the value of `size()` on entry to the method.

:::problem id=worked-crop-contract title="The contract for crop" source="materials/lectures/Chapter 9 - Design by Contract.pptx" kind=worked solution_origin=source
State the precondition, the invariant, and the postcondition of `crop`:

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

The caller must establish the precondition. When it does not hold, the method is not required to establish a postcondition for this call.
:::

## Practice

:::problem id=ps5-stack-contract title="The contract for Stack" source="materials/sessions/SPL_PS5.pptx" kind=exercise solution_origin=source
`Stack` has `push`, `top`, `isEmpty`, and `size`. `push` rejects null. `top` returns the last element that was pushed and does not remove it. `size` is never negative, and an empty stack has size 0.

:::check id=ps5-stack-contract-q1
The postcondition of `push` writes the old size as {{=size()@pre|size()|capacity()}}.

After `push(obj)`, `size()` is `size()@pre + 1`, and `top()` equals `obj`.
:::

:::check id=ps5-stack-contract-q2
Which of these belong to the contract?

- [x] Invariant: `size() >= 0`, and `isEmpty()` is true exactly when `size()` is 0
- [ ] Postcondition of `top`: `size()` grows by one
- [x] Precondition of `push`: `obj != null`. Precondition of `top`: `!isEmpty()`
- [x] Postcondition of `top`: the result is the last element that was pushed and has not yet been removed, and `size()` is unchanged

The postcondition of `top` leaves `size()` unchanged.
:::

:::check id=ps5-stack-contract-q3
Which test checks the precondition of `push`?

- [ ] Record `size()`, push `"a"`, and check that `size` grew by one and that `top` is `"a"`
- [x] Call `push(null)` and expect rejection
- [ ] Check `size` before and after, with no null argument

The postcondition test pushes `"a"` and checks the new size and `top`. The invariant test checks `size` before and after.
:::
:::

:::examnote
The question pastes an interface and says to define the invariant, and the precondition and the postcondition of the given method. The trap is an invariant that forgets the empty case, or a postcondition that is written so it holds only when no other code changes the object.
:::

:::problem id=exam-16a-q1 title="The contract for a queue" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
`Queue<T>` has `add(T item)` and `remove()`. `createQueue()` returns the object under test. `setUp` builds a new queue.

:::check id=exam-16a-q1-q1
The contract adds the queries {{=size|lock|thread}} and `isEmpty`.

The invariant is `size() >= 0`, and `isEmpty()` if and only if `size() == 0`.
:::

:::check id=exam-16a-q1-q2
Which of these belong to the contract?

- [x] The next `remove` yields the earliest `add` that has not yet been removed
- [ ] `remove` on an empty queue has the postcondition that `size()` becomes negative
- [x] `remove` has precondition `!isEmpty()`. Its postcondition is that `size()` is smaller by one and the removed element was the oldest
- [x] The postcondition of `add` is that `size()` is larger by one, and later `remove` calls still yield the old elements and then the new item

Elements stay in insertion order. `remove` on an empty queue is ruled out by the precondition.
:::

:::check id=exam-16a-q1-q3
What does `testAdd` check?

- [ ] It records `size` before the call and expects that size to stay the same
- [ ] It calls `add` and never inspects the queue
- [x] It adds one element, then checks `size() == 1` and that `remove` returns that element

`testAdd` records nothing beforehand. It adds one element and then checks the size and the removed value.
:::

:::check id=exam-16a-q1-q4
Which of these match the tests?

- [ ] `setUp` may leave the previous test's elements in the queue
- [x] `testRemove` on an empty queue expects the precondition to fail
- [x] `testRemove` after one `add` checks that `size` returns to 0 and that the value matches
- [x] `setUp` gives every test a fresh queue, so leftovers do not look like failures of the invariant

An empty `testRemove` is a precondition failure. After one `add`, removal returns the size to 0.
:::
:::

:::problem id=exam-18a-q2 title="A bounded stack" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
`Stack<T>` is bounded. `push` may store null. `pop` removes an element. `size` is the current number of elements. `capacity` is the maximum.

:::check id=exam-18a-q2-q1
The precondition of `push` is {{=size() < capacity()|data != null|size() == 0}}.

Null is allowed. The postcondition is that `size()` is `size()@pre + 1`, and `pop()` yields `data`.
:::

:::check id=exam-18a-q2-q2
Which of these belong to the contract?

- [x] Invariant: `0 <= size() <= capacity()`, and `capacity()` does not change
- [ ] `push` of null violates the precondition
- [x] `pop` has precondition `size() > 0`
- [x] The postcondition of `pop` is that `size()` is `size()@pre - 1`, and the result is the last element that was pushed and is still on the stack

The bound is `size` against `capacity`. Null is explicitly allowed.
:::

:::check id=exam-18a-q2-q3
Which implementation breaks the postcondition even when a lock was held?

- [x] `size` grows past `capacity`, or `push` returns without storing `data`
- [ ] `capacity()` stays constant across calls
- [ ] `pop` returns the last element that is still on the stack

The invariant is still the bound on `size` and `capacity`. A held lock is a separate fact about the implementation.
:::
:::

:::problem id=exam-19a-q2 title="The invariant of a tree" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
`SortedBinaryTree<T extends Comparable<T>>` has `getData`, `getLeft`, `getRight`, and `insert`. The implementation stores `data`, `left`, and `right` in `volatile` fields. The invariant is a fact about a quiet tree.

:::check id=exam-19a-q2-q1
Which claims belong to the invariant?

- [x] For every node, `getData() != null`
- [ ] A child may hold a datum equal to its parent
- [x] If `getLeft()` is not null, `getData().compareTo(getLeft().getData()) > 0`, and the left child satisfies the same invariant
- [x] If `getRight()` is not null, `getData().compareTo(getRight().getData()) < 0`, and the right child satisfies the same invariant

Duplicates are not inserted, so no child holds a datum equal to its parent. The same invariant holds for every child.
:::

:::check id=exam-19a-q2-q2
The precondition of `insert` is a {{=non-null|duplicate|volatile}} argument.

The precondition of `insert` is a non-null argument.
:::

:::check id=exam-19a-q2-q3
What does `volatile` guarantee for this tree?

- [ ] The three field updates inside `insert` are atomic
- [x] A write of a single reference is visible to other threads
- [ ] Two threads can no longer break the invariant

`volatile` does not make the three field updates inside `insert` atomic, so two threads can break the invariant. That is a concurrency failure of the implementation. The invariant remains the right fact about a quiet tree.
:::

:::check id=exam-19a-q2-q4
Which postcondition does `insert` establish?

- [ ] The three field writes are one atomic update
- [ ] An equal key is stored under both children
- [x] The value is in the tree, the tree is still sorted, and a value that was already present is still present once

A value that was already present stays present once. The tree remains sorted.
:::
:::

:::problem id=exam-24a-q2 title="The contract for a set" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
`Set<T>` has `contains` and `add`. `SetImpl` is a linked list with a `volatile` head. `add` walks the list and returns if `equals` matches an element. Otherwise it links a new node at the end.

:::check id=exam-24a-q2-q1
The precondition of `add` is {{=obj != null|head == null|already present}}.

The implementation calls `equals` on elements. A null element makes that call unsafe unless the contract names null.
:::

:::check id=exam-24a-q2-q2
Which of these belong to the invariant?

- [x] No two nodes are `equals`
- [ ] `add` of an element that is already present appends another node
- [x] `contains(x)` is true exactly when some node reachable from `head` holds an element equal to `x`
- [x] The list has no cycle

If `contains(obj)` was already true, the number of nodes is unchanged.
:::

:::check id=exam-24a-q2-q3
Which postcondition does `add` establish?

- [ ] The number of nodes always grows by one
- [ ] The contract requires `add` to be safe for two threads at once
- [x] `contains(obj)` holds, every previous member is still present, and the node count grows only when `obj` was not already a member

For every `y` that was a member before the call, `contains(y)` still holds.
:::

:::check id=exam-24a-q2-q4
What is true of the published `add` when two threads run it?

- [ ] The contract says `add` is synchronized
- [x] The contract says nothing about threads. Two threads can both link a node, or both assign `head`, and an element is lost
- [ ] `volatile` head makes the `equals` walk and the link atomic

The published `add` meets the postcondition only when one thread runs it. The implementation is what has to protect the contract.
:::
:::

A contract is the set of statements a concurrent method must still establish. [Networking](topic:networking) is the channel between processes, taken up later.

Under concurrency, the invariant is a fact about the data that holds whenever no public method of the object is running. You have already seen interleaving in [Concurrency](topic:concurrency). Write the invariant as that fact about the data. A sentence that only says the method is `synchronized` leaves the fact unstated.
