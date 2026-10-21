---
id: memory-model
title: The memory model
sources:
  - "materials/lectures/Chapter 1 - The Memory Model.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS2 (1).pptx"
  - "materials/exams/15-a.pdf"
  - "materials/exams/15-a-solution.pdf"
  - "materials/exams/15-b.pdf"
  - "materials/exams/15-b-solution.pdf"
---

Systems programming is the work of writing libraries and services that other programs use. The programmer stays close to the machine: memory, protocols, and the run-time environment (סביבת זמן ריצה) that executes the program. A run-time environment (RTE) is the layer between a program and the infrastructure. It preserves the properties of that infrastructure, adds an abstraction and a usable interface, and supplies services the hardware does not offer on its own. For a C++ program the operating system is the RTE. The JVM is an RTE above the operating system: the Java program uses the JVM, and the JVM uses the OS.

A program (תוכנית) is a passive collection of instructions. A process (תהליך) is one execution of a program. The process has its own address space and its own state, so two runs of the same program at the same time are two processes. The operating system creates the process. It shares CPU time among processes by a context switch: the scheduler suspends one process and resumes another. That sharing is multitasking. The operating system also gives each process a virtual address space of its own. A process reaches the disk or the network by a system call (קריאת מערכת). A system call is the process asking the kernel for a service. An ordinary function call transfers control to another function inside the same process.

The memory of a C++ process is divided into regions. Code, static variables, call frames, and blocks obtained with `new` each live in a different region of the virtual address space. Later pictures in this course are drawings of those regions: a pointer (מצביע) on the stack (מחסנית), a buffer on the heap (ערימה), and an argument passed by value into the frame of the called function.

Java, C#, and Python hide these regions behind garbage collection (איסוף אשפה). The collector releases storage the program can no longer reach. In C++ the programmer owns the lifetime of each dynamic block. `new` obtains a block, and a matching `delete` releases it. A block that is never released is a memory leak (זליגת זיכרון). `new` hands you the key to an apartment, and `delete` returns that key: a forgotten key leaves the apartment occupied for the rest of the process.

## The run-time environment

Consider a system that searches for a film on the network, downloads it, and plays it. Searching the network, reading and writing the file system, and decoding video are three separate services. They are provided by the layer between the program and the hardware, above the processor's instruction set.

:::definition id=def-runtime title="Computer, program, process, and run-time environment" source="materials/notes/lecture-notes.docx.pdf"
A computer is a logical unit that carries out tasks on its own, through its instruction set. A program is a passive collection of instructions: a formal description of a task. A process is one execution of a program, with its own address space and its own state.

A run-time environment is the layer between a program and the infrastructure. For a C++ program that layer is the operating system, and the infrastructure under it is the hardware. The layer has four main roles. It preserves properties of the infrastructure. It supplies an abstraction over that infrastructure. It offers a more convenient interface to the infrastructure. It provides services that the infrastructure does not provide on its own.
:::

The operating system is the run-time environment of a C++ process. It stands between the process and the hardware. When a program is started, the operating system builds the process and moves it from state to state. The program counter (PC) holds the address of the next instruction the processor will execute.

:::definition id=def-process-states title="Process states" source="materials/notes/lecture-notes.docx.pdf"
A process has five main states:

| State | Description | Next state |
| --- | --- | --- |
| Created | The process object is built, memory is allocated, the file is loaded, and the PC points at the first line of `main` | Runnable |
| Runnable | The process is ready to run and is waiting for its turn from the scheduler | Running |
| Running | The process is executing on the CPU. Each step advances the PC to the next instruction | Runnable (when the time slice ends); Blocked (waiting for an event or for I/O); Terminated (when the program finishes) |
| Blocked | The process cannot run at the moment, and it is not in the scheduler's ready queue | Runnable (once the cause of the block is gone) |
| Terminated | The resources have been released and the process has ended | none |

![Five process states: Created enters Runnable, Runnable and Running alternate, Running drops to Blocked and returns, and Running finishes in Terminated](../assets/figures/process-states.svg)

:::

Runnable is the state of waiting for the scheduler. Blocked is the state of waiting for I/O or for an event.

A system call is how a process asks the kernel for a service. An ordinary function call transfers control to code inside the same process. The kernel performs the operation on the disk or the network card. An external hardware event is delivered back to the process as a message from the operating system.

The operating system also does three things for the processes it runs. It multitasks more processes than the machine has physical cores, by a context switch from one process to another. It gives each process an independent virtual address space, usually larger than the physical RAM. It enforces read, write, and execute permissions on files and on memory.

The JVM is a further run-time environment, running above the operating system. The chapter [Back to Java](topic:java-runtime) describes how the same bytecode runs, with only small changes, on different operating systems.

## The five regions

The virtual address space runs from low addresses up to high addresses. Separate regions grow toward each other, so the free range between them can be used by whichever side needs it.

:::definition id=def-address-space title="The address space of a process" source="materials/lectures/Chapter 1 - The Memory Model.pptx"
A running process has an address range of its own. Five main regions sit inside that range:

| Region | Also called | Size | Release | Access |
| --- | --- | --- | --- | --- |
| Stack | Stack | Dynamic (grows and shrinks) | Automatic, in LIFO order | Read and write |
| Heap | Heap | Dynamic (grows and shrinks) | Manual, by the programmer (for example `delete`) | Read and write |
| Uninitialized static data | BSS / Uninitialized Data | Fixed at compile time | For the life of the process | Read and write |
| Initialized static data | Data / Initialized Data | Fixed at compile time | For the life of the process | Read and write |
| Code | Text / Code | Fixed at compile time | For the life of the process | Read only |

![The process address space, high addresses at the top: stack, heap, uninitialized variables, initialized variables, and code](../assets/figures/address-space.svg)

High addresses sit at the end of the stack region, which grows downward. Low addresses sit in the code region.
:::

The stack holds local variables and the data a return needs: the return address, and saved registers. When the function ends, its stack frame is popped and its local variables leave that memory.

The heap is where a program allocates blocks dynamically, for example with `new`. The block's lifetime is separate from the stack frame of the function that allocated it, so the block can remain after that function has returned.

The two static regions, Data and BSS, hold variables whose lifetime is the lifetime of the process. Data holds initialized static data. BSS holds uninitialized static data. The code region, Text, holds the machine instructions the processor fetches and executes. The process reads those instructions through a read-only mapping.

### Static variables

A static variable is initialized with a value the compiler (מהדר) can compute at compile time. The initializer is a constant expression, fixed before the program runs. The keyword `static` has three forms:

```cpp
int a = 1;                 // global: whole run, visible from every file
static int b = 2;          // file-scope static: whole run, this file only
void function() {
    static int c = 3;      // function static: whole run, this function only
}                          // c is initialized once, not on every call

```

Any file that declares `a`, for example with `extern`, can use `a`. Only the file that defines `b` can use `b`. That limit is file scope. `c` keeps its value from one call of `function` to the next, and only the code inside `function` may name `c`. The compiler and the linker (מקשר) give these variables a fixed address before `main` begins. Every later call finds those same variables.

In the next example, `c` and `x` have different lifetimes, although both names appear inside `tick`. `c` lives in the static region, and its initialization runs once. `x` lives in the stack frame, and each call gets a new `x`:

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

![c stays in the static region after the return. The second call receives a new x that reads the c that remained](../assets/figures/static-calls.svg)

| Moment | `c` | `x` |
| --- | --- | --- |
| First call, at the line `int x = c` | 0 | 0 |
| First call, when the function ends | 1 | Gone (popped off the stack) |
| Second call, at the line `int x = c` | 1 | 1 |

### The stack frame

:::definition id=def-stack-frame title="Stack frame" source="materials/lectures/Chapter 1 - The Memory Model.pptx"
A stack frame, also called an activation record, is pushed on every function call. It holds the return address, the parameters that were passed, and the function's local variables. Frames are popped in LIFO order, last in first out, when the function returns.
:::

A local variable is allocated inside the frame of the current call. When the call ends, the run-time releases it by moving the stack pointer. There is no search for a free block, which is why the allocation is fast. The name disappears when the function returns, because the whole frame is then available for a later call to reuse.

A stack overflow means the stack has no room left for another frame. Two common causes are infinite recursion and a very large local array.

In the call `foo(a)`, the value of `a` is copied into a new parameter `n`. This is pass by value. A reference (רפרנס) parameter would be another name for the caller's `a`.

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

While `foo` is running, the stack holds two frames. The frame of `main` holds `a`. The frame of `foo` holds the return address, the parameter `n`, and the local variable `x`. When `foo` finishes, its frame is popped.

![While foo is running, n and x sit in foo's frame below main. After the return only main's frame remains, and a](../assets/figures/stack-frames.svg)

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
Both `n` and `x` are stored in `foo`'s stack frame. `n` is the parameter, a copy of the value 4 passed from `main`, and `x` is a local whose value is 8. That frame sits at the top of the stack, above `main`'s frame, which still holds `a`.

The return from `foo` pops `foo`'s frame, so the names `n` and `x` can no longer be used. The value of `a` is still 4. The call passed `a` by value, so `n` received a copy. A reference parameter would have named `a` itself.

If `foo` had executed `new`, the block on the heap would stay allocated. The pointer that addressed it lived in the frame, and that pointer would disappear with the frame.
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

`n` and `x` belonged to `foo`'s frame, and that frame has been popped. `a` lives in `main`'s frame, which is still on the stack.
:::

### The heap

```cpp
int* pi = new int;       // one int on the heap; pi itself is local
delete pi;

int* arr = new int[10];  // ten ints on the heap
delete[] arr;            // the array form, not delete

```

A block on the heap can outlive the function that allocated it. A local variable on the stack cannot: the local is released when its frame is popped.

The cost of that longer lifetime is time, and a record of what is free. `new` asks the operating system's memory manager to find a free range, so the allocation is much slower than moving the stack pointer. The heap records which blocks are occupied and which are free.

The pointer and the block it addresses may occupy different regions:

```cpp
int* pi = new int[10];             // pi on the stack, the ten ints on the heap
Student* ps = new Student("Avi");  // ps on the stack, the Student on the heap

```

In the first line, `pi` is a local on the stack and it holds an address. The ten integers are one contiguous block on the heap. In the second line, `ps` lives on the stack and the `Student` object lives on the heap.

A stack frame is popped on every return, so a stack allocation ends with the call that created it. A memory leak is a heap block that stays marked occupied after no live pointer in the program still holds its address.

In Java, garbage collection releases an object that has no reachable reference. A memory leak in Java is a reference that stays reachable by accident, for example because it was left in a static collection, after the program no longer needs the object.

```cpp
void leaky() {
    int* box = new int(9);   // box is a stack slot, 9 is an int on the heap
}                            // the return pops box and does not call delete

```

![Inside leaky, the pointer on the stack points at the int on the heap. After the return the int is still there, and nothing points to it](../assets/figures/heap-leak.svg)

### All five regions in one run

One run of a program can use all five regions at the same time:

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

![The second call of note: x and box on the stack, the new int on the heap, calls and ready in static storage, the instructions in the code](../assets/figures/five-homes.svg)

### Recursion and the stack

Each recursive call pushes a new frame. The previous frame stays in place, because the call that created it is still in progress.

In `forever`, the function calls itself again with `n + 1`. No call reaches its end, so no frame is popped. The local array `pad`, 256 integers, takes space in every frame. The stack grows until its region is full.

```cpp
void forever(int n) {
    int pad[256];
    forever(n + 1);    // this call does not return, so no frame is popped
}

int main() {
    forever(0);
}

```

![forever keeps pushing a frame for n and pad. The stack grows downward until the region is full](../assets/figures/recursion-frames.svg)

This example never executes `new`, so the heap stays empty. The failure is a stack overflow.

A program can exhaust the heap with a single stack frame. One function that loops on `new` and never releases the blocks uses one frame, while the free heap shrinks until the allocation fails with `std::bad_alloc`.

## Design considerations

The frame of a called function lives entirely inside the lifetime of the function that called it. A stack matches that nesting. Frames leave in LIFO order: the frame pushed last is the frame popped first. Creating a frame moves the stack pointer by a size the compiler already knows. Leaving the frame moves the pointer back by that same amount. Because frames are released in the reverse of the order in which they were created, live frames occupy one contiguous range. The stack stays free of fragmentation.

Two kinds of storage need the heap:

1. An object whose lifetime must continue after the function that created it has returned.
2. Data whose size is unknown at compile time, such as `new int[n]` when `n` is obtained at run time.

The compiler fixes the size of every local slot in the frame before the program runs. Data of a dynamic size is allocated on the heap. The frame stores only the pointer, and the pointer's size is fixed and known.

## The von Neumann machine

In the von Neumann architecture, the RAM that holds a program's data also holds its code, the instructions.

:::definition id=def-von-neumann title="The von Neumann machine" source="materials/lectures/Chapter 1 - The Memory Model.pptx"
The von Neumann architecture is a processor (CPU), a bus, and a main memory (RAM) shared by code and data. The processor repeats a fixed cycle of fetch, decode, and execute. It fetches an instruction from memory, decodes it, and executes it.
:::

![A von Neumann machine: a CPU, a bus, and one RAM that holds both the program and the data](../assets/figures/von-neumann-architecture.svg)

The main parts of the processor:

- **Control unit (CU).** It runs the fetch-decode-execute cycle, stays in step with the clock, and handles input and output through interrupts.
- **Arithmetic-logic unit (ALU).** It performs arithmetic, logical operations, comparisons, bitwise operations, and checks for arithmetic overflow.
- **Registers.** These are the fastest storage in the processor. General-purpose registers hold values for the operation in progress (`load`, `store`). Dedicated registers hold execution state, including `ip`, the instruction pointer, and `rsp`, the stack pointer.
- **Cache.** This is fast memory between the registers and physical RAM, divided into levels. L1 is the smallest and the fastest, then L2, then L3.

![The processor components in a table, then the cache, the bus, and RAM, with the fast end of the memory hierarchy at the top](../assets/figures/memory-hierarchy.svg)

When the processor loads a local variable, the address is in the stack region. When it reads through the pointer `pi`, the address is in the heap region. Every access travels on the bus. The stack, the heap, and the code region are a software division of that same physical RAM.

The memory hierarchy, from the fast and small end to the slow and large end:

| Component | Role | Retains data with the power off? |
| --- | --- | --- |
| Register | Values for the processor's current operation | No |
| Cache | A copy of recently used RAM cells, so the processor can avoid a slow access | No |
| Main memory (RAM) | The process's data and code during the run | No |
| Disk (SSD/HDD) | Permanent storage for files | Yes |
| Magnetic tape | Long-term backup and retrieval | Yes |

The width of the data bus is how many bits move in one memory transfer. That width is the word size. The width of the address bus is the largest range of memory the processor can address.

The raw instruction set includes operations such as these:

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
The values are written into memory first. They are then loaded into registers, the ALU adds them, and the result is written back into the cell of `i`:

```text
WRITE 3000 10
WRITE 4000 20
READ  3000 R1
READ  4000 R2
ADD   R1 R2 R3
WRITE 3000 R3

```

At the end, cell 3000 holds 30. The addition is performed in the processor's registers. RAM holds the cells that were read and the cell that was written.
:::
:::

The stack and the heap correspond to a small set of operations:

**Stack operations:**

- `createAF`: create a new stack frame.
- `removeAF`: remove the current frame and return to the caller's frame.
- `push`: add a cell at the top of the current frame.
- `pop`: remove the cell at the top of the frame.
- `read` / `write`: access a cell in the current frame only.

**Heap operations:**

- `new`: allocate a free run of cells on the heap and mark them occupied for this process.
- `delete`: release an allocated range and mark it free.
- `read` / `write`: access a cell that is currently allocated on the heap. A read or a write of a cell that has already been released is a run-time fault, a segmentation fault.

A procedure call does the following. It creates the frame (`createAF`), pushes the return address, pushes the `this` pointer when the call is a method of an object, pushes the arguments, runs the body, writes the return value to a temporary location, pops the arguments, and removes the frame (`removeAF`).

:::check id=chk-where-array
The following line runs inside a function. Where do `pi` and the ten integers live?

```cpp
int* pi = new int[10];

```

- [ ] Both are on the stack
- [x] `pi` is on the stack and the ten integers are on the heap
- [ ] Both are on the heap
- [ ] `pi` is stored in the code region

`pi` is a local variable that holds an address, so it is allocated in the stack frame. The block of ten integers is allocated on the heap by `new[]`.
:::

## An example layout

Consider this code:

```cpp
int* pi = new int[10];
pi[0] = 1;

```

| Name | Region | Contents |
| --- | --- | --- |
| `pi` | The stack frame | The address of the first `int` on the heap |
| The ten `int`s | Heap | The array values (index 0 has been set to 1) |
| The instructions | Code region (Text) | Machine instructions, read only |

When the function returns, the local `pi` disappears with the frame. The ten integers stay allocated on the heap until the program executes `delete[] pi`. Once the only copy of that address has disappeared with the frame, the integers are unreachable, and the block is a memory leak.

:::problem id=worked-stack-array title="A pointer on the stack" source="materials/lectures/Chapter 1 - The Memory Model.pptx" kind=worked solution_origin=source
Explain where `ps` is stored, where the `Student` object is stored, and what happens in memory if nobody calls `delete`.

```cpp
int main() {
    Student* ps = new Student("Avi");
    return 0;
}

```

:::solution
`ps` is a local pointer, so it occupies a cell in `main`'s stack frame. The `Student` object itself is allocated on the heap:

```text
stack (main):  ps  ----------+
                             |
heap:                        v
                       Student("Avi")

```

When `main` ends, the stack frame is popped and `ps` disappears. The heap block stays allocated. No pointer remains that can reach it, so the block is a memory leak.
:::
:::

:::trap
`delete` releases one object. `delete[]` releases an array. Applying `delete` to an array that was allocated with `new[]` is undefined behavior, and it corrupts the heap's bookkeeping. A memory leak is a separate failure: the block is never released.
:::

:::trap
Global variables, and local variables declared `static`, occupy the static region for the whole run of the program. Their storage is that static region for the entire lifetime. They sit outside every stack frame, and they sit outside the heap.
:::

## Practice

:::problem id=ps2-stack-vs-heap title="Stack versus heap" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
Four names are declared in `demo`.

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

`local` is an `int` on the {{=stack|heap|vtable}} and takes {{=no delete|delete|delete[]}}.

`one` is a pointer on the {{=stack|heap|vtable}}. The `int` from `new int(2)` lives on the {{=heap|stack|frame of demo}} and is released with {{=delete|delete[]|no delete}}.

`local` is an `int` in `demo`'s stack frame. The return releases it. It takes no `delete`. `one` is a local pointer on the stack. The `int` it addresses is a block on the heap. Release that `int` with `delete one`.
:::

:::check id=ps2-stack-vs-heap-q2
`many` is a pointer on the {{=stack|heap|vtable}}. The array of ten integers lives on the {{=heap|stack|frame of demo}} and is released with {{=delete[]|delete|no delete}}.

`s` is a pointer on the {{=stack|heap|vtable}}. The `string` object lives on the {{=heap|stack|frame of demo}} and is released with {{=delete|delete[]|no delete}}.

`many` is a local pointer on the stack. The array of ten integers is a block on the heap. Release it with `delete[] many`. `s` is a local pointer on the stack. The `string` object itself is a block on the heap. Release it with `delete s`.
:::

:::check id=ps2-stack-vs-heap-q3
What is true if `demo` returns while those three blocks are still allocated?

- [ ] The return pops the frame and releases the three heap blocks with it.
- [ ] The three pointers move onto the heap, so the blocks stay reachable.
- [x] The return pops the frame and the pointers disappear with it. A block left behind is a memory leak on the heap.

The three heap blocks have to be released before the function returns. The return pops the frame and the pointers disappear with it. A block left behind is a memory leak on the heap.
:::
:::

:::examnote
A common exam question passes an object by value into a function and asks for a drawing of the stack and the heap at a given line. Draw each dynamic buffer on the heap. An argument passed by value is a separate object in the called function's frame. An argument passed by reference is another name for an object that already exists. An argument passed by pointer is an address of an object that already exists.
:::

:::problem id=exam-15a-q2 title="A vector as a list" source="materials/exams/15-a.pdf" kind=exam solution_origin=source
A class `mvector<T>` stores its elements as a dynamic linked list, using that list where another design would use a contiguous array. `insertAt` allocates a node when one is needed and inserts it at position `pos`. `removeAt` shrinks the structure. One proposal drops `_len` and uses `sizeof(_head)` as the length. The call `foo(mvector<T> vec)` passes the argument by value.

:::check id=exam-15a-q2-q1
Which destructor matches this list, and which copy goes with it?

```cpp
// A
delete[] _head;
```

```cpp
// B
node<T>* current = _head;
while (current != nullptr) {
    node<T>* upcoming = current->_next;
    delete current;
    current = upcoming;
}
```

```cpp
// C
delete _head;
```

- [ ] A, together with a copy constructor that copies `_head` only.
- [x] B, together with a copy constructor that makes a deep copy of every node.
- [ ] C, together with a copy constructor that leaves every vector sharing one chain.

The class keeps a linked list of `node<T>` nodes and the length of that list in `_len`. The destructor walks the nodes and releases each one with `delete`. The copy constructor makes a deep copy of every node. Each vector then owns its own nodes, so the destructor of one vector releases only that vector's nodes.
:::

:::check id=exam-15a-q2-q2
`_len` is removed and the length is `sizeof(_head)`. Which statement is correct?

- [ ] 1. This works, and it returns the exact length.
- [ ] 2. The result has to be divided by `sizeof(T)`.
- [x] 3. On a 32-bit system the expression always returns 4.
- [ ] 4. A compilation error (`sizeof` cannot be applied to a template).
- [ ] 5. None of the answers is correct.

Statement 3 is correct. `_head` is a pointer. On a 32-bit system the size of a pointer is 4 bytes, for any number of elements in the list it addresses.
:::

:::check id=exam-15a-q2-q3
Which description of the stack and the heap is right for `foo(mvector<T> vec)`?

- [ ] The parameter is another name for the caller's vector, so both share one `_head` cell on the stack.
- [ ] The nodes live in `foo`'s frame, and the class has a vtable because it is a template.
- [x] A new `mvector` is created in `foo`'s stack frame, with its own `_head` and `_len`. A deep copy puts a new chain on the heap. A shallow copy leaves both stack pointers on one heap chain. There is no vtable.

Inside `foo`, the parameter arrives by value, so a new `mvector` object is created in `foo`'s stack frame. It has its own `_head` and its own `_len`. A deep copy duplicates the nodes on the heap into a new chain. A shallow copy leaves the two pointers on the stack addressing one chain of nodes on the heap. This class has no virtual methods, so it has no vtable.
:::
:::

:::problem id=exam-15b-q2 title="A vector that grows" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
The class `mvector` is based on a dynamic array. When `insertAt` goes past the current size, it grows the array to the smallest power of 2 that is greater than `pos`. `removeAt` shrinks the array by half when the entire upper half is unused. `node` has a pure virtual method `duplicate()`.

```cpp
void foo(mvector vec) {
    mvector my_vec(vec);
    // ***** here *****
}
void main() {
    mvector vec;
    node* n = new my_node("test");
    vec.insertAt(*n, 3);
    foo(vec);
}

```

At the end of `main` the code contains the conversion `my_node* m = (my_node*)(vec.getAt(0));`.

:::check id=exam-15b-q2-q1
Which copy constructor is correct?

```cpp
// A
node* buf = new node[n];
for (int i = 0; i < n; ++i)
    buf[i] = *src[i];
```

```cpp
// B
node** buf = src;
```

```cpp
// C
node** buf = new node*[n];
for (int i = 0; i < n; ++i)
    buf[i] = src[i]->duplicate();
```

- [ ] A. Copying a `node` by value keeps the derived part.
- [ ] B. The copy stores the source array pointer and allocates no new array.
- [x] C. Allocate a new array on the heap and copy every node by calling `duplicate()`.

The copy constructor allocates a new array on the heap, of the appropriate size, and copies every node into it. Because `node` is polymorphic, a correct copy calls `duplicate()`, so the new object has the real dynamic type. Copying a `node` by value would slice the object. That loss of the derived part is object slicing.
:::

:::check id=exam-15b-q2-q2
Which description of the stack and the heap is right at the marked line?

- [ ] `my_vec` is another name for `vec` in `main`, so one vector object sits on the heap.
- [x] Three vectors sit on the stack: `vec` in `main`, the parameter `vec` in `foo`, and `my_vec`. After a deep copy, each has its own array on the heap, and `my_node` has a vtable.
- [ ] The three vectors share one array in `foo`'s frame, and `my_node` has no vtable.

Three distinct vector objects sit on the stack: `vec` in `main`'s frame, the parameter `vec` in `foo`'s frame (the object produced by pass by value), and the local `my_vec` in `foo`'s frame. Each has its own dynamic array on the heap, provided the copy was a correct deep copy. The vtable of `my_node` is present, because the elements are polymorphic and include virtual functions.
:::

:::check id=exam-15b-q2-q3
`getAt` returns `node*`, and the added line is a C-style cast. Which statement is correct?

- [ ] 1. Downcasting is forbidden in C++.
- [ ] 2. A C-style cast is checked only at compile time.
- [ ] 3. A downcast is safe only when there are no virtual methods.
- [x] 4. Virtual methods are bound at run time (dynamic binding).
- [ ] 5. None of the answers is correct.

Statement 4 is correct. A call of a virtual function is resolved at run time from the real object on the heap. A C-style cast converts the pointer with no run-time type check. `dynamic_cast` performs that check.
:::
:::

The chapter [Pointers and references](topic:pointers) builds on this drawing. A cell on the stack holds an address, and the address is useful while the block on the heap is still alive. The copy operations in [The rule of three](topic:rule-of-three) have to reproduce that drawing correctly.
