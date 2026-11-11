---
id: bridge-memory-basics
title: "Review: memory and pointers"
kind: bridge
reviews: [run-time-environment, memory-model, pointers]
blurb: "A look back at the first three chapters: how a program is built and run, where its variables live, and how pointers and references reach them."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
---

Three chapters in, you have seen how a program is built and run, where each of its variables lives, and how a pointer or a reference reaches a variable. This review brings those three back and has you use them together.

Each reminder is short. The questions after it need more than one chapter to answer.

## From source file to running process

- **The build has four stages:** the preprocessor, the compiler, the assembler, and the linker. The first three work on one `.cpp` file at a time. Only the linker sees the whole program. See [The run-time environment](topic:run-time-environment).
- **A declaration is enough to compile a call.** The compiler checks the call against the declaration and leaves a note in the object file. The linker fills in the address, and fails with an **undefined reference** if no file defines the function.
- **A process has five regions:** the stack, the heap, uninitialized static data (BSS), initialized static data, and the code. See [The memory model](topic:memory-model).
- **Three of the regions are fixed before the program runs.** The code and the two static regions have their size set at compile time, and they last for the whole process.
- **Two of the regions change while it runs.** A frame is pushed on the stack at each call and popped at each return. A heap block appears when `new` runs and stays until `delete` runs.

| What | Decided or created | Lasts until |
| --- | --- | --- |
| The code of a function | At build time | The process ends |
| A global or `static` variable | Its cell is fixed at build time | The process ends |
| A local variable or a parameter | When its function is called | Its function returns |
| A block from `new` | When `new` runs | `delete` runs on its address |

:::problem id=br1-build-or-run title="Decided at build time or at run time?" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
A small program in two files. No file defines `next` yet.

```cpp
// counter.h
int next();            // a declaration only

// main.cpp
#include "counter.h"

int limit = 3;

int main() {
    int total = 0;
    int* cell = new int(next());
    total = total + *cell;
    delete cell;
    return total > limit;
}
```

:::check id=br1-build-or-run-q1
For each fact, choose when it is settled.

The text of `counter.h` is pasted into `main.cpp` by the {{=preprocessor|compiler|linker}}.

The address that the call `next()` jumps to is filled in by the {{=linker|compiler|operating system, when the process is created}}.

The cell of `limit` is in {{=initialized static data|uninitialized static data (BSS)|main's stack frame}}, and its size is fixed {{=at compile time|when main is called|when new runs}}.

The cells of `total` and `cell` appear {{=when main's frame is pushed, at run time|at compile time|at link time}}.

The `int` that `cell` points at appears {{=when new runs, at run time|when main's frame is pushed|at link time}}.

- **Build time:** the preprocessor handles `#include`, and the linker resolves the address of every call across files. Static data has a fixed size, and `limit` has an initial value, so it sits in initialized static data.
- **Run time:** `total` and `cell` are locals, so they exist only while `main`'s frame is on the stack. The `int` they lead to is a heap block, created by `new`.
:::

:::check id=br1-build-or-run-q2
No file defines `next`. Which of these are true?

- [x] `g++ -c main.cpp` still writes `main.o`.
- [x] Linking `main.o` into an executable fails with an undefined reference.
- [ ] The executable is written, and the process crashes when it reaches the call.
- [ ] The compiler rejects `main.cpp`, because it cannot see the body of `next`.

- **Compiling works:** the compiler only needs the declaration from `counter.h` to check the call. It leaves a note in `main.o` that the address of `next` is still missing.
- **Linking fails:** the linker looks for a definition of `next` in every object file, finds none, and stops. No executable is written, so no process ever runs.
:::
:::

:::problem id=br1-who-outlives title="What outlives the call?" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Follow one call to `remember`.

```cpp
int hits = 0;

int* remember(int value) {
    int copy = value;
    int* slot = new int(copy);
    hits = hits + 1;
    return slot;
}

int main() {
    int* kept = remember(7);
    int* also = kept;
    delete kept;
    return 0;
}
```

:::check id=br1-who-outlives-q1
Place each name while `remember` is running.

`hits` lives in {{=initialized static data|the heap|remember's stack frame}}.

`value`, `copy`, and `slot` live in {{=remember's stack frame|main's stack frame|the heap}}.

The `int` that holds 7 and was made by `new` lives on the {{=heap|stack|static data}}.

`kept` lives in {{=main's stack frame|remember's stack frame|the heap}}.

A global with an initial value sits in initialized static data. Parameters and locals sit in the frame of their own function. Only `new` puts something on the heap. `slot` itself is a local: it is the address inside it that leads to the heap.
:::

:::check id=br1-who-outlives-q2
Right after `remember` returns, which of these still exist?

- [x] `hits`
- [x] the heap `int` that holds 7
- [x] `kept`, holding the address of that heap `int`
- [ ] `copy`
- [ ] `slot`

- **Gone:** `copy` and `slot` were in `remember`'s frame, and the frame was popped.
- **Still there:** `hits` is static, and a heap block does not care which function returns.
- **Why the block is not lost:** the function returns by value, so the address inside `slot` was copied into `kept` before `slot` disappeared.
:::

:::check id=br1-who-outlives-q3
After `delete kept;`, what is true of `also`?

- [ ] It is `nullptr`, because `delete` clears every pointer to the block.
- [x] It still holds the old address, and reading or writing `*also` is undefined behavior.
- [ ] The block is only half released, so `delete also;` is needed to finish the job.
- [ ] It still points at a live `int`, because `also` was never deleted.

- **`delete` releases the block, not the pointers.** `kept` and `also` both still hold the same old address.
- **One block, one `delete`.** Calling `delete also;` would release the same block twice, which is also undefined behavior.
:::
:::

## Frames and the heap

- **A call pushes a frame.** The frame holds the parameters, the locals, and what is needed to return. When the function returns, the frame is popped and everything in it is gone.
- **`new` returns an address.** The block it creates has no name. The only way to reach it is through a pointer that holds its address.
- **A leak is a block with no pointer left.** If the last copy of the address is overwritten or popped with its frame, the block stays on the heap and nothing can ever release it.
- **Match the form of `delete` to the form of `new`.** A block from `new int` is released with `delete`. A block from `new int[n]` is released with `delete[]`. Mixing them is undefined behavior.
- **`delete` does not change the pointer.** The pointer keeps the old address. Writing `p = nullptr;` afterwards is your job.

```cpp
int* one = new int(5);       // one int
int* many = new int[3];      // an array of three ints

delete one;                  // matches new
delete[] many;               // matches new[]
```

:::problem id=br1-grow-and-lose title="Growing an array" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`grow` builds a larger copy of an array.

```cpp
int* grow(int* old, int n) {
    int* bigger = new int[n + 1];
    for (int i = 0; i < n; i++) {
        bigger[i] = old[i];
    }
    bigger[n] = 0;
    return bigger;
}

int main() {
    int* data = new int[2];
    data[0] = 4;
    data[1] = 9;
    data = grow(data, 2);
    delete data;
    return 0;
}
```

:::check id=br1-grow-and-lose-q1
What happens to the first block, the two `int`s, at the line `data = grow(data, 2);`?

- [ ] It is released when `grow`'s frame is popped, because `old` pointed at it.
- [x] It leaks. `old` is popped with the frame, `data` is overwritten, and no pointer holds its address any more.
- [ ] Nothing is lost, because `bigger` and `data` name the same block.
- [ ] It is still reachable through `old`.

- **`old` was a copy of the address,** passed by value. Popping the frame destroys that copy and leaves the block alone.
- **`data` was the only other copy,** and the assignment replaces it with the address of the new block.
- **A block with no pointer left is a leak.**
:::

:::check id=br1-grow-and-lose-q2
Which changes stop the leak?

- [x] In `main`, keep the old address in a second pointer, call `grow`, then `delete[]` the old block.
- [x] In `grow`, write `delete[] old;` after the copy loop and before the `return`.
- [ ] In `grow`, write `delete[] old;` before the copy loop.
- [ ] In `grow`, write `old = nullptr;` before the `return`.

- **Both correct fixes release the old block after its values were copied** and while some pointer still holds its address. They differ only in who is responsible: the caller or `grow`.
- **Releasing before the loop** makes the loop read a block that is already gone.
- **`old = nullptr;`** changes only the local copy of the address. It releases nothing.
:::

:::check id=br1-grow-and-lose-q3
What is wrong with the last line, `delete data;`?

- [ ] Nothing. `data` is one pointer, so one plain `delete` is right.
- [x] The block came from `new int[n + 1]`, so it must be released with `delete[] data;`.
- [ ] `data` was returned from a function, so it lives on the stack and must not be deleted.
- [ ] It should be `delete *data;`.

The form of `delete` follows the form of `new` that made the block, not the type of the pointer. A block from `new[]` is released with `delete[]`, and using plain `delete` on it is undefined behavior.
:::
:::

## Addresses, pointers, and references

- **A pointer is a variable that holds an address.** `&x` takes the address of `x`, and `*p` reaches the variable that `p` points at. See [Variables, pointers, and references](topic:pointers).
- **A reference is a second name.** `int& r = x;` makes `r` an alias for `x`. It has no cell of its own to reassign, and it cannot be null.
- **Parameters are passed by value unless the type says `&`.** Passing a pointer by value copies the address: the function can change what the pointer points at, but not the caller's pointer itself.
- **To change the caller's pointer, pass a reference to it.** The parameter type is `int*&`.
- **Never return the address of a local, or a reference to one.** The local dies when the frame is popped. Returning a heap address is fine, and it hands the caller the job of releasing the block.

| Parameter | What is copied | What the function can change |
| --- | --- | --- |
| `int n` | The value | Only its own copy |
| `int* p` | The address | The caller's `int`, through `*p` |
| `int& n` | Nothing | The caller's `int` |
| `int*& p` | Nothing | The caller's pointer, and the `int` through it |

:::problem id=br1-four-returns title="Four ways to hand back a five" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Each function gives the caller a five.

```cpp
int* a() { int n = 5; return &n; }
int& b() { int n = 5; return n; }
int* c() { int* p = new int(5); return p; }
int  d() { int n = 5; return n; }
```

:::check id=br1-four-returns-q1
Which functions give the caller something that is safe to use?

- [ ] `a`
- [ ] `b`
- [x] `c`
- [x] `d`

- **`a` and `b` return a way to reach `n`,** an address in one and an alias in the other. `n` is in the frame, and the frame is popped at the return, so the caller is left pointing at a dead variable.
- **`c` returns an address on the heap.** The local `p` is popped, but its content was copied out, and the block is still alive.
- **`d` returns by value.** The caller gets its own copy of the 5.
:::

:::check id=br1-four-returns-q2
Complete the sentences about `c` and `d`.

After `int* got = c();`, the block is released {{=when the caller runs delete got|when c's frame is popped|when the process reaches the end of the line}}.

If the caller writes `c();` and ignores the result, the block {{=leaks|is released at once|is never created}}.

After `int got = d();`, the caller has to release {{=nothing|got, with delete|n, with delete}}.

Returning a heap address hands over a responsibility along with the value: someone must run `delete` on it exactly once. Returning by value hands over only a copy, which lives and dies with the caller's own frame.
:::
:::

:::problem id=br1-reset-three-ways title="Three ways to reset" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Each function is called on its own, starting from `int* cell = new int(8);` in the caller.

```cpp
void resetA(int* p)  { p = nullptr; }
void resetB(int*& p) { p = nullptr; }
void resetC(int* p)  { *p = 0; }
```

:::check id=br1-reset-three-ways-q1
Say what the caller sees after each call.

After `resetA(cell);`, `cell` {{=still holds the heap address|is nullptr}} and the heap `int` holds {{=8|0}}.

After `resetC(cell);`, `cell` {{=still holds the heap address|is nullptr}} and the heap `int` holds {{=0|8}}.

After `resetB(cell);`, `cell` {{=is nullptr|still holds the heap address}} and the heap `int` {{=is still on the heap with no pointer to it|was released|was set to 0}}.

- **`resetA` changes only its own copy of the address.** The caller sees nothing.
- **`resetC` uses its copy of the address to reach the caller's `int`.**
- **`resetB` takes the caller's pointer by reference,** so the assignment changes `cell` itself. Nothing ran `delete`, so the block is now a leak.
:::

:::check id=br1-reset-three-ways-q2
Which function releases the block and leaves the caller's pointer null?

- [ ] `void close(int* p) { delete p; p = nullptr; }`
- [x] `void close(int*& p) { delete p; p = nullptr; }`
- [ ] `void close(int& p) { delete &p; }`
- [ ] `void close(int*& p) { p = nullptr; delete p; }`

- **The parameter must be `int*&`,** or `p = nullptr;` changes only a copy and the caller keeps a pointer to a released block.
- **The order matters.** After `p = nullptr;` the address is gone, so `delete p;` deletes null, which does nothing, and the block leaks.
:::
:::
