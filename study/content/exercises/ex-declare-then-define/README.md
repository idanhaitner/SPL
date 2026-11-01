---
title: Call a function before its body
chapter: run-time-environment
order: 1
---

The compiler can check a call to a function as long as it knows the function's name and signature, which are its return type and the types of its parameters. A declaration gives exactly that, and it ends in a semicolon. A definition also gives the body, in braces.

In the starter, `minutesToSeconds` is declared on the first line and defined at the bottom. Because of that first line, `totalSeconds` can call it, even though its body comes later in the file.

Write the two bodies. Keep the declaration and every first line as they are.

- `minutesToSeconds(minutes)` returns how many seconds are in that many minutes. One minute is 60 seconds.
- `totalSeconds(minutes, seconds)` returns the whole time in seconds. It must call `minutesToSeconds` to do part of the work.

Each `return 0;` in the starter is only there so the code compiles. Replace them.

:::example
**Input:** `minutesToSeconds(2)`

**Result:** `120`
:::

:::example
**Input:** `totalSeconds(2, 5)`

**Result:** `125`, which is 120 seconds from the minutes plus 5 more
:::

:::hint
Start with `minutesToSeconds`. What do you do to the number 3 to get 180?
:::

:::hint
A call to a function gives you a value, so it can sit inside a sum like any number.
:::

:::hint
If the build says a function is redefined, the file has two bodies for it. The One Definition Rule allows only one. Fill in the body you were given instead of adding another.
:::

:::case name="total adds the minutes"
Look at what `totalSeconds` does with `minutes`. It has to become seconds before it can be added to `seconds`.
:::

You are done when Submit shows every test passing.
