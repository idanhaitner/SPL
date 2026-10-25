---
id: run-time-environment
title: The run-time environment
blurb: "What the course covers, the operating system and the JVM as run-time environments, and building a C++ program."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 1 - The Memory Model.pptx"
  - "materials/lectures/Chapter 7 - Back to Java.pptx"
  - "materials/sessions/SPL_PS1 (1).pptx"
---

This chapter introduces the course and the idea that ties it together: a program never talks to the hardware directly, but through a run-time environment.

- **The course:** what systems programming is, and which four topics it covers.
- **Two run-time environments:** the operating system, which runs every process, and the JVM, which runs Java programs on top of it.
- **Building a C++ program:** how C++ source files become one executable ahead of time, compared with Java, which finishes the job while the program runs.

## What the course is about

Systems Programming (תכנות מערכות) looks at the design of software systems from many angles. The languages are Java, C++, Python, and SQL. The final grade is 70% exam and 30% programming assignments.

The lecture notes start from one example: a system that searches for a film on the network, downloads it, and plays it.

1. Get the search properties from the user.
2. Search for the film on the web.
3. Display the results, and get the user's choice.
4. Download the film.
5. Play it, which means reading, decoding, and displaying it.

Each step needs a different kind of service.

- **The user interface (GUI):** not interesting for this course. Existing libraries handle it.
- **Searching the network:** data structures and algorithms, and also **communication between processes**, because the search runs on other machines.
- **Downloading the film:** questions of storage, in **memory**, in files, and in **databases**.
- **Playing the film:** **concurrency**, because downloading, decoding, and playing run at the same time, with constraints between them.

Those bold words are the four parts of the course, and of the exam.

| Part | Language | Share of the exam |
| --- | --- | --- |
| Memory management | C++ | 30% |
| Concurrency | Java (its thread libraries) | 30% |
| Communication | Java and C++ | 30% |
| Databases | Python and SQL | 10% |

## Programs, processes, and run-time environments

:::definition id=def-runtime title="Computer, program, process, and run-time environment" source="materials/notes/lecture-notes.docx.pdf"

- **Computer:** a logical unit that can carry out a task on its own. It may be made of several physical computers, as long as one operating system manages them.
- **Program:** a formal definition of a task, written in some language. Examples are a recipe, or a Java program.
- **Process:** a program while a computer is running it.
- **Run-time environment (RTE):** a layer that mediates between a program and the infrastructure it runs on. For a C++ program, that infrastructure is the hardware.
:::

Picture a process that runs directly on the computer and asks the hardware itself for every service. That raises three problems.

- **The program must be written in a language the machine understands,** and at a very specific level: this processor, this disk, this network card. There is no abstraction.
- **The interfaces are inconvenient.** Every service means talking to a device in its own terms.
- **The hardware alone is limited.** It cannot run more programs than there are processors, or run a program that needs more memory than the machine has.

The solution is to put a run-time environment between the program and the infrastructure.

- **It preserves** the useful properties of the infrastructure, so programs can still use what it offers.
- **It abstracts** the infrastructure, so a program does not depend on the exact resources underneath.
- **It offers more convenient interfaces** for reaching the infrastructure.
- **It adds services** that the infrastructure does not provide on its own.

The course looks at two examples of such a layer: the operating system, and the Java virtual machine. A third one, the database management system, appears in [Persistence](topic:persistence).

## The operating system

The operating system is the run-time environment that mediates between a process and the computer's hardware. It provides all four properties.

### 1. It runs programs

When you run a program under the operating system, the process moves through a fixed set of states.

:::definition id=def-process-states title="Process states" source="materials/notes/lecture-notes.docx.pdf"
A process is always in one of five main states.

| State | What happens in it | Next state |
| --- | --- | --- |
| Created | The system builds an object for the process's data (its id, its current state, statistics such as the time it has run), allocates memory, loads the program file, and points the program counter (PC) at the first line of `main` | Runnable |
| Runnable | The process could run, but is waiting for its turn under the scheduling policy | Running |
| Running | The processor runs the line at the PC, then advances the PC to the next line, and so on | Terminated (the program ended); Runnable (its time slice ended); Blocked (a constraint stops the next line, such as reading from a file or the network) |
| Blocked | The process is not in the queue of processes waiting for the processor. It waits for the constraint to go away, for example for data to arrive from the network | Runnable (once the constraint is gone) |
| Terminated | The process's resources are cleaned up and released | none |

![Five process states: Created enters Runnable, Runnable and Running alternate, Running drops to Blocked and returns, and Running finishes in Terminated](../../web/public/figures/process-states.svg)

:::

- **Runnable versus Blocked:** a runnable process is ready and only waits for the scheduler to give it the processor. A blocked process cannot run at all until some I/O or event completes.
- **The program counter (PC):** a processor register that holds the address of the next instruction to execute.

### 2. It abstracts the hardware

The operating system knows every kind of hardware it runs on. When it meets a device it does not know, it needs a **driver** for that device, a piece of code that translates the program's requests into the language of that particular device. The program itself never depends on the device.

### 3. It offers convenient interfaces

- **System calls:** a process reaches the hardware through a set of functions that the operating system provides, called system calls. An ordinary function call, by contrast, stays inside the process.
- **Messages:** events in the hardware, such as a key press or a packet arriving, are delivered to the process as messages from the operating system.
- **Who touches the hardware:** the kernel performs the actual operation on the disk or network card, and reports the result back to the process.

### 4. It adds services the hardware does not have

- **More processes than processors:** a scheduling policy runs some processes while the rest wait. Switching the processor from one process to another is called a context switch.
- **More memory than RAM:** the virtual memory mechanism lets a process use more memory than physically exists. Each process gets its own virtual address space, and one process cannot touch another's memory.
- **Permissions:** files can be read or written only by the right users or groups.

## The Java virtual machine

As we saw, the operating system already gives a process abstraction from the hardware, convenient interfaces, and extra services. In the 1990s those were no longer enough.

- **Running code across the network:** the idea of "running a program" stopped meaning one program on one machine. Code had to move from computer to computer and run there, for example a piece of code sent from a web server to every browser that visits a page. Every client may run a different operating system, so the code must not depend on any one of them.
- **Object-oriented interfaces:** the operating system's interfaces are not object oriented. System calls are not methods of objects, and hardware events reach the program as messages that it must listen for.
- **Finer permissions:** the operating system's permissions are not detailed enough. You may want to control which methods of which class a piece of code may call.

So a second run-time environment was added between the process and the operating system: the Java Virtual Machine (JVM). The process calls methods of the JVM, and the JVM uses the operating system's messages and system calls on its behalf.

The JVM provides the same four properties.

### 1. It runs programs

The JVM runs programs written as `class` files, in a language called bytecode. Bytecode does **not** depend on the operating system: it is close to the processor's assembly language, but not yet translated for any particular machine.

```text
> javac A.java
A.class

> java A

```

- **`javac A.java`** compiles the Java program into the bytecode file `A.class`.
- **The operating system cannot run `A.class`,** because it is not written in the processor's language. To run it, you ask a run-time environment that can run class files, the JVM.
- **`java A`** runs the JVM as a process of the operating system, and passes it the name of the class to run.
- **The JVM compiles `A`** into the machine code of the processor under the current operating system, while the program runs. Every time a new class is needed, it is compiled at that moment. This is called just-in-time (JIT) compilation.
- **The JVM sets the PC** of its own process to the first line of `A`'s `main` method.

### 2. It abstracts the operating system

Java code is compiled in two stages.

- **Offline:** into bytecode, which does not depend on the operating system. `javac` does this once.
- **Online:** into the machine code of the current processor and operating system, each time the program runs. The JVM (`java`) does this while the program runs.

Compare this with what happens to a C++ program. Given `A.cpp` with a `main` function, you compile it like this.

```text
> g++ A.cpp
A.o

> cl A.cpp
A.exe

```

- **`A.o`** is already written in the processor's assembly language, for the current operating system. It is specific to Linux, and does not run on another operating system such as Windows.
- **To run the program on Windows,** you compile it again on that operating system, here with Microsoft's `cl` compiler.

### 3. It offers convenient interfaces

Every call to the system, and every response to an event, goes through object-oriented interfaces. For example, the class `FileInputStream` supports reading files.

### 4. It adds services

For example, a detailed definition of which methods of which class a piece of code may run.

Because the bytecode does not depend on the machine, the same `.class` file runs on any operating system that has a JVM. Every instance method in Java is also chosen at run time, from the class of the actual object. [Inheritance and polymorphism](topic:inheritance) explains how that works, and why C++ does it only for functions declared `virtual`.

## Building a C++ program

The C++ side of the comparison deserves a closer look, because a real C++ program is not one file. It is split across many `.cpp` files, and each file is compiled on its own. So a file often calls a function whose body lives in a different file. The compiler can still check that call, as long as it knows the function's name and signature.

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
- **Java** has no separate link step. The JVM links dynamically while the program runs, at the moment each class is loaded, which is the same moment it is compiled to machine code.

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

To sum up, a run-time environment sits between a program and the layer below it. It preserves what that layer offers, hides its details, gives it a better interface, and adds services. The operating system does this for the hardware, and the JVM does it again for the operating system.

- **Next:** [The memory model](topic:memory-model) looks at the first service in detail: how memory is seen by the hardware, by the operating system, and by a programming language.
