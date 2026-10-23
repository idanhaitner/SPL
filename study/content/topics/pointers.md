---
id: pointers
title: Pointers and references
sources:
  - "materials/lectures/Chapter 2 - Pointers.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS2 (1).pptx"
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

## References

A reference (רפרנס), written `T&`, is another name for an object that already exists. It is not a second cell you can point somewhere else.

```cpp
int x = 10;
int& ref = x;   // ref and x are the same object
ref = 20;       // writes x, so x is now 20

```

- **Initialization** binds the name once, when the reference is created.
- **Reseating** is not possible. `ref` names `x` for the rest of its lifetime.
- **No null.** A reference always names an object. A pointer may be `nullptr`.

### Lvalues and rvalues

Every expression is an lvalue or an rvalue. An lvalue names an object that is still there after the line. An rvalue is a temporary value that the line uses and then drops.

```cpp
int x = 10;
int y = x + 1;

```

- **`x`** is an lvalue. It is a variable, it has an address, and it is still there on the next line.
- **`x + 1`** is an rvalue. The sum is computed for this line and is not stored under a name.
- **`3` and `3 + 4`** are rvalues. A literal and an arithmetic result have no address you can keep.
- **Address** can be taken of an lvalue: `&x` is legal. `&(x + 1)` is an error, because a temporary has no lasting address.

A variable declared `const` is still an lvalue. `const` forbids assignment. It does not turn the variable into a temporary.

```cpp
const int n = 3;
const int* pn = &n;   // ok: n is an lvalue, so it has an address
n = 4;                // error: n is const, so assignment is forbidden

```

A function call has the category of what it returns.

```cpp
int next(int v) { return v + 1; }  // returns a temporary int
int& slot(int& v) { return v; }    // returns another name for v

int x = 10;
int y = next(x);   // next(x) is an rvalue
slot(x) = 5;       // slot(x) is an lvalue, so this writes x
next(x) = 5;       // error: cannot assign to the temporary

```

What each kind of reference may be initialized from:

| Expression | Kind | `int&` | `const int&` |
| --- | --- | --- | --- |
| `x` | lvalue | allowed | allowed |
| `n` (`const int`) | lvalue | error: would drop `const` | allowed |
| `x + 1` | rvalue | error | allowed |
| `3` | rvalue | error | allowed |
| `next(x)` | rvalue | error | allowed |
| `slot(x)` | lvalue | allowed | allowed |

```cpp
int x = 10;
const int n = 3;

int& a = x;            // ok
int& b = n;            // error: a plain reference could write a const object
int& c = x + 1;        // error: a plain reference cannot bind to a temporary
int& d = 3;            // error: 3 is an rvalue
const int& e = x;      // ok: a const reference may also name an lvalue
const int& f = n;      // ok
const int& g = x + 1;  // ok: the temporary lives as long as g does
const int& h = 3;      // ok: same rule, the literal is kept alive for h
const int& i = next(x); // ok: the returned temporary lives as long as i does

```

- **Plain reference** (`T&`) is initialized only from a non-const lvalue.
- **Reference to const** (`const T&`) is initialized from an lvalue or from an rvalue. Binding an rvalue keeps that temporary alive until the reference itself ends.
- **Parameter** `void show(const int& v)` may be called as `show(x)`, `show(n)`, `show(x + 1)`, or `show(3)`. The temporary for `show(x + 1)` lasts for that call.
- **Parameter** `void edit(int& v)` may be called only as `edit(x)` or `edit(slot(x))`. `edit(x + 1)` and `edit(3)` are errors.

### Passing a parameter

The declaration of the parameter says which form is in use. The call site then has to match that form.

```cpp
void byValue(int n) {
    n = n + 1;             // writes the copy only
}

void byPointer(int* p) {
    if (p == nullptr) return;
    *p = *p + 1;           // writes the caller's int
}

void byRef(int& n) {
    n = n + 1;             // writes the caller's int
}

void byConstRef(const int& n) {
    // int seen = n;      // a read is allowed
    // n = n + 1;         // error: a const reference cannot write
}

int x = 10;
byValue(x);                // x is still 10
byPointer(&x);             // x is 11; the call passes the address of x
byPointer(nullptr);        // legal; byPointer has to handle the null case
byRef(x);                  // x is 12
byConstRef(x);             // reads x; x stays 12
byConstRef(x + 1);         // legal: the temporary lasts for this call
byConstRef(3);             // legal: a literal is an rvalue
byRef(x + 1);              // error: a plain reference needs a real object
byRef(3);                  // error: 3 is an rvalue

```

- **Pass by value** copies the argument into the called function's frame. `byValue(x)` leaves `x` unchanged, because `n = n + 1` writes that copy.
- **Pass by pointer** copies an address. `byPointer(&x)` lets `*p` read or write `x`. `nullptr` is a legal argument, so the function has a null case to consider.
- **Pass by reference** initializes a reference from the caller's object. `byRef(x)` writes `x` itself. A reference has no null value, and it cannot be initialized from `x + 1` or from `3`.
- **`const` reference** reads an object in place, including a temporary. `byConstRef(x)`, `byConstRef(x + 1)`, and `byConstRef(3)` all compile. A write through `n` is rejected at compile time. Use it when the function only reads and a copy would be expensive. Pass by value when the object is cheap to copy, as with an `int`.

### Returning a value

A function may return by value, by pointer, or by reference.

- **Return by value** copies the result to the caller. The function's local can be destroyed; the caller holds its own copy.
- **Returned pointer or reference** has to name an object that is still alive after the called function returns.
- **Local** in that function's frame is destroyed when the frame is popped. Returning its address hands the caller a pointer or a reference to storage the return has already released.

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

- **Pass by value** copies the argument.
- **Plain reference** is pass by reference without `const`, so the procedure may modify the caller's object.
- **`const` reference** reads that object in place.
- **Null pointer** passes no object.
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
Each `arry[i]` is an array on the {{=heap|stack|code region}} and is released with {{=delete[]|delete|no delete}}. The array of pointers is released with {{=delete[]|delete|no delete}}. `delete` releases {{=one object|an array|the stack frame}}.

Each `arry[i]` came from `new int[colCount]`, an array on the heap, so `delete[]` matches it. The pointer array came from `new int*[rowCount]`, so it too is released with `delete[]`. `delete` releases one object.
:::

:::check id=ps2-delete-2d-q3
What follows from releasing the pointer array first?

- [ ] The row addresses have already been copied onto the stack, so the rows stay reachable.
- [ ] `delete[] arry` releases every row as well as the pointer array.
- [x] The only copies of the row addresses are dropped, and every row is a memory leak.

Releasing the pointer array first drops the only copies of the row addresses, and every row is a memory leak.
:::
:::


Pointers are how [Classes and objects](topic:classes-and-objects) name a `Student` on the heap, and how [The rule of three](topic:rule-of-three) decides whether a copy shares a buffer or allocates a new one.
