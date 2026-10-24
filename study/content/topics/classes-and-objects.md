---
id: classes-and-objects
title: Classes and objects
sources:
  - "materials/lectures/Chapter 3 - Classes and Objects.pptx"
  - "materials/sessions/SPL_PS1 (1).pptx"
  - "materials/sessions/SPL_PS3.pptx"
---

This chapter follows a C++ program from its source files all the way to a running object.

- **Building:** how headers and `.cpp` files are compiled separately and then linked into one executable.
- **Classes:** what an object looks like in memory, and how member functions operate on it.
- **Using objects:** how an object is created, how its members get their first values, and how a member function finds its object through `this`.

## Building a program

A function defined outside every class lives in the global scope.

- **A declaration** introduces the function's name and its signature, so other code can call it.
- **A definition** is a declaration that also supplies the function's body.
- **The One Definition Rule (ODR)** allows a function to be declared many times, but defined exactly once in the whole program.

A forward declaration tells the compiler that a type or a function exists.

- **Header files** (`.h` or `.hpp`) collect the declarations that several `.cpp` files need to share.
- **`#include`** literally pastes the header's text into the source file at that point.
- **Include guards** stop the same header from being pasted twice into one file, which also protects against two headers that include each other.

```cpp
#ifndef POINT_H
#define POINT_H
// declarations
#endif

```

The build has four stages, which always run in this order.

:::definition id=def-build title="The four stages of the build" source="materials/sessions/SPL_PS1 (1).pptx"

1. **Preprocessor:** handles the `#` directives (`#include`, `#define`, `#ifndef`), strips comments, and writes the expanded source.
2. **Compiler:** translates that expanded source into assembly.
3. **Assembler:** translates the assembly into a machine-code object file (`.o` / `.obj`).
4. **Linker:** combines the object files and the libraries, resolves the addresses of symbols and of external calls, and writes a single executable.
:::

![The four build stages in order: preprocessor, compiler, assembler, then the linker, which produces one executable](../../web/public/figures/build-pipeline.svg)

Java and C++ finish the link at different times.

- **Java** compiles source code to bytecode. The JVM links dynamically while the program runs, at the moment each class is loaded.
- **C++** resolves every symbol ahead of time, in the linker, so the executable is complete before it starts.
- **`g++ -c`** stops the build after the assembler and writes a `.o` object file. It does not link.
- **`g++ -o name`** sets the name of the output file. Without it, the executable on Linux is named `a.out`.

:::problem id=worked-compile-vs-link title="Linking without main" source="materials/sessions/SPL_PS1 (1).pptx" kind=worked solution_origin=source
The first command succeeds and the second fails. Which stage fails, and why?

```text
g++ -c student.cpp
g++ -o app student.o

```

:::solution
- **The failing stage:** the linker fails, because linking is what the second command runs.
- **Why the first command succeeds:** `g++ -c` writes `student.o` and stops before linking, so it never looks for `main`.
- **Why the second command fails:** it asks for an executable, so it runs the linker. Every executable needs a `main`, and `student.o` does not define one, so the linker reports an undefined reference to `main`.
:::
:::

A `Makefile` records the dependencies of a build.

- **The default target:** when you run `make` without naming a target, it builds the first target in the file.
- **Recipe lines:** each command under a target must begin with a Tab character, not spaces.

```makefile
hello: helloWorld.o run.o
	g++ -o bin/hello bin/helloWorld.o bin/run.o

```

The fundamental types in C++ include `int`, `double`, `bool`, and `char`.

- **`const`** marks a value that cannot change. Java uses `final` for the same job.
- **`std::string`** is a string you can modify, and two strings are compared by content with `==`, unlike Java.
- **`std::vector<T>`** is an array that grows as you add elements, like Java's `ArrayList`.

## Objects and values

A class defines the memory layout of its objects and the member functions that operate on them.

- **Non-static data members:** each object gets its own copy of them.
- **Member functions:** there is only one copy of each function, shared by all the objects of the class.
- **`this`:** this hidden parameter carries the address of the current object into every non-static member function, which is how one shared function knows which object to work on.

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

A constructor (בנאי) gives the members their first values in an initializer list, which is written after a colon and before the constructor body.

- **`const` members and reference members** must receive their values in that list, because it is the only place they can be initialized.
- **The constructor body** runs after every member already exists, so assigning to a `const` member there is a compile error.
- **Other members** are also best initialized in the list. An assignment in the body would first default-construct the member and then assign it again, which does the work twice.

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

A large object is usually passed as `const T&`, a reference to const.

- **Why:** the parameter then names the caller's object itself, so the call skips the copy, and `const` promises the function will not change that object.

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

### The this pointer, const member functions, and static

Every non-static member function receives a hidden pointer named `this`.

- **`this`** holds the address of the object the function was called on.
- **A `const` member function** promises not to change the object's members. Inside it, `this` has the type `const ClassName*`.
- **A `const` object** may call only `const` member functions, because only they promise to leave it unchanged.
- **A `static` member function** belongs to the class, not to an object, so it has no `this` and cannot reach the non-static members.
- **A delegating constructor** names another constructor of the same class in its initializer list, and lets that constructor do the work.

### Returning an object from a member function

Returning an object by value creates a copy.

- **Returning a reference to a local is undefined behavior.** The local object is destroyed when the function returns, so the caller is left holding a reference to an object that no longer exists.
- **Returning a reference is safe only when the object outlives the call.** A data member is a good example, because it lives as long as the object it belongs to.

```cpp
Image& myPicture() {
    Image avi(...);
    return avi;          // Undefined Behavior: avi is destroyed at function exit
}

```

The special member functions control how an object is created, copied, and destroyed.

- **Default constructor:** this constructor takes no arguments. The compiler generates one only when the class declares no constructor of its own.
- **Copy constructor (בנאי העתקה):** this constructor builds a new object from an existing one, which it receives as `const ClassName&`.
- **Copy assignment operator (אופרטור השמה):** runs when one existing object is assigned to another existing object.
- **Destructor (הורס):** runs at the end of the object's lifetime and releases the resources the object acquired.

:::check id=chk-dot-arrow
Given `Student* pb = new Student("Benni", 2000);`, how do you call `print`?

- [ ] `pb.print()`
- [x] `pb->print()`
- [ ] `(*pb)->print()`

- **`pb` is a pointer**, so the dot operator does not work on it directly.
- **`->`** first dereferences the pointer and then reaches the member.
- **`(*pb).print()`** is the same call, written with an explicit dereference followed by a dot. `(*pb)->print()` fails, because `*pb` is already an object, not a pointer.
:::

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

:::trap
- **The mistake:** forgetting the semicolon after a `class` or `struct` definition is one of the most common compile errors.
- **Why the error message is confusing:** the grammar allows objects to be declared right after the closing brace, so the compiler keeps reading into the next line and reports the error there, not where the semicolon is missing.
:::

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

hello: helloWorld.o run.o
	g++ -o bin/hello bin/helloWorld.o bin/run.o

```

:::check id=ps1-makefile-first-target-q1
`make` with no arguments runs {{=clean|hello|bin}}.

`make` with no arguments builds the first target in the file, and here that is `clean`.
:::

:::check id=ps1-makefile-first-target-q2
What does that run do?

- [ ] It links `bin/hello` from `helloWorld.o` and `run.o`
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
