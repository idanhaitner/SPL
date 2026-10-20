# 09 — Memory

A running program is a process (תהליך). The operating system gives that process its own address space (מרחב כתובות). C++ does not put every value in one bag inside that space. The lecture draws five regions. Three of them show up constantly in code you write.

| Region | Hebrew on the slides | What lives there | Who frees it |
| --- | --- | --- | --- |
| Code | קוד, Text | the machine instructions | the process ending |
| Initialized statics | Data | globals you initialized | the process ending |
| Uninitialized statics | BSS | globals you did not initialize, zeroed by the loader | the process ending |
| Stack | מחסנית | parameters and locals of the calls that are running now | automatic, when the call returns |
| Heap | ערימה | blocks from `new` | you, with `delete` |

The study site's memory chapter also draws process states, the program counter, and the hardware under this picture. Read that chapter beside this lesson. This file is the part you have to be able to write.

## The stack frame

Each call pushes a frame (מסגרת מחסנית, also activation record). The frame holds the return address, the parameters, and the locals. When the function returns, the frame is popped. The locals are gone.

```cpp
void tick() {
    static int c = 0;    // not in the frame: see below
    int x = c;           // in the frame, a new x on every call
    c = c + 1;
}
```

Call `tick` twice. The first call's `x` is 0, then that `x` is destroyed. The second call's `x` is a different `int`, initialized from the `c` that is still 1.

This is why a frame fits the stack. Calls nest. The return is in the opposite order: last in, first out. A heap block does not have that shape. It has to survive the function that created it, and it can be freed in any order.

Recursion works because each call has its own frame. Infinite recursion fills the stack until the operating system kills the process. That crash is a stack overflow, which is a different word from the integer overflow in lesson 2.

## static

`static` has three shapes in the slides. All three live for the whole run of the process. None of them is recreated on each call.

```cpp
int a = 1;                 // global: the whole run, visible to other files that say extern
static int b = 2;          // file static: the whole run, this file only

void function() {
    static int c = 3;      // function static: the whole run, this function only
}
```

`c` is initialized once, the first time control passes through that line, not on every call. A global or a `static` local is initialized with a value the compiler can see, or zero if you leave it uninitialized in the static region. Do not confuse that zeroing with a local `int x;`, which is not zeroed.

`extern int a;` in another file is a declaration: "a is defined somewhere else." The definition `int a = 1;` appears in one file. That is the One Definition Rule again.

## The heap: new and delete

```cpp
int* p = new int(10);     // one int on the heap, value 10
*p = 11;
delete p;                 // free that one int
p = nullptr;              // the local pointer still exists; it no longer owns anything
```

```cpp
int* a = new int[3]{10, 20, 30};
a[1] = 21;
delete[] a;
```

`new` and `delete` match. `new[]` and `delete[]` match. `delete` on a pointer from `new[]`, or `delete[]` on a pointer from `new`, is undefined behavior. The lecture is explicit: they are not the same operation. An array allocation may store a count next to the elements, and `delete[]` is what reads that count and destroys each element.

`delete nullptr` and `delete[] nullptr` are legal and do nothing. That fact is what makes a moved-from object safe in lesson 13: its pointer is null, and its destructor still runs `delete[]`.

The heap block is not inside the caller's frame. `make_filled` can return the pointer, and the caller frees it later. Forgetting `delete` is a leak (זליגת זיכרון): the block stays reserved until the process ends. The pointer variable itself can die with the frame, and the block remains, unreachable. That is the lecture's "the key was never returned."

What is still true after a leak: the rest of the program is allowed to keep running. The leak is a missing `delete`, not an immediate crash. Tools such as `make test-asan` exist because a leak is silent.

## The crashes that look like "bad luck"

| Mistake | What you did |
| --- | --- |
| Use after free | read or write `*p` after `delete p` |
| Double free | `delete p` twice on the same address |
| Dangling stack pointer | return `&local`, or use a pointer to a local after the function returned |
| Leak | lose the only pointer to a `new` block without `delete` |

Set a pointer to `nullptr` after you delete it if any later code might look at that variable. Deleting a second time is then a no-op. This does not fix a second pointer that still holds the old address. Two pointers to one block are the shallow-copy bug in lesson 12.

## What the demo is showing

`demo.cpp` prints addresses of a global, a function-local `static`, a local, and a `new` int. The numbers change from run to run because the operating system slides the address space (ASLR). Do not submit a lab that depends on a particular address. Do check the lifetimes: the local's storage is meaningful only until the function returns, and the `new` int is meaningful until `delete`.

## Exercise

`make try LESSON=09-memory`

`copy_to_new` allocates a fresh array, copies `n` ints, and returns it. The caller frees both arrays. `tick` is the lecture's function: the first call returns 0, the second returns 1, because the `static` survives.

Next: [building a program](../10-build/lesson.md).
