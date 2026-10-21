# 03 — Expressions

An expression computes a value. `2 + 3 * 4` is an expression. Its value is 14, because `*` happens before `+`. A statement does something with a value, and it ends with `;`.

## Arithmetic

`+`, `-`, `*`, `/`, and `%` work on integers and, except for `%`, on `double`.

When both operands of `/` are integers, the result is an integer. The fraction is discarded toward zero.

```cpp
7 / 2      // 3
-7 / 2     // -3
7.0 / 2    // 3.5, because 7.0 is double and 2 is converted to double
```

`%` is the remainder. `7 % 2` is `1`. The sign of the remainder follows the sign of the dividend (the left operand). You will mostly use it with positive numbers: "is this even?" is `n % 2 == 0`.

## Precedence

| Earlier | Operators |
| --- | --- |
| first | `++` `--` (the postfix forms), function calls |
| then | unary `+` `-` `!`, prefix `++` `--` |
| then | `*` `/` `%` |
| then | `+` `-` |
| then | `<` `<=` `>` `>=` |
| then | `==` `!=` |
| then | `&&` |
| then | `\|\|` |
| last | `=` |

`2 + 3 * 4` is `2 + (3 * 4)`. When you are unsure, add parentheses. They cost nothing.

## Comparison and logic

```cpp
x == y     // equal
x != y     // not equal
x < y
lo <= x && x <= hi     // true when x is inside [lo, hi]
a || b                 // true when at least one side is true
!ready                 // the opposite bool
```

`&&` and `||` stop early. In `p != nullptr && *p > 0`, the right side runs only when `p` is not null. Lesson 8 depends on that.

`=` writes. `==` compares. `if (x = 0)` assigns 0 to `x` and then tests that value, which is false. The compiler warns about this when the warning flags from the Makefile are on. Write `==` in a condition.

## Chained comparison

```cpp
1 < 100 < 0
```

This is `(1 < 100) < 0`. `1 < 100` is `true`, which converts to `1`. `1 < 0` is `false`. The whole expression is false, for a reason that has nothing to do with whether 100 sits between 1 and 0. The compiler on this Mac rejects the chained spelling, so the demo and the exercise write the two steps separately.

A range test is two comparisons joined by `&&`:

```cpp
1 < x && x < 100
```

## Increment

```cpp
int x = 5;
int a = ++x;    // x becomes 6, then a is 6. Prefix: increment, then read.
int y = 5;
int b = y++;    // b is 5, then y becomes 6. Postfix: read, then increment.
```

Prefer `++i` in a `for` loop. The value of the expression is usually thrown away, and prefix says "change it" without an extra copy of the old value. For `int` the copy is irrelevant. For a class later, it can matter.

## Assignment is an expression

`x = 3` writes 3 into `x` and also has the value 3. That is why `a = b = 0` sets both to 0: `=` associates to the right, so this is `a = (b = 0)`. Lesson 12 uses the same fact for `operator=`, which returns the left object so that `a = b = c` can compile.

## Exercise

`make try LESSON=03-expressions`

`value_of_chained_compare` returns the value of that parse: compare `1 < 100`, then compare the result with `0`. Do not rewrite it as a range test. `in_range` is the range test.

Next: [control flow](../04-control-flow/lesson.md).
