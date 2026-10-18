---
id: design-by-contract
title: Design by contract
sources:
  - "Classes/Chapter 9 - Design by Contract.pptx"
  - "Exrecises/SPL_PS5.pptx"
  - "Exams/16-a.pdf"
  - "Exams/16-a-solution.pdf"
  - "Exams/18-a.pdf"
  - "Exams/18-a-solution.pdf"
  - "Exams/19-a.pdf"
  - "Exams/19-a-solution.pdf"
  - "Exams/24-a.pdf"
  - "Exams/24-a-solution.pdf"
---

A method is a deal. The caller promises a condition. The object promises that its structure still makes sense. The method promises a result. Chapter 9 names the three parts of that deal design by contract (תכנון לפי חוזה, DbC). The exams ask for the deal in words, on whatever class the question just introduced.

## The three clauses

:::definition id=def-dbc title="Preconditions, invariants, postconditions" source="Classes/Chapter 9 - Design by Contract.pptx"
A contract between a class and its caller has three kinds of clause.

A precondition (תנאי קדם) must hold at the call. If it does not, the method's behavior is not guaranteed; the lecture marks that as undefined behavior. Breaking it is the caller's bug. The condition may be stated in the vocabulary of the contract, not only in field names.

An invariant (תנאי פנימי, and on exams תכונה נשמרת or אינווריאנטה) holds whenever the object is observable by a caller: at the start and at the end of every public operation. It is the consistency of the representation. Breaking it is the implementation's bug.

A postcondition (תנאי סיום) holds after the operation returns. It describes the object's state and the result, independent of one caller's habits. Breaking it is the implementation's bug.
:::

The running example is `Image.crop`. The precondition is that `x`, `y`, `w`, and `h` fall inside the picture. The invariant is that the width and the height are positive and that the byte array's length is `width * height`. The postcondition is that the width and the height become the cropped size and that the buffer holds the cropped pixels.

![crop's contract, in the order a call meets it: precondition, invariant, postcondition](../assets/figures/contract-clauses.svg)

Defensive programming checks some of the same facts and recovers or throws. The lecture's last slide says the two styles are being compared and that they do not contradict each other. A contract can be enforced with a check. The check is not the contract. The contract is the statement of whose bug it is.

### What the tests are for

:::definition id=def-unit-test title="Unit tests against the contract" source="Classes/Chapter 9 - Design by Contract.pptx"
The contract says what should be true. A unit test checks that it is. The lecture uses asserts that run in development. Preconditions are tested with bad arguments, edge arguments, and ordinary arguments. Postconditions are tested on the result. Invariants are tested before and after the call.
:::

Session 5 turns that into rules you can actually write tests from:

- Separate commands from queries. `pop` both removes and returns; split it into `top` and `removeTop` if you want a postcondition you can observe without destroying the evidence.
- Separate basic queries from derived ones. `isEmpty` is basic. `top` is derived.
- Define the derived query using the basic ones. `top` checks `isEmpty` first.

The session's `Stack` contract, copied in spirit from the slide:

```java
/**
 * @inv isEmpty() implies size() == 0
 * @inv size() >= 0
 */
public interface Stack<T> {
    /**
     * @param obj a non-null T
     * @pre obj != null
     * @post size() == size()@pre + 1
     * @post top() equals obj
     */
    void push(T obj);

    /**
     * @pre !isEmpty()
     * @post size() == size()@pre - 1
     */
    void removeTop();
}
```

`size()@pre` means the value of `size()` at the call. That is the notation the session uses so a postcondition can talk about the change.

An invariant that is only true single-threaded is not an invariant of a concurrent object. You already saw the interleaving in [Concurrency](topic:concurrency). Write the invariant as a fact about the data, not as "the method is synchronized."

:::problem id=worked-crop-contract source="Classes/Chapter 9 - Design by Contract.pptx" kind=worked solution_origin=source
State the precondition, one invariant, and the postcondition of `Image.crop(x, y, w, h)` as the lecture frames them.

:::solution
Precondition: `x` and `y` are inside the image, and the rectangle `w` by `h` does not extend past the far edges. If the caller breaks that, `crop` owes nothing.

Invariant: width and height are positive, and the buffer length equals width times height, whenever a caller can see the image. That includes the moment `crop` is entered and the moment it returns.

Postcondition: the image width and height are the cropped dimensions, and the buffer contains the pixels of that rectangle. A caller who met the precondition and observes anything else has found an implementation bug.
:::
:::

:::check id=chk-whose-bug
`crop` is called with a negative width. Whose bug is it, in the lecture's terms?

- [ ] The implementation, because the invariant failed
- [x] The caller, because a precondition failed
- [ ] The collector, because the buffer leaked

A precondition is the caller's obligation. The method is not required to preserve anything after that call.
:::

:::trap
An invariant written as "the method is synchronized" does not constrain the data. Two threads can both be outside the method and still observe a torn structure if the lock does not cover every access. State the invariant on the fields.
:::

:::trap
A postcondition that says "the list is sorted if the caller inserted in order" smuggles a precondition into the postcondition. The session wants the postcondition to be the method's promise, given that the precondition held.
:::

## Practice

:::problem id=ps5-stack-contract source="Exrecises/SPL_PS5.pptx" kind=exercise solution_origin=source
Using the session's rules, write the invariant of `Stack`, the precondition and postcondition of `push`, and the precondition of `top`. `push` rejects null. `top` returns the last pushed element and does not remove it. `size` is never negative, and an empty stack has size 0.

:::hint
`top` is a query. Its postcondition should not say that `size` changes.
:::
:::hint
Use `size()@pre` if you need the old size in the postcondition of `push`.
:::
:::hint
The empty-stack fact is an invariant linking `isEmpty` and `size`, not a precondition of `push`.
:::
:::solution
Invariant: `size() >= 0`, and `isEmpty()` is true exactly when `size()` is 0.

`push(obj)`: precondition `obj != null`. Postcondition: `size()` is `size()@pre + 1`, and `top()` equals `obj`.

`top()`: precondition `!isEmpty()`. Postcondition: the result equals the last pushed element that has not been removed, and `size()` is unchanged.

A test for the precondition calls `push(null)` and expects the rejection. A test for the postcondition records `size()`, pushes `"a"`, and checks that `size` grew by one and `top` is `"a"`. A test for the invariant checks `size` before and after. `pop` that both returns and removes is harder to test; the session splits it into `top` and `removeTop` for that reason.
:::
:::


:::examnote
The question pastes an interface and says "define the invariant, and the pre- and postconditions of this method." The trap is an invariant that forgets the empty case, or a postcondition that is only true when nobody else mutates the object.
:::

:::problem id=exam-16a-q1 source="Exams/16-a.pdf" kind=exam solution_origin=derived
`Queue<T>` has `add(T item)` and `remove()`.

a. (8) Define an invariant for the interface, and pre- and postconditions for the methods. Add methods to the interface if you need them to state the contract.

b. (6) Complete `testAdd` and `testRemove` in `TestQueue`. `createQueue()` returns the object under test. `setUp` builds a fresh queue.

c. The question then shows the dining philosophers with a hand-rolled `Semaphore` and asks about deadlock, livelock, and starvation. That part is concurrency. Here, answer the contract.

:::hint
`remove` on an empty queue has no honest postcondition unless you forbid the call.
:::
:::hint
You need a query, `size` or `isEmpty`, or the invariant cannot be stated.
:::
:::hint
A test that only calls `add` and never looks at the queue does not check a postcondition.
:::
:::solution
Add `int size()` and `boolean isEmpty()`.

Invariant: `size() >= 0`, and `isEmpty()` if and only if `size() == 0`. The elements are in insertion order: the next `remove` yields the earliest `add` that has not been removed.

`add(item)`: precondition `item` meets whatever the queue promises about null (if null is forbidden, say so). Postcondition: `size()` is one greater, and a later sequence of `remove` still yields the old elements, followed by `item`.

`remove()`: precondition `!isEmpty()`. Postcondition: `size()` is one smaller, and the removed element was the oldest.

`testAdd` records nothing, pushes one element, and checks `size() == 1` and that the element is the one that `remove` returns. `testRemove` on an empty queue expects the precondition failure. `testRemove` after one `add` checks that `size` returns to 0 and the value matches. `setUp` must give each test a new queue so leftovers do not look like invariant failures.
:::
:::

:::problem id=exam-18a-q2 source="Exams/18-a.pdf" kind=exam solution_origin=derived
`Stack<T>` is a bounded stack. `push` may store null. `pop` removes. `size` is the current count. `capacity` is the maximum.

a. (5) Define an invariant.

Also state pre- and postconditions for `push` and `pop`. The rest of the question, about making the implementation safe, is the concurrency chapter.

:::hint
The bound is the interesting clause. `size` is not just non-negative.
:::
:::hint
`push` of null is explicitly allowed, so null is not a precondition failure.
:::
:::hint
`pop` on an empty stack is the caller's bug if you give it a precondition, or the method's bug if you promised a value anyway.
:::
:::solution
Invariant: `0 <= size() <= capacity()`, and `capacity()` does not change.

`push(data)`: precondition `size() < capacity()`. Null is allowed. Postcondition: `size()` is `size()@pre + 1`, and `pop()` yields `data`.

`pop()`: precondition `size() > 0`. Postcondition: `size()` is `size()@pre - 1`, and the result is the last pushed element still in the stack.

An implementation that increments `size` past `capacity`, or that returns from `push` without storing `data`, breaks the postcondition even if a lock was held. The lock is not the invariant.
:::
:::

:::problem id=exam-19a-q2 source="Exams/19-a.pdf" kind=exam solution_origin=derived
`SortedBinaryTree<T extends Comparable<T>>` has `getData`, `getLeft`, `getRight`, and `insert`.

a. (5) Define the invariant.

The implementation keeps `data`, `left`, and `right` in `volatile` fields, rejects null with an exception, and inserts by comparing with `data`. Later parts ask whether that implementation is thread-safe. Answer the invariant here as a fact about a quiet tree.

:::hint
Every node is a tree. The invariant has to hold for the children, not only for the root.
:::
:::hint
`compareTo` decides the side. Equals does not go in both children.
:::
:::hint
Null data is already rejected by `insert`. The invariant can say `getData() != null`.
:::
:::solution
For every node, `getData() != null`. If `getLeft()` is not null, `getData().compareTo(getLeft().getData()) > 0` and the left child satisfies the same invariant. If `getRight()` is not null, `getData().compareTo(getRight().getData()) < 0` and the right child satisfies it. Duplicates are not inserted, so no child has a data equal to its parent.

`insert`'s precondition is a non-null argument. Its postcondition is that the value is in the tree, the tree is still sorted, and a value that was already present is still present once.

`volatile` makes a single reference write visible. It does not make the three-field update of `insert` atomic, so two threads can break this invariant. That is a concurrency failure of the implementation, not a weakness in the invariant you were asked to write.
:::
:::

:::problem id=exam-24a-q2 source="Exams/24-a.pdf" kind=exam solution_origin=derived
`Set<T>` has `contains` and `add`.

a. (10) Define an invariant. Define a precondition and a postcondition for `add`. Extend the interface if you need a query to state them.

The given `SetImpl` is a linked list with a `volatile` head. `add` walks the list and returns if `equals` hits, otherwise it links a new node at the end. `contains` is not shown and is not required. The rest of the question asks you to make `add` safe. State the contract first.

:::hint
A set does not contain duplicates. The invariant is about membership, not about the list being sorted.
:::
:::hint
`add` of an element that is already present must not grow the list.
:::
:::hint
You may add `size` or you may state membership with `contains`, which is already on the interface.
:::
:::solution
Invariant: no two nodes are `equals`, and `contains(x)` is true exactly when some node from `head` holds an element equal to `x`. The list has no cycle.

`add(obj)`: precondition `obj != null` (the implementation calls `equals` on elements, and a null element makes that unsafe unless you specify it). Postcondition: `contains(obj)`, and for every `y` that was contained before the call, `contains(y)` still holds. If `contains(obj)` was already true, the node count is unchanged. Otherwise the node count is one greater.

The published `add` matches that postcondition only when one thread runs it. Two threads can both pass the `equals` check and both link, or both see `head == null` and both assign `head`, losing an element. The contract does not mention threads. The implementation has to be the thing that protects it.
:::
:::

Contracts are the sentences a concurrent method has to preserve. Next, [Networking](topic:networking) is the channel between processes.
