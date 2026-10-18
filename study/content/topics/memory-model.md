---
id: memory-model
title: The memory model
sources:
  - "Classes/Chapter 1 - The Memory Model.pptx"
  - "Exrecises/SPL_PS2 (1).pptx"
  - "Exams/15-a.pdf"
  - "Exams/15-a-solution.pdf"
  - "Exams/15-b.pdf"
  - "Exams/15-b-solution.pdf"
---

A C++ program does not get one undifferentiated bag of memory. The process owns an address space, and the language puts code, globals, call frames, and `new` blocks into different regions of it. Every later picture in this course — a pointer on the stack, a buffer on the heap, a by-value argument — is a drawing of those regions.

Java, C#, and Python hide the same machine behind a garbage collector (איסוף זבל). C++ gives the programmer the keys: `new` is taking the key to an apartment, `delete` is handing it back. Forget to hand it back, and the apartment stays rented.

## The five regions

Chapter 1 draws the address space from high addresses down to low addresses. The names in the slides are the ones to keep.

:::definition id=def-address-space title="Process address space" source="Classes/Chapter 1 - The Memory Model.pptx"
A running process has its own range of addresses. Inside that range the course separates five regions:

| region | Hebrew name | size | who frees it | access |
| --- | --- | --- | --- | --- |
| stack | מחסנית | grows and shrinks | automatic, LIFO | read and write |
| heap | ערימה | grows and shrinks | the programmer, with delete | read and write |
| uninitialized statics | משתנים לא מאותחלים | fixed at compile time | the process lifetime | read and write |
| initialized statics | משתנים מאותחלים | fixed at compile time | the process lifetime | read and write |
| code | אזור הקוד, text | fixed | the process lifetime | read only |

High addresses sit at the stack end of the drawing. Low addresses sit at the code.
:::

![Process address space, high addresses at the top: stack, heap, uninitialized statics, initialized statics, and code](../assets/figures/address-space.svg)

The stack holds local variables and the bookkeeping for a call. The heap holds blocks whose lifetime is not the block of code that created them. The two static regions hold variables that exist for the whole run. The code region holds the machine instructions and is not written by the program.

![Von Neumann machine: a CPU, a bus, and one RAM that holds both the program and the data](../assets/figures/von-neumann-architecture.svg)

### Static variables

A static variable is initialized only with a value the compiler can compute, not with a call. Three forms show up on the slides:

```cpp
int a = 1;                 // global: whole run, visible from every file
static int b = 2;          // file-scope static: whole run, this file only
void function() {
    static int c = 3;      // function static: whole run, this function only
}                          // c is initialized once, not on every call
```

`a` can be named from any translation unit that declares it. `b` cannot. `c` keeps its value across calls, but only `function` can name it.

### The stack frame

:::definition id=def-stack-frame title="Stack frame" source="Classes/Chapter 1 - The Memory Model.pptx"
A stack frame, also called an activation frame, is pushed on every function call. It holds the return address, the parameters that were passed, and the local variables. Frames are removed in LIFO order when the call returns.
:::

That is why a local variable is fast and why it is gone when the function returns. A stack overflow (מילוי המחסנית) is the frame stack running out of room, the example on the slide being infinite recursion.

![Two stack frames: main stays, foo's frame holds the parameter and the local, and the return pops foo](../assets/figures/stack-frames.svg)

:::problem id=worked-frame-call source="Classes/Chapter 1 - The Memory Model.pptx" kind=worked solution_origin=source
`main` calls `foo(int n)`, and `foo` declares `int x`. Where do `n` and `x` live while `foo` is running, and what remains after `foo` returns?

:::solution
Both live in `foo`'s stack frame. `n` is the parameter and `x` is the local. That frame sits under `main`'s frame and is removed when `foo` returns, so neither name remains. A `new` inside `foo` is the exception: the block is on the heap, and only the frame's pointer to it disappears.
:::
:::

### The heap

```cpp
int* pi = new int;       // one int on the heap; pi itself is a local
delete pi;

int* arr = new int[10];  // ten ints on the heap
delete[] arr;            // the array form, not delete
```

The slide lists the heap's advantage as the lack of automatic release: the block outlives the block of code. The cost is that allocation asks the operating system, so it is slower than a stack slot, and the allocator has to keep its own bookkeeping.

The pointer and the block are not in the same region.

```cpp
int* pi = new int[10];     // pi is on the stack, the ten ints are on the heap
Student* ps = new Student("Avi");  // ps on the stack, the Student on the heap
```

Can the stack itself leak? The frame is popped on return, so the local pointer disappears. The leak, when there is one, is the heap block that nobody can name anymore. In Java the collector reclaims an object with no remaining references; a Java "leak" is a reference that is still reachable and that the program forgot about, not a missing `delete`.

## Why the split is shaped this way

Call frames have a nested lifetime, so a stack is the cheapest structure that matches them: allocate by moving a pointer, free by moving it back. Objects that must survive the call, or whose size is not known at the call, cannot live in that frame. They go on the heap, and the programmer becomes the one who knows when the last use is over. Code is separate and read-only so a stray store does not rewrite instructions. Statics are fixed so the linker can place them before `main`.

If you `delete` an array that was allocated with `new[]`, or `delete[]` a single object, the bookkeeping header does not match the pointer and the heap is corrupted. If you lose the only pointer to a heap block, the stack is fine and the heap block is leaked.

## The machine under the regions

The same RAM holds both the instructions and the data. That is the von Neumann architecture (ארכיטקטורת פון נוימן): one memory, a central processing unit, and a bus between them.

:::definition id=def-von-neumann title="Von Neumann machine" source="Classes/Chapter 1 - The Memory Model.pptx"
The machine in the lecture is a CPU, a bus (ערוץ העברת נתונים), and RAM. The program text and the data both reside in that RAM. The CPU repeats a fetch-decode-execute cycle (הבאה-פענוח-ביצוע): fetch an instruction from memory, decode it, execute it.
:::

Inside the CPU the lecture names four parts, plus the clock:

- The control unit (יחידת הבקרה, CU) fetches, decodes, and executes, uses the clock to stay in step, and handles input and output through interrupts (פסיקות).
- The arithmetic logic unit (יחידת החישוב, ALU) does integer arithmetic, comparisons, bitwise operations, and overflow checks.
- Registers (אוגרים, רגיסטרים) are the fastest storage. General registers hold values for ordinary instructions such as load and save. Dedicated registers include the instruction pointer `ip` and combined registers such as `rsp`. Dedicated instructions such as `push`, `pop`, and `jump` use those special registers.
- Cache (זיכרון מטמון) sits between registers and RAM. L1 is the smallest and fastest, then L2, then L3, each level larger and slower than the one before it. The clock sets how many steps the processor takes per second.

![CPU parts in a grid, then cache, the bus, and RAM, with the memory hierarchy fastest at the top](../assets/figures/memory-hierarchy.svg)

A load of a local variable is usually a stack address. A load through `pi` is a heap address. Both travel the bus; the regions are a software convention on top of one RAM.

:::check id=chk-where-array
`int* pi = new int[10];` is evaluated inside a function. Where do `pi` and the ten integers live?

- [ ] Both live on the stack
- [x] `pi` lives on the stack and the ten integers live on the heap
- [ ] Both live on the heap
- [ ] `pi` lives in the code region

The pointer variable is a local, so it is part of the frame. `new` obtains a separate block whose lifetime is not the frame.
:::

## A worked layout

Take the two lines from the lecture and one call.

```cpp
int* pi = new int[10];
pi[0] = 1;
```

| name | region | what is stored |
| --- | --- | --- |
| pi | stack frame of the caller | the address of the first int |
| the ten ints | heap | the values, initially unspecific until written |
| the instructions of the function | text | read only |

When the function returns, the slot named `pi` is gone. The ten ints remain until something executes `delete[]` on that address. If the address was not saved anywhere else, nothing can.

:::problem id=worked-stack-array source="Classes/Chapter 1 - The Memory Model.pptx" kind=worked solution_origin=source
`Student* ps = new Student("Avi");` runs inside `main`. Say where `ps` lives, where the `Student` lives, and what remains after `main` returns if nobody calls `delete`.

:::solution
`ps` is a local pointer, so it occupies a slot in `main`'s stack frame. The `Student` object, including the characters of the name if the constructor places them in the object, is the block returned by `new`, on the heap. When `main` returns, the frame is popped and the slot `ps` disappears. The heap block is not freed by that pop. With no remaining pointer to it, the block has leaked.
:::
:::

:::trap
`delete pi` after `int* pi = new int[10]` frees the wrong shape of block. The array form is `delete[] pi`. Mixing them is heap corruption, not a tidy leak.
:::

:::trap
A global or a `static` local is not on the stack and not on the heap. It lives for the whole run in the static region, and a function-scope `static` is initialized once.
:::

## Practice

:::problem id=ps2-stack-vs-heap source="Exrecises/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
Practical session 2 draws the same split. For each line, say whether the named storage is on the stack or the heap, and what `delete` is required.

```cpp
void demo() {
    int local = 2;
    int* one = new int(2);
    int* many = new int[10];
    string* s = new string("I'm on the heap");
}
```

:::hint
A name declared inside the function without `new` is a local. `new` and `new[]` are the heap.
:::
:::hint
Match the deallocation to the allocation: one object uses `delete`, an array uses `delete[]`. A stack local is not deleted.
:::
:::hint
`int local = 2;` has no `new`.
:::
:::solution
`local` is an `int` in the frame of `demo`. It is freed when `demo` returns. No `delete`.

`one` is a pointer in the frame. The `int` it points at is one heap object, released with `delete one`.

`many` is a pointer in the frame. The ten ints are one heap array, released with `delete[] many`.

`s` is a pointer in the frame. The `string` object is on the heap, released with `delete s`. The characters inside a `std::string` are that object's problem; you do not `delete` them yourself.

After those three deletes, the frame can disappear without leaking. Skipping them leaks the heap blocks, not the pointers.
:::
:::


:::examnote
The memory question hands you a small C++ container and a `main` that passes it by value into `foo`, then says to draw the stack and the heap at a marked line. The trap is drawing the buffer as if it lived in the frame, or drawing a by-value parameter as if it were the same object as the caller's.
:::

:::problem id=exam-15a-q2 source="Exams/15-a.pdf" kind=exam solution_origin=source
A `vector` stores elements in a contiguous array and can resize. The course decides that is wasteful, and asks for `mvector<T>`, whose memory is exactly the cells it needs, stored as a linked list.

a. (15) Implement the functions. You may add helpers. You may not add fields or change signatures. `insertAt` always succeeds, allocating if it must, and inserts at `pos`. `removeAt` shrinks the structure and, if `pos` is empty, returns some dummy `T`. Access to a linked-list cell is not O(1).

b. (5) Yosi suggests deleting the `_len` field and returning `sizeof(_head)` as the length. Choose the best description.

1. It works and returns the length.
2. Almost: divide by `sizeof(T)`.
3. On a 32-bit machine it always returns 4.
4. It does not compile, because `sizeof` cannot be used with a template.
5. None of the above.

c. (10) Draw the stack, the heap, and the vtable at the marked comment, for a by-value call `foo(mvector<T> vec)`.

The official solution's class skeleton is a `node<T>` list with `_len` and `_head`, plus `getSize`, `pushAt`, and `popAt`.

:::hint
`sizeof` is a compile-time size of a type, not a count of nodes reached by walking `_next`.
:::
:::hint
A parameter taken by value is a second object. Its pointer member and the caller's pointer member are two stack slots. Whether they share one list is exactly the copy constructor.
:::
:::hint
`_head` has pointer type. On the 32-bit machines this exam is thinking about, a pointer is 4 bytes.
:::
:::solution
a. The official solution stores a singly linked `node<T>` and a length. The destructor walks `_len` nodes and `delete`s each. `copy` allocates a fresh node per element and is used by the copy constructor. Assignment in that solution calls `copy` and returns `*this` (it does not first destroy the old list; a complete assignment also has to free the previous nodes, or it leaks). `pushAt` walks to `pos`, filling missing links with default nodes, then links a node that holds `val`. `getSize` returns `_len`.

b. The official solution marks 3. `_head` is a pointer. `sizeof(_head)` is the size of that pointer, which is 4 on a 32-bit machine, not the number of elements. Dividing by `sizeof(T)` is still a pointer size, not a length. The expression does compile inside a template.

c. At the line inside `foo`, the caller's `mvector` is one object and the parameter `vec` is another, because the parameter is passed by value. Each object occupies a stack slot (the `_head` pointer and `_len`). The nodes are on the heap. The official marking notes deduct for a missing return address, for drawing the parameter as if it were not passed by value, for putting the vector object itself on the heap, and for a vtable the class does not have. Shallow-copy drawings were accepted: both stack objects' `_head` pointers can aim at one node chain if the copy constructor was not a deep copy. A deep copy draws a second chain.
:::
:::

:::problem id=exam-15b-q2 source="Exams/15-b.pdf" kind=exam solution_origin=source
`mvector` is now an array of `node`, not a list. `insertAt` at a `pos` past the end grows the array to the smallest power of two strictly larger than `pos` (an empty vector, insert at 5, becomes length 8). `removeAt` shrinks by half once every element in the upper half has been removed (length 8, after the four high elements are gone, becomes 4). Elements keep their indexes. `node` has a pure virtual `duplicate()`.

a. (15) Implement the underlined operations, including a deep copy constructor. Helpers are allowed. Do not add fields or change signatures.

b. (10) `my_node` derives from `node` and adds a `long _data`. Assume its functions are correct. Draw stack and heap for this run, up to the comment:

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

c. (5) Someone adds, at the end of `main`:

```cpp
my_node* m = (my_node*)(vec.getAt(0));
```

Choose the best statement.

1. Downcasting is forbidden in C++, so this is an error.
2. A cast can never check compatibility at compile time.
3. A downcast is safe only when the class has no virtual methods.
4. Virtual methods are bound late, at run time.
5. None of the above.

:::hint
Growth is "smallest power of two that can hold index `pos`", and the old cells are copied by value into the new array before the old array is deleted.
:::
:::hint
`foo` takes `mvector` by value, then copy-constructs `my_vec` from that parameter. Count three vector objects, not one.
:::
:::hint
`getAt` returns a `node*`. The added line is a C-style cast. The official choices are about what is true of virtual functions, not about whether the cast is pretty.
:::
:::solution
a. The official copy constructor allocates a new array of `_len` and assigns each cell from the source. `insertAt`, when `pos >= _len`, sets the new length to the next power of two above `pos`, allocates, copies the old cells, `delete`s the old array, then writes the new element at `pos` and marks it not free. `removeAt` clears the cell and, when the high half is all free, allocates an array of half the length, copies, and deletes the old one. Because `node` is polymorphic, a truly deep copy of a `my_node` cell has to go through `duplicate()` rather than slicing the cell into a plain `node`. The published copy loop assigns cells; that is the official skeleton, and it will slice if `node` assignment does not call `duplicate`.

b. `n` points at a heap `my_node`. `vec` lives in `main`'s frame; its array is on the heap, grown to 8, with the copy of the node at index 3. The call `foo(vec)` copy-constructs the parameter `vec` in `foo`'s frame (a second array on the heap if the copy is deep). `my_vec(vec)` is a third vector in `foo`'s frame and a third array. The vtable pointer sits in each `my_node`, because `duplicate` is virtual.

c. The official solution marks 4. Virtual methods are resolved at run time. Statement 1 is false: C++ allows a downcast. Statement 3 has the safety condition backwards: a checked `dynamic_cast` needs at least one virtual method. The line as written is a C-style cast, which does not perform that check.
:::
:::

This picture is the one [Pointers](topic:pointers) builds on: the stack slot holds an address, and the address is useful only while the heap block is alive. The same drawing is what the copy operations in [Rule of three](topic:rule-of-three) have to keep honest.
