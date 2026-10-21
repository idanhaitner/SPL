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
`crop` is called with a negative width. Whose bug is that, in the terms of the lecture?

- [ ] The implementation, because the invariant failed
- [x] The caller, because a precondition failed
- [ ] The garbage collector, because the buffer leaked

The caller must establish the precondition. When it does not hold, the method is not required to establish a postcondition for this call.
:::

## Practice

:::problem id=ps5-stack-contract title="The contract for Stack" source="materials/sessions/SPL_PS5.pptx" kind=exercise solution_origin=source
Write the invariant of `Stack`, the precondition and the postcondition of `push`, and the precondition of `top`. `push` rejects null. `top` returns the last element that was pushed and does not remove it. `size` is never negative, and an empty `Stack` has size 0.

:::hint
`top` is a query. Its postcondition does not say that `size` changes.
:::
:::hint
Use `size()@pre` when the postcondition of `push` needs the old size.
:::
:::hint
The fact about an empty `Stack` is an invariant that relates `isEmpty` and `size`. `push` is legal on an empty stack.
:::
:::solution
Invariant: `size() >= 0`, and `isEmpty()` is true exactly when `size()` is 0.

`push(obj)`: precondition `obj != null`. Postcondition: `size()` is `size()@pre + 1`, and `top()` equals `obj`.

`top()`: precondition `!isEmpty()`. Postcondition: the result equals the last element that was pushed and has not yet been removed, and `size()` is unchanged.

A test of the precondition calls `push(null)` and expects rejection. A test of the postcondition records `size()`, pushes `"a"`, and checks that `size` grew by one and that `top` is `"a"`. A test of the invariant checks `size` before and after. A `pop` that both returns a value and removes it is harder to test. The exercise splits that operation into `top` and `removeTop` for this reason.
:::
:::

:::examnote
The question pastes an interface and says to define the invariant, and the precondition and the postcondition of the given method. The trap is an invariant that forgets the empty case, or a postcondition that is written so it holds only when no other code changes the object.
:::

:::problem id=exam-16a-q1 title="The contract for a queue" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
`Queue<T>` has `add(T item)` and `remove()`.

a. Define an invariant for the interface, and a precondition and a postcondition for the methods. Add methods to the interface if you need them in order to state the contract.

b. Complete `testAdd` and `testRemove` in `TestQueue`. `createQueue()` returns the object under test. `setUp` builds a new queue.

c. The question later shows the dining philosophers with a hand-written `Semaphore`, and asks about deadlock, livelock, and starvation. That part belongs to concurrency. Here, answer the contract.

:::hint
`remove` on an empty queue has no immediate postcondition, unless the contract forbids the call.
:::
:::hint
The contract needs a query, `size` or `isEmpty`. Without one, the invariant cannot be stated.
:::
:::hint
A test that only calls `add` and never inspects the queue does not test a postcondition.
:::
:::solution
Add `int size()` and `boolean isEmpty()`.

Invariant: `size() >= 0`, and `isEmpty()` if and only if `size() == 0`. Elements stay in insertion order: the next `remove` yields the earliest `add` that has not yet been removed.

`add(item)`: a precondition that `item` meets whatever the queue promises about null (if null is forbidden, say so). Postcondition: `size()` is larger by one, and a later sequence of `remove` calls still yields the old elements and then `item`.

`remove()`: precondition `!isEmpty()`. Postcondition: `size()` is smaller by one, and the removed element was the oldest.

`testAdd` records nothing beforehand. It adds one element, then checks `size() == 1` and that the element is the one `remove` returns. `testRemove` on an empty queue expects the precondition to fail. `testRemove` after one `add` checks that `size` returns to 0 and that the value matches. `setUp` must give every test a fresh queue, so leftovers do not look like failures of the invariant.
:::
:::

:::problem id=exam-18a-q2 title="A bounded stack" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
`Stack<T>` is bounded. `push` may store null. `pop` removes. `size` is the current number of elements. `capacity` is the maximum.

a. Define an invariant.

Also state a precondition and a postcondition for `push` and for `pop`. The rest of the question, about making the implementation safe, belongs to the concurrency chapter.

:::hint
The bound is the clause that matters. `size` is more than a non-negative count.
:::
:::hint
`push` of null is explicitly allowed, so null is not a precondition failure.
:::
:::hint
`pop` on an empty `Stack` is the caller's bug if the contract gives it a precondition, and the method's bug if the contract promises a value in every case.
:::
:::solution
Invariant: `0 <= size() <= capacity()`, and `capacity()` does not change.

`push(data)`: precondition `size() < capacity()`. Null is allowed. Postcondition: `size()` is `size()@pre + 1`, and `pop()` yields `data`.

`pop()`: precondition `size() > 0`. Postcondition: `size()` is `size()@pre - 1`, and the result is the last element that was pushed and is still on the `Stack`.

An implementation that lets `size` grow past `capacity`, or that returns from `push` without storing `data`, breaks the postcondition even if a lock was held. The invariant is still the bound on `size` and `capacity`. A held lock is a separate fact about the implementation.
:::
:::

:::problem id=exam-19a-q2 title="The invariant of a tree" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
`SortedBinaryTree<T extends Comparable<T>>` has `getData`, `getLeft`, `getRight`, and `insert`.

a. Define the invariant.

The implementation stores `data`, `left`, and `right` in `volatile` fields, rejects null by throwing, and inserts by comparing with `data`. Later parts ask whether this implementation is safe for threads. Here, answer the invariant as a fact about a quiet tree.

:::hint
Every node is a tree. The invariant must hold for the children, as well as for the root.
:::
:::hint
`compareTo` decides the side. An equal key is not inserted under both children.
:::
:::hint
Null data is already rejected by `insert`. The invariant can say `getData() != null`.
:::
:::solution
For every node, `getData() != null`. If `getLeft()` is not null, then `getData().compareTo(getLeft().getData()) > 0` and the left child satisfies the same invariant. If `getRight()` is not null, then `getData().compareTo(getRight().getData()) < 0` and the right child satisfies it. Duplicates are not inserted, so no child holds a datum equal to its parent.

The precondition of `insert` is a non-null argument. The postcondition is that the value is in the tree, the tree is still sorted, and a value that was already present is still present once.

`volatile` makes a write of a single reference visible to other threads. It does not make the three field updates inside `insert` atomic, so two threads can break this invariant. That is a concurrency failure of the implementation. The invariant you were asked to write remains the right fact about a quiet tree.
:::
:::

:::problem id=exam-24a-q2 title="The contract for a set" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
`Set<T>` has `contains` and `add`.

a. Define an invariant. Define a precondition and a postcondition for `add`. Extend the interface if you need a query in order to state them.

The given `SetImpl` is a linked list with a `volatile` head. `add` walks the list and returns if `equals` matches an element. Otherwise it links a new node at the end. The body of `contains` is not shown, and you are not asked to write it. The rest of the question asks you to make `add` safe. State the contract first.

:::hint
A set contains no duplicates. The invariant states membership. Sorting the list is outside this contract.
:::
:::hint
`add` of an element that is already present does not grow the list.
:::
:::hint
You may add `size`, or state membership with `contains`, which is already on the interface.
:::
:::solution
Invariant: no two nodes are `equals`, and `contains(x)` is true exactly when some node reachable from `head` holds an element equal to `x`. The list has no cycle.

`add(obj)`: precondition `obj != null` (the implementation calls `equals` on elements, and a null element makes that call unsafe unless the contract names null). Postcondition: `contains(obj)`, and for every `y` that was a member before the call, `contains(y)` still holds. If `contains(obj)` was already true, the number of nodes is unchanged. Otherwise the number of nodes is larger by one.

The published `add` meets this postcondition only when one thread runs it. Two threads can both pass the `equals` check and both link a node, or both see `head == null` and both assign `head`, and an element is lost. The contract says nothing about threads. The implementation is what has to protect the contract.
:::
:::

A contract is the set of statements a concurrent method must still establish. [Networking](topic:networking) is the channel between processes, taken up later.

Under concurrency, the invariant is a fact about the data that holds whenever no public method of the object is running. You have already seen interleaving in [Concurrency](topic:concurrency). Write the invariant as that fact about the data. A sentence that only says the method is `synchronized` leaves the fact unstated.
