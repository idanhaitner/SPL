# 02 — Types

Every value in C++ has a type. The type decides how many bytes the value occupies, which operations are legal, and what bit pattern counts as a number. The types to know first are `int`, `double`, `bool`, `char`, and later `const`.

## Built-in types

| Type | Size on this Mac | What you store |
| --- | --- | --- |
| `bool` | 1 byte | `true` or `false` |
| `char` | 1 byte | a small integer, often a character |
| `short` | 2 bytes | an integer |
| `int` | 4 bytes | an integer; the default choice |
| `long` | 8 bytes here | an integer; 4 bytes on some other systems |
| `long long` | 8 bytes | an integer that is at least 64 bits |
| `float` | 4 bytes | an approximate real number |
| `double` | 8 bytes | an approximate real; the default choice |
| `unsigned int` | 4 bytes | an integer that wraps at 0 |

`sizeof(char)` is 1 by definition. One byte. Everything else is a multiple of that. Do not memorize `long`. Ask the compiler:

```cpp
sizeof(int)     // 4 on this machine
sizeof(int*)    // 8 on this 64-bit machine: a pointer is an address
```

`sizeof` is a compile-time operator. It does not run a function.

## Integers and reals

```cpp
int courses = 6;
double grade = 87.5;
```

An integer literal is `int`: `6`, `-3`, `0`. A real literal is `double`: `87.5`, `1.0`.

Storing a `double` into an `int` drops the fraction. It does not round.

```cpp
double d = 3.9;
int n = static_cast<int>(d);   // n is 3
```

`static_cast<int>(d)` is the cast you should write. It says "I mean to convert." The older form `(int)d` does the same conversion and also several more dangerous ones, so this course's code uses `static_cast`.

`int` is signed: it can be negative. Overflow of a signed integer (a result that does not fit) is undefined behavior. Do not rely on wraparound for `int`.

`unsigned` cannot be negative. It wraps. An `unsigned char` holds 0 through 255. `255 + 1` is `0`. An image buffer is raw bytes. When you need a byte that is definitely 0..255, `unsigned char` says that. Plain `char` may be signed. `Image` still uses `char*`, and that signedness is not portable.

## Characters

```cpp
char letter = 'A';
```

Single quotes are one character. Double quotes are a string, which is a different type (lesson 6). `'A'` is a small integer. Its code is 65 in ASCII, which is what this machine uses. You can do arithmetic: `'A' + 1` is `'B'`.

The newline character is `'\n'`. The null character is `'\0'`, which is the integer 0. Lesson 6 needs `'\0'` as the marker at the end of a C string.

## bool

```cpp
bool ready = true;
```

A condition such as `year > 2000` produces a `bool`. In a numeric context `true` converts to `1` and `false` converts to `0`. The other way, `0` becomes `false` and any other number becomes `true`. That conversion is why a later trap in lesson 3 exists. Prefer real `bool` values in new code.

## Initialization

```cpp
int a = 10;    // copy-initialization
int b{10};     // brace initialization, the form to prefer
int c{};       // zero. c is 0
```

`int c{}` value-initializes `c`, which for `int` means 0. This is the form to use when you want "start at zero" and you want the compiler to reject a narrowing conversion such as `int x{3.9}`.

A local with no initializer, `int mystery;`, has an indeterminate value. Reading it is undefined behavior. The compiler will often warn. Initialize it.

## const

`const` (קבוע) is the C++ counterpart of Java's `final` for a variable.

```cpp
const int width = 1080;
width = 720;          // error: const cannot be assigned
```

You will use `const` on parameters, methods, and pointers for the rest of the course. Here it only means "this name will not be assigned again."

## auto

```cpp
auto n = 3;       // n is int, because 3 is int
auto g = 87.5;    // g is double
```

`auto` asks the compiler to deduce the type from the initializer. It is convenient later with iterators. In these first lessons, write the type yourself so you can see it.

## Exercise

`make try LESSON=02-types`

`bytes_of_char` and `chars_per_int` should use `sizeof`, so the answer matches this machine. `truncated` is the `int` you get from `3.9`. `wrapped_byte` is an `unsigned char` that started at 255 and then had 1 added. `zero` is an `int` created with `{}`.

Next: [expressions](../03-expressions/lesson.md).
