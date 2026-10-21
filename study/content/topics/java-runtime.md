---
id: java-runtime
title: Back to Java
sources:
  - "materials/lectures/Chapter 7 - Back to Java.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS5.pptx"
---

Java compiles a program to bytecode and runs that bytecode on the Java Virtual Machine, a run-time environment. The same `.class` file can run on any operating system that supplies a JVM. This chapter places that execution next to the C++ object model: which values live on the stack, how an array is laid out on the heap, and why a call to an instance method is selected from the class of the object at run time. Checked exceptions are part of the same story, because the compiler treats them as part of a method's type.

## Compilation and execution

1. **Compilation, before the program runs:** the compiler (`javac`) translates the source file (`.java`) into a bytecode file (`.class`). This step checks types, enforces access control, and requires every checked exception to be caught or declared.
2. **Execution:** the JVM, as the run-time environment, loads the `.class` files. It interprets the bytecode. Its just-in-time (JIT) compiler compiles hot spots, the stretches of code that run often, into native machine code.

Every instance method in Java is virtual. A call uses **dynamic binding** (קשירה דינמית), also called late binding, and the method comes from the class of the object at run time. A C++ function is dispatched that way when it is declared `virtual`.

## The Java storage model

- **Stack:** local variables of primitive type (`int`, `boolean`, and the other primitives) live here, together with references to objects.
- **Heap:** every object and every array lives here, including the fields inside each object.

An array in Java is an object on the heap, and its object layout stores the length in `length`. An array whose element type is a primitive stores those values inside the array object. An array whose element type is a reference type stores references. Each referent is a separate object on the heap.

![An int array is one block of ints on the heap. A String array is a block of references on the heap, and each string is a further object](../assets/figures/java-array.svg)

## Exceptions

:::definition id=def-exception title="How Java classifies exceptions" source="materials/lectures/Chapter 7 - Back to Java.pptx"

- **Checked exceptions:** these inherit from `java.lang.Exception`, excluding `RuntimeException`. They stand for failures the program is expected to anticipate, such as a missing file. The compiler requires the method to catch the exception with `try-catch`, or to declare it on the method with `throws`.
- **Unchecked exceptions:** these inherit from `RuntimeException`. They stand for bugs in the program, such as `NullPointerException` and `IndexOutOfBoundsException`. A method may leave them undeclared.
- **Errors:** these inherit from `java.lang.Error`. They stand for severe failures of the JVM, such as `OutOfMemoryError`. Ordinary application code leaves them uncaught.
:::

A `finally` block runs whenever control leaves the `try` block, whether an exception was thrown or the block finished normally. `try-with-resources` closes resources that implement `AutoCloseable` on every exit from the block.

:::problem id=worked-array-layout title="An array on the heap" source="materials/lectures/Chapter 7 - Back to Java.pptx" kind=worked solution_origin=source
What is on the stack, and what is on the heap?

```java
int[] a = new int[10];
String[] b = new String[10];
b[0] = new String("Avi");
```

:::solution
`a` and `b` are references in the frame of `main`. `a` points at one array object on the heap. That object's layout holds a header, the length 10, and ten `int` values. `b` points at one array object on the heap whose ten slots are references. Those references begin as null. `b[0] = new String("Avi")` stores one further heap object in the first slot. The `String` objects are separate from the block of `b`. The other nine slots remain null.
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
`FileNotFoundException` is checked. `ArithmeticException` is unchecked. For each one, say whether the program compiles when the caller ignores it, and where a thrown exception goes when no frame handles it.

:::hint
The exercise table says that ignoring an unchecked exception still leaves the program able to compile. Ignoring a checked exception makes compilation fail.
:::
:::hint
The ways to handle a checked exception are a `try/catch`, or a `throws` clause on the method.
:::
:::hint
The picture of the call stack ends at the JVM when `main` has no handler.
:::
:::solution
Ignoring `ArithmeticException` still compiles. Handling it is optional, and catching it is usually the wrong response when the exception marks a bug the program should fix. A method that ignores `FileNotFoundException` fails to compile. The method must catch it or declare `throws FileNotFoundException`, and the caller then has the same obligation.

If the exception is thrown and no frame from the throw site through `main` has a matching `catch`, the JVM terminates the program and reports the exception. `finally` blocks along that walk still run. `try-with-resources` closes the resource on this path. A second failure thrown by `close` is suppressed, and the original exception remains the one that propagates.
:::
:::

The rule that every instance method in Java is virtual is the rule that [Inheritance and polymorphism](topic:inheritance) expresses with the keyword `virtual`. [Concurrency](topic:concurrency) is what follows when more than one of these methods runs at the same time.
