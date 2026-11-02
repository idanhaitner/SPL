---
title: Call a function before its body
chapter: run-time-environment
order: 1
---

Fill in the bodies of `minutesToSeconds` and `totalSeconds`.

**Requirements**

- `int minutesToSeconds(int minutes)`: return the number of seconds in `minutes` minutes. One minute is 60 seconds.
- `int totalSeconds(int minutes, int seconds)`: return the whole time in seconds. It must call `minutesToSeconds`.

**Constraints**

- Keep the declaration on the first line, and the first line of each function, as they are.
- Replace each `return 0;`. They are only there so the code compiles.

**Background**

- A declaration gives a function's name, return type, and parameter types, and ends with `;`. A definition also gives the body, in braces.
- The declaration on the first line is what lets `totalSeconds` call `minutesToSeconds`, even though its body comes later in the file.

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
