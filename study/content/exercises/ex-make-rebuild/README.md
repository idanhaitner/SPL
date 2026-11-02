---
title: Decide whether make rebuilds a target
chapter: run-time-environment
order: 2
---

Write the decision `make` takes for one target: must its recipe run?

**What to write**

- `int needsRebuild(int targetTime, int firstDependency, int secondDependency)`: return `1` if the recipe must run, and `0` if the target is up to date.

**Rules**

- All three numbers are times, the moment a file last changed. A bigger number is later.
- A target that does not exist yet has the time 0.
- The recipe runs when the target is missing, or when either dependency is newer than the target.
- The starter's `return 0;` is only there so the code compiles. Keep it if it fits your answer.

**Good to know**

The `if` statement runs its braces only when the condition holds. `>` means "greater than":

```cpp
int isTooHot(int degrees) {
    if (degrees > 30) {
        return 1;
    }
    return 0;
}
```

A `return` ends the function straight away, so when `degrees` is 31, the `return 0;` never runs.

:::example
**Input:** `needsRebuild(50, 30, 70)`

**Result:** `1`, because the second dependency changed after the target was built
:::

:::example
**Input:** `needsRebuild(50, 30, 40)`

**Result:** `0`, because both dependencies are older than the target
:::

:::hint
Ask the question once for each dependency: is this one newer than the target? One `if` for each is fine.
:::

:::hint
A missing target has the time 0, and every real file has a time above 0. Try a missing target on paper. Does it need a check of its own?
:::

:::case name="same time is not newer"
The rule says "newer". A dependency with exactly the same time as the target is not newer, so look at which comparison you used.
:::
