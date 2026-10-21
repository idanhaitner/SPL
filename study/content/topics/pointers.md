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

A pointer (מצביע) is a variable that stores the address of another object.

## Basic syntax

:::definition id=def-pointer title="A pointer and its operators" source="materials/lectures/Chapter 2 - Pointers.pptx"

- `&`, the address-of operator, yields the address of its operand.
- `*`, dereference, accesses the object at the address the pointer holds.

```cpp
int x = 10;
int* p = &x;   // p holds the address of x
*p = 20;       // x is now 20

```

:::

The value `nullptr` is a null pointer: it holds no address of a live object. Dereferencing a null pointer causes a segmentation fault.

![A short in two bytes, and a pointer cell that stores the address of the short](../assets/figures/pointer-bytes.svg)

### Using const with pointers

```cpp
int x = 10, y = 20;

const int* p1 = &x;        // Pointer to const int: cannot change *p1, can change p1
int* const p2 = &x;        // Const pointer to int: can change *p2, cannot change p2
const int* const p3 = &x;  // Const pointer to const int: cannot change *p3 or p3

```

The position of `const` relative to `*` selects what is constant. `const int*` is a pointer to a const `int`: dereference may read the `int`, and the pointer may be reseated. `int* const` is a const pointer to an `int`: dereference may write the `int`, and the pointer stays bound to the same address. `const int* const` fixes both the pointer and the `int`.

### Pointer arithmetic

Advancing a pointer with `p++` adds `sizeof(T)` to the stored address. The step is the size of the type the pointer addresses, in bytes:

```cpp
int arr[5] = {10, 20, 30, 40, 50};
int* p = arr;   // Points to arr[0]
p++;            // Points to arr[1] (4 bytes ahead if sizeof(int) == 4)

```

![px points at address 16. px + 1 points four bytes later, at address 20](../assets/figures/pointer-step.svg)

The array `arr` in that example lives on the stack (מחסנית). Its five integers occupy the current frame, and they end when the frame is popped. An array created by `new int[n]` lives on the heap (ערימה). It remains allocated until `delete[]` releases it. `delete` releases one object. `delete[]` releases an array.

## References

A reference (רפרנס), written `T&`, is another name for an existing object. It is initialized at the point of creation, and it stays bound to that same object.

Every expression is an lvalue or an rvalue. An lvalue designates an object whose lifetime extends past the current expression. Variables are lvalues, including variables declared `const`. An rvalue is a temporary that lasts for the expression that uses it. The sum `3 + 4` is an rvalue, and so is the value a function returns by value. A plain reference is initialized from an lvalue. A reference to const may also be initialized from an rvalue, and that binding extends the temporary's lifetime to the lifetime of the reference.

```cpp
int x = 10;
int& ref = x; // ref is an alias for x
ref = 20;     // x is now 20

```

C++ has three explicit forms of parameter passing. The declaration of the parameter states which form is in use.

Pass by value copies the argument into the called function's frame. A later write to the parameter changes that copy.

Pass by pointer copies an address into the called function's frame. The called function dereferences the pointer to read or write the caller's object. A pointer may be null, so that function has a null case to consider. A reference has no null value.

Pass by reference initializes a reference parameter from the caller's object. A non-const reference can write that object. A `const` reference reads a large object in place. The parameter type permits that read, and a write through it is rejected at compile time.

A function may return by value, by pointer, or by reference. Return by value copies the result to the caller. A returned pointer or reference has to designate an object that is still alive after the called function returns. A local in that function's frame is destroyed when the frame is popped. Returning its address would hand the caller a pointer or a reference to storage the return has already released.

:::problem id=worked-pointer-step title="One step of a pointer" source="materials/lectures/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
`sizeof(int)` is 4, and `x` is at address 16. Which address does `px + 1` designate?

```cpp
int x;
int* px = &x;
int* next = px + 1;
```

:::solution
`px + 1` designates address 20. The step equals `sizeof(int)`, four bytes. `*(px + 1)` loads the `int` that begins at address 20. That `int` is a different object from `x`.
:::
:::

:::check id=chk-pass-mode
A procedure only reads a large object. What should the C++ parameter be?

- [ ] A plain reference, so the procedure can write later if it wants to
- [x] A `const` reference, or pass by value when the object is cheap to copy
- [ ] A null pointer, because no object is required

Pass by value copies the argument. A plain reference is pass by reference without `const`, so the procedure may modify the caller's object. A `const` reference reads that object in place. A null pointer passes no object.
:::

:::problem id=worked-pointer-trace title="A pointer to a pointer" source="materials/lectures/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
What do `i`, `*pi`, `*ppi`, and `**ppi` print, and what is `&i` equal to?

```cpp
int i = 2;
int* pi = &i;
int** ppi = &pi;
```

:::solution
`i` is 2. `*pi` loads the `int` at the address stored in `pi`, which is `i`, so the value is 2. `*ppi` loads the pointer stored in `ppi`, which is `pi`, so it yields the address of `i`. `**ppi` loads that address as an `int`, so the value is 2. The address-of operator applied to `i` produces the same address that `pi` holds and the same address that `*ppi` yields.

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

`const` stands to the left of `*`, so `ps1` is a pointer to a const `short`. Dereference may read that `short`. The assignment `*ps1 = 3` writes it, and that line fails to compile. The assignment `ps1 = &s2` reseats the pointer, which this declaration allows.
:::

## Practice

:::problem id=ps2-pointer-dangers title="Four pointer faults" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
For each fragment, name the fault. Leave in place any line that still compiles.

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

:::hint
For each pointer, at the moment of the dereference, ask whether it holds the address of a live object.
:::
:::hint
`delete` releases the block. Any other pointer variable that copied the address keeps the bits it already holds.
:::
:::hint
The first fragment stores the sentinel address 0.
:::
:::solution
The first fault is a dereference of null. Address 0 is the null sentinel, and the load or the store is a segmentation fault.

The second fault is an uninitialized pointer. The exercise notes that a declaration such as `int* q;` leaves the pointer with an indeterminate value, so `*q = 3` is undefined behavior. Those bits were never set to an object this program allocated.

The third fault is a use after `delete`. The variable `r` still holds the old address, and that address no longer designates an object. A later slide in the exercise observes that the assignment still compiles.

The fourth fault is a dangling second pointer. `a` and `b` held one address. `delete b` releases the `int`. `*a` uses that same address after the release. The safe pattern on the slide is `delete p; p = nullptr;`, applied to every copy. That assignment is possible only while the program still knows about those copies.
:::
:::

:::problem id=ps2-delete-2d title="Releasing a two-dimensional array" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
Release every block this allocation obtained. Release each row once.

```cpp
int** arry = new int*[rowCount];
for (int i = 0; i < rowCount; ++i)
    arry[i] = new int[colCount];
```

:::hint
There are `rowCount + 1` blocks on the heap: one array of pointers, and one array of `int` for each row.
:::
:::hint
Release the rows before you release the array that holds their addresses. After the outer `delete[]`, the row pointers are gone.
:::
:::hint
The loop that allocated is the loop that must delete, in the reverse order of the dependency.
:::
:::solution
```cpp
for (int i = 0; i < rowCount; ++i)
    delete[] arry[i];
delete[] arry;
arry = nullptr;
```

Each `arry[i]` came from `new int[colCount]`, which is an array on the heap, so `delete[]` is the release that matches it. The array of pointers came from `new int*[rowCount]`, so it too is released with `delete[]`. `delete` releases one object. Releasing the pointer array first would drop the only copies of the row addresses, and every row would be a memory leak (זליגת זיכרון). Setting `arry` to null afterward matches the exercise's habit after a delete.
:::
:::

:::examnote
The question builds an image repository behind an array of pointers, then returns that repository by value from a function whose local was built by the default constructor. The trap is to treat the returned object as a copy of the pixels, and to treat the `sizeof` of a pointer as a length.
:::

:::problem id=exam-20a-q1 title="An image repository" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
Write a C++ program that stores two kinds of image, `Portrait` and `Scenery`. Each pixel is a gray level in `0..255`. The pixels of one image are stored in a one-dimensional `BYTES` array, row after row. `ImageRepository` holds many images in an array named `_images`.

a. Implement the constructor and `Insert`. The constructor allocates an array of `capacity` pointers. `Insert` receives an array of images, allocates a new array, and copies the pointers into it. The `BYTES` arrays of the images stay as they are. Add a field or a method only when you need it.

b. A student writes:

```cpp
ImageRepository CreateEmptyRep() {
    ImageRepository rep;
    return rep;
}
```

Explain what this returns, and what goes wrong if it is used as an empty repository.

The rest of the question continues the same class. Answer (a) and (b) as the question about pointers.
:::hint
`_images` is an array of pointers. Copying that array copies addresses. Copying an `Image` would copy pixels. The question asks for the copy of the addresses, and it rules out the copy of the pixels.
:::
:::hint
`rep` is an automatic object. Returning it by value constructs a copy from the local. With no copy constructor of your own, that copy shares `_images` with an object that is about to be destroyed.
:::
:::hint
The constructor has to execute `_images = new Image*[capacity];` and record `capacity`. `Insert` allocates a new array of pointers of that length and copies those pointers. The `BYTES` blocks stay where they are.
:::
:::solution
a. One reading that stays consistent with the rules on the slides and with the question:

```cpp
class Image { /* pixels in a BYTES block, virtual destructor */ };
class ImageRepository {
    Image** _images;
    int _capacity;
    int _size;
public:
    ImageRepository(int capacity)
        : _images(new Image*[capacity]), _capacity(capacity), _size(0) {}
    void Insert(Image** src, int n) {
        Image** copy = new Image*[n];
        for (int i = 0; i < n; ++i) copy[i] = src[i];  // pointers only
        delete[] _images;
        _images = copy;
        _capacity = n;
        _size = n;
    }
};
```

The byte arrays stay where the images already allocated them. Two repositories can hold the same `Image*`. That sharing of the image objects is the shallow copy the question asked for. A `delete` of an `Image` is safe only for a sole owner. `Insert` copies the pointer, so several repositories can hold it.

b. `rep` is constructed in the frame of `CreateEmptyRep`. `return rep` is a return by value, so it uses the copy constructor. The default copy constructor copies the pointer `_images`. The destructor of `rep` then runs. If that destructor executes `delete[] _images`, the returned object holds a dangling pointer. If the destructor leaves the array allocated, every other path is a memory leak, and the caller shares the buffer with a local that has already been destroyed. In either case, returning by value an object that owns a pointer array is the problem the rule of three addresses. An empty repository is built by returning an object constructed in the caller's storage, or by returning by move. Move is the tool of the next chapter. A correct empty repository is `ImageRepository(capacity)` with `_size == 0` and a live array of pointers.
:::
:::

Pointers are how [Classes and objects](topic:classes-and-objects) name a `Student` on the heap, and how [The rule of three](topic:rule-of-three) decides whether a copy shares a buffer or allocates a new one.
