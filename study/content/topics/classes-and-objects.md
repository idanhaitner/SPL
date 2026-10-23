---
id: classes-and-objects
title: Classes and objects
sources:
  - "materials/lectures/Chapter 3 - Classes and Objects.pptx"
  - "materials/sessions/SPL_PS1 (1).pptx"
  - "materials/sessions/SPL_PS3.pptx"
---

This chapter follows a C++ program from source files to a running object.

- **Build** — headers, translation units, and how a program becomes an executable.
- **Classes** — the layout of an object and the functions that operate on it.
- **Use** — how an object is allocated, initialized, and reached through `this`.

## Building a program

A function defined outside every class lives in the global scope.

- **Declaration** introduces the function's name and its signature.
- **Definition** also supplies the function body.
- **One Definition Rule (ODR)** allows many declarations and exactly one definition.

A forward declaration tells the compiler that a type or a function exists.

- **Header files** (`.h` or `.hpp`) collect declarations shared by several `.cpp` files.
- **`#include`** pastes the header's text into the source file at that point.
- **Include guards** stop the same header from being pasted twice, including through a circular include.

```cpp
#ifndef POINT_H
#define POINT_H
// declarations
#endif

```

The build has four stages:

:::definition id=def-build title="The four stages of the build" source="materials/sessions/SPL_PS1 (1).pptx"

1. **Preprocessor:** handles the `#` directives (`#include`, `#define`, `#ifndef`), strips comments, and writes the expanded source.
2. **Compiler:** translates that expanded source into assembly.
3. **Assembler:** translates the assembly into a machine-code object file (`.o` / `.obj`).
4. **Linker:** combines the object files and the libraries, resolves the addresses of symbols and of external calls, and writes a single executable.
:::

![The four build stages in order: preprocessor, compiler, assembler, then the linker, which produces one executable](../assets/figures/build-pipeline.svg)

Java and C++ finish the link at different times.

- **Java** compiles source to bytecode. The JVM links dynamically while the program runs, at the moment a class is loaded.
- **C++** resolves those symbols ahead of time, so the executable is complete before it starts.
- **`g++ -c`** stops the build after the assembler and writes a `.o` file.
- **`g++ -o name`** sets the executable's name. On Linux the default name is `a.out`.

:::problem id=worked-compile-vs-link title="Linking without main" source="materials/sessions/SPL_PS1 (1).pptx" kind=worked solution_origin=source
The first command succeeds and the second fails. Which stage fails, and why?

```text
g++ -c student.cpp
g++ -o app student.o

```

:::solution
- **Failure** is in the linker, which is what the second command runs.
- **`g++ -c`** writes `student.o` and stops before linking, so that command never searches for `main`.
- **Second command** asks for an executable, so it invokes the linker.
- **`student.o`** has no definition of `main`, and the linker reports an undefined reference to `main`.
:::
:::

A `Makefile` records the dependencies of a build.

- **No target** on the command line means `make` runs the first target in the file.
- **Recipe line** begins with a Tab character.

```makefile
hello: helloWorld.o run.o
	g++ -o bin/hello bin/helloWorld.o bin/run.o

```

The fundamental types in C++ include `int`, `double`, `bool`, and `char`.

- **`const`** names a constant. Java uses `final` for that job.
- **`std::string`** is a mutable string, and strings compare with `==`.
- **`std::vector<T>`** is a dynamic array.

## Objects and values

A class defines the memory layout of its objects and the member functions that operate on them.

- **Non-static data** is copied once into each object.
- **Member functions** are shared.
- **`this`** is the hidden parameter that carries the address of the object into every non-static member function.

:::definition id=def-class title="Class and struct" source="materials/lectures/Chapter 3 - Classes and Objects.pptx"
A class is a set of data members and member functions, together with access rules.

- **`class`** defaults to `private`.
- **`struct`** defaults to `public`.
- **Semicolon** ends the definition, because the same statement may also declare objects.

```cpp
struct Point {
    const int x, y;
    Point(int x, int y);
} p1(1, 1), p2(2, 2);

```

:::

A constructor (בנאי) initializes the members through an initializer list, written before the constructor body.

- **`const` member** and a reference member receive their values in that list.
- **Body** runs after the member already exists, so assigning to a `const` member there is a compile error.
- **Other members** are initialized directly by the list. An assignment in the body would default-construct the member first and then assign.

```cpp
// student.h
class Student {
    std::string _name;
    int _year;
public:
    Student(const std::string& name, int year);
    void print() const;
};

// student.cpp
Student::Student(const std::string& name, int year)
    : _name(name), _year(year) {
    std::cout << "Student " << name << " created";
}

```

A large object is usually passed as `const T&`, a reference to const.

- **Parameter** then names the caller's object, and the call skips the copy.

Where an object lives decides how you reach its members.

- **Automatic storage** is an object created without `new`, in the caller's stack frame. Members are reached with the dot operator `.`.
- **Heap** is an object created with `new`. You hold a pointer, and you reach its members with the arrow operator `->`.

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
- **`const` object** may call only member functions that are themselves `const`. Those functions promise to leave the object's members unchanged.
- **`const` member function** gives `this` the type `const ClassName*`.
- **`static` member function** has no `this` pointer, so the non-static members are out of its reach.
- **Delegating constructor** names another constructor of the same class in the initializer list.

### Returning an object from a member function

Returning an object by value creates a copy.

- **Local reference** is undefined behavior. That object's lifetime ends when the function returns, and the caller is left with a reference to storage that no longer holds the object.
- **Valid reference** names an object that outlives the call. A member of the class is such an object: its lifetime is the lifetime of the class object.

```cpp
Image& myPicture() {
    Image avi(...);
    return avi;          // Undefined Behavior: avi is destroyed at function exit
}

```

These are the special member functions that bound an object's lifetime and its copies:

- **Default constructor:** the compiler generates one only when the class declares no constructor of its own.
- **Copy constructor (בנאי העתקה):** takes a reference to another object of the same type (`const ClassName&`).
- **Copy assignment operator (אופרטור השמה):** runs when one existing object is assigned to another existing object.
- **Destructor (הורס):** runs at the end of the object's lifetime and releases the resources the object acquired.

:::check id=chk-dot-arrow
Given `Student* pb = new Student("Benni", 2000);`, how do you call `print`?

- [ ] `pb.print()`
- [x] `pb->print()`
- [ ] `(*pb)->print()`

- **`pb`** is a pointer.
- **`->`** dereferences that pointer and then accesses the member.
- **`(*pb).print()`** is the same call, written with an explicit dereference and a dot.
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
- **`const` member** receives its value in the initializer list. By the time the constructor body runs, the member already exists, and a `const` member cannot be assigned.
- **`len`** in `Line` is `const`, so the initializer list is where it is initialized.
- **Ordinary member function** called from that list would use `this` on an object that is still being initialized, and the language rejects that call.
- **`static` function** runs with no object, so `calcLen` is a safe call from the list.
:::
:::

:::trap
- **Missing semicolon** after a `class` or `struct` definition is a common compile error.
- **Grammar** allows object declarations in the same statement as the type, so the compiler keeps reading past the type and reports the mistake later.
:::

## Practice

:::problem id=ps1-link-vs-java title="Where linking happens" source="materials/sessions/SPL_PS1 (1).pptx" kind=exercise solution_origin=source
Java and C++ both turn source into a program that can run. In this session the C++ compile step is `g++ -c`.

:::check id=ps1-link-vs-java-q1
`g++ -c` writes an {{=object file|executable|bytecode}}.

- **`.o` file** contains machine code, and its external symbols are still unresolved.
- **That step** runs the preprocessor, the compiler, and the assembler.
:::

:::check id=ps1-link-vs-java-q2
Which of these hold for Java?

- [ ] Java source is compiled straight to an `.o` file
- [x] Java source is compiled to bytecode
- [x] The JVM links dynamically while the program runs, when it loads a class

Linking happens when the JVM loads a class, during the run.
:::

:::check id=ps1-link-vs-java-q3
When does C++ linking run, relative to `g++ -c`?

- [x] As a separate step, before the executable exists
- [ ] Inside `g++ -c`, which already resolves every external symbol
- [ ] While the program runs, when a class is loaded

After `g++ -c`, external symbols are still unresolved. Linking runs before the executable exists.
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

That is the first target in the file.
:::

:::check id=ps1-makefile-first-target-q2
What does that run do?

- [ ] It links `bin/hello` from `helloWorld.o` and `run.o`
- [x] It deletes the build products, and `hello` stays unbuilt
- [ ] It builds `hello`, then deletes `bin`

The recipe under `clean` deletes the build products.
:::

:::check id=ps1-makefile-first-target-q3
Which of these build the program?

- [x] Run `make hello`
- [ ] Run `make` with no arguments
- [x] Move `hello` so it is the first target, then run `make`

- **`make hello`** selects that target.
- **`make` with no arguments** stays on `clean` while `clean` is first.
:::
:::

:::problem id=ps3-pass-by-value title="Three signatures of emphasize" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
Three signatures.

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

- **Copy** is what `emphasize1` receives, passed by value.
- **Changes** inside the function leave the caller's string as it was.
:::

:::check id=ps3-pass-by-value-q2
Which of these hold?

- [x] `emphasize2` receives a reference, so changes inside the function modify the caller's string
- [ ] `emphasize2` can be passed `nullptr`
- [x] `emphasize3` receives a pointer. Changes through that pointer modify the caller's string, and the pointer may be `nullptr`

A reference cannot be `nullptr`.
:::

:::check id=ps3-pass-by-value-q3
The body of `emphasize3` has to check for {{=nullptr|a reference|a copy}} before it uses the pointer.

The pointer may be `nullptr`, and the function body has to check before it uses it.
:::
:::

The initializer list is how a constructor gives members their first values, and `this` is how a member function finds the object it was called on.

- **[Rule of three](topic:rule-of-three)** (חוק השלושה) is what changes when one of those members is a pointer to a buffer the class allocated.
- **[Inheritance](topic:inheritance)** is what changes when a call through a base-class pointer has to reach the function in the derived class.
