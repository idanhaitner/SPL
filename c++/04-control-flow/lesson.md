# 04 — Control flow

A function runs from top to bottom until a branch or a loop sends it somewhere else. The forms below are the ones you will write in this course.

## if

```cpp
if (n < 0) {
    return -1;
} else if (n == 0) {
    return 0;
} else {
    return 1;
}
```

The parentheses around the condition are required. The braces are optional when the body is a single statement, and you should still write them. A later edit that adds a second line will otherwise attach to the wrong `if`.

An `if` condition is converted to `bool`. Prefer a comparison or a real `bool`.

## while and for

```cpp
int sum = 0;
int i = 1;
while (i <= n) {
    sum += i;
    ++i;
}
```

`+=` means `sum = sum + i`.

```cpp
int sum = 0;
for (int i = 1; i <= n; ++i) {
    sum += i;
}
```

The `for` header is init, test, update. `i` exists only inside the loop. After the closing brace, the name `i` is gone. That is the scope you want for a loop index.

The test is checked before the body. If `n` is 0, the body of `for (int i = 1; i <= n; ++i)` never runs, and the sum stays 0.

`do { ... } while (cond);` runs the body once before the test. This course rarely needs it. A `while` or a `for` is the default.

## break and continue

`break` leaves the innermost loop (or `switch`) immediately. `continue` skips the rest of this iteration and goes to the next test.

```cpp
for (int i = 0; i < n; ++i) {
    if (a[i] < 0) {
        continue;          // skip negatives
    }
    if (a[i] == 0) {
        break;             // stop at the first zero
    }
}
```

## switch

```cpp
switch (op) {
case '+':
    result = a + b;
    break;
case '-':
    result = a - b;
    break;
default:
    result = 0;
    break;
}
```

Without `break`, execution falls into the next `case`. That is legal and almost always a bug when you did not mean it. Put a `break` (or a `return`) at the end of each arm.

`switch` compares with `==` against a constant integer or enumeration. It does not compare strings.

## A trace

`sum_to(3)` with the `for` above:

| `i` before the body | `sum` after the body |
| --- | --- |
| 1 | 1 |
| 2 | 3 |
| 3 | 6 |
| 4 | the test `4 <= 3` fails, loop ends |

## Exercise

`make try LESSON=04-control-flow`

`sign` returns `-1`, `0`, or `1`. `sum_to(n)` is `1 + 2 + ... + n`, and `sum_to(0)` is `0`. `count_evens(1, 10)` counts 2, 4, 6, 8, 10. `factorial(0)` is `1`. Use a loop for the factorial, not a library call.

Next: [functions](../05-functions/lesson.md).
