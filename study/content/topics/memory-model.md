---
id: memory-model
title: The memory model
blurb: "Memory as the hardware, the operating system, and a language see it; the stack and heap models; and the regions of a C++ process."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 1 - The Memory Model.pptx"
  - "materials/sessions/SPL_PS2 (1).pptx"
---

The word "memory" means different things depending on who is looking at it. This chapter looks at it three times, and then builds the two models, the stack and the heap, that the rest of the course draws on.

- **Three views:** memory as the hardware sees it, as the operating system sees it, and as a programming language sees it.
- **The stack and the heap:** two ways to organize the cells a process receives, and how a compiler translates code into operations on them.
- **A C++ process:** the five regions of its address space, with stack frames, heap blocks, and static variables.

## Three views of memory

### The hardware view

For the hardware, memory means the different technologies for storing information, and the operations on them.

| Technology | Where | Access time | Keeps data with the power off? |
| --- | --- | --- | --- |
| Registers | On the processor chip | 1 clock pulse | No |
| Cache memory | On the processor chip | About 3 pulses | No |
| RAM | A separate component from the processor | About 10 pulses | No |
| Disk | "Motherboard" storage: magnetic, or SSD, which is faster | About 10,000 pulses | Yes |
| Tape | Optical technology with slow access | Slowest | Yes |

You can compare the technologies by four parameters: size, access speed, price, and whether the data survives when the power is cut.

- **The rule:** the faster the access to the data, the smaller and more expensive the storage.

- **Registers** hold the data the processor needs for the operation it is running now. Some registers have fixed jobs, such as the address of the next line of code to run (the `pc` register) or the address of the top of the current process's stack (the `sp` register).
- **The cache** keeps a copy of "popular" RAM cells, the ones read or written most recently, to cut the time it takes to reach them.
- **RAM** holds the information a process needs while it runs, in particular the program's variables.
- **The disk** holds information the user needs over time.
- **Tape** is used for backups.

![The processor components in a table, then the cache, the bus, and RAM, with the fast end of the memory hierarchy at the top](../../web/public/figures/memory-hierarchy.svg)

The processor and the RAM are connected by two buses.

- **The data bus width** is the number of bits that can be read or written in one operation, the size of one memory "cell", called a word. It is also the size of the registers.
- **The address bus width** fixes how much memory the processor can reach. A RAM larger than that cannot be fully addressed, because each cell's address is described only by the bits of the address bus. For example, 32 address bits can address 2³² bytes, which is 4 GB.

:::definition id=def-von-neumann title="The von Neumann machine" source="materials/lectures/Chapter 1 - The Memory Model.pptx"

- **The parts:** a von Neumann machine has a processor (CPU), a bus, and one main memory (RAM) shared by code and data.
- **The fetch-decode-execute cycle:** the processor repeatedly fetches the next instruction from memory, decodes it, and executes it.
:::

![A von Neumann machine: a CPU, a bus, and one RAM that holds both the program and the data](../../web/public/figures/von-neumann-architecture.svg)

These are the main parts of the processor.

- **The control unit (CU)** runs the fetch-decode-execute cycle in step with the clock, and handles input and output through interrupts.
- **The arithmetic-logic unit (ALU)** performs arithmetic, logical operations, comparisons, and bitwise operations, and detects arithmetic overflow.
- **Registers** are the fastest storage in the machine, inside the processor itself.

Every processor has a set of operations it knows how to run, called its **instruction set**. Besides arithmetic, it has two basic memory operations: writing to RAM and reading from RAM.

- `ADD R1 R2 R3`: add the contents of registers R1 and R2, and write the sum into register R3.
- `READ 100 R1`: copy the contents of cell 100 in RAM into register R1.
- `WRITE R2 200`: copy the contents of register R2 into cell 200 in RAM.

:::problem id=worked-add-trace title="A trace of an addition" source="materials/notes/lecture-notes.docx.pdf" kind=worked solution_origin=source
The variable `i` is stored in cell 3000 and the variable `j` in cell 4000. Translate the fragment into `READ`, `WRITE`, and `ADD` instructions.

```java
int i = 10;
int j = 20;
i = i + j;

```

:::solution
First the initial values are written into memory. Then both are loaded into registers, the ALU adds them, and the result is written back into the cell of `i`.

```text
WRITE 3000 10
WRITE 4000 20
READ  3000 R1
READ  4000 R2
ADD   R1 R2 R3
WRITE 3000 R3

```

- **The final result:** cell 3000, which is `i`, holds 30.
- **The ALU cannot add memory cells directly.** The values must first be loaded into registers, and the result must be written back to memory.
:::
:::

### The operating system view

For the operating system, the question is how to give memory to processes.

- **Allocating memory to a process:** how to find free cells in RAM, and what happens if there are none. Must the cells be contiguous? Can the process's memory grow while it runs?
- **Sharing memory between processes:** how to give memory to two processes when there is not room for both. This is part of the context switch.
- **More memory than RAM:** how to give a process more memory than the RAM has. This is virtual memory.

### The programming language view

A programming language organizes the memory that the operating system gives it. The questions here are the ones the next chapters answer.

- **Organization:** how to arrange the memory in data structures that support different usage patterns while the program runs. This chapter answers it with the stack and the heap.
- **Functions:** how a call to a function, and the return from it, are carried out in memory. That comes later in this chapter.
- **Variables:** what they represent, and how they are kept in memory. See [Variables, pointers, and references](topic:pointers).
- **Objects:** how they are laid out in memory, created, copied, moved, and deleted. See [Classes and objects](topic:classes-and-objects), [The rule of three](topic:rule-of-three), and [The rule of five](topic:rule-of-five).
- **Inheritance and polymorphism:** how these ideas are carried out in memory. See [Inheritance and polymorphism](topic:inheritance).

## The stack and the heap

The operating system allocates a memory region to each process: an array of cells that the process reaches by reading or writing through an index, the address of the cell. From the process's point of view the cells are contiguous, even if physically they are not.

Programming languages arrange that region as data structures that match the different ways a program uses memory while it runs.

### Two usage patterns

Think of the reservations for a cinema hall during one day. Some are made long in advance, for a known number of seats. Others arrive while the day is already running, for a number of seats nobody could know ahead. A program uses memory in the same two ways.

**Static use.** A procedure is called and runs, or a variable is defined whose size is known at compile time.

- **The memory is known in advance** ("compile time"), and it is used only while the procedure runs.
- **Allocation and release are automatic.** The run-time environment does them, and allocation is efficient: it goes in the last place that was freed, and release happens at the end of the use.
- **The advantage** is efficiency. **The drawback** is rigidity.

**Dynamic use.** Information is defined whose size is not known at compile time, for example a structure whose size depends on user input, or whose lifetime is not known.

- **The memory is known only at run time.** Allocation searches the memory for free space, and release depends on the programmer, which can leave "holes" in memory.
- **The advantage** is flexibility. **The drawback** is efficiency.

The memory a process receives is organized, by the operating system, as two data structures.

- **The stack** supports the static usage pattern, which is efficient.
- **The heap** supports the dynamic usage pattern, which is flexible.

### The operations of each model

**The heap** is a data structure with these operations.

- `new`: allocate a run of contiguous cells, given the number of cells as a parameter. Each cell of the heap carries a flag saying whether it is allocated. `new` marks the run as allocated.
- `delete`: release a run of cells. It clears the allocation flag.
- `read`: read an allocated cell, by its address. Reading a cell that is not allocated is a run-time error.
- `write`: write an allocated cell, by its address. Writing a cell that is not allocated is a run-time error.

**The stack** is a data structure with these operations.

- `createAF`: open a new region on the stack, called an activation frame (AF). Unlike the stack data structure from the data-structures course, our stack holds cells, but also groups them into regions. The stack keeps a list of the addresses where the regions start, and `createAF` adds the current top of the stack to that list.
- `removeAF`: return to the previous region on the stack. It removes the last address from the list.
- `push`: add one cell at the top of the stack, in the current region (AF).
- `pop`: remove one cell from the top of the stack, from the current region.
- `read`: read one of the cells in the current region. Unlike the stack data structure, you may read any cell of the region, not only the last one.
- `write`: write one of the cells in the current region, again any cell of the region.

### How a compiler uses them

The compiler translates the program's code into operations on the stack and the heap. The general principle is that while the program runs, a procedure can reach memory (the stack or the heap) **only through the activation frame on top of the stack**.

**1. Variables**

- **Defining a variable** is always translated into `push` operations, according to its size, which is known at compile time.
- **At the end of a block of code** (the closing `}` in Java), there is a `pop` for every variable that was defined in that block.
- **Reaching a variable** in the AF, to read or write it, becomes `read` or `write` on the variable's cell. The variable's place relative to the top of the AF is known at compile time, so the compiler keeps a variable that points at the top of the stack, and sometimes keeps it in a register.

**2. A call to a procedure**

1. Open a new region on the stack (`createAF`).
2. `push` the address of the next line in the code, so that the procedure knows where to return when it ends. That address is called the return address (`ra`).
3. `push` every argument passed to the procedure, and write the values into place.
4. Move to the procedure's code, by setting the `pc` to the procedure's address.

**3. The definition of a function**

1. At the end of the procedure, the returned value is written to a temporary place, such as a register set aside for it, so it can be copied to the right place in the previous AF.
2. At the end of the procedure, besides `pop` for every variable defined in the block, including the parameters sent to it, there is a return to the previous AF (`removeAF`).
3. Return to the caller's code, by setting the `pc` to the return address received as a parameter.

**4. Dynamic information**

- **Whenever information is defined whose size is known only at run time,** both its size and its lifetime are left to the programmer: allocation and release are written in by the programmer, with a call to `new` on the heap when it is created, and to `delete` when it is no longer needed.

### Following one call

Put the four rules together on a tiny program.

```java
static int add(int i, int j) {
    int r = i + j;
    return r;
}

int k = add(1, 2);
```

**In the caller, the line `int k = add(1, 2);` becomes:**

1. `push` a cell for `k`.
2. `createAF`: open a new frame for `add`.
3. `push` the return address, the line to come back to.
4. `push` a cell for `i` and write 1 into it, then `push` a cell for `j` and write 2.
5. Set the `pc` to the first line of `add`.

**Inside `add`:**

1. `push` a cell for `r`.
2. Read `i` and `j` into registers, add them, and write 3 into `r`.
3. Copy `r` into a temporary place, such as a register, so it survives what comes next.
4. `pop` `r`, `j`, `i`, and the return address, then `removeAF`.
5. Set the `pc` to the return address.

**Back in the caller,** the value in the temporary place is written into `k`.

While `add` runs, just before it returns, the stack looks like this:

| Frame | Cell | Value |
| --- | --- | --- |
| caller | `k` | not set yet |
| `add` | return address | the line after the call |
| `add` | `i` | 1 |
| `add` | `j` | 2 |
| `add` | `r` | 3 |

**And for `new`?** `int[] a = new int[2];` pushes one cell for `a` on the stack, calls `heap.new` for the cells of the array, and writes the array's address into `a`.

:::check id=chk-trace-temp
Why is the returned value copied to a temporary place before the frame is removed?

- [ ] Because registers are faster than the stack
- [x] Because `r` is popped with the frame, and the caller still needs its value
- [ ] Because the caller cannot read the stack

- **`r` lives in `add`'s frame,** and `removeAF` throws that frame away.
- **The temporary place survives the return,** so the caller can copy the value into `k`.
:::

To summarize:

- **The different usage patterns** become operations on the stack and on the heap.
- **A procedure needs extra information:** the parameters and the return address.
- **A function needs temporary storage** for the returned value, and for the return address, until the return.
- **The advantage of the stack** is efficient allocation, with a simple `push`, and automatic release with `pop` at the end of the block, which guarantees there are no "holes" in memory. **Its drawback** is rigidity: the size of the information must be known in advance, and its lifetime is that of the block.
- **The advantage of the heap** is flexibility: there is no need to commit in advance to the size of the information or to how long it is used. **Its drawback** is the search for free space when allocating with `new` at run time, and the danger of holes in memory, called a **memory leak**, when `delete` is not called.

## The memory of a C++ process

A process's virtual address space runs from low addresses to high addresses, and it is divided into regions.

- **Why it matters:** almost every picture in this course is drawn on these regions, for example a pointer (מצביע) on the stack (מחסנית) that holds the address of a buffer on the heap (ערימה).
- **The two growing regions,** the stack and the heap, start at opposite ends and grow toward each other, so the free space between them can be used by whichever one needs it.

:::definition id=def-address-space title="The address space of a process" source="materials/lectures/Chapter 1 - The Memory Model.pptx"
Every running process has its own range of addresses, divided into five main regions.

| Region | Also called | Size | Release | Access |
| --- | --- | --- | --- | --- |
| Stack | Stack | Dynamic (grows and shrinks) | Automatic, in LIFO order | Read and write |
| Heap | Heap | Dynamic (grows and shrinks) | Manual, by the programmer (for example `delete`) | Read and write |
| Uninitialized static data | BSS / Uninitialized Data | Fixed at compile time | For the life of the process | Read and write |
| Initialized static data | Data / Initialized Data | Fixed at compile time | For the life of the process | Read and write |
| Code | Text / Code | Fixed at compile time | For the life of the process | Read only |

![The process address space, high addresses at the top: stack, heap, uninitialized variables, initialized variables, and code](../../web/public/figures/address-space.svg)

The stack sits at the high addresses and grows downward. The code sits at the low addresses.
:::

- **The stack** holds each function's local variables, plus what is needed to return: the return address and saved registers.
- **When a function ends,** its stack frame is popped, and its local variables cease to exist.
- **The heap** is where the program allocates blocks at run time, for example with `new`.
- **A heap block's lifetime** does not depend on the function that allocated it, so the block can outlive that function.
- **Data and BSS** are the two static regions. Their variables live for the whole run of the process.
- **Data** holds static variables that were given an initial value, and **BSS** holds those that were not (they start as zero).
- **The code region (Text)** holds the machine instructions. It is read-only, so a program cannot overwrite its own code by accident.

### Static variables

A static variable lives for the whole run of the program. In these examples, each one starts from a constant that the compiler (מהדר) knows before the program runs.

- **A global variable** (`int a = 1`) lives for the whole run and can be used from every file.
- **A file-scope static** (`static int b = 2`) lives for the whole run, but can be used only in its own file.
- **A function static** (`static int c = 3` inside a function) lives for the whole run, can be used only inside that function, and is initialized once, not on every call.

```cpp
int a = 1;                 // global: whole run, visible from every file
static int b = 2;          // file-scope static: whole run, this file only
void function() {
    static int c = 3;      // function static: whole run, this function only
}                          // c is initialized once, not on every call

```

- **`a`** can be used from any other file that declares it with `extern int a;`.
- **`b`** can be used only in the file that defines it, which is called file scope.
- **`c`** keeps its value from one call of `function` to the next, but only code inside `function` can refer to it.
- **Where they live:** the compiler and linker (מקשר) give all three a fixed address before `main` begins, so every call finds the same variables.

In the next example, `c` and `x` are both declared inside `tick`, but they have very different lifetimes.

- **`c` is static,** so it lives in the static region and is initialized only once.
- **`x` is an ordinary local,** so it lives in the stack frame, and each call gets a brand-new `x`.

```cpp
void tick() {
    static int c = 0;   // static region, initialized on the first call
    int x = c;          // stack, a new x on every call
    c = c + 1;
}

int main() {
    tick();             // x is 0, then c becomes 1, then x is gone
    tick();             // x is 1, copied from the c that stayed
}

```

![c stays in the static region after the return. The second call receives a new x that reads the c that remained](../../web/public/figures/static-calls.svg)

| Moment | `c` | `x` |
| --- | --- | --- |
| First call, at the line `int x = c` | 0 | 0 |
| First call, when the function ends | 1 | Gone (popped off the stack) |
| Second call, at the line `int x = c` | 1 | 1 |

:::trap
Global variables, and local variables declared `static`, live in the static region for the whole run of the program.

- **They are not on the stack,** even when they are declared inside a function, so they survive when the function returns.
- **They are not on the heap** either, so they are never released with `delete`.
:::

### The stack frame

:::definition id=def-stack-frame title="Stack frame" source="materials/lectures/Chapter 1 - The Memory Model.pptx"

- **A stack frame** (also called an activation record) is pushed onto the stack on every function call.
- **It contains** the return address, the parameters that were passed, and the function's local variables.
- **Frames are removed in LIFO order** (last in, first out): when a function returns, its frame, the most recent one, is popped.
:::

- **Local variables** are allocated inside the frame of the current call.
- **Why the stack is fast:** allocating and releasing a frame only moves the stack pointer. There is no search for a free block.
- **When locals die:** a local stops existing when its function returns, because the frame's memory is then reused by later calls.
- **Stack overflow** happens when there is no room left on the stack for another frame. The usual causes are infinite recursion and very large local arrays.
- **Pass by value:** in the call `foo(a)` below, the value of `a` is copied into a new parameter `n`.
- **Pass by reference:** if `n` were a reference (רפרנס) parameter instead, `n` would be another name for the caller's `a`, not a copy.

```cpp
void foo(int n) {
    int x = n * 2;
}

int main() {
    int a = 4;
    foo(a);
    return 0;
}

```

While `foo` is running, the stack holds two frames.

- **`main`'s frame** holds `a`.
- **`foo`'s frame,** on top of it, holds the return address, the parameter `n`, and the local variable `x`.
- **When `foo` returns,** its frame is popped, and only `main`'s frame remains.

![While foo is running, n and x sit in foo's frame below main. After the return only main's frame remains, and a is still in that frame.](../../web/public/figures/stack-frames.svg)

| Name | While `foo` is running | After `foo` returns |
| --- | --- | --- |
| `a` | In `main`'s frame, value 4 | Still in `main`'s frame, value 4 |
| `n` | In `foo`'s frame, value 4 | Gone when the frame is popped |
| `x` | In `foo`'s frame, value 8 | Gone when the frame is popped |
| Return address | In `foo`'s frame, points back into `main` | Popped in order to perform the return, then gone |

:::problem id=worked-frame-call title="The frame of a call" source="materials/lectures/Chapter 1 - The Memory Model.pptx" kind=worked solution_origin=source
Where are `n` and `x` stored while `foo` is running, and what remains after `foo` returns?

```cpp
void foo(int n) {
    int x = n * 2;
}

int main() {
    int a = 4;
    foo(a);
    return 0;
}

```

:::solution

- **Where they are:** `n` and `x` are both in `foo`'s stack frame, which sits on top of `main`'s frame.
- **Their values:** `n` is the parameter, a copy of the value 4 from `main`, and `x` is a local holding 8.
- **After the return:** `foo`'s frame is popped, so `n` and `x` no longer exist.
- **What is left:** `a` is still in `main`'s frame, with the value 4. It never changed, because `n` was only a copy.
- **A related case:** if `foo` had allocated a block with `new`, that block would stay on the heap after the return, even though the pointer to it disappeared with the frame.
:::
:::

:::check id=chk-frame-gone
After `foo` returns, which of the following is still in memory?

```cpp
void foo(int n) {
    int x = n * 2;
}
int main() {
    int a = 4;
    foo(a);
}

```

- [ ] `n`, because the parameter was passed in
- [ ] `x`, because it was initialized
- [x] only `a`

- **`n` and `x`** belonged to `foo`'s frame, and that frame was popped when `foo` returned.
- **`a`** lives in `main`'s frame, which is still on the stack, because `main` has not returned.
:::

### The heap

The stack cannot hold an object that must outlive the function that created it. Such an object is allocated on the heap with `new` and released with `delete`.

```cpp
int* pi = new int;       // one int on the heap; pi itself is local
delete pi;

int* arr = new int[10];  // ten ints on the heap
delete[] arr;            // the array form, not delete

```

- **Heap versus stack lifetime:** a heap block can outlive the function that allocated it, but a stack local is released as soon as its frame is popped.
- **Why `new` is slower:** it must search for a free range of the right size, and keep a record of which blocks are occupied and which are free.
- **Who does that work:** the memory manager, a part of the C++ run-time library, which asks the operating system for more memory when it runs out.
- **Why the stack is faster:** allocating on the stack only moves the stack pointer.
- **A pointer and its block can be in different regions,** as the next example shows.

```cpp
int* pi = new int[10];     // pi on the stack, the ten ints on the heap
double* pd = new double(2.5); // pd on the stack, the double on the heap

```

- **The first line** puts the pointer `pi` on the stack, holding an address, and the ten integers on the heap, as one contiguous block.
- **The second line** puts the pointer `pd` on the stack, and one `double` on the heap.
- **When the function returns,** the pointers disappear with its frame, but the heap blocks do not.

:::check id=chk-where-array
The following line runs inside a function. Where do `pi` and the ten integers live?

```cpp
int* pi = new int[10];

```

- [ ] Both are on the stack
- [x] `pi` is on the stack and the ten integers are on the heap
- [ ] Both are on the heap
- [ ] `pi` is stored in the code region

- **`pi`** is a local variable that holds an address, so it lives in the function's stack frame.
- **The ten integers** are created by `new[]`, so they live on the heap.
:::

Because the heap block outlives the pointer, someone has to release it.

- **In C++, you own every heap block:** `new` obtains it, and only a matching `delete` releases it.
- **An analogy:** `new` is like taking the key to an apartment, and `delete` is returning it. If you never return the key, the apartment stays occupied until the process ends.
- **A memory leak (זליגת זיכרון)** is a heap block that is still marked as occupied, although no pointer in the program holds its address anymore.
- **Garbage collection (איסוף אשפה):** in Java, C#, and Python, the run-time environment frees memory the program can no longer reach, so the programmer does much less of this bookkeeping.
- **Java can still leak,** when a reference stays reachable by accident, for example an object left in a static collection that the program no longer needs.

```cpp
void leaky() {
    int* box = new int(9);   // box is a stack slot, 9 is an int on the heap
}                            // the return pops box and does not call delete

```

![Inside leaky, the pointer on the stack points at the int on the heap. After the return the int is still there, and nothing points to it](../../web/public/figures/heap-leak.svg)

:::problem id=worked-stack-array title="A pointer on the stack" source="materials/lectures/Chapter 1 - The Memory Model.pptx" kind=worked solution_origin=source
Explain where `pa` is stored, where the array is stored, and what happens in memory if nobody calls `delete[]`.

```cpp
int main() {
    int* pa = new int[5];
    return 0;
}

```

:::solution

- **`pa`** is a local pointer, so it occupies a cell in `main`'s stack frame.
- **The five ints** are created by `new[]`, so they live on the heap, as one block.

```text
stack (main):  pa  ----------+
                             |
heap:                        v
                       [ ? | ? | ? | ? | ? ]

```

- **When `main` returns,** its frame is popped and `pa` disappears.
- **The array block** stays allocated, but nothing points to it anymore, so it is a memory leak. In practice the operating system reclaims all of the process's memory when it exits, but inside a long-running program, a leak like this keeps growing.
:::
:::

:::trap
- **`delete`** releases a single object made with `new`.
- **`delete[]`** releases an array made with `new[]`.
- **Using `delete` on memory from `new[]`** is undefined behavior, and can corrupt the heap's bookkeeping.
- **A memory leak** is a different mistake: the block is never released at all.
:::

### All five regions in one run

A single run of a program can use all five regions at the same time, as this example shows.

```cpp
int ready = 1;              // initialized static, whole run
int scratch;                // uninitialized static, whole run

void note() {
    static int calls = 0;   // initialized static, once
    int x = calls;          // local on the stack
    int* box = new int(x);  // box on the stack, the int on the heap
    calls = calls + 1;
    delete box;
}

int main() {
    note();                 // x becomes 0, calls becomes 1, box is gone
    note();                 // x becomes 1, from the calls that stayed
}

```

| Name | Region | Still present after `note` returns? |
| --- | --- | --- |
| `ready` | Initialized static data | Yes, until the process ends |
| `scratch` | Uninitialized static data (BSS) | Yes, until the process ends |
| `calls` | Initialized static data | Yes, it keeps its value across calls |
| `x` | Stack (`note`'s frame) | No, it is popped on return |
| `box` | Stack (`note`'s frame) | No, it is popped on return |
| the `int` from `new` | Heap | Released explicitly before the return (`delete box`) |
| the program's code | Code region (Text) | Yes, read only |

![The second call of note: x and box on the stack, the new int on the heap, calls and ready in static storage, the instructions in the code](../../web/public/figures/five-homes.svg)

### Recursion and the stack

Each recursive call pushes a new frame onto the stack.

- **The earlier frames stay,** because each of those calls is still in progress, waiting for the one it made.
- **`forever` never stops:** it always calls itself again with `n + 1`, so no call ever finishes and no frame is ever popped.
- **The `pad` array** of 256 integers takes space in every frame, so the stack grows quickly until it runs out of room.

```cpp
void forever(int n) {
    int pad[256];
    forever(n + 1);    // this call does not return, so no frame is popped
}

int main() {
    forever(0);
}

```

![forever keeps pushing a frame for n and pad. The stack grows downward until the region is full](../../web/public/figures/recursion-frames.svg)

This example never calls `new`, so the heap stays empty the whole time.

- **How it fails:** with a stack overflow, which usually crashes the program.
- **The opposite failure** is running out of heap, which can happen even with a single stack frame.
- **For example,** a loop that keeps calling `new` without ever releasing the blocks eventually makes `new` fail, which throws `std::bad_alloc`.

## Design considerations

Why are local variables kept on a stack? Because a called function always finishes before the function that called it.

- **The lifetimes are nested,** and a stack, which releases items in LIFO order, matches that nesting exactly: the frame pushed last is always the first one popped.
- **Creating a frame** just moves the stack pointer by a size the compiler already knows.
- **Leaving a frame** moves it back by the same amount.
- **No fragmentation:** because frames are always released in the reverse of the order they were created, the live frames always form one contiguous block, with no gaps.

Two kinds of data cannot live on the stack, and need the heap instead.

1. An object that must keep living after the function that created it has returned.
2. Data whose size is not known at compile time, such as `new int[n]` when `n` is only known at run time.

- **Why the second case needs the heap:** the compiler must know the size of every local in a frame before the program runs.
- **The solution:** the data goes on the heap, and the frame stores only a pointer to it, whose size is fixed and known.

## Practice

:::problem id=ps2-stack-vs-heap title="Stack versus heap" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
`demo` declares four local variables.

```cpp
void demo() {
    int local = 2;
    int* one = new int(2);
    int* many = new int[10];
    string* s = new string("I'm on the heap");
}

```

:::check id=ps2-stack-vs-heap-q1
Where does each object live, and which release matches it?

`local` is an `int` on the {{=stack|heap|code region}} and takes {{=no delete|delete|delete[]}}.

`one` is a pointer on the {{=stack|heap|code region}}. The `int` from `new int(2)` lives on the {{=heap|stack|frame of demo}} and is released with {{=delete|delete[]|no delete}}.

`local` is an ordinary `int` in `demo`'s stack frame, so it disappears automatically on return and must not be deleted. `one` is a local pointer on the stack, but the `int` it points at is a heap block, which must be released with `delete one`.
:::

:::check id=ps2-stack-vs-heap-q2
`many` is a pointer on the {{=stack|heap|code region}}. The array of ten integers lives on the {{=heap|stack|frame of demo}} and is released with {{=delete[]|delete|no delete}}.

`s` is a pointer on the {{=stack|heap|code region}}. The `string` object lives on the {{=heap|stack|frame of demo}} and is released with {{=delete|delete[]|no delete}}.

`many` is a local pointer on the stack, and the array of ten integers is a heap block, which must be released with `delete[] many` because it is an array. `s` is also a local pointer on the stack, and the `string` object is a single heap object, so it is released with `delete s`.
:::

:::check id=ps2-stack-vs-heap-q3
What is true if `demo` returns while those three blocks are still allocated?

- [ ] The return pops the frame and releases the three heap blocks with it.
- [ ] The three pointers move onto the heap, so the blocks stay reachable.
- [x] The return pops the frame and the pointers disappear with it. A block left behind is a memory leak on the heap.

- **On return,** the frame is popped, and the three pointers disappear with it.
- **The heap blocks do not move or disappear.** They stay allocated, and with no pointer left to them, each one is a memory leak.
- **The fix:** release each heap block before the function returns.
:::
:::

:::problem id=mm-pass-by-value title="Pass by value and a leak" source="materials/lectures/Chapter 1 - The Memory Model.pptx" kind=exercise solution_origin=derived
Look at memory twice: while `foo` is running, and again after it returns.

```cpp
void foo(int n) {
    int x = n * 2;
    int* box = new int(x);
}

int main() {
    int a = 4;
    foo(a);
}

```

:::check id=mm-pass-by-value-q1
While `foo` is running, where does each name live?

- [x] `a` is in `main`'s stack frame
- [x] `n` and `x` are in `foo`'s stack frame
- [x] `box` is a pointer cell in `foo`'s frame; the `int` from `new` is on the heap
- [ ] `n` is another name for `a` on the stack

- **`n` is not another name for `a`:** passing by value copies the value 4 into the separate parameter `n`.
- **`box`** is a pointer in `foo`'s frame that holds an address, and the `int` at that address is a block on the heap.
:::

:::check id=mm-pass-by-value-q2
After `foo` returns with no `delete`, what remains?

- [ ] `n`, `x`, and `box` stay in memory until `main` ends
- [x] Only `a` is still on the stack. The heap `int` is still allocated, and nothing points to it
- [ ] The return releases the heap `int` automatically with the frame

- **On return,** `foo`'s frame is popped, so `n`, `x`, and `box` are all gone.
- **The heap `int` is not released** with the frame. It stays allocated with no pointer to it, which is a memory leak.
:::
:::

:::problem id=mm-regions-quiz title="Which region holds the name" source="materials/lectures/Chapter 1 - The Memory Model.pptx" kind=exercise solution_origin=derived
Use the five-region layout from this chapter.

```cpp
int ready = 1;
int scratch;

void note() {
    static int calls = 0;
    int x = calls;
    int* box = new int(x);
    calls = calls + 1;
    delete box;
}

```

:::check id=mm-regions-quiz-q1
Match each name to its region while `note` is running.

`ready` and `calls` live in {{=initialized static data|the stack|the heap}}.

`scratch` lives in {{=uninitialized static data (BSS)|the stack|the code region}}.

`x` and `box` live in {{=note's stack frame|initialized static data|the heap}}.

The `int` from `new` lives on the {{=heap|stack|code region}}.

Global and static variables live in static data for the whole process. `ready` and `calls` have an initial value, so they are in initialized data, while `scratch` has none, so it is in BSS. Ordinary locals live in the current frame, and `new` creates a block on the heap.
:::

:::check id=mm-regions-quiz-q2
After `note` returns, which are still present?

- [x] `ready`, `scratch`, and `calls`
- [ ] `x` and `box`
- [x] the program's code in the code region
- [ ] the `int` from `new`, because `delete box` already ran before the return

- **Still present:** the static variables `ready`, `scratch`, and `calls`, and the program's code, all last for the whole process.
- **Gone:** the locals `x` and `box` disappear with the frame.
- **Also gone:** the heap `int`, because `delete box` released it before the return.
:::
:::

:::problem id=mm-delete-forms title="delete and delete[]" source="materials/lectures/Chapter 1 - The Memory Model.pptx" kind=exercise solution_origin=derived
Choose the matching release for each allocation.

:::check id=mm-delete-forms-q1
`int* p = new int(3);` is released with {{=delete p|delete[] p|no delete}}.

`int* a = new int[10];` is released with {{=delete[] a|delete a|no delete}}.

The rule is simple: memory from `new T` is released with `delete`, and memory from `new T[n]` is released with `delete[]`.
:::

:::check id=mm-delete-forms-q2
What goes wrong if the forms are swapped?

- [x] `delete` on memory from `new[]` is undefined behavior and can corrupt the heap's bookkeeping
- [ ] The compiler always rewrites `delete` into `delete[]` for arrays
- [x] Skipping every `delete` leaves heap blocks allocated after the pointers are gone — a memory leak

- **Using the wrong form** is undefined behavior, which can corrupt the heap's bookkeeping. The compiler does not fix it for you.
- **Never releasing at all** is a different failure: a memory leak.
:::
:::

- **Next:** [Variables, pointers, and references](topic:pointers) decides, for each variable, whether it holds content or an address, and whether it is a new variable or another name for an existing one.
- **Later:** [The rule of three](topic:rule-of-three) shows what happens when objects that own heap buffers are copied.
