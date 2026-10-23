---
id: pointers
title: Pointers and references
sources:
  - "materials/lectures/Chapter 2 - Pointers.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS2 (1).pptx"
  - "materials/exams/20-a.pdf"
  - "materials/exams/20-a-solution.pdf"
---

This chapter is how C++ names and follows addresses in memory.

- **Pointers and references** — storing an address, and aliasing an object.
- **Const and lifetime** — what a pointer may change, and what it may still point at.
- **Common mistakes** — null, dangling addresses, and what the machine does when you get it wrong.

## Basic syntax

A **pointer** (מצביע) is a variable that stores the address of another object.

:::definition id=def-pointer title="A pointer and its operators" source="materials/lectures/Chapter 2 - Pointers.pptx"

- **`&`**, the address-of operator, yields the address of its operand.
- **`*`**, dereference, accesses the object at the address the pointer holds.

```cpp
int x = 10;
int* p = &x;   // p holds the address of x
*p = 20;       // x is now 20

```

:::

- **`nullptr`** is a null pointer. It holds no address of a live object.
- **Dereference** of a null pointer causes a segmentation fault.

![A short in two bytes, and a pointer cell that stores the address of the short](../../web/public/figures/pointer-bytes.svg)

### Using const with pointers

```cpp
int x = 10, y = 20;

const int* p1 = &x;        // Pointer to const int: cannot change *p1, can change p1
int* const p2 = &x;        // Const pointer to int: can change *p2, cannot change p2
const int* const p3 = &x;  // Const pointer to const int: cannot change *p3 or p3

```

The position of `const` relative to `*` selects what is constant.

- **`const int*`** is a pointer to a const `int`. Dereference may read the `int`, and the pointer may be reseated.
- **`int* const`** is a const pointer to an `int`. Dereference may write the `int`, and the pointer stays bound to the same address.
- **`const int* const`** fixes both the pointer and the `int`.

### Pointer arithmetic

Advancing a pointer with `p++` adds `sizeof(T)` to the stored address.

- **Step** is the size of the type the pointer addresses, in bytes.

```cpp
int arr[5] = {10, 20, 30, 40, 50};
int* p = arr;   // Points to arr[0]
p++;            // Points to arr[1] (4 bytes ahead if sizeof(int) == 4)

```

![px points at address 16. px + 1 points four bytes later, at address 20](../../web/public/figures/pointer-step.svg)

The array `arr` in that example lives on the stack (מחסנית).

- **Five integers** occupy the current frame, and they end when the frame is popped.
- **`new int[n]`** puts an array on the heap (ערימה). It remains allocated until `delete[]` releases it.
- **`delete`** releases one object.
- **`delete[]`** releases an array.

## References

A reference (רפרנס), written `T&`, is another name for an existing object.

- **Initialization** happens at the point of creation.
- **Binding** stays on that same object.

Every expression is an lvalue or an rvalue.

- **Lvalue** designates an object whose lifetime extends past the current expression. Variables are lvalues, including variables declared `const`.
- **Rvalue** is a temporary that lasts for the expression that uses it. The sum `3 + 4` is an rvalue, and so is the value a function returns by value.
- **Plain reference** is initialized from an lvalue.
- **Reference to const** may also be initialized from an rvalue, and that binding extends the temporary's lifetime to the lifetime of the reference.

```cpp
int x = 10;
int& ref = x; // ref is an alias for x
ref = 20;     // x is now 20

```

C++ has three explicit forms of parameter passing. The declaration of the parameter states which form is in use.

- **Pass by value** copies the argument into the called function's frame. A later write to the parameter changes that copy.
- **Pass by pointer** copies an address into the called function's frame.
- **Dereference** lets that function read or write the caller's object.
- **Null** is allowed for a pointer, so the function has a null case to consider.
- **Reference** has no null value.
- **Pass by reference** initializes a reference parameter from the caller's object. A non-const reference can write that object.
- **`const` reference** reads a large object in place. The parameter type permits that read, and a write through it is rejected at compile time.

A function may return by value, by pointer, or by reference.

- **Return by value** copies the result to the caller.
- **Returned pointer or reference** has to designate an object that is still alive after the called function returns.
- **Local** in that function's frame is destroyed when the frame is popped. Returning its address would hand the caller a pointer or a reference to storage the return has already released.

:::problem id=worked-pointer-step title="One step of a pointer" source="materials/lectures/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
`sizeof(int)` is 4, and `x` is at address 16. Which address does `px + 1` designate?

```cpp
int x;
int* px = &x;
int* next = px + 1;
```

:::solution
- **`px + 1`** designates address 20.
- **Step** equals `sizeof(int)`, four bytes.
- **`*(px + 1)`** loads the `int` that begins at address 20. That `int` is a different object from `x`.
:::
:::

:::check id=chk-pass-mode
A procedure only reads a large object. What should the C++ parameter be?

- [ ] A plain reference, so the procedure can write later if it wants to
- [x] A `const` reference, or pass by value when the object is cheap to copy
- [ ] A null pointer, because no object is required

- **Pass by value** copies the argument.
- **Plain reference** is pass by reference without `const`, so the procedure may modify the caller's object.
- **`const` reference** reads that object in place.
- **Null pointer** passes no object.
:::

:::problem id=worked-pointer-trace title="A pointer to a pointer" source="materials/lectures/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
What do `i`, `*pi`, `*ppi`, and `**ppi` print, and what is `&i` equal to?

```cpp
int i = 2;
int* pi = &i;
int** ppi = &pi;
```

:::solution
- **`i`** is 2.
- **`*pi`** loads the `int` at the address stored in `pi`, which is `i`, so the value is 2.
- **`*ppi`** loads the pointer stored in `ppi`, which is `pi`, so it yields the address of `i`.
- **`**ppi`** loads that address as an `int`, so the value is 2.
- **`&i`** produces the same address that `pi` holds and the same address that `*ppi` yields.

```text
i    = 2
pi   = &i
ppi  = &pi

*pi  = 2
*ppi = &i
**ppi = 2
```
:::
:::

:::check id=chk-star-const
Which line fails to compile?

```cpp
short s1 = 1, s2 = 2;
const short* ps1 = &s1;
```

- [ ] `std::cout << *ps1;`
- [x] `*ps1 = 3;`
- [ ] `ps1 = &s2;`

- **`const`** stands to the left of `*`, so `ps1` is a pointer to a const `short`.
- **Dereference** may read that `short`.
- **`*ps1 = 3`** writes it, and that line fails to compile.
- **`ps1 = &s2`** reseats the pointer, which this declaration allows.
:::

## Practice

:::problem id=ps2-pointer-dangers title="Four pointer faults" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
Four fragments use a pointer.

```cpp
int* p = nullptr;
*p = 3;

int* q;
*q = 3;

int* r = new int;
delete r;
*r = 5;

int* a = new int;
int* b = a;
delete b;
*a = 3;
```

:::check id=ps2-pointer-dangers-q1
Which of these are faults?

- [ ] `int* r = new int` stores an indeterminate address.
- [x] `*p = 3` dereferences null.
- [x] `*q = 3` uses an uninitialized pointer.
- [x] `*r = 5` after `delete r` is a use after `delete`.
- [x] `*a = 3` after `delete b` uses an address that `delete` already released.

- **Null dereference** is the first fault. Address 0 is the null sentinel, and the load or the store is a segmentation fault.
- **Uninitialized pointer** is the second fault. `int* q;` leaves an indeterminate value, so `*q = 3` is undefined behavior. Those bits were never set to an object this program allocated.
- **Use after `delete`** is the third fault.
- **Dangling second pointer** is the fourth fault. `a` and `b` held one address. `delete b` releases the `int`. `*a` uses that same address after the release.
:::

:::check id=ps2-pointer-dangers-q2
What is true of `*r = 5` after `delete r`?

- [ ] The line is rejected at compile time.
- [x] The line still compiles. `r` holds the old address, and that address no longer designates an object.
- [ ] `delete r` clears `r`, so the assignment stores into a new `int`.

- **`r`** still holds the old address, and that address no longer designates an object.
- **Assignment** still compiles.
:::

:::check id=ps2-pointer-dangers-q3
Which repair matches the safe pattern after `delete b`?

- [ ] Call `delete a` as well. `a` and `b` owned two blocks.
- [ ] Set only `b` to null. `a` still addresses a live `int`.
- [ ] Leave both pointers unchanged. `delete` already stored null in every copy.
- [x] Apply `delete p; p = nullptr;` to every copy, while the program still knows about those copies.

- **`a` and `b`** held one address. `delete b` releases the `int`.
- **Safe pattern** is `delete p; p = nullptr;`, applied to every copy.
- **That assignment** is possible only while the program still knows about those copies.
:::
:::

:::problem id=ps2-delete-2d title="Releasing a two-dimensional array" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
A two-dimensional array is allocated as an array of pointers and one array of `int` per row.

```cpp
int** arry = new int*[rowCount];
for (int i = 0; i < rowCount; ++i)
    arry[i] = new int[colCount];
```

:::check id=ps2-delete-2d-q1
Which body releases every block?

```cpp
// A
delete[] arry;
for (int i = 0; i < rowCount; ++i)
    delete arry[i];
```

```cpp
// B
for (int i = 0; i < rowCount; ++i)
    delete[] arry[i];
delete[] arry;
arry = nullptr;
```

```cpp
// C
for (int i = 0; i < rowCount; ++i)
    delete arry[i];
delete arry;
```

- [ ] A. Release the pointer array first, then each row with `delete`.
- [x] B. `delete[]` each row, then `delete[]` the pointer array, then set `arry` to null.
- [ ] C. `delete` matches both `new int[colCount]` and `new int*[rowCount]`.

- **Each `arry[i]`** came from `new int[colCount]`, an array on the heap, so `delete[]` matches it.
- **Pointer array** came from `new int*[rowCount]`, so it too is released with `delete[]`.
- **`delete`** releases one object.
- **`arry = nullptr`** matches the exercise's habit after a delete.
:::

:::check id=ps2-delete-2d-q2
Each `arry[i]` is an array on the {{=heap|stack|vtable}} and is released with {{=delete[]|delete|no delete}}. The array of pointers is released with {{=delete[]|delete|no delete}}. `delete` releases {{=one object|an array|the stack frame}}.

- **Each `arry[i]`** came from `new int[colCount]`, an array on the heap, so `delete[]` matches it.
- **Pointer array** came from `new int*[rowCount]`, so it too is released with `delete[]`.
- **`delete`** releases one object.
:::

:::check id=ps2-delete-2d-q3
What follows from releasing the pointer array first?

- [ ] The row addresses have already been copied onto the stack, so the rows stay reachable.
- [ ] `delete[] arry` releases every row as well as the pointer array.
- [x] The only copies of the row addresses are dropped, and every row is a memory leak.

Releasing the pointer array first drops the only copies of the row addresses, and every row is a memory leak.
:::
:::

:::examnote
The question builds an image repository behind an array of pointers, then returns that repository by value from a function whose local was built by the default constructor. The trap is to treat the returned object as a copy of the pixels, and to treat the `sizeof` of a pointer as a length.
:::

:::problem id=exam-20a-q1 title="An image repository" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
`Portrait` and `Scenery` are images. Each pixel is a gray level in `0..255`. The pixels of one image are stored in a one-dimensional `BYTES` array, row after row. `ImageRepository` holds many images in an array named `_images`. The constructor allocates an array of `capacity` pointers. `Insert` receives an array of images, allocates a new array, and copies the pointers into it. The `BYTES` arrays of the images stay as they are.

```cpp
ImageRepository CreateEmptyRep() {
    ImageRepository rep;
    return rep;
}
```

:::check id=exam-20a-q1-q1
Which constructor and `Insert` match that design?

```cpp
// A
ImageRepository(int capacity)
    : _images(new Image*[capacity]), _capacity(capacity), _size(0) {}
void Insert(Image** src, int n) {
    Image** copy = new Image*[n];
    for (int i = 0; i < n; ++i) copy[i] = new Image(*src[i]);
    delete[] _images;
    _images = copy;
    _capacity = n;
    _size = n;
}
```

```cpp
// B
ImageRepository(int capacity)
    : _images(new Image*[capacity]), _capacity(capacity), _size(0) {}
void Insert(Image** src, int n) {
    Image** copy = new Image*[n];
    for (int i = 0; i < n; ++i) copy[i] = src[i]; // pointers only
    delete[] _images;
    _images = copy;
    _capacity = n;
    _size = n;
}
```

```cpp
// C
ImageRepository(int capacity)
    : _images(nullptr), _capacity(capacity), _size(0) {}
void Insert(Image** src, int n) {
    _images = src;
    _size = n;
}
```

- [ ] A. `Insert` allocates a new `Image` for each element, so the pixels are copied.
- [x] B. The constructor allocates `new Image*[capacity]`. `Insert` copies pointers into a new array. The `BYTES` blocks stay where they are.
- [ ] C. The constructor leaves `_images` null. `Insert` stores the caller's array and does not allocate.

- **Constructor** allocates `_images` with `new Image*[capacity]` and records `capacity` and `_size == 0`.
- **`Insert`** allocates a new array of pointers and copies those pointers.
- **Byte arrays** stay where the images already allocated them.
:::

:::check id=exam-20a-q1-q2
`Insert` releases the previous `_images` array with {{=delete[]|delete|no delete}}. It copies {{=pointers|pixels|BYTES blocks}}. Two repositories can hold the same {{=Image*|stack frame|vtable}}. A `delete` of an `Image` is safe only for a {{=sole owner|second repository|null pointer}}.

- **`Insert`** copies the pointer and releases the previous array with `delete[]`.
- **Byte arrays** stay where the images already allocated them.
- **Two repositories** can hold the same `Image*`. That sharing is the shallow copy the question asked for.
- **`delete` of an `Image`** is safe only for a sole owner. Several repositories can hold the same pointer.
:::

:::check id=exam-20a-q1-q3
What does `CreateEmptyRep` return?

- [ ] `return rep` returns the local object itself, so the destructor of `rep` does not run.
- [ ] The default copy constructor duplicates every `BYTES` array, so the caller owns new pixels.
- [x] `return rep` copies `_images`. If the destructor then executes `delete[] _images`, the returned object holds a dangling pointer. If it leaves the array allocated, the caller shares that buffer with a destroyed local, and other paths leak.

- **`rep`** is constructed in the frame of `CreateEmptyRep`.
- **`return rep`** is a return by value, so it uses the copy constructor.
- **Default copy** copies the pointer `_images`. The destructor of `rep` then runs.
- **`delete[] _images`** in that destructor leaves the returned object with a dangling pointer.
- **Leaving the array allocated** makes every other path a memory leak, and the caller shares the buffer with a local that has already been destroyed.
:::

:::check id=exam-20a-q1-q4
Which object is an empty repository?

- [x] `ImageRepository(capacity)` with `_size == 0` and a live array of pointers.
- [ ] The object returned by `CreateEmptyRep` after its destructor has executed `delete[] _images`.
- [ ] A repository whose `_images` still addresses the array of a local that has been destroyed.

- **Return by value** of an object that owns a pointer array is the problem the rule of three addresses.
- **Empty repository** is built by returning an object constructed in the caller's storage, or by returning by move.
- **Move** is the tool of the next chapter.
- **Correct empty repository** is `ImageRepository(capacity)` with `_size == 0` and a live array of pointers.
:::
:::

Pointers are how [Classes and objects](topic:classes-and-objects) name a `Student` on the heap, and how [The rule of three](topic:rule-of-three) decides whether a copy shares a buffer or allocates a new one.
