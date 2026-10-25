---
id: memory-model
title: The memory model
sources:
  - "materials/lectures/Chapter 1 - The Memory Model.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS2 (1).pptx"
---

This chapter shows how a running C++ program sits on the machine: what runs it, how its memory is divided into five regions, and why the stack and the heap are kept separate.

- **The run-time environment:** how the operating system turns a program into a running process.
- **The five regions:** the stack, the heap, two static-data regions, and the code, all inside one virtual address space.
- **The design and the machine:** why those regions exist, and what a running process looks like on a von Neumann machine.

## The run-time environment

Systems programming keeps the programmer close to the machine. You deal directly with memory, with communication protocols, and with the run-time environment (סביבת זמן ריצה) that executes your program.

Consider a program that searches for a film on the network, downloads it, and plays it.

- **It needs many services:** searching the network, reading and writing files, and decoding video.
- **The program does not talk to the hardware for these.** A layer between the program and the hardware provides them, on top of the processor's raw instruction set. That layer is the run-time environment.

:::definition id=def-runtime title="Computer, program, process, and run-time environment" source="materials/notes/lecture-notes.docx.pdf"

- **Computer:** a machine that carries out tasks on its own, through its instruction set.
- **Program:** a passive collection of instructions, which formally describes a task.
- **Process:** one execution of a program, with its own address space and its own state.
- **Run-time environment:** the layer between a program and the infrastructure it runs on. For a C++ program, that layer is the operating system, and the infrastructure under it is the hardware.
- **The four jobs of a run-time environment:**
  - **It preserves** the useful properties of the infrastructure.
  - **It abstracts** the infrastructure, hiding its details.
  - **It offers an interface** that is more convenient than the infrastructure itself.
  - **It adds services** that the infrastructure does not provide on its own.
:::

The operating system is the run-time environment of a C++ process.

- **Its position:** it stands between the process and the hardware.
- **Starting a program:** the operating system creates a process for it, and then moves the process from state to state as it runs.
- **The program counter (PC):** a processor register that holds the address of the next instruction to execute.

:::definition id=def-process-states title="Process states" source="materials/notes/lecture-notes.docx.pdf"
A process is always in one of five main states.

| State | Description | Next state |
| --- | --- | --- |
| Created | The process object is built, memory is allocated, the file is loaded, and the PC points at the first line of `main` | Runnable |
| Runnable | The process is ready to run and is waiting for its turn from the scheduler | Running |
| Running | The process is executing on the CPU. Each step advances the PC to the next instruction | Runnable (when the time slice ends); Blocked (waiting for an event or for I/O); Terminated (when the program finishes) |
| Blocked | The process cannot run at the moment, and it is not in the scheduler's ready queue | Runnable (once the cause of the block is gone) |
| Terminated | The resources have been released and the process has ended | none |

![Five process states: Created enters Runnable, Runnable and Running alternate, Running drops to Blocked and returns, and Running finishes in Terminated](../../web/public/figures/process-states.svg)

:::

A few points about the states, and about the other services the operating system provides to a running process.

- **Runnable versus Blocked:** a runnable process is ready and only waiting for the scheduler to give it the CPU. A blocked process cannot run at all until some I/O or event completes.
- **System calls:** a process asks the operating system's kernel for a service, such as reading a file, through a system call. An ordinary function call, by contrast, stays inside the process.
- **Who touches the hardware:** the kernel performs the actual operation on the disk or network card, and reports the result back to the process.
- **Multitasking:** the operating system can run more processes than there are CPU cores, by quickly switching the CPU from one process to another. That switch is called a context switch.
- **Virtual memory:** each process gets its own virtual address space, which is usually larger than the physical RAM.
- **Protection:** the operating system enforces permissions on files and on memory, so one process cannot touch another's memory.
- **The JVM** is another run-time environment, which runs on top of the operating system. As the chapter [Back to Java](topic:java-runtime) explains, this is what lets the same bytecode run on different operating systems.

## The five regions

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
int* pi = new int[10];             // pi on the stack, the ten ints on the heap
Student* ps = new Student("Avi");  // ps on the stack, the Student on the heap

```

- **The first line** puts the pointer `pi` on the stack, holding an address, and the ten integers on the heap, as one contiguous block.
- **The second line** puts the pointer `ps` on the stack, and the `Student` object on the heap.
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
Explain where `ps` is stored, where the `Student` object is stored, and what happens in memory if nobody calls `delete`.

```cpp
int main() {
    Student* ps = new Student("Avi");
    return 0;
}

```

:::solution

- **`ps`** is a local pointer, so it occupies a cell in `main`'s stack frame.
- **The `Student` object** is created by `new`, so it lives on the heap.

```text
stack (main):  ps  ----------+
                             |
heap:                        v
                       Student("Avi")

```

- **When `main` returns,** its frame is popped and `ps` disappears.
- **The `Student` block** stays allocated, but nothing points to it anymore, so it is a memory leak. In practice the operating system reclaims all of the process's memory when it exits, but inside a long-running program, a leak like this keeps growing.
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

## The von Neumann machine

In the von Neumann architecture, the same RAM holds both a program's data and its code, the instructions.

:::definition id=def-von-neumann title="The von Neumann machine" source="materials/lectures/Chapter 1 - The Memory Model.pptx"

- **The parts:** a von Neumann machine has a processor (CPU), a bus, and one main memory (RAM) shared by code and data.
- **The fetch-decode-execute cycle:** the processor repeatedly fetches the next instruction from memory, decodes it, and executes it.
:::

![A von Neumann machine: a CPU, a bus, and one RAM that holds both the program and the data](../../web/public/figures/von-neumann-architecture.svg)

These are the main parts of the processor.

- **The control unit (CU)** runs the fetch-decode-execute cycle in step with the clock, and handles input and output through interrupts.
- **The arithmetic-logic unit (ALU)** performs arithmetic, logical operations, comparisons, and bitwise operations, and detects arithmetic overflow.
- **Registers** are the fastest storage in the machine, inside the processor itself.
- **General-purpose registers** hold the values for the operation in progress, which are moved in and out of memory with `load` and `store`.
- **Special registers** hold the execution state, such as `ip` (the instruction pointer) and `rsp` (the stack pointer).
- **The cache** is fast memory between the registers and the RAM. It has several levels: L1 is the smallest and fastest, then L2, then L3.

![The processor components in a table, then the cache, the bus, and RAM, with the fast end of the memory hierarchy at the top](../../web/public/figures/memory-hierarchy.svg)

- **The regions are only a software convention.** The stack, the heap, and the code are all ordinary parts of the same physical RAM.
- **For example,** when the processor loads a local variable, the address is in the stack region, and when it reads through the pointer `pi`, the address is in the heap region.
- **Either way,** the access travels over the same bus.

The memory hierarchy, listed from the fastest and smallest level to the slowest and largest:

| Component | Role | Retains data with the power off? |
| --- | --- | --- |
| Register | Values for the processor's current operation | No |
| Cache | A copy of recently used RAM cells, so the processor can avoid a slow access | No |
| Main memory (RAM) | The process's data and code during the run | No |
| Disk (SSD/HDD) | Permanent storage for files | Yes |
| Magnetic tape | Long-term backup and retrieval | Yes |

- **The data bus width** is how many bits move in one memory transfer. It usually matches the machine's word size.
- **The address bus width** determines how much memory the processor can address. For example, 32 address bits can address 2³² bytes, which is 4 GB.

The processor's raw instruction set includes simple operations like these.

- `READ 100 R1`: copy the contents of cell 100 into register R1.
- `ADD R1 R2 R3`: add the contents of R1 and R2, and store the result in R3.
- `WRITE R3 200`: copy the contents of R3 into cell 200.

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

The lecture notes describe the stack and the heap as two simple machines on top of this RAM, each with a small set of operations.

**Stack operations:**

- `createAF`: create a new stack frame.
- `removeAF`: remove the current frame and return to the caller's frame.
- `push`: add a cell at the top of the current frame.
- `pop`: remove the cell at the top of the frame.
- `read` / `write`: access a cell in the current frame only.

**Heap operations:**

- `new`: allocate a free run of cells on the heap and mark them occupied for this process.
- `delete`: release an allocated range and mark it free.
- `read` / `write`: access a cell that is currently allocated on the heap.
- **After `delete`:** reading or writing a released cell is undefined behavior. It may crash with a segmentation fault, or it may silently corrupt data.

A procedure call goes through these steps, in order.

1. `createAF` creates a new frame.
2. The return address is pushed.
3. If the call is a method of an object, the `this` pointer is pushed.
4. The arguments are pushed.
5. The body runs, and the return value is written to a temporary location.
6. The arguments are popped, and `removeAF` removes the frame, returning control to the caller's frame.

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

This picture of memory is the base for the rest of the course.

- **Next:** [Pointers and references](topic:pointers) looks closely at a stack cell that holds an address, which is only useful while the heap block it points at is alive.
- **Later:** [The rule of three](topic:rule-of-three) shows what happens when objects that own heap buffers are copied, including the past-exam `mvector` questions that need a deep copy.
