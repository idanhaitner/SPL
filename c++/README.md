# C++ for Systems Programming

This folder teaches the C++ you need for **תכנות מערכות** (Systems Programming, 202-1-2031), from a first program through the material the exams actually use: memory, pointers, classes, the rule of three, move, and inheritance.

The lectures are in Hebrew. These lessons are in English. The first time a lecture term appears, the Hebrew name is in parentheses. The rest of the course (Java, threads, sockets, the Reactor, SQL) stays on the study site: [idanhaitner.github.io/SPL](https://idanhaitner.github.io/SPL/).

You are assumed to know what a variable, a function, an `if`, and a loop are from another language (this course's students usually know Java). You are not assumed to know C++.

## How to study one lesson

1. Read `lesson.md`.
2. Run the demo and read `demo.cpp` next to the output.
3. Open `exercise.cpp`. Replace each `throw NotImplemented(...)` with your code.
4. Run the exercise until every line says `[pass]`.
5. If you are stuck after a real attempt, read `solution.cpp`.

From this directory (`c++`):

```bash
make run LESSON=01-program
make try LESSON=01-program
```

`make test` runs every finished solution. `make test-asan` does the same with the address sanitizer, which is worth running after lessons 9, 12, 13, and 15: it reports leaks and frees of the same block twice.

The `[] { ... }` inside each exercise's `main` is a lambda: a function with no name. The checker uses it. You finish an exercise by replacing the `throw` lines above `main`.

The compiler on this Mac is Apple clang. The command `c++` and the command `clang++` are that compiler. A finished program is a file the operating system can run. There is no JVM.

## The path

| Lesson | What you can do after it | Course chapter |
| --- | --- | --- |
| [01 A program](01-program/lesson.md) | Compile `main`, print, use a variable | Build pipeline, first hour |
| [02 Types](02-types/lesson.md) | Choose `int`, `double`, `bool`, `char`, and read `sizeof` | Primitives the slides use |
| [03 Expressions](03-expressions/lesson.md) | Trust integer division, precedence, and `++` | Everyday code |
| [04 Control flow](04-control-flow/lesson.md) | Write `if`, `while`, and `for` | Everyday code |
| [05 Functions](05-functions/lesson.md) | Declare, define, pass by value, overload | Build pipeline |
| [06 Arrays and text](06-arrays-and-text/lesson.md) | Use a C array, `std::string`, and `std::vector` | `Image` bytes, `std::string` |
| [07 References](07-references/lesson.md) | Pass `const T&` and change a caller's variable | Pointers lecture |
| [08 Pointers](08-pointers/lesson.md) | Take an address, dereference, walk an array | Pointers lecture |
| [09 Memory](09-memory/lesson.md) | Place a value on the stack, the heap, or in static storage | Memory model |
| [10 Building](10-build/lesson.md) | Split a header and a `.cpp`, and read a linker error | PS1 |
| [11 Classes](11-classes/lesson.md) | Write a constructor, an initializer list, and a `const` method | Classes and objects |
| [12 Rule of three](12-rule-of-three/lesson.md) | Deep-copy a class that owns a `new[]` buffer | Rule of three |
| [13 Rule of five](13-rule-of-five/lesson.md) | Move, `unique_ptr`, `shared_ptr`, rule of zero | Rule of five |
| [14 Inheritance](14-inheritance/lesson.md) | Call a `virtual` function and avoid slicing | Inheritance |
| [15 Capstone](15-capstone/lesson.md) | Write a stack both ways: raw pointer, and `vector` | Ownership, end to end |

Lessons 1–6 are the language. Lessons 7–10 are how a running program holds values. Lessons 11–15 are the part the C++ exam questions are about.

## Words the lectures use

| English | Hebrew | In code |
| --- | --- | --- |
| stack | מחסנית | local variables, call frames |
| heap | ערימה | `new` / `delete` |
| pointer | מצביע | `int* p` |
| reference | רפרנס | `int& r` |
| constructor | בנאי | `Image(...)` |
| destructor | הורס, דיסטרקטור | `~Image()` |
| copy constructor | בנאי העתקה | `Image(const Image&)` |
| assignment operator | אופרטור השמה | `operator=` |
| shallow copy | העתקה רדודה | copy the pointer only |
| deep copy | העתקה עמוקה | allocate and copy the bytes |
| move | העברה | `Image(Image&&)` |
| inheritance | ירושה | `class Dog : public Animal` |
| virtual function | פונקציה וירטואלית | `virtual` |
| preprocessor | קדם-מעבד | `#include` |
| compiler | מהדר | `c++ -c` |
| linker | מקשר | combines `.o` files into a program |
| header | קובץ כותרת | `.hpp` |

## What "undefined behavior" means

Some mistakes have no defined result. The program may crash, print a wrong number, or look fine until a later lab. Reading an uninitialized local, deleting the same block twice, using a pointer after `delete`, and walking off the end of an array are in this set. When a lesson says **undefined behavior**, treat it as forbidden, and do not "try it to see what happens."
