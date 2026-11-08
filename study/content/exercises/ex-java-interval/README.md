---
title: An interval that keeps its invariant
chapter: design-by-contract
order: 2
lang: java
---

Finish the class `Interval`, the numbers from `low` up to `high`. Its **invariant** is `low <= high`: no `Interval` may ever exist with its ends the wrong way round.

**Requirements**

- `Interval(int low, int high)`: reject `low > high` with an `IllegalArgumentException`, before the fields are set. Otherwise store both.
- `int length()`: return `high - low`.
- `boolean contains(int x)`: true when `low <= x <= high`.
- `Interval intersect(Interval other)`: return a new `Interval` holding the numbers that are in both. The precondition is that they overlap, so reject two disjoint intervals with an `IllegalArgumentException`.

**Background**

- An invariant must be true after every constructor and every public method. The easiest way to guarantee it is to refuse to build an object that would break it.
- The overlap of two intervals starts at the larger `low` and ends at the smaller `high`. If that start is past that end, they do not overlap.

:::example
**Input:** `new Interval(1, 10).intersect(new Interval(6, 20))`

**Result:** an interval from 6 to 10
:::

:::hint
The constructor is the only place that can break the invariant, so guard it. `new Interval(5, 1)` must throw.
:::

:::hint
`Math.max` and `Math.min` give the two ends of the overlap. Compare them before you build the new `Interval`.
:::

:::case name="constructor rejects reversed ends"
`new Interval(5, 1)` has `low > high`. The constructor should throw an `IllegalArgumentException` instead of storing the fields.
:::

:::case name="intersect of disjoint intervals"
`[1, 2]` and `[5, 6]` share no number. The overlap's start (5) is past its end (2), so `intersect` should throw.
:::
