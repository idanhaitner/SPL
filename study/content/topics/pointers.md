---
id: pointers
title: Variables, pointers, and references
blurb: "Content or address, a new variable or an alias: pointers, references, passing parameters, and returning values."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 2 - Pointers.pptx"
  - "materials/lectures/Chapter 7 - Back to Java.pptx"
  - "materials/sessions/SPL_PS2 (1).pptx"
  - "materials/sessions/SPL_PS3.pptx"
---

Programming languages let you reach memory, to read or write it, through a convenient abstraction: variables. This chapter looks at exactly what a variable represents, how it sits in memory, how it is passed as a parameter, and how it comes back as a return value.

- **Defining a variable:** the two decisions behind every variable, and how Java and C++ answer them.
- **Pointers and references:** the C++ syntax for a variable that holds an address, and for a second name of an existing variable.
- **Parameters and return values:** how to choose the way each one is passed, so that nothing is copied for no reason and no address leaks to code that should not own it.

## Defining a variable

```java
int i;
...
i = 4;      // write i
i++;
...
j = i;      // read i, write j

```

In most languages a variable also has a **type**, which fixes how large it is, and, for objects, its structure as well.

When you define a variable for some piece of information, you make two decisions.

1. **What exactly does the variable represent?** Does it represent the **content** of the cells in memory, or the **address** of a cell that holds the information (or where the information starts)?
2. **Is a new variable defined on the stack** (representing content or an address), or is this an additional name, an **alias** (a reference), for an existing variable that represents content or an address?

### The Java answer

In Java the language designers already answered both questions, so programmers are spared the decision.

1. **Variables of simple types** (`int`, `long`, `boolean`, ...) represent **content**. **Variables of object types** (a `class`) represent an **address**.
2. **You cannot give an alias to an existing variable.** Java has no references in the C++ sense.

```java
Pair p1 = new Pair(3, 4);
Pair p2 = p1;            // p2 holds the same address: both name one Pair
p1 = new Pair(8, 0);     // p1 now holds a new address; p2 still points at (3, 4)

```

So Java decides for you what goes where.

- **The stack** holds each method's local variables. A local of primitive type holds its value directly, and a local of class type holds only an address of an object.
- **The heap** holds every object and every array, together with the fields inside them. Unlike C++, Java never puts an object on the stack.

An array in Java is an object on the heap.

- **`length`:** the array's length is stored inside the array object itself.
- **Primitive elements:** an `int[]` stores the `int` values themselves, inside the array object.
- **Reference elements:** a `String[]` stores only addresses. Each `String` they refer to is a separate object elsewhere on the heap.

![An int array is one block of ints on the heap. A String array is a block of references on the heap, and each string is a further object](../../web/public/figures/java-array.svg)

:::problem id=worked-array-layout title="An array on the heap" source="materials/lectures/Chapter 7 - Back to Java.pptx" kind=worked solution_origin=source
What is on the stack, and what is on the heap?

```java
int[] a = new int[10];
String[] b = new String[10];
b[0] = new String("Avi");
```

:::solution
- **On the stack:** `a` and `b` are two references in the frame of the running method. Nothing else is on the stack.
- **`a`:** it points at one array object on the heap. That object holds a header, the length 10, and ten `int` values, all 0.
- **`b`:** it points at a second array object, whose ten slots are references. Every slot starts as `null`.
- **`b[0]`:** after the third line, this slot refers to a new `String` object, which is a separate object on the heap. The other nine slots are still `null`.
:::
:::

### The C++ answer

In C++ the programmer chooses any combination of the two decisions: content or address, and a new variable or an alias. The example below goes through them, and marks which ones Java also allows.

```cpp
// simple type, content                       [allowed in Java]
int i(5);
i++;

// object, content                            [not in Java]
Pair m(3, 4);
m.sum();                  // returns 7

// simple type, address                       [not in Java]
int* pi = new int(15);
// pi++ would increase pi, the address it holds, not the value 15
cout << i;                // 6
cout << pi;               // 100, the address of the int on the heap
// to reach the content at an address, use the * operator
cout << (*pi);            // 15
(*pi)++;
// to find the address of a content, use the & operator
cout << (&i);             // 10000, the address of i on the stack

// object, address                            [allowed in Java]
Pair* pm = new Pair(8, 9);
pm.first();               // error: pm is not an object
(*pm).first();            // 8. Syntactic sugar: pm->first()

// simple type, content, alias                [not in Java]
int& j = i;
j++;
cout << (&j);             // 10000: j and i are the same cell

// object, content, alias                     [not in Java]
Pair& n = m;
cout << n.second();       // 4

// simple type, address, alias                [not in Java]
int*& pj = pi;

// object, address, alias                     [not in Java]
Pair*& pn = pm;

```

| Stack address | Content | Variable |
| --- | --- | --- |
| 10000 | 7 | `i`, `j` |
| 9992 | 4 | `m`, `n` (second field) |
| 9984 | 3 | `m`, `n` (first field) |
| 9976 | 100 | `pi`, `pj` |
| 9968 | 200 | `pm`, `pn` |

An alias takes no cell of its own: `j` is another name for the cell of `i`, and `pn` is another name for the cell of `pm`.

## Pointers

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

## Choosing the kind of variable

How do you choose the kind of variable you need: content or address, and a new variable or an alias?

### Content or address

**The general idea:** where you can, always prefer to define the information itself, the content, on the stack, rather than allocate it on the heap. Allocation on the stack is far more efficient, and its release is automatic and safe.

- **Always prefer, where possible, a variable that represents content.** The variable always sits on the stack, and if it represents content, then the content is on the stack too.

When is that possible? When the size of the information is known at compile time (not an array of unknown size, and no inheritance whose concrete type is unknown in advance), and the information is needed only in the current block. Otherwise, define the variable as an address, a pointer.

### When an alias is needed

**The general idea:** a reference lets you support two concepts.

- **Avoiding a needless copy** of an object.
- **Not exposing the address of a heap object** to an activation frame that is not responsible for deleting it.

You will see these scenarios in detail in what follows:

- **a heap object** passed as a parameter to a procedure,
- **a field of a class** that refers to information belonging to another object,
- **a getter of a class** that returns an object.

## Passing parameters

A call to a procedure involves passing the information it needs: the current activation frame must hand the parameters over to the procedure's new activation frame. There are two ways to pass a parameter.

- **By value:** whatever the variable represents (content or address) is duplicated and copied into the new frame, as new variables.
- **By reference:** the parameters do not move to the new frame, but stay where they are. The new frame gets access to information that lives elsewhere, which means the procedure gets additional names (aliases) for variables that already exist somewhere else.

In Java there is only passing by value. In C++ the programmer chooses how to pass each parameter.

:::problem id=worked-pass-eight title="Eight ways to pass a pair" source="materials/notes/lecture-notes.docx.pdf" kind=worked solution_origin=source
Which of these functions copy their argument into the new frame, and which receive an alias for a variable of `main`?

```cpp
int sum1(int i, int j) { return i + j; }
int sum2(Pair n) { return n.first() + n.second(); }
int sum3(int* pi, int* pj) { return (*pi) + (*pj); }
int sum4(Pair* pn) { return (*pn).first() + (*pn).second(); }

int sum5(int& i, int& j) { return i + j; }
int sum6(const Pair& n) { return n.first() + n.second(); }
int sum7(int*& pi, int*& pj) { return (*pi) + (*pj); }
int sum8(Pair*& pn) { return (*pn).first() + (*pn).second(); }

{
    int a(5);
    int b(6);
    Pair* pm = new Pair(3, 4);

    cout << sum1(a, b);
    cout << sum2(*pm);
    cout << sum3(&a, &b);
    cout << sum4(pm);

    cout << sum5(a, b);
    cout << sum6(*pm);
    cout << sum7(&a, &b);
    cout << sum8(pm);

    delete pm;
}

```

:::solution
- **The default is by value.** `sum1` through `sum4` copy their arguments into the new frame: two `int`s, a whole `Pair`, two addresses, and one address.
- **`sum2` copies the whole object,** both fields, which costs a copy for nothing.
- **`sum3` and `sum4` copy only addresses,** so they reach `a`, `b`, and the pair on the heap through those copies.
- **To pass by reference you mark the type with `&`,** and that is the only change: the rest of the code stays the same. `sum5` through `sum8` get aliases, so nothing new is placed in their frames for the parameters.
- **`sum6` takes `const Pair&`,** which avoids copying the pair, and promises not to change it.
- **`sum7(&a, &b)` does not compile:** `&a` is a temporary address, an rvalue, and a plain reference `int*&` cannot bind to it.
:::
:::

How do you choose how to pass each parameter? You want to get the most out of three points.

- **Saving copies.** Prefer to avoid copying objects or arrays.
- **Not exposing a memory address** to a procedure that is not responsible for deleting it (it only uses the information).
- **Supporting changes** that the procedure makes to the caller's information (a side effect, which is generally not recommended), or preventing the procedure from making changes.

That gives a simple rule.

| Is the parameter meant to change inside the procedure? | Pass it |
| --- | --- |
| Yes | By reference |
| No, and it is a simple type | By value |
| No, and it is an object | By `const` reference |

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

## Returning a value

A value can be returned from a function in two ways.

- **By value:** the returned value (an address or content) is duplicated and copied from the function's activation frame into the previous frame.
- **By reference:** the returned value stays where it is. What is returned is only an alias, and the previous frame gets access to it.

In Java a function can return only by value. In C++ the programmer picks one of the two. Here too the default is to return by value, and you can return by reference by writing `&` next to the type of the returned value.

:::problem id=worked-return-five title="Five ways to return a sum" source="materials/notes/lecture-notes.docx.pdf" kind=worked solution_origin=source
Which of these functions are correct, and which leave the caller with something that no longer exists?

```cpp
int sum9(int i, int j) { int ret(i + j); return ret; }
Number sum10(int i, int j) { Number ret(i + j); return ret; }
int& sum11(int i, int j) { int ret(i + j); return ret; }
Number& sum12(int i, int j) { Number ret(i + j); return ret; }
Number* sum13(int i, int j) { Number* ret = new Number(i + j); return ret; }

{
    int a = sum9(1, 2);
    Number n = sum10(1, 2);
    int& b = sum11(1, 2);
    Number& m = sum12(1, 2);
    Number* pn = sum13(1, 2);
    ...
    delete pn;
}

```

:::solution
- **`sum9`** returns a simple type by value. It is correct and cheap.
- **`sum10`** returns an object by value. It is correct, but it copies the object into the previous frame.
- **`sum11` and `sum12`** return a reference to `ret`, a local variable. `ret` is destroyed when the function ends, so `b` and `m` are aliases for a cell that no longer exists. This is a serious bug.
- **`sum13`** creates the `Number` on the heap and returns its address. It is correct, but now the caller is responsible for the object, and must `delete pn`.
:::
:::

How do you choose the way to return a value? Here too you want to avoid copying objects, and not return a reference to a place that no longer exists in memory. There are two cases.

**Case A: the function returns new information that it created** (most functions).

- **A simple type** is returned by value.
- **An object** should not be returned by value, because the copy is inefficient. On the other hand it cannot be returned by reference, because it is erased from the stack when the function ends. This is a case of information whose lifetime is not tied to the block where it was defined, so define it on the heap and return its address. The caller is then responsible for deleting it. [Classes and objects](topic:classes-and-objects) shows a design pattern for this, called a factory.

**Case B: the function returns information that already exists.** The typical example is a getter of a class.

- **Simple types** are returned by value.
- **Objects** are returned by (`const`) reference.

The `Student` class in [Classes and objects](topic:classes-and-objects) is an example.

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

:::problem id=ps3-pass-by-value title="Three signatures of emphasize" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
Here are three ways to pass a string to a function.

```cpp
void emphasize1(std::string word);
void emphasize2(std::string& word);
void emphasize3(std::string* word);

```

:::check id=ps3-pass-by-value-q1
What does `emphasize1` do with the caller's string?

- [x] It receives a copy. Changes inside the function leave the caller's string as it was
- [ ] It modifies the caller's string
- [ ] It accepts `nullptr` in place of the string

- **`emphasize1` takes its parameter by value**, so it receives its own copy of the string.
- **Changes to that copy** inside the function leave the caller's string as it was.
:::

:::check id=ps3-pass-by-value-q2
Which of these hold?

- [x] `emphasize2` receives a reference, so changes inside the function modify the caller's string
- [ ] `emphasize2` can be passed `nullptr`
- [x] `emphasize3` receives a pointer. Changes through that pointer modify the caller's string, and the pointer may be `nullptr`

A reference always refers to a real object, so it can never be `nullptr`. A pointer, by contrast, may be `nullptr`.
:::

:::check id=ps3-pass-by-value-q3
The body of `emphasize3` has to check for {{=nullptr|a reference|a copy}} before it uses the pointer.

Dereferencing a `nullptr` is undefined behavior, so a function that takes a pointer must check for `nullptr` before using it.
:::
:::

To sum up, every variable is a choice between content and an address, and between a new variable and an alias. Java makes that choice for you. In C++ you make it each time, guided by two goals: avoid needless copies, and never hand out an address to code that is not responsible for it.

- **Next:** [Classes and objects](topic:classes-and-objects) applies the same questions to objects: how they are laid out in memory, initialized, and deleted.
- **Later:** [The rule of three](topic:rule-of-three) uses them to decide whether a copy of an object shares a buffer with the original or allocates its own.
