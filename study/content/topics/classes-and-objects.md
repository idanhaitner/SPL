---
id: classes-and-objects
title: Classes and objects
sources:
  - "materials/lectures/Chapter 3 - Classes and Objects.pptx"
  - "materials/sessions/SPL_PS1 (1).pptx"
  - "materials/sessions/SPL_PS3.pptx"
---

This chapter follows a C++ program from its source files all the way to a running object.

- **Building:** how a program split across several files is compiled one file at a time and then linked into one executable.
- **Classes:** what an object looks like in memory, and how its members get their first values.
- **Using objects:** how you reach an object's members, and how a member function finds its object through `this`.

## Building a program

A real C++ program is split across many `.cpp` files, and each file is compiled on its own. So a file often calls a function whose body lives in a different file. The compiler can still check that call, as long as it knows the function's name and signature.

- **A declaration** introduces a function's name and its signature, so other code can call it.
- **A definition** is a declaration that also supplies the function's body.
- **The One Definition Rule (ODR)** allows a function to be declared many times, but defined exactly once in the whole program.

The declarations that several files need are written once, in a header, and each file that needs them includes it.

- **Header files** (`.h` or `.hpp`) collect the declarations that several `.cpp` files share. A declaration of a type or function that comes before its definition is called a forward declaration.
- **`#include`** literally pastes the header's text into the source file at that point.
- **Include guards** stop the same header from being pasted twice into one file, which also protects against two headers that include each other.

```cpp
#ifndef POINT_H
#define POINT_H
// declarations
#endif

```

### From source files to an executable

Turning those files into a program takes four stages, which always run in this order.

:::definition id=def-build title="The four stages of the build" source="materials/sessions/SPL_PS1 (1).pptx"

1. **Preprocessor:** handles the `#` directives (`#include`, `#define`, `#ifndef`), strips comments, and writes the expanded source.
2. **Compiler:** translates that expanded source into assembly.
3. **Assembler:** translates the assembly into a machine-code object file (`.o` / `.obj`).
4. **Linker:** combines the object files and the libraries, resolves the addresses of symbols and of external calls, and writes a single executable.
:::

![The four build stages in order: preprocessor, compiler, assembler, then the linker, which produces one executable](../../web/public/figures/build-pipeline.svg)

The first three stages work on one `.cpp` file at a time. Only the linker sees the whole program.

- **An object file is unfinished.** When `a.cpp` calls a function defined in `b.cpp`, the compiler only checks the call against the declaration. It leaves a note in `a.o` saying "the address of this function is still missing".
- **The linker fills those notes in.** It looks for each missing function among the definitions in all the object files. If no file defines it, the link fails with an **undefined reference** error. If two files define it, the link fails because the ODR is broken.
- **The linker also needs a starting point.** An executable starts running at `main`, so when the linker builds an executable, exactly one of the object files must define `main`.

You choose how far the build goes with `g++` flags.

- **`g++ -c file.cpp`** runs the first three stages and stops before the linker. It writes `file.o`, and it does not care whether `main` or the other functions exist yet.
- **`g++ -o name a.o b.o`** links the object files into an executable called `name`. Without `-o`, the executable on Linux is named `a.out`.
- **`g++ -o name a.cpp b.cpp`** does all four stages in one command.

:::problem id=worked-compile-vs-link title="Linking without main" source="materials/sessions/SPL_PS1 (1).pptx" kind=worked solution_origin=source
`student.cpp` defines the members of `Student` and nothing else.

```cpp
// student.cpp
#include "student.h"

Student::Student(const std::string& name, int year)
    : _name(name), _year(year) {}

void Student::print() const {
    std::cout << _name << " " << _year;
}

```

The first command below succeeds and the second fails. Which stage fails, and why?

```text
g++ -c student.cpp
g++ -o app student.o

```

:::solution
- **Where to look:** search the file for `main`. It has a constructor and `print`, but no `main` function.
- **Why the first command succeeds:** `-c` stops before the linker. Compiling one file only checks that file's own code, and a file without `main` is perfectly fine.
- **Why the second command fails:** asking for an executable runs the linker, and an executable needs `main` as its starting point. `student.o` is the only object file given, and it does not define `main`.
- **The failing stage:** the linker. It reports an undefined reference to `main`.
- **The fix:** link it together with the file that defines `main`, for example `g++ -o app student.o main.o`.
:::
:::

### Rebuilding with make

With many files, typing every `g++` command by hand gets slow, and recompiling every file after a one-line change wastes time. A `Makefile` records which file is built from which, so `make` can rebuild only what changed.

- **A rule** has a target, a colon, and the files it depends on. The lines under it are the recipe, the commands that build the target.
- **Recipe lines** must begin with a Tab character, not spaces.
- **Rebuilding:** `make` runs a recipe only when the target is missing or one of its dependencies is newer than it.
- **The default target:** when you run `make` without naming a target, it builds the first target in the file.

In this makefile, `hello` is linked from two object files, and each object file is compiled from its own `.cpp` file. After an edit to `run.cpp`, `make` recompiles only `run.o` and then links again.

```makefile
hello: bin/helloWorld.o bin/run.o
	g++ -o bin/hello bin/helloWorld.o bin/run.o

bin/helloWorld.o: src/helloWorld.cpp
	g++ -c -o bin/helloWorld.o src/helloWorld.cpp

bin/run.o: src/run.cpp
	g++ -c -o bin/run.o src/run.cpp

```

### Linking in Java

Java and C++ finish the link at different times.

- **C++** resolves every symbol ahead of time, in the linker, so the executable is complete before it starts.
- **Java** compiles source code to bytecode and has no separate link step. The JVM links dynamically while the program runs, at the moment each class is loaded.

## Objects and values

A class bundles data with the functions that work on it. Before the first class, here are the library types the examples use, compared with their Java counterparts.

- **Fundamental types:** `int`, `double`, `bool`, and `char` work as in Java.
- **`const`** marks a value that cannot change, the job `final` does in Java.
- **`std::string`** is a string you can modify. Two strings are compared by content with `==`, unlike Java, where `==` compares references.
- **`std::vector<T>`** is an array that grows as you add elements, like Java's `ArrayList`.

A class defines the memory layout of its objects and the member functions that operate on them.

- **Non-static data members:** each object gets its own copy of them.
- **Member functions:** there is only one copy of each function, shared by all the objects of the class. How one shared function knows which object to work on is explained below, under `this`.

:::definition id=def-class title="Class and struct" source="materials/lectures/Chapter 3 - Classes and Objects.pptx"
A class is a set of data members and member functions, together with access rules.

- **`class`:** its members are `private` unless you say otherwise.
- **`struct`:** its members are `public` unless you say otherwise. This default is the only difference between the two.
- **The closing semicolon:** a semicolon must end the definition, because the same statement may also declare objects, as `p1` and `p2` are declared below.

```cpp
struct Point {
    const int x, y;
    Point(int x, int y);
} p1(1, 1), p2(2, 2);

```

:::

:::trap
- **The mistake:** forgetting the semicolon after a `class` or `struct` definition is one of the most common compile errors.
- **Why the error message is confusing:** the grammar allows objects to be declared right after the closing brace, so the compiler keeps reading into the next line and reports the error there, not where the semicolon is missing.
:::

### Constructors and the initializer list

A constructor (בנאי) gives the members their first values in an initializer list, which is written after a colon and before the constructor body.

- **`const` members and reference members** must receive their values in that list, because it is the only place they can be initialized.
- **The constructor body** runs after every member already exists, so assigning to a `const` member there is a compile error.
- **Other members** are also best initialized in the list. An assignment in the body would first default-construct the member and then assign it again, which does the work twice.
- **A delegating constructor** names another constructor of the same class in its initializer list, and lets that constructor do the work.

The header file only declares the constructor.

```cpp
// student.h
class Student {
    std::string _name;
    int _year;
public:
    Student(const std::string& name, int year);
    void print() const;
};
```

The source file defines it, and the initializer list comes after the colon.

```cpp
// student.cpp
Student::Student(const std::string& name, int year)
    : _name(name), _year(year) {
    std::cout << "Student " << name << " created";
}

```

The constructor takes `name` as `const std::string&`, a reference to const. This is the usual way to pass a large object.

- **The reference** names the caller's object itself, so the call skips the copy.
- **`const`** promises that the function will not change that object.

### Reaching an object's members

Where an object lives decides how you reach its members.

- **On the stack:** an object created without `new` lives in automatic storage, in the current function's stack frame. You reach its members with the dot operator `.`.
- **On the heap:** an object created with `new` is reached through a pointer. You reach its members with the arrow operator `->`, and you must eventually `delete` it.

```cpp
Student a("Avi", 2000);
a.print();
Student* pb = new Student("Benni", 2000);
pb->print();
delete pb;

```

:::check id=chk-dot-arrow
Given `Student* pb = new Student("Benni", 2000);`, how do you call `print`?

- [ ] `pb.print()`
- [x] `pb->print()`
- [ ] `(*pb)->print()`

- **`pb` is a pointer**, so the dot operator does not work on it directly.
- **`->`** first dereferences the pointer and then reaches the member.
- **`(*pb).print()`** is the same call, written with an explicit dereference followed by a dot. `(*pb)->print()` fails, because `*pb` is already an object, not a pointer.
:::

### The this pointer, const member functions, and static

A call like `a.print()` runs the one shared `print` function. The function knows to print `a` because every non-static member function receives a hidden pointer named `this`.

- **`this`** holds the address of the object the function was called on. In `a.print()`, `this` is `&a`.
- **A `const` member function**, like `print() const` above, promises not to change the object's members. Inside it, `this` has the type `const ClassName*`.
- **A `const` object** may call only `const` member functions, because only they promise to leave it unchanged.
- **A `static` member function** belongs to the class, not to an object, so it has no `this` and cannot reach the non-static members.

The next example puts the initializer list and a `static` function together.

:::problem id=worked-initializer title="The initializer list" source="materials/lectures/Chapter 3 - Classes and Objects.pptx" kind=worked solution_origin=source
Why must `Point` initialize `x` and `y` in the initializer list, and why does `Line` use a static function to initialize `len`?

```cpp
struct Point {
    const int x, y;
    Point(int x, int y) : x(x), y(y) {}
};

struct Line {
    Point p1, p2;
    const int len;
    Line(Point a, Point b)
        : p1(a), p2(b), len(calcLen(a, b)) {}
    static int calcLen(const Point& a, const Point& b);
};

```

:::solution
- **`x` and `y`:** they are `const`, so they must get their values in the initializer list. By the time the constructor body runs, they already exist, and a `const` member cannot be assigned.
- **`len`:** it is also `const`, so it too must be initialized in the list.
- **Why not an ordinary member function:** calling one from the list is legal, but it runs on an object that is only half built, and it could read members that have no value yet.
- **Why a `static` function:** `calcLen` has no object and no `this`, so it can use only its arguments. That makes it a safe call from the list.
:::
:::

### Returning an object from a member function

Returning an object by value creates a copy. Returning a reference avoids the copy, but only if the object is still alive after the call.

- **Returning a reference to a local is undefined behavior.** The local object is destroyed when the function returns, so the caller is left holding a reference to an object that no longer exists.
- **Returning a reference is safe only when the object outlives the call.** A data member is a good example, because it lives as long as the object it belongs to.

```cpp
Image& myPicture() {
    Image avi(...);
    return avi;          // Undefined Behavior: avi is destroyed at function exit
}

```

### The special member functions

Creating, copying, and destroying objects is handled by four special member functions. If you do not write them, the compiler writes them for you.

- **Default constructor:** this constructor takes no arguments. The compiler generates one only when the class declares no constructor of its own.
- **Copy constructor (בנאי העתקה):** this constructor builds a new object from an existing one, which it receives as `const ClassName&`. It is what makes the copy when an object is passed or returned by value.
- **Copy assignment operator (אופרטור השמה):** runs when one existing object is assigned to another existing object.
- **Destructor (הורס):** runs at the end of the object's lifetime and releases the resources the object acquired.

The versions the compiler writes copy each member one by one. That is correct for `Student`, whose members are a `std::string` and an `int`. The next chapter shows when it is not.

## Practice

:::problem id=ps1-link-vs-java title="Where linking happens" source="materials/sessions/SPL_PS1 (1).pptx" kind=exercise solution_origin=source
Java and C++ both turn source into a program that can run. In this session the C++ compile step is `g++ -c`.

:::check id=ps1-link-vs-java-q1
`g++ -c` writes an {{=object file|executable|bytecode}}.

- **The `.o` file** contains machine code, but its calls to functions in other files are still unresolved.
- **`g++ -c`** runs the preprocessor, the compiler, and the assembler, and stops before the linker.
:::

:::check id=ps1-link-vs-java-q2
Which of these hold for Java?

- [ ] Java source is compiled straight to an `.o` file
- [x] Java source is compiled to bytecode
- [x] The JVM links dynamically while the program runs, when it loads a class

Java has no `.o` files. Its linking happens while the program runs, each time the JVM loads a class.
:::

:::check id=ps1-link-vs-java-q3
When does C++ linking run, relative to `g++ -c`?

- [x] As a separate step, before the executable exists
- [ ] Inside `g++ -c`, which already resolves every external symbol
- [ ] While the program runs, when a class is loaded

After `g++ -c`, external symbols are still unresolved. The linker runs as a separate step, and the executable exists only after it finishes.
:::
:::

:::problem id=ps1-makefile-first-target title="The first target of make" source="materials/sessions/SPL_PS1 (1).pptx" kind=exercise solution_origin=source
This makefile has two targets.

```makefile
clean:
	rm -rf bin

hello: bin/helloWorld.o bin/run.o
	g++ -o bin/hello bin/helloWorld.o bin/run.o

```

:::check id=ps1-makefile-first-target-q1
`make` with no arguments runs {{=clean|hello|bin}}.

`make` with no arguments builds the first target in the file, and here that is `clean`.
:::

:::check id=ps1-makefile-first-target-q2
What does that run do?

- [ ] It links `bin/hello` from `bin/helloWorld.o` and `bin/run.o`
- [x] It deletes the build products, and `hello` stays unbuilt
- [ ] It builds `hello`, then deletes `bin`

Running `clean` executes its recipe, `rm -rf bin`, which deletes the build products. Nothing gets built.
:::

:::check id=ps1-makefile-first-target-q3
Which of these build the program?

- [x] Run `make hello`
- [ ] Run `make` with no arguments
- [x] Move `hello` so it is the first target, then run `make`

- **`make hello`** names the target explicitly, so it builds the program.
- **Moving `hello` to the top** makes it the default target, so a plain `make` builds it.
- **A plain `make`** keeps running `clean` for as long as `clean` is the first target.
:::
:::

:::problem id=ps3-pass-by-value title="Three signatures of emphasize" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
Here are three ways to pass a string to a function.

```cpp
void emphasize1(std::string word);
void emphasize2(std::string& word);
void emphasize3(std::string* word);

```

:::check id=ps3-pass-by-value-q1
What does `emphasize1` do with the caller's string?

- [x] It receives a copy. Changes inside the function leave the caller's string as it was
- [ ] It modifies the caller's string
- [ ] It accepts `nullptr` in place of the string

- **`emphasize1` takes its parameter by value**, so it receives its own copy of the string.
- **Changes to that copy** inside the function leave the caller's string as it was.
:::

:::check id=ps3-pass-by-value-q2
Which of these hold?

- [x] `emphasize2` receives a reference, so changes inside the function modify the caller's string
- [ ] `emphasize2` can be passed `nullptr`
- [x] `emphasize3` receives a pointer. Changes through that pointer modify the caller's string, and the pointer may be `nullptr`

A reference always refers to a real object, so it can never be `nullptr`. A pointer, by contrast, may be `nullptr`.
:::

:::check id=ps3-pass-by-value-q3
The body of `emphasize3` has to check for {{=nullptr|a reference|a copy}} before it uses the pointer.

Dereferencing a `nullptr` is undefined behavior, so a function that takes a pointer must check for `nullptr` before using it.
:::
:::

To sum up, the initializer list is how a constructor gives members their first values, and `this` is how a member function finds the object it was called on.

- **Next:** [Rule of three](topic:rule-of-three) (חוק השלושה) shows what must change when a member is a pointer to memory that the class allocated itself.
- **Later:** [Inheritance](topic:inheritance) shows how a call through a base-class pointer can reach the function defined in the derived class.
