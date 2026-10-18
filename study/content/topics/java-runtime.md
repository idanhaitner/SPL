---
id: java-runtime
title: Back to Java
sources:
  - "Classes/Chapter 7 - Back to Java.pptx"
  - "Exrecises/SPL_PS5.pptx"
---

The second half of the course writes servers, threads, and databases in Java. Chapter 7 is the reset: what the virtual machine actually stores, which methods are virtual, and how a failure leaves a method.

## The virtual machine

Java is chosen here because the program runs on a virtual machine, so the same bytecode moves between operating systems, and because garbage collection removes the `delete` errors of the C++ half. The cost is that you have to understand the object graph the collector sees.

A source file ends in `.java` and compiles to a `.class` file of bytecode, the machine language of the JVM. Bytecode is not tied to one processor. The compiler's job, as the lecture lists it, is to check the program and to compress it into that form: full type checking, access control, argument matching, checked exceptions, inheritance and interfaces, and reachability. Most of the structure survives in the class file: names, signatures, the inheritance tree, and the shape of `if`, `while`, `for`, and `switch`. The lecture's point is that bytecode is largely reversible.

A program is classes only. There are no free functions and no globals. Some class has `public static void main(String[] args)`.

:::definition id=def-java-storage title="Where Java stores a value" source="Classes/Chapter 7 - Back to Java.pptx"
A local variable that is a primitive, or a reference that is not a field, lives on the stack. Objects live on the heap, and so do their fields, even fields that are primitives or references. Distinct objects are distinct heap blocks. A class is loaded as one `Class` object that describes fields, methods, and the hierarchy, and that object is what reflection and `new` consult.
:::

An array is an object. It lives on the heap, it stores its length, and every index is checked. `int[] a = new int[10]` is a reference on the stack and an array object on the heap. An array of references is a heap array of pointers, each of which may point at its own object. That indirection is the lecture's complaint about Java arrays. A multi-dimensional array is an array of arrays, not one rectangular block.

![An int array is one heap block of ints. A String array is a heap block of references, and each string is a further object](../assets/figures/java-array.svg)

Wrapper types box a primitive. `Integer j = 3` is autoboxing: the compiler inserts the conversion to an `Integer` object. `Integer i = new Integer(3)` is the explicit form. The lecture warns that this allocation is easy to miss inside a hot loop.

`Object` contributes `equals` for value equality and the other methods every class inherits. `==` on references compares identity, not the field values, unless you are comparing primitives.

## Inheritance, interfaces, exceptions

Java inheritance uses `extends`, and it is public only. Every class extends `Object`, directly or through its parent. A class has one superclass. It may implement many interfaces. `@Override` marks an override. `super` names the base. Every instance method is virtual. Static methods are not: a static call uses the compile-time class, which the lecture demonstrates with `A.staticFunc` hidden by `B`.

```java
class A {
    void func() { System.out.println("A"); }
    static void staticFunc() { /* A's version */ }
}
class B extends A {
    @Override void func() { super.func(); }
}
```

An interface says what the object can do and, originally, gives no code. A class may implement several. From the practical session, an interface may also carry a default method, used when one implementation fits almost everyone. `Stack.isEmpty` as `return size() == 0` is the session's example: it only calls operations the interface already has.

```java
interface Worker { void work(); }
abstract class Shape { abstract double area(); }
class Circle extends Shape {
    double area() { return Math.PI * r * r; }
}
```

An abstract class mixes real methods with abstract ones and cannot be instantiated. An interface is the pure "what", with default methods as the later exception.

:::definition id=def-exception title="Exceptions" source="Classes/Chapter 7 - Back to Java.pptx"
An exception is a failure the virtual machine reports at run time by throwing an object. Checked exceptions extend `Exception`, may be legitimate failures such as a missing file, and must be caught or declared with `throws`. Unchecked exceptions extend `RuntimeException` and represent bugs: a null dereference, a bad index, division by zero. `Error` extends `java.lang.Error` and is a failure of the runtime itself, such as `StackOverflowError` or `OutOfMemoryError`. You do not catch those in ordinary code.
:::

`try` runs the body. `catch` handles one type. `finally` runs on the way out, including on `return`, `break`, and a thrown exception. Session 5's picture is a chain of calls: the exception walks back until a frame has a handler. If `main` has none, the JVM terminates the program.

Closing a resource can itself throw. A `close` inside `finally` can mask the original exception. Try-with-resources puts an `AutoCloseable` in the `try` header and closes it. If the body throws and `close` throws too, the close exception is suppressed and attached to the original, which is the session's last slide.

The collector walks objects reachable from stacks and from statics. An object with no path is reclaimed. There is no `delete`. A leak in this model is a reference you still hold.

:::problem id=worked-array-layout source="Classes/Chapter 7 - Back to Java.pptx" kind=worked solution_origin=source
`int[] a = new int[10];` and `String[] b = new String[10];` inside `main`. What is on the stack, and what is on the heap?

:::solution
`a` and `b` are references in `main`'s frame. `a` points at one heap array object that stores a header, the length 10, and ten `int`s. `b` points at one heap array of ten references. Those references start null. Each `new String` you later store is a further heap object. The ten strings are not inside `b`'s block.
:::
:::

:::check id=chk-checked
A method calls an API that throws `java.io.FileNotFoundException`, a checked exception. What does the compiler require?

- [ ] Nothing, because only `Error` is mandatory
- [x] A `try/catch` for that exception, or a `throws` clause
- [ ] A `finally` block and no `catch`

Checked exceptions are part of the method's type. Unchecked exceptions and `Error` are not.
:::

:::trap
`==` on two `Integer` objects compares references. Two boxed `200`s can be different objects. `equals` compares the values. The autobox cache makes some small integers share one object, which is why `==` appears to work until the number leaves the cache.
:::

:::trap
Catching `Error`, or catching `Exception` around a programming bug, hides the failure the lecture wants you to see. `finally` that throws replaces the exception you were handling.
:::

## Practice

:::problem id=ps5-checked-exception source="Exrecises/SPL_PS5.pptx" kind=exercise solution_origin=source
Session 5 contrasts a checked exception with an unchecked one. `FileNotFoundException` is checked. `ArithmeticException` is unchecked. For each, say whether the program compiles if the caller ignores it, and where a thrown exception goes if no frame handles it.

:::hint
The session's table: unchecked compiles even when it is ignored. Checked does not.
:::
:::hint
Handling a checked exception is `try/catch` or `throws` on the method.
:::
:::hint
The call-stack picture ends at the JVM when `main` has no handler.
:::
:::solution
Ignoring `ArithmeticException` still compiles. Handling it is optional and usually wrong if it means a bug you should fix. Ignoring `FileNotFoundException` does not compile. The method must catch it or declare `throws FileNotFoundException`, and the caller then faces the same choice.

If the exception is thrown and no frame from the throw site out to `main` has a matching `catch`, the JVM terminates the program and reports the exception. `finally` blocks along that walk still run. A try-with-resources closes the resource on that path; a second failure from `close` is suppressed rather than replacing the first exception.
:::
:::

Java's "every instance method is virtual" is the rule [Inheritance](topic:inheritance) had to ask for with the `virtual` keyword. Next, [Concurrency](topic:concurrency) is what happens when more than one of those methods runs at once.
