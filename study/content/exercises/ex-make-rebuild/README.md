---
title: Decide whether make rebuilds a target
chapter: run-time-environment
order: 2
---

`make` runs a recipe only when the target is missing or one of its dependencies is newer than it. Here you write that same decision as a function.

Every file gets a time, the moment it last changed, written as a number. A bigger number means later. A target that does not exist yet has the time 0.

Write `needsRebuild(targetTime, firstDependency, secondDependency)`. All three parameters are times. Return `1` if `make` must run the recipe, and `0` if the target is up to date.

This needs one piece of C++ you have not met yet, the `if` statement. Here is one that has nothing to do with `make`:

```cpp
int isTooHot(int degrees) {
    if (degrees > 30) {
        return 1;
    }
    return 0;
}
```

The lines inside the braces run only when the condition holds, and `>` means "greater than". A `return` ends the function straight away, so when `degrees` is 31, the `return 0;` never runs.

The `return 0;` in the starter is only there so the code compiles. You may keep it if it fits your answer.

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

You are done when Submit shows every test passing.
