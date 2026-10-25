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

In most languages a variable also has a **type**, which fixes how large it is.

When you define a variable for some piece of information, you make two decisions.

1. **What exactly does the variable represent?** Does it represent the **content** of the cells in memory, or the **address** of a cell that holds the information (or where the information starts)?
2. **Is a new variable defined on the stack** (representing content or an address), or is this an additional name, an **alias** (a reference), for an existing variable that represents content or an address?

### The Java answer

In Java the language designers already answered both questions, so programmers are spared the decision.

1. **Variables of simple types** (`int`, `long`, `boolean`, ...) represent **content**. **Variables of array types** (and every other non-simple type, such as `String`) represent an **address**.
2. **You cannot give an alias to an existing variable.** Java has no references in the C++ sense.

```java
int[] a1 = {3, 4};
int[] a2 = a1;           // a2 holds the same address: both name one array
a1 = new int[]{8, 0};    // a1 now holds a new address; a2 still points at {3, 4}
a2[0] = 7;               // changes the old array, which only a2 still names

```

So Java decides for you what goes where.

- **The stack** holds each method's local variables. A local of primitive type holds its value directly, and a local of array type holds only the address of the array.
- **The heap** holds every array, together with the values inside it. Unlike C++, Java never puts an array on the stack.

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

In C++ you make both decisions yourself, for every variable. Here are the three kinds, one at a time.

**1. A variable that holds content.** The value itself sits in the variable's cell on the stack.

```cpp
int i = 5;          // the cell of i holds 5
int arr[3];         // the three cells of arr are on the stack
```

- **`int i`** works exactly as in Java.
- **`int arr[3]`** has no Java equivalent: in Java an array is always on the heap, and the variable holds only its address. Here the whole array lives on the stack, and disappears at the end of the block.

**2. A variable that holds an address.** The variable is a pointer, written with `*`. It holds the address of something else, usually on the heap.

```cpp
int* pi = new int(15);     // pi holds an address; 15 is on the heap
int* pa = new int[3];      // pa holds an address; the three ints are on the heap
```

- **`int* pa`** is what every Java array variable is.
- **`int* pi`** has no Java equivalent: Java never gives you the address of a single `int`.
- **To reach the content** at an address, write `*pi`, which is 15, or `pa[0]` for the first cell of the array. The next section goes through the syntax.

**3. An alias for a variable that already exists.** A reference, written with `&`, is a second name for an existing cell. It takes no cell of its own.

```cpp
int& j = i;     // j is another name for i
j++;            // i is now 6
```

- **Java has nothing like it.** Every Java variable is a cell of its own.
- **You can make an alias for any kind of variable,** including a pointer: `int*& pj = pi;` is another name for the cell of `pi`.

In short:

| | Holds content | Holds an address |
| --- | --- | --- |
| **A new variable** | `int i;` `int arr[3];` | `int* pi;` `int* pa;` |
| **An alias** | `int& j = i;` | `int*& pj = pi;` |
| **What Java allows** | simple types only | arrays (and other non-simple types) only |

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

- **Avoiding a needless copy** of a large value, such as a long string.
- **Not exposing the address of a heap block** to an activation frame that is not responsible for deleting it.

The next two sections show both: passing a parameter to a procedure, and returning a value from it.

## Passing parameters

A call to a procedure has to hand it the information it needs. That information starts in the caller's activation frame, and the procedure runs in a new frame. There are two ways to get it across.

- **By value:** whatever the argument holds, content or an address, is **copied** into new variables in the new frame.
- **By reference:** nothing is copied. The parameter is an **alias** for the caller's variable, which stays where it is.

Java passes only by value. C++ lets you choose, parameter by parameter. Each example below starts from `int x = 10;`.

**Pass by value.** The parameter is a copy, so changing it does not touch the caller's variable.

```cpp
void byValue(int n) {
    n = n + 1;        // changes the copy only
}

byValue(x);           // x is still 10
```

**Pass by pointer.** This is still pass by value, but the value copied is an address. Through that address, the function reaches the caller's variable.

```cpp
void byPointer(int* p) {
    if (p == nullptr) return;
    *p = *p + 1;      // changes the caller's int
}

byPointer(&x);        // x is 11
```

- **The caller writes `&x`,** the address of `x`, and the function writes `*p` to reach it.
- **`nullptr` is a legal argument,** so the function must check for it.

**Pass by reference.** Add `&` to the parameter's type, and nothing else changes in the code. The parameter is now another name for `x`.

```cpp
void byRef(int& n) {
    n = n + 1;        // changes x itself
}

byRef(x);             // x is 11
byRef(3);             // error: 3 is not a variable, there is nothing to alias
```

**Pass by `const` reference.** Still no copy, but the function promises not to change the argument, and the compiler enforces it.

```cpp
void show(const int& n) {
    cout << n;        // reading is fine
    // n = 0;         // error: n is const
}

show(x);              // fine
show(x + 1);          // also fine: a const reference can name a temporary
```

The difference matters most for large values. Copying a long `std::string` copies every one of its characters.

:::problem id=worked-pass-eight title="What does each call copy?" source="materials/notes/lecture-notes.docx.pdf" kind=worked solution_origin=derived
Each function returns the first character of a string. What is copied into the new frame when it is called?

```cpp
char firstCopy(string s)          { return s[0]; }
char firstPtr(string* ps)         { return (*ps)[0]; }
char firstRef(const string& s)    { return s[0]; }

string* pt = new string("a very long sentence ...");
firstCopy(*pt);
firstPtr(pt);
firstRef(*pt);
```

:::solution
- **`firstCopy(*pt)`** copies the whole string, every character, into the new frame. For a long string that is wasteful.
- **`firstPtr(pt)`** copies one address. No string is copied, but now the function holds the address of a heap block it is not responsible for deleting.
- **`firstRef(*pt)`** copies nothing. `s` is another name for the string on the heap, and `const` stops the function from changing it.
- **All three return `'a'`.** The difference is only in the cost, and in what the function is allowed to do.
:::
:::

So how do you choose? You want three things.

- **No needless copies** of large values, such as long strings.
- **No addresses handed out** to a procedure that is not responsible for deleting what is there.
- **Control over side effects:** let the procedure change the caller's data only when that is the point.

That gives a simple rule.

| Is the parameter meant to change inside the procedure? | Pass it |
| --- | --- |
| Yes | By reference (`T&`) |
| No, and it is a simple type | By value (`T`) |
| No, and it is large (a long `string`) | By `const` reference (`const T&`) |

:::check id=chk-pass-mode
A procedure only reads a long `string`. What should the C++ parameter be?

- [ ] A plain reference, so the procedure can write later if it wants to
- [x] A `const` reference, or pass by value when the value is cheap to copy
- [ ] A null pointer, because no object is required

- **A `const` reference** reads the string in place, without the cost of a copy, and promises not to change it.
- **Passing by value** is also fine when the value is cheap to copy, like an `int`.
- **A plain reference** would allow the procedure to modify the caller's string, which a read-only procedure should not be able to do.
- **A null pointer** passes no string at all, so the procedure would have nothing to read.
:::

## Returning a value

The same two options exist on the way back.

- **By value:** the returned value is copied from the function's frame into the caller's frame.
- **By reference:** only an alias is returned. The caller reaches the value where it already is.

Java returns only by value. In C++ the default is also by value, and you return by reference by adding `&` to the return type. Which one is right depends on where the returned thing lives.

**Case A: the function creates something new.** That is most functions.

A simple value is returned by value. The copy is cheap.

```cpp
int add(int i, int j) {
    int sum = i + j;
    return sum;          // fine: the caller gets its own copy of the int
}
```

A local should not be returned by reference, because it is destroyed when the function ends.

```cpp
string& makeBad(const string& a, const string& b) {
    string both = a + b;
    return both;         // bug: both is gone once makeBad returns
}

string& s = makeBad("ab", "cd");   // s names a destroyed string
```

Returning it by value works, but copies it. So when the value is large, or its lifetime should not depend on the block, create it on the heap and return its address.

```cpp
int* makeArray(int n) {
    return new int[n];           // lives on after the function returns
}

int* arr = makeArray(100);
...
delete[] arr;                    // the caller is now responsible for it
```

[Classes and objects](topic:classes-and-objects) shows a design pattern built on this idea, the factory.

**Case B: the function returns something that already exists.** For example, a function that picks one of the caller's strings.

```cpp
const string& longer(const string& a, const string& b) {
    if (a.size() >= b.size())
        return a;        // a belongs to the caller, so it outlives the call
    return b;
}

string x = "hello", y = "hi";
const string& w = longer(x, y);   // w is another name for x; nothing was copied
```

- **`a` and `b` name the caller's strings,** which still exist after the call, so returning a reference to one of them is safe, and saves copying it.
- **`const`** stops the caller from changing `x` through `w`.

:::problem id=worked-return-five title="Which return is a bug?" source="materials/notes/lecture-notes.docx.pdf" kind=worked solution_origin=derived
Which of these functions leave the caller with something that no longer exists?

```cpp
int& first(int i, int j)       { int ret = i + j; return ret; }
int second(int i, int j)       { int ret = i + j; return ret; }
int& third(int* arr)           { return arr[0]; }
```

:::solution
- **`first`** is the bug. `ret` is a local, so it is destroyed when `first` returns, and the caller holds a reference to a dead cell.
- **`second`** is fine. It returns a copy of `ret`.
- **`third`** is fine. `arr[0]` belongs to the caller's array, which still exists after the call.
- **The test:** a returned reference is safe only if the thing it names lives longer than the function.
:::
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
