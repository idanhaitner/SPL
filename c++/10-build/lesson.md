# 10 — Building a program

Until now, one `.cpp` file was the whole program. A real lab is several files, and the four-stage build (בניית תוכנית) is how they become one executable. PS1 and the classes lecture both start here.

## Declaration and definition

A declaration introduces a name. A definition creates the thing.

```cpp
int add(int a, int b);          // declaration: no body

int add(int a, int b) {         // definition: there must be exactly one
    return a + b;
}
```

The One Definition Rule (ODR): one definition of a function in the whole program. Declarations may be repeated.

`main` must see a declaration of `add` before it calls `add`. The definition can sit later in the same file, or in another file entirely.

## A header

A header (קובץ כותרת) holds declarations that more than one `.cpp` file needs. `#include "mathx.hpp"` means "paste this file here."

```cpp
#ifndef MATHX_HPP
#define MATHX_HPP

int add(int a, int b);

#endif
```

Those three lines are an include guard (שומר הכללה). The first time the header is pasted into a file, `MATHX_HPP` gets defined and the declaration is kept. A second paste in the same file sees the macro and skips the body. Without the guard, two inclusions produce two declarations of a class, and the compiler rejects the file. Function declarations may repeat, so a guard is still the habit, because headers also contain classes, and a class may be defined once per file.

`#include <iostream>` searches the standard library. `#include "mathx.hpp"` searches next to the file that wrote the include.

This course writes guards. `#pragma once` is a common alternative. Use the guards, so the code matches the slides.

## The four stages

The lecture names four stages. `c++` hides the middle two unless you ask.

1. **Preprocessor** (קדם-מעבד). Handles `#include`, `#define`, `#ifndef`. Removes comments. Produces one expanded source.
2. **Compiler** (מהדר). Translates that source to assembly.
3. **Assembler**. Translates assembly to an object file, `mathx.o`. Machine code, plus a list of symbols it defines and symbols it still needs.
4. **Linker** (מקשר). Combines object files and libraries, fills in those missing symbols, and writes one executable.

```bash
c++ -std=c++17 -c 10-build/split/mathx.cpp -o build/mathx.o
c++ -std=c++17 -c 10-build/split/main.cpp -o build/main.o
c++ -std=c++17 -o build/10-build-split build/main.o build/mathx.o
```

`-c` stops after the object file. It does not look for `main`. The third command is the link.

The failure the session asks you to explain:

```bash
c++ -std=c++17 -c 10-build/split/mathx.cpp -o build/mathx.o
c++ -std=c++17 -o build/app build/mathx.o
```

The first command succeeds. `mathx.cpp` has no `main`, and `-c` does not want one. The second command fails in the **linker**, with a message like `undefined symbol: _main`. The compiler already finished. A missing `main` is a link error. A missing semicolon is a compile error. Read which one you got.

Java compiles to bytecode and links class names when the program runs. C++ links before the program starts.

`make run LESSON=10-build` builds the single-file demo. The split program is built with everything else:

```bash
make demos
./build/10-build-split
```

It prints `5`.

## A Makefile

`make` reads a `Makefile` and rebuilds what is older than the files it depends on. The first target is the default. A command line under a target starts with a tab, not spaces.

```makefile
build/app: build/main.o build/mathx.o
	c++ -std=c++17 -o build/app build/main.o build/mathx.o
```

The `Makefile` in this directory is the one the lessons use. It is worth reading after this lesson. The first time you see `undefined reference` or `undefined symbol`, you are in the linker, and some `.cpp` that defines the function was left out of the command.

## std:: is a namespace

`cout` lives in namespace `std`, so its full name is `std::cout`. A namespace keeps names from colliding. You can write `using std::cout;` inside a `.cpp` function or file. Do not write `using namespace std;` in a header. The paste would dump every standard name into every file that includes it.

## Exercise

`make try LESSON=10-build`

`stage_of_missing_main` returns the word `linker`. `file_written_by_dash_c` returns the word `object`. `declared_later` is defined below the function that calls it, the same shape as a header declaration plus a `.cpp` definition. Return the argument plus one.

Next: [classes](../11-classes/lesson.md).
