---
id: pointers
title: Pointers and references
sources:
  - "materials/lectures/Chapter 2 - Pointers.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS2 (1).pptx"
---

This chapter shows how C++ stores memory addresses in variables and follows them to reach objects.

- **Pointers and references:** a pointer stores an address, and a reference is a second name for an existing object.
- **`const` and lifetime:** what a pointer is allowed to change, and how long the object it points at stays alive.
- **Common mistakes:** null pointers, dangling pointers, and what actually happens when you use them.

## Basic syntax

A **pointer** (מצביע) is a variable that stores the address of another object.

:::definition id=def-pointer title="A pointer and its operators" source="materials/lectures/Chapter 2 - Pointers.pptx"

- **`&` (address-of):** `&x` gives the address of `x`.
- **`*` (dereference):** `*p` is the object stored at the address that `p` holds, so you can read it or write it.

```cpp
int x = 10;
int* p = &x;   // p holds the address of x
*p = 20;       // x is now 20

```

:::

- **`nullptr`** is the null pointer value. A pointer set to `nullptr` points at no object.
- **Dereferencing a null pointer** is undefined behavior. In practice the program usually crashes with a segmentation fault.

![A short in two bytes, and a pointer cell that stores the address of the short](../../web/public/figures/pointer-bytes.svg)

### Using const with pointers

A pointer involves two things that could be constant: the object it points at, and the address it holds. Where you write `const` decides which one.

```cpp
int x = 10, y = 20;

const int* p1 = &x;        // Pointer to const int: cannot change *p1, can change p1
int* const p2 = &x;        // Const pointer to int: can change *p2, cannot change p2
const int* const p3 = &x;  // Const pointer to const int: cannot change *p3 or p3

```

Whether `const` appears before or after the `*` decides what is constant. A simple way to read it: `const` applies to whatever is just to its left, or to the type on its right if nothing is to its left.

- **`const int*`** is a pointer to a constant `int`. You can read the `int` through the pointer but not write it, and you can point the pointer somewhere else.
- **`int* const`** is a constant pointer to an `int`. You can write the `int` through it, but the pointer always holds the same address.
- **`const int* const`** makes both constant: you can neither write the `int` through it nor move the pointer.

:::check id=chk-star-const
Which line fails to compile?

```cpp
short s1 = 1, s2 = 2;
const short* ps1 = &s1;
```

- [ ] `std::cout << *ps1;`
- [x] `*ps1 = 3;`
- [ ] `ps1 = &s2;`

- **What `ps1` is:** `const` is to the left of `*`, so `ps1` is a pointer to a constant `short`.
- **Reading is fine:** `std::cout << *ps1;` only reads the `short`.
- **Writing fails:** `*ps1 = 3` tries to write the `short` through the pointer, so it does not compile.
- **Moving the pointer is fine:** `ps1 = &s2` changes where the pointer points, which this declaration allows.
:::

### Pointer arithmetic

Advancing a pointer with `p++` moves it to the next element, not the next byte.

- **The size of one step** is `sizeof(T)` bytes, where `T` is the type the pointer points at. For an `int*`, that is usually 4 bytes.

```cpp
int arr[5] = {10, 20, 30, 40, 50};
int* p = arr;   // Points to arr[0]
p++;            // Points to arr[1] (4 bytes ahead if sizeof(int) == 4)

```

![px points at address 16. px + 1 points four bytes later, at address 20](../../web/public/figures/pointer-step.svg)

The array `arr` in that example lives on the stack (מחסנית).

- **A stack array:** its five integers sit in the current function's frame, and they disappear when the function returns.
- **A heap array:** `new int[n]` puts an array on the heap (ערימה), where it stays until `delete[]` releases it.
- **`delete` versus `delete[]`:** use `delete` for one object made with `new`, and `delete[]` for an array made with `new[]`. Mixing them up is undefined behavior.

:::problem id=worked-pointer-step title="One step of a pointer" source="materials/lectures/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
`sizeof(int)` is 4, and `x` is at address 16. Which address does `px + 1` designate?

```cpp
int x;
int* px = &x;
int* next = px + 1;
```

:::solution
- **The answer:** `px + 1` designates address 20.
- **Why:** one step of an `int*` is `sizeof(int)`, which is four bytes, and 16 + 4 = 20.
- **A warning:** `*(px + 1)` would read whatever lies at address 20. That is not `x`, and since `x` is not part of an array, reading it is undefined behavior.
:::
:::

A pointer is itself a variable, so it also has an address, and a second pointer can hold that address. Its type gets a second star: an `int**` points at an `int*`.

:::problem id=worked-pointer-trace title="A pointer to a pointer" source="materials/lectures/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
What do `i`, `*pi`, `*ppi`, and `**ppi` print, and what is `&i` equal to?

```cpp
int i = 2;
int* pi = &i;
int** ppi = &pi;
```

:::solution
- **`i`** is 2.
- **`*pi`** follows the address in `pi`, which is the address of `i`, so its value is 2.
- **`*ppi`** follows the address in `ppi`, which leads to `pi`. Its value is therefore the value of `pi`, which is the address of `i`.
- **`**ppi`** follows two addresses, from `ppi` to `pi` and from `pi` to `i`, so its value is 2.
- **`&i`** is the same address that `pi` holds and that `*ppi` yields.

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


## References

A reference (רפרנס), written `T&`, is another name for an object that already exists. It is not a second cell you can point somewhere else.

```cpp
int x = 10;
int& ref = x;   // ref and x are the same object
ref = 20;       // writes x, so x is now 20

```

- **A reference must be initialized:** it is bound to its object once, when it is created.
- **A reference cannot be reseated:** `ref` names `x` for its whole lifetime. Assigning to `ref` writes `x`; it does not rebind `ref`.
- **A reference is never null:** it always names an object, whereas a pointer may be `nullptr`.

### Lvalues and rvalues

Every expression is either an lvalue or an rvalue.

- **An lvalue** names an object that still exists after the current line, so it has an address you can take.
- **An rvalue** is a temporary value that the line uses and then throws away.

```cpp
int x = 10;
int y = x + 1;

```

- **`x`** is an lvalue. It is a variable, it has an address, and it is still there on the next line.
- **`x + 1`** is an rvalue. The sum is computed for this line only and is never stored under a name.
- **`3` and `3 + 4`** are rvalues. A literal or an arithmetic result has no address you can keep.
- **The address test:** you can take the address of an lvalue, so `&x` is legal. `&(x + 1)` is an error, because a temporary has no lasting address.

A variable declared `const` is still an lvalue. `const` only forbids assigning to it; it does not turn the variable into a temporary.

```cpp
const int n = 3;
const int* pn = &n;   // ok: n is an lvalue, so it has an address
n = 4;                // error: n is const, so assignment is forbidden

```

A function call is an lvalue or an rvalue depending on its return type. A function that returns a plain value gives an rvalue, and a function that returns a reference gives an lvalue.

```cpp
int next(int v) { return v + 1; }  // returns a temporary int
int& slot(int& v) { return v; }    // returns another name for v

int x = 10;
int y = next(x);   // next(x) is an rvalue
slot(x) = 5;       // slot(x) is an lvalue, so this writes x
next(x) = 5;       // error: cannot assign to the temporary

```

The table shows what each kind of reference can be bound to.

| Expression | Kind | `int&` | `const int&` |
| --- | --- | --- | --- |
| `x` | lvalue | allowed | allowed |
| `n` (`const int`) | lvalue | error: would drop `const` | allowed |
| `x + 1` | rvalue | error | allowed |
| `3` | rvalue | error | allowed |
| `next(x)` | rvalue | error | allowed |
| `slot(x)` | lvalue | allowed | allowed |

Both examples below use `int x = 10;` and `const int n = 3;`.

**A plain reference** (`T&`) can bind only to a non-const lvalue, because it might be used to write the object.

```cpp
int& a = x;        // ok
int& b = n;        // error: a plain reference could write a const object
int& c = x + 1;    // error: a plain reference cannot bind to a temporary
int& d = 3;        // error: 3 is an rvalue
```

**A reference to const** (`const T&`) can bind to anything: an lvalue, a const lvalue, or an rvalue. When it binds to a temporary, the temporary is kept alive for as long as the reference exists.

```cpp
const int& e = x;        // ok: a const reference may also name an lvalue
const int& f = n;        // ok
const int& g = x + 1;    // ok: the temporary lives as long as g does
const int& h = 3;        // ok: the literal is kept alive for h
const int& i = next(x);  // ok: the returned temporary lives as long as i does
```

- **In practice, for parameters:** `void show(const int& v)` accepts `show(x)`, `show(n)`, `show(x + 1)`, and `show(3)`. The temporary in `show(x + 1)` lasts until the call ends.
- **By contrast:** `void edit(int& v)` accepts only real, writable objects such as `edit(x)` or `edit(slot(x))`. `edit(x + 1)` and `edit(3)` do not compile.

### Passing a parameter

The parameter's declaration decides how the argument is passed, and the call has to match it. Each of the four forms below starts from `int x = 10;`.

**Pass by value.** The argument is copied into the called function's frame, so `n = n + 1` changes only the copy and `x` is unchanged.

```cpp
void byValue(int n) {
    n = n + 1;        // writes the copy only
}

byValue(x);           // x is still 10
```

**Pass by pointer.** The address is copied, so the function can read and write `x` through `*p`. Because `nullptr` is a legal argument, the function must handle the null case.

```cpp
void byPointer(int* p) {
    if (p == nullptr) return;
    *p = *p + 1;      // writes the caller's int
}

byPointer(&x);        // x is 11: the call passes the address of x
byPointer(nullptr);   // legal, so byPointer checks for null
```

**Pass by reference.** The parameter becomes another name for the caller's object, so `byRef(x)` changes `x` itself. A reference cannot be null, and it cannot be bound to a temporary such as `x + 1` or a literal such as `3`.

```cpp
void byRef(int& n) {
    n = n + 1;        // writes the caller's int
}

byRef(x);             // x is 11
byRef(x + 1);         // error: a plain reference needs a real object
byRef(3);             // error: 3 is an rvalue
```

**Pass by `const` reference.** The function reads the caller's object in place, without copying it, and the compiler rejects any write. It also accepts temporaries and literals.

```cpp
void byConstRef(const int& n) {
    int seen = n;     // reading is allowed
    // n = n + 1;     // error: a const reference cannot write
}

byConstRef(x);        // reads x, and x stays 10
byConstRef(x + 1);    // legal: the temporary lasts for this call
byConstRef(3);        // legal: the literal is kept alive for this call
```

**Which to choose:** use a `const` reference when the function only reads a large object. For a small type such as `int`, passing by value is simpler and just as fast.

### Returning a value

A function may return by value, by pointer, or by reference.

- **Returning by value** gives the caller its own copy, so it does not matter that the function's local variables are destroyed.
- **Returning a pointer or a reference** is safe only if the object it names is still alive after the function returns.
- **Never return the address of a local:** a local variable is destroyed when its function returns, so the caller would get a pointer or reference to an object that no longer exists.

```cpp
int& bad() {
    int local = 3;
    return local;   // local is gone as soon as bad returns
}

int& good(int& n) {
    return n;       // the caller's object is still alive
}

```

:::check id=chk-pass-mode
A procedure only reads a large object. What should the C++ parameter be?

- [ ] A plain reference, so the procedure can write later if it wants to
- [x] A `const` reference, or pass by value when the object is cheap to copy
- [ ] A null pointer, because no object is required

- **A `const` reference** reads the object in place, without the cost of a copy, and promises not to change it.
- **Passing by value** is also fine when the object is cheap to copy.
- **A plain reference** would allow the procedure to modify the caller's object, which a read-only procedure should not be able to do.
- **A null pointer** passes no object at all, so the procedure would have nothing to read.
:::

## Common pointer mistakes

The compiler does not track what a pointer points at, so these mistakes all compile. Each one is undefined behavior when it runs.

- **Null dereference:** `*p` when `p` is `nullptr`. There is no object to read or write, and the program usually crashes with a segmentation fault.
- **Uninitialized pointer:** `int* q;` holds a garbage address that was never set, so `*q` reads or writes some random place in memory.
- **Dangling pointer:** a pointer that still holds the address of an object that no longer exists. That happens after `delete p`, because `delete` releases the block but does not change `p`. It also happens to a pointer to a local after its function returns.
- **A dangling copy:** if two pointers hold the same address and one of them is deleted, the other one is now dangling too.
- **The safe habit:** after `delete p;`, write `p = nullptr;`, so a later mistake is a clean null dereference instead of a silent write into released memory.

The practice below has one fragment for each of these mistakes.

## Practice

:::problem id=ps2-pointer-dangers title="Four pointer faults" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
Each of these four fragments uses a pointer.

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

- **First fault, null dereference:** `p` points at no object, so writing through it is undefined behavior, and usually a segmentation fault.
- **Second fault, uninitialized pointer:** `int* q;` holds garbage, an address that was never set to any object, so `*q = 3` is undefined behavior.
- **Third fault, use after `delete`:** after `delete r`, the `int` is gone, but `r` still holds its old address.
- **Fourth fault, dangling copy:** `a` and `b` hold the same address. `delete b` releases that `int`, so `*a` writes to memory that was already released.
- **Not a fault:** `int* r = new int` stores a valid address of a new `int`.
:::

:::check id=ps2-pointer-dangers-q2
What is true of `*r = 5` after `delete r`?

- [ ] The line is rejected at compile time.
- [x] The line still compiles. `r` holds the old address, and that address no longer designates an object.
- [ ] `delete r` clears `r`, so the assignment stores into a new `int`.

- **It compiles:** the compiler does not track whether memory was released, so it accepts the line.
- **It is still wrong:** `delete` does not change `r`, which still holds the old address, but no object lives there anymore. Writing to it is undefined behavior.
:::

:::check id=ps2-pointer-dangers-q3
Which repair matches the safe pattern after `delete b`?

- [ ] Call `delete a` as well. `a` and `b` owned two blocks.
- [ ] Set only `b` to null. `a` still addresses a live `int`.
- [ ] Leave both pointers unchanged. `delete` already stored null in every copy.
- [x] Apply `delete p; p = nullptr;` to every copy, while the program still knows about those copies.

- **The situation:** `a` and `b` held the same address, and `delete b` released the one `int` they shared.
- **The safe pattern:** after `delete p;`, write `p = nullptr;`, and do the same for every other pointer that held that address.
- **The catch:** you can only do that while the program still knows where all those copies are, which is why shared raw pointers are risky.
:::
:::

:::problem id=ps2-delete-2d title="Releasing a two-dimensional array" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
This two-dimensional array is built from an array of row pointers, plus one separate `int` array for each row.

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

- **The rows go first:** each `arry[i]` came from `new int[colCount]`, so each must be released with `delete[]`, while their addresses are still readable.
- **The pointer array goes last:** it came from `new int*[rowCount]`, so it is also released with `delete[]`.
- **Why A and C are wrong:** A releases the pointer array first and then reads the row addresses from released memory. C uses `delete`, which is only for single objects.
- **`arry = nullptr`** is the safe habit after a delete, so `arry` cannot be used by mistake later.
:::

:::check id=ps2-delete-2d-q2
Each `arry[i]` is an array on the {{=heap|stack|code region}} and is released with {{=delete[]|delete|no delete}}. The array of pointers is released with {{=delete[]|delete|no delete}}. `delete` releases {{=one object|an array|the stack frame}}.

Each `arry[i]` came from `new int[colCount]`, which is an array on the heap, so it is released with `delete[]`. The pointer array came from `new int*[rowCount]`, so it is also released with `delete[]`. Plain `delete` is only for a single object.
:::

:::check id=ps2-delete-2d-q3
What follows from releasing the pointer array first?

- [ ] The row addresses have already been copied onto the stack, so the rows stay reachable.
- [ ] `delete[] arry` releases every row as well as the pointer array.
- [x] The only copies of the row addresses are dropped, and every row is a memory leak.

The pointer array held the only copies of the row addresses. Once it is released, those addresses can no longer be read safely, so the rows can never be released, and every row becomes a memory leak.
:::
:::

To sum up, a pointer is a variable that holds an address and may be null or moved, while a reference is a fixed second name for an object that already exists.

- **Next:** [Classes and objects](topic:classes-and-objects) uses pointers to reach a `Student` on the heap.
- **Later:** [The rule of three](topic:rule-of-three) uses them to decide whether a copy of an object shares a buffer with the original or allocates its own.
