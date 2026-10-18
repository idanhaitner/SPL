---
id: pointers
title: Pointers and references
sources:
  - "Classes/Chapter 2 - Pointers.pptx"
  - "Exrecises/SPL_PS2 (1).pptx"
  - "Exams/20-a.pdf"
  - "Exams/20-a-solution.pdf"
---

A pointer (מצביע) is a variable whose value is the address of another cell. The machine does not know the name `s`. It knows "read 2 bytes from address 4" or "write 4 bytes at address 8, and treat them as a signed int." The type on the pointer is what tells the compiler how many bytes that means, and how to scale arithmetic.

RAM in this lecture is a row of bytes. Each byte is 8 bits. Each byte has an index, starting at 0, and that index is the address. On the course machines a pointer itself occupies 8 bytes, because the system is 64-bit.

## What a pointer is

:::definition id=def-pointer title="Pointer" source="Classes/Chapter 2 - Pointers.pptx"
A pointer is a variable that stores an address. Through it the program can read or write at that address and after it. The declaration `short* ps` says that `ps` points at a `short`. The address-of operator `&` produces the address of an object. The dereference operator `*` reads or writes the object at the stored address.

```cpp
short s = 17978;
short* ps;          // declaration
ps = &s;            // assignment
short* ps2 = &s;    // initialization
*ps = 3;            // dereference, write
std::cout << *ps;   // dereference, read
```
:::

The compiler's table for a variable has three columns: name, type, address. At run time the CPU only sees the address and a width. `short` at address 4 means bytes 4 and 5. The lecture's running picture puts `s` at a low address and `ps` in the next cells, holding that address, drawn in hexadecimal (`45 46 3A` and so on in the slide).

![A short in two bytes, and a pointer cell that stores that short's address](../assets/figures/pointer-bytes.svg)

A pointer may be declared and initialized in one line, or several pointers in one declaration. `short *ps3 = ps2, *ps4` declares two pointers. `short* ps3 = ps2, ps4` declares one pointer and one `short`, because the star binds to the name. The slides pause on that line on purpose.

`NULL` and the integer 0 are the null pointer (מצביע null). Address 0 is a sentinel: it is never a valid object. Reading or writing through it is a segmentation fault. A pointer you did not initialize is not null; it holds whatever bits were in that slot.

```cpp
int* p = nullptr;   // safe to test
*p = 3;             // segmentation fault
```

:::definition id=def-void-pointer title="void pointer" source="Classes/Chapter 2 - Pointers.pptx"
`void*` stores an address and no element type. It cannot be dereferenced. To use the cell you cast it back to a typed pointer.

```cpp
short x;
void* vp = &x;
*vp = 3;            // ill-formed: no type to write
```
:::

### const on a pointer

`const` here is the C++ analogue of Java's `final`, and the place of the keyword changes the meaning.

```cpp
short s1, s2;
const short* ps1 = &s1;   // the short is const: *ps1 = 3 is an error, ps1 = &s2 is allowed
short* const ps2 = &s1;   // the pointer is const: ps2 = &s2 is an error, *ps2 = 3 is allowed
```

Read the star as the boundary. `const` on the left of `*` freezes the pointee. `const` on the right freezes the pointer variable.

### Pointer to pointer, and arithmetic

A pointer is a variable, so it has an address, so another pointer can hold that address.

```cpp
int x = 3, *px = &x, **ppx = &px;
int y = **ppx;     // 3
int* ppy = &&y;    // illegal: &y is not an object you can take again this way
int* ppz = &123;   // illegal: 123 has no address
```

Arithmetic steps by the size of the pointed-to type, not by one byte.

```cpp
int x, *px = &x;
px++;                  // now aims at the next int, sizeof(int) bytes ahead
int y = *(px - 2);     // the int two slots before
int* pa = px, *pb = px + 10;
int d = pb - pa;       // 10, a distance in ints
```

:::problem id=worked-pointer-step source="Classes/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
`int* px` aims at `x`. `sizeof(int)` is 4 and `x` is at address 16. What address does `px + 1` name?

:::solution
`px + 1` names address 20. The step is the size of an `int`, four bytes, not one byte. `*(px + 1)` loads the int that starts at 20. That int is not `x`.
:::
:::

An array name is treated as a pointer to the first element, and subscript is sugar for that arithmetic. The array itself, when written `int ax[8]`, is a block on the stack. `ax` is not a pointer variable you can reseat.

```cpp
int ax[8], b;
b = ax[1];
b = *(ax + 1);         // same load
int* px = ax;          // same as px = &ax[0]
```

The session 2 warning is the other direction: a pointer that does not point at an array can still be subscripted. `pi[3] = 5` writes three elements past whatever `pi` aims at. If `pi` aims at a single local, that write steps on neighboring stack slots.

### A C string is not a std::string

A C string is a `char` array whose last used cell is 0. `const char* c = "abcdefg"` points at that array. `s.c_str()` on a `std::string` hands back a pointer into the string's buffer. If you then assign a new value to `s`, the buffer may move, and the saved `c` dangles. Modifying a const array through that pointer is undefined.

### References

An lvalue (ערך מיקום) is an object with an address that outlives the expression: a variable. An rvalue (ערך זמני) is a temporary: the result of `5 * 22`, a literal. A reference (רפרנס) of the lvalue kind is declared with `&` after the type. It must be initialized with a real object, it cannot be null, and it cannot be reseated. The lecture compares it to a const pointer that was bound once.

```cpp
void dec(int& x) { x--; }
int a = 3;
dec(a);                // a == 2
```

The same effect with a pointer takes the address at the call and dereferences in the body: `void dec(int* x) { (*x)--; }` called as `dec(&a)`. The reference version does not have a pointer object whose address you can print. `printAddr(int& x)` that prints `&x` prints the address of `a`. `printAddr(int* x)` that prints `&x` prints the address of the pointer parameter, which is a different slot from `a`.

`const int&` can bind to a temporary and extends that temporary's life to the reference's scope. It also refuses `x--`.

## A numeric trace

Slide 10's picture, stripped to the cells that matter:

| address | cell | meaning |
| --- | --- | --- |
| 0x00 | 45 46 | the short `s`, value 17978, little-endian in the drawing |
| 0x08 | the 8 bytes of `ps` | the address of `s` |

`*ps = 3` overwrites the short, not the pointer. `ps = &other` overwrites the pointer, not the short.

:::problem id=worked-pointer-trace source="Classes/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
`int i = 2; int* pi = &i; int** ppi = &pi;` What do `i`, `*pi`, `*ppi`, and `**ppi` print, and what does `&i` equal?

:::solution
`i` is 2. `*pi` loads the int at the address stored in `pi`, which is `i`, so 2. `*ppi` loads the pointer stored in `ppi`, which is `pi`, so it prints the address of `i`. `**ppi` loads that address as an int, so 2. `&i` is the same address as `pi` and as `*ppi`.
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

`const` is on the left of `*`, so the short is frozen and the pointer variable is not.
:::

:::trap
`int* p; *p = 3;` uses an uninitialized address. It is not a null check. The session lists the four classic faults: an uninitialized pointer, a null dereference, a use after `delete`, and a second pointer that still holds an address you already deleted (a dangling pointer). Setting `p = nullptr` after `delete p` makes the next `delete p` a no-op and makes the dangling use obvious.
:::

:::trap
`delete` on a block from `new[]`, or the reverse, is the wrong deallocator. A two-dimensional heap array is an array of pointers, each row its own `new[]`. Deleting only the outer array leaks every row. Session 2 leaves that cleanup as an exercise on purpose.
:::

## Practice

:::problem id=ps2-pointer-dangers source="Exrecises/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
For each fragment from the practical session, name the fault. Do not "fix" it by deleting a line that the session says still compiles.

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
Ask, for each pointer, whether it holds a live object's address at the moment of the star.
:::
:::hint
`delete` does not change the bits stored in other pointer variables that copied the address.
:::
:::hint
The first fragment stores the sentinel address 0.
:::
:::solution
The first is a null dereference: address 0 is the sentinel, and the load or store is a segmentation fault.

The second is an uninitialized pointer. The session notes that a bare `int* p;` followed by `*p = 3` is not a well-defined program; the bits in `p` are not an object you allocated.

The third is a use after `delete`. The slot `r` still contains the old address, and that address is no longer an object. The session's later slide comments that the assignment still compiles.

The fourth is a dangling alias. `b` and `a` held one address. `delete b` frees the int. `*a` uses the same address. The safe pattern on the slide is `delete p; p = nullptr;` and the same for every copy, which you cannot do unless you still know about those copies.
:::
:::

:::problem id=ps2-delete-2d source="Exrecises/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
This is the session's two-dimensional allocation. Free every block it obtained. Do not free a row twice.

```cpp
int** arry = new int*[rowCount];
for (int i = 0; i < rowCount; ++i)
    arry[i] = new int[colCount];
```

:::hint
There are `rowCount + 1` heap blocks: one array of pointers, and one array of ints per row.
:::
:::hint
Free the rows before you free the array that holds their addresses. After the outer `delete[]` you no longer have the row pointers.
:::
:::hint
The loop that allocated is the loop that must delete, in reverse order of dependence.
:::
:::solution
```cpp
for (int i = 0; i < rowCount; ++i)
    delete[] arry[i];
delete[] arry;
arry = nullptr;
```

Each `arry[i]` came from `new int[colCount]`, so it is released with `delete[]`. The pointer array came from `new int*[rowCount]`, so it is also `delete[]`. Reversing that order loses the only copies of the row addresses and leaks every row. Setting `arry` to null afterwards matches the session's safe-delete habit.
:::
:::


:::examnote
The question builds a repository of images behind a pointer array, then returns that repository by value from a function that default-constructed a local. The trap is treating the returned object as a copy of the pixels, and treating `sizeof` of a pointer as a length.
:::

:::problem id=exam-20a-q1 source="Exams/20-a.pdf" kind=exam solution_origin=derived
Write a C++ program that stores two kinds of image, `Portrait` and `Scenery`. Each pixel is a gray level in `0..255`. Pixels of one image are kept in a one-dimensional `BYTES` array, row after row. An `ImageRepository` holds many images in an array named `_images`.

a. (10) Implement the constructor and `Insert`. The constructor allocates an array of `capacity` pointers. `Insert` receives an array of images, deep-copies that pointer array, and does not deep-copy the byte arrays of the images. Add fields or methods only if you need them.

b. A student writes:

```cpp
ImageRepository CreateEmptyRep() {
    ImageRepository rep;
    return rep;
}
```

Explain what this returns and what is wrong with using it as an empty repository.

The rest of the question continues the same class; answer (a) and (b) as the pointer question.

:::hint
`_images` is an array of pointers. Copying the array copies addresses. Copying an `Image` would copy pixels. The question asks for the first and forbids the second.
:::
:::hint
`rep` is an automatic object. Returning it by value copy-constructs from that local. If you did not write a copy constructor, the copy shares `_images` with an object that is about to die.
:::
:::hint
The constructor must do `_images = new Image*[capacity];` and remember `capacity`. `Insert` allocates a new pointer array of the same length and copies the pointers, not the `BYTES` blocks.
:::
:::solution
a. One consistent reading of the slide-level rules and the question:

```cpp
class Image { /* pixels in a BYTES block, a virtual destructor */ };
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

The byte arrays stay where the images already allocated them. Two repositories can hold the same `Image*`. That is the shallow copy the question requested. Whoever `delete`s an `Image` must be the sole owner; this design does not give you that.

b. `rep` is constructed in the frame of `CreateEmptyRep`. `return rep` uses the copy constructor. The default one copies the `_images` pointer. Then `rep`'s destructor runs. If that destructor is `delete[] _images`, the returned object holds a dangling pointer. If the destructor does not free, the function leaks on every other path and the caller shares a buffer with a dead local. Either way a by-value return of a pointer-owning object is the rule-of-three problem, not a way to make an empty repository. Return an object that was constructed in the caller's storage, or move, which is the next chapter's tool. A correct empty repository is `ImageRepository(capacity)` with `_size == 0` and a live pointer array.
:::
:::

Pointers are how [Classes and objects](topic:classes-and-objects) name a heap `Student`, and how [Rule of three](topic:rule-of-three) decides whether a copy shares a buffer or allocates a new one.
