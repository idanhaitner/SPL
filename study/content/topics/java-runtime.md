---
id: java-runtime
title: Back to Java
sources:
  - "materials/lectures/Chapter 7 - Back to Java.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS5.pptx"
---

This chapter compares Java's run-time picture with the C++ model from earlier chapters.

- **Compile and run** — bytecode, the JVM, and what a `.class` file can do.
- **Storage** — stack, heap, and how an array is laid out.
- **Calls and errors** — virtual dispatch and checked exceptions.

## Compilation and execution

Java compiles a program to bytecode and runs that bytecode on the Java Virtual Machine, a run-time environment.

- **`.class` file** can run on any operating system that supplies a JVM.

1. **Compilation, before the program runs:** the compiler (`javac`) translates the source file (`.java`) into a bytecode file (`.class`). This step checks types, enforces access control, and requires every checked exception to be caught or declared.
2. **Execution:** the JVM, as the run-time environment, loads the `.class` files. It interprets the bytecode. Its just-in-time (JIT) compiler compiles hot spots, the stretches of code that run often, into native machine code.

Every instance method in Java is virtual.

- **Dynamic binding** (קשירה דינמית), also called late binding, takes the method from the class of the object at run time.
- **C++** dispatches that way when the function is declared `virtual`.

## The Java storage model

- **Stack** holds the values this chapter compares with the C++ object model: local variables of primitive type (`int`, `boolean`, and the other primitives), together with references to objects.
- **Heap** is where every object and every array lives, including the fields inside each object.

An array in Java is an object on the heap.

- **`length`** is stored in the array object's layout.
- **Primitive elements** live inside the array object.
- **Reference elements** are stored as references. Each referent is a separate object on the heap.

![An int array is one block of ints on the heap. A String array is a block of references on the heap, and each string is a further object](../assets/figures/java-array.svg)

## Exceptions

:::definition id=def-exception title="How Java classifies exceptions" source="materials/lectures/Chapter 7 - Back to Java.pptx"

- **Checked exceptions:** these inherit from `java.lang.Exception`, excluding `RuntimeException`. They stand for failures the program is expected to anticipate, such as a missing file. The compiler requires the method to catch the exception with `try-catch`, or to declare it on the method with `throws`.
- **Unchecked exceptions:** these inherit from `RuntimeException`. They stand for bugs in the program, such as `NullPointerException` and `IndexOutOfBoundsException`. A method may leave them undeclared.
- **Errors:** these inherit from `java.lang.Error`. They stand for severe failures of the JVM, such as `OutOfMemoryError`. Ordinary application code leaves them uncaught.
:::

- **`finally`** runs whenever control leaves the `try` block, whether an exception was thrown or the block finished normally.
- **`try-with-resources`** closes resources that implement `AutoCloseable` on every exit from the block.

:::problem id=worked-array-layout title="An array on the heap" source="materials/lectures/Chapter 7 - Back to Java.pptx" kind=worked solution_origin=source
What is on the stack, and what is on the heap?

```java
int[] a = new int[10];
String[] b = new String[10];
b[0] = new String("Avi");
```

:::solution
- **`a` and `b`** are references in the frame of `main`.
- **`a`** points at one array object on the heap. That object's layout holds a header, the length 10, and ten `int` values.
- **`b`** points at one array object whose ten slots are references. Those references begin as null.
- **`b[0]`** stores one further heap `String`. The other nine slots remain null. The `String` objects are separate from the block of `b`.
:::
:::

:::check id=chk-checked
A method calls an API that throws `java.io.FileNotFoundException`, a checked exception. What does the compiler require?

- [ ] Nothing, because only `Error` is mandatory
- [x] A `try/catch` for this exception, or a `throws` clause
- [ ] A `finally` block and no `catch`

Checked exceptions are part of the method's type. Unchecked exceptions and `Error` stay outside that type.
:::

## Practice

:::problem id=ps5-checked-exception title="A checked exception" source="materials/sessions/SPL_PS5.pptx" kind=exercise solution_origin=source
`FileNotFoundException` is checked. `ArithmeticException` is unchecked.

:::check id=ps5-checked-exception-q1
A method that can throw `FileNotFoundException` must catch it or declare {{=throws|finally|assert}} `FileNotFoundException`.

A method that ignores `FileNotFoundException` fails to compile. The caller then has the same obligation.
:::

:::check id=ps5-checked-exception-q2
Which of these hold?

- [x] Ignoring `ArithmeticException` still compiles
- [ ] Ignoring `FileNotFoundException` still compiles
- [x] The caller of a method that declares `throws FileNotFoundException` has the same obligation
- [x] Catching `ArithmeticException` is usually the wrong response when the exception marks a bug the program should fix

- **`ArithmeticException`** is optional to handle.
- **`FileNotFoundException`** must be caught or declared with `throws FileNotFoundException`.
- **Caller** of that method has the same obligation.
:::

:::check id=ps5-checked-exception-q3
If no frame from the throw site through `main` has a matching `catch`, what happens?

- [ ] `main` returns normally and the exception is discarded
- [ ] `finally` blocks along that walk are skipped
- [x] The JVM terminates the program and reports the exception

The JVM terminates the program and reports the exception.
:::

:::check id=ps5-checked-exception-q4
Which of these hold on that path?

- [x] `finally` blocks along the walk still run
- [ ] A second failure thrown by `close` replaces the original exception
- [x] `try-with-resources` closes the resource. A second failure from `close` is suppressed, and the original exception remains the one that propagates

- **`finally`** still runs along the walk.
- **Original exception** stays the one that propagates.
:::
:::

Every instance method in Java is virtual. [Inheritance and polymorphism](topic:inheritance) expresses that rule with the keyword `virtual`.

- **[Concurrency](topic:concurrency)** is what follows when more than one of these methods runs at the same time.
