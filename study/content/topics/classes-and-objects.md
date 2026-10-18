---
id: classes-and-objects
title: Classes and objects
sources:
  - "Classes/Chapter 3 - Classes and Objects.pptx"
  - "Exrecises/SPL_PS1 (1).pptx"
  - "Exrecises/SPL_PS3.pptx"
---

A C++ class is a layout plus functions that receive a hidden pointer to that layout. The practical sessions start one step earlier, because a class is useless until the compiler and the linker have turned two files into one program. This topic is that path: how a program is built, how an object is constructed, and how a call sees the object.

## Building a program

A C++ function does not have to live inside a class. A name declared outside every class is in the global scope. A definition gives the prototype and the body. A declaration gives only the prototype and a semicolon. You may declare a function many times and define it once.

A forward declaration tells the compiler the shape of a name whose body comes later. Names needed by more than one `.cpp` file go in a header, and each user `#include`s that header. `#include` pastes the file in. Include headers, not other `.cpp` files, and guard the header so a cycle does not paste it twice:

```cpp
#ifndef POINT_H
#define POINT_H
// declarations
#endif
```

The build has four stages, from practical session 1.

:::definition id=def-build title="Compile and link" source="Exrecises/SPL_PS1 (1).pptx"
The preprocessor takes a `.cpp` file, strips comments, and obeys `#` directives (`#include`, `#ifndef`, `#define`). The compiler turns that into assembly. The assembler produces an object file (`.o`). The linker resolves calls to other object files, finds `main`, and writes one executable.
:::

Java compiles to bytecode and links when the program runs. C++ does the preprocessor, the compile, and the assemble up front, and the linker runs before the program starts. `g++ -c` stops before the link. `g++ -o name` names the executable; the default name is `a.out`.

![Four build stages in order: preprocessor, compiler, assembler, then the linker that produces one executable](../assets/figures/build-pipeline.svg)

:::problem id=worked-compile-vs-link source="Exrecises/SPL_PS1 (1).pptx" kind=worked solution_origin=source
`g++ -c student.cpp` succeeds. `g++ -o app student.o` then fails because `main` is undefined. Which stage failed, and why did `-c` not catch it?

:::solution
The link failed. `-c` stops after the assembler, so `student.o` only has to be a valid object file. `main` lives in another file. The linker is the stage that looks for `main` and for calls into other object files. The compiler of `student.cpp` never saw those files.
:::
:::

A makefile records targets and the files they depend on. `make` runs the first target unless you name another. A sketch from the session:

```
hello: helloWorld.o run.o
	g++ -o bin/hello bin/helloWorld.o bin/run.o
```

Tabs, not spaces, introduce the recipe. `clean` removes the products and is not the first target, so a bare `make` does not wipe the build.

The types you meet immediately are the primitives `int`, `double`, `long`, `bool`, `char`, and `const` in place of Java's `final`. `std::string` is mutable, compared with `==`, not `equals`. `std::vector<T>` is a growable array with random access. Both live in namespace `std`.

## An object is a value

:::definition id=def-class title="Class layout" source="Classes/Chapter 3 - Classes and Objects.pptx"
A class is a sequence of members with access control. The default access in a `class` is private. A `struct` is the same layout with default public access. The definition ends with a semicolon, because the grammar allows objects to be declared in the same sentence:

```cpp
struct Point {
    const int x, y;
    Point(int x, int y);
} p1(1, 1), p2(2, 2);
```

A class with no name in that position is an anonymous class, useful only for the objects declared there.
:::

The constructor that the lecture wants is not a series of assignments in the body. Members are initialized on the member-initializer list, before the body runs. That is the only way to initialize a `const` member or a reference member, and it avoids constructing a member and then assigning over it.

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

The bad version on the slide takes `std::string` by value and assigns `_name = name` in the body. The good version binds a const reference and initializes `_name` from it. Passing a large object by value calls the copy constructor, which session 3 flags as the slow path.

An object with no `new` lives in the frame, and you use `.`. An object from `new` lives on the heap, you hold a pointer, and you use `->`.

```cpp
Student a("Avi", 2000);
a.print();
Student* pb = new Student("Benni", 2000);
pb->print();
```

### this, const, and static

Every non-static member function receives a hidden pointer, `this`, holding the address of the object. `print` that mentions `_name` is the same function as one that mentions `this->_name`.

A `const` object, `const Student a("Avi")`, may only call `const` methods. `setName` is not `const`, so `a.setName("Benni")` is an error. `print() const` promises not to modify members, so the call is allowed. Inside a `const` method, `this` has type `const Student*`.

A `static` member function has no `this`. The lecture's `Line` stores a `const int len` computed from its endpoints. Calling an ordinary `calcLen()` from the initializer list is illegal: the object is not alive yet, so there is no `this`. A `static` `calcLen(p1, p2)` has no `this` and can run. A constructor may also delegate to another constructor of the same class, and that delegation is the whole initializer, not a mix with other members.

### Returning an object

Returning a primitive by value returns a copy. Returning a local `Image` by value also returns a copy, and the copy is the caller's problem; the local dies. Returning a reference to a local is forbidden: the referent is in the frame that is about to pop.

```cpp
Image& myPicture() {
    Image avi(...);
    return avi;          // the referent dies at the closing brace
}
```

Returning a reference to a member is allowed, and it aliases that member. The safe form on the slide returns `const Image&` from a `const` method, so the caller cannot assign through the alias and change the student's picture.

Session 3 adds the vocabulary the next topic will need, already visible in ordinary classes:

- A default constructor can be called with no arguments. The compiler writes one only if you wrote no constructors at all.
- A copy constructor's first parameter is a reference to the same class, usually `const`.
- The copy-assignment operator runs when an existing object is on the left of `=`.
- The destructor runs when the object dies, by leaving scope or by `delete`. It has no parameters and no return type.

If any of those is missing, the compiler generates a memberwise version. That generated version is the right one only when the class owns nothing besides its own bytes.

:::check id=chk-dot-arrow
`Student* pb = new Student("Benni", 2000);` How do you call `print`?

- [ ] `pb.print()`
- [x] `pb->print()`
- [ ] `(*pb).print` is ill-formed, and so is the arrow

`pb` is a pointer. The arrow dereferences, then selects the member. `(*pb).print()` is the same call written out.
:::

:::problem id=worked-initializer source="Classes/Chapter 3 - Classes and Objects.pptx" kind=worked solution_origin=source
`Point` has `const int x, y`. Why does the constructor need `: x(x), y(y)`, and why does a `Line` that wants `len` computed in the initializer call a static function?

:::solution
A `const` member is initialized once, before the constructor body. An assignment `_x = x` in the body would be writing a const after it already exists, and it does not compile. The initializer list is that initialization.

`len` is also const, so it too must be initialized on the list. An ordinary member function call from that list would use `this` before the object is constructed. `static int calcLen(const Point&, const Point&)` does not need `this`, so `len(calcLen(p1, p2))` is legal. The slide's non-static version is marked as the one that will not compile.
:::
:::

:::trap
Forgetting the semicolon after the class definition is a parse error, often reported on the next declaration. The semicolon is there because `struct Point { ... } p;` is one declaration.
:::

:::trap
`void checkDebtAndGraduate(Student s)` receives a copy. `s.graduate()` sets the flag on the copy. The caller's student is unchanged. The session's repair is `Student& s`.
:::

## Practice

:::problem id=ps1-link-vs-java source="Exrecises/SPL_PS1 (1).pptx" kind=exercise solution_origin=source
Session 1's comparison table asks where linking happens. State, for Java and for C++, when unresolved calls are tied to their definitions, and what file `g++ -c` produces.

:::hint
Java's compiler does not emit machine code for one operating system.
:::
:::hint
C++ object files still contain symbols that other `.cpp` files define. Something after `-c` has to patch those in.
:::
:::hint
The session's assembler step writes `*.o` on Unix.
:::
:::solution
Java compiles to bytecode and links at run time, when the virtual machine loads a class. There is no assembler step, because the bytecode is not a machine encoding.

`g++` by default preprocesses, compiles, and assembles. `g++ -c` stops after the object file: one `.o` per source file, symbols still unresolved. A later link, `g++` without `-c`, combines those objects, resolves cross-file calls, and uses `main` as the start address. If you skip the link, you have no executable.
:::
:::

:::problem id=ps1-makefile-first-target source="Exrecises/SPL_PS1 (1).pptx" kind=exercise solution_origin=source
A makefile lists `clean` first and `hello` second. `hello` depends on `helloWorld.o` and `run.o`. You type `make` in that directory. What runs, and what would you type to build `hello`?

:::hint
`make` with no arguments does not search for a target named `all` unless that target is the one it finds first.
:::
:::hint
The session says the default is the first target in the file.
:::
:::hint
The recipe under a target is indented with a tab. The dependency line is `target: dep1 dep2`.
:::
:::solution
A bare `make` builds the first target, `clean`, and deletes the products. It does not build `hello`. `make hello` builds `hello`, and before that it builds `helloWorld.o` and `run.o` if those rules exist and the objects are older than their sources. Put the real program first, or name it `all` and put `all` first, if you want `make` to build the executable.
:::
:::

:::problem id=ps3-pass-by-value source="Exrecises/SPL_PS3.pptx" kind=exercise solution_origin=source
`emphasize` should append three exclamation marks to the caller's string. The session shows three signatures. Which ones change the caller's string, and which one can be given a null?

```cpp
void emphasize(std::string word);
void emphasize(std::string& word);
void emphasize(std::string* word);
```

:::hint
A by-value parameter is a different object from the caller's.
:::
:::hint
A reference must be bound to an object. A pointer can hold `nullptr`, and the body has to test it.
:::
:::hint
The body on the slide is `word.append(3, '!')` or `word->append(3, '!')`.
:::
:::solution
`std::string word` copies the string. `append` changes the copy. The caller is unchanged, and the copy constructor ran.

`std::string& word` is another name for the caller's string. `append` changes that string. You cannot pass a null reference.

`std::string* word` can be null. The session returns immediately when `word == nullptr`, and otherwise calls `word->append(3, '!')`, which changes the caller's string. The call site passes an address.
:::
:::

The initializer list and `this` are the ordinary half of a class. [Rule of three](topic:rule-of-three) is what changes when one of the members is a pointer to a buffer you allocated. [Inheritance](topic:inheritance) is what changes when the call through a base pointer should reach the derived function.
