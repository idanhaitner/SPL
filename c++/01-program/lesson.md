# 01 — A program

A C++ program is a text file the compiler translates into a program the operating system can run. This course's later chapters draw that program's memory. This lesson is only the file, the compiler, and `main`.

## The smallest program

```cpp
#include <iostream>

int main() {
    std::cout << "Hello\n";
    return 0;
}
```

`main` is where execution starts. It returns `int`. `0` means the program finished successfully. A non-zero value means it failed. The operating system can see that value; you will not see it unless you ask the shell (`echo $?` after the program exits).

`#include <iostream>` pastes the library header that declares `std::cout`, the standard output stream. The name `cout` lives in the namespace `std`. Write `std::cout`, not `cout`, until a later lesson says otherwise.

`<<` sends a value to the stream. `"Hello\n"` is text ending in a newline. A statement ends with `;`.

Braces `{ }` form a block. Names declared inside a block die at the closing brace.

## Compile it

From the `c++` directory:

```bash
make run LESSON=01-program
```

That runs the equivalent of:

```bash
c++ -std=c++17 -Wall -Wextra -Wpedantic -o build/01-program-demo 01-program/demo.cpp
./build/01-program-demo
```

`-std=c++17` asks for the 2017 language, which is enough for every feature this course uses (`unique_ptr`, `make_unique`, move). `-Wall -Wextra -Wpedantic` turn on warnings. Read a warning. It is often a real bug.

The compiler writes an executable file. You run that file. Editing `demo.cpp` does nothing until you compile again.

## A variable

```cpp
int year = 2026;
year = year + 1;
```

The first line creates an `int` named `year` and stores `2026`. The second line reads `year`, adds 1, and stores the result back. `=` is assignment. It writes. It does not compare. Comparison is `==`, in lesson 3.

A name is declared once in a block. This is a compiler error:

```cpp
int year = 2026;
int year = 2027;
```

## Comments

```cpp
// The compiler deletes this through the end of the line.

/* It also deletes
   a block comment. */
```

Comments are for a person reading the file. The preprocessor removes them before the compiler translates the code.

## What the demo prints

Your run of `demo.cpp` should end with these lines:

```text
A C++ program starts in main.
year = 2026
after adding 1, year = 2027
```

## Java and C++

A Java program is compiled to bytecode and started by the JVM, which looks for `public static void main`. A C++ program is compiled to machine code and started by the operating system, which looks for `main`. Objects in Java are reclaimed by a garbage collector. In C++, lesson 9 is where you start freeing memory yourself. You do not need that yet.

## Exercise

Open `exercise.cpp`. Each function still throws `NotImplemented`. Replace the body so the function returns the value its name describes. Then:

```bash
make try LESSON=01-program
```

A `[todo]` line is still the original throw. A `[fail]` line ran and returned something else. The finished file is `solution.cpp`.

Next: [types](../02-types/lesson.md).
