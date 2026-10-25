---
id: rule-of-five
title: The rule of five and zero
blurb: "Moving from temporaries, the rule of five, smart pointers, and the rule of zero."
sources:
  - "materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
  - "materials/sessions/SPL_PS4.pptx"
  - "materials/exams/16-b.pdf"
  - "materials/exams/16-b-solution.pdf"
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
  - "materials/exams/24-a.pdf"
  - "materials/exams/24-a-solution.pdf"
  - "materials/exams/24-c.pdf"
  - "materials/exams/24-c-solution.pdf"
---

This chapter shows how C++ copies and moves objects that own resources, without two objects ever sharing one buffer by accident.

- **Value categories:** which objects are safe to move from, and which must be left alone.
- **The rule of five:** the five special members that make copying and moving correct.
- **The rule of zero:** when you should write none of them, because the compiler's versions are already correct.

## Copying versus moving

Copying gives two objects the same data, but it is expensive, for example when a function returns a large object.

- **A move** (העברה), added in C++11, lets a temporary object hand its resource to a new owner. Only the pointer changes hands; the bytes themselves are not copied.
- **The rule of five** (חוק החמישה) names the five special members that make both copying and moving correct.
- **The rule of zero** (חוק האפס) says to write none of them when every data member already manages its own resource.

:::definition id=def-value-category title="lvalue and rvalue" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
An lvalue names an object that has an address.

- **What you can do with an lvalue:** take its address, assign to it (unless it is `const`), and bind a reference to it.
- **Where the name comes from:** historically, an lvalue was something that could stand on the left side of an assignment.
- **An rvalue** is a value that is about to be used up. It can stand only on the right side of an assignment.
- **A temporary** is an rvalue, such as the result of a computation, or an object returned by value from a function.
- **A temporary's lifetime** ends at the end of the full expression that created it, unless a reference extends it.
- **`const T&`** can bind to an lvalue or to an rvalue. Binding it to a temporary keeps that temporary alive for as long as the reference exists.
- **The `const`** means that code cannot modify the object through that reference.
:::

This is why the value category matters for moving. Stealing an object's buffer leaves that object empty.

- **An rvalue is safe to move from:** it is a temporary, and nothing will read it again after this line.
- **An lvalue is not:** it has a name, so the code below may still use it, and it must keep its contents.
- **So the compiler moves only from rvalues.** To move from a named object anyway, you must say so explicitly, with `std::move`.

`std::move(x)` does not move anything by itself. It is only a cast.

- **What the cast does:** it tells the compiler to treat the lvalue `x` as an rvalue. The compiler can then choose the overload that takes an rvalue reference, which is the one that steals the resource.
- **Who actually moves:** the move constructor or move-assignment operator that the compiler chose.
- **After the move:** `x` is in a valid but unspecified state. You may destroy it or assign it a new value, but you should not rely on its contents.
- **For `Image`:** a moved-from `Image` holds a null pointer, so destroying it is safe.

An rvalue reference is written `&&`, as in `Image&&`.

- **What it binds to:** an rvalue reference can bind only to an rvalue, such as a temporary or the result of `std::move`.
- **Where it is used:** it is the parameter type of the move constructor and of the move-assignment operator.

With these two overloads, the compiler picks the right version automatically: the first one only reads the image, and the second may take its buffer.

```cpp
void convert(const Image& img);   // binds a named image or a temporary, does not steal
void convert(Image&& img);        // binds only a temporary, may steal

```

### Moving a Student

The deep copy from [The rule of three](topic:rule-of-three) is correct, but wasteful when the source is a temporary.

```cpp
Student ringo(Student(1, "yosi", new Bag7(), univ));
```

The `Student(...)` in parentheses is a temporary, an rvalue. It is destroyed right after this line. Cloning its bag and books, only to delete the originals a moment later, is pointless. Better to **take** them.

C++ tells the two cases apart by the parameter type.

- **`const Student&`** binds to an lvalue, an object someone will still use. Copy it.
- **`Student&&`** binds to an rvalue, a temporary nobody will use again. Take from it.

**The move constructor** takes the pointers, then clears them in the source, so the source's destructor deletes nothing.

```cpp
Student(Student&& other)
    : _id(other._id), _name(other._name), _univ(other._univ),
      _bag(other._bag),          // take the other's bag
      _books(other._books)       // take the other's books
{
    other._bag = nullptr;        // the other's destructor deletes nothing
    other._books.clear();
}
```

**The move assignment operator** does the same for an object that already exists. Like the ordinary assignment, it first releases what it held. Here is the part for `_bag`:

```cpp
Student& operator=(Student&& other) {
    if (this != &other) {
        delete _bag;             // release the old bag
        _bag = other._bag;       // take the other's
        other._bag = nullptr;    // and leave it empty
        ...                      // the same for _books, and copy the simple fields
    }
    return *this;
}
```

It runs for a line like `ringo = Student(2, "danny", new Bag5(), univ);`, where the right side is a temporary.

Writing these two methods, in addition to the three from before, is called the **rule of five**.

### Move operations

:::definition id=def-rule-of-five title="The rule of five" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
The rule of five extends the rule of three (חוק השלושה).

- **The rule:** if you write any one of the five, write all five. They are the destructor (הורס), the copy constructor (בנאי העתקה), the copy assignment operator (אופרטור השמה), the move constructor, and the move-assignment operator.
- **The first three** keep ownership correct, so the class never frees a buffer twice and never leaks one.
- **The last two** perform moves: a temporary hands over its resource, and the only thing copied is the pointer.
:::

The move constructor copies the pointer and leaves the bytes where they are.

- **Resetting the source:** it then sets the source's pointer to `nullptr` and its dimensions to 0, so the source no longer owns the buffer.
- **Why that matters:** when the source is destroyed later, its destructor runs `delete[]` on a null pointer, which is safe and releases nothing.

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}

```

The move-assignment operator is different, because `*this` already holds a buffer that must be released. A `swap` handles both jobs at once.

```cpp
Image& Image::operator=(Image&& other) {
    swap(other);
    return *this;
}

```

After the swap, `other` holds the buffer that used to belong to `*this`. Since `other` is a temporary, its destructor soon releases that old buffer.

## Smart pointers

The memory part of the notes ends with a design pattern that uses the rule of three to manage heap objects automatically: the **smart pointer**.

**The problem.** With raw pointers, it is often unclear who should delete what.

```cpp
Student* s1 = new Student(...);
Student* s2 = new Student(...);
s1 = s2;
delete s1;   // ?
delete s2;   // ?
```

After `s1 = s2`, both point at the second student, and the first one is leaked. Deleting both pointers now deletes the second student twice. With more copies, passed into functions and stored in fields, nobody can tell when it is safe to delete.

**The idea.** Wrap the address in an object that counts how many variables currently know it.

- **When the wrapper is created,** the count is 1.
- **When it is copied** (passed to a function, or assigned to another wrapper), the count goes up.
- **When a copy is destroyed or reassigned,** the count goes down.
- **When the count reaches 0,** nobody knows the address anymore, so the wrapper deletes the object.

Those are exactly the three scenarios of the rule of three, so the wrapper is built from a constructor, a copy constructor, a destructor, and an assignment operator.

**The fields.** The count is shared by every wrapper of the same address, so it lives on the heap too.

```cpp
template <typename T>
class smart_ptr {
    T _ptr;            // the address it manages
    int* _refcount;    // how many smart_ptrs share it

    void checkIfDelete() {
        if (*_refcount == 0) {
            delete _ptr;
            delete _refcount;
        }
    }
    ...
};
```

**Creating and copying** start or increase the count.

```cpp
smart_ptr(T ptr) : _ptr(ptr), _refcount(new int(1)) { }

smart_ptr(const smart_ptr& other)
    : _ptr(other._ptr), _refcount(other._refcount) {
    (*_refcount)++;
}
```

**Destroying** decreases it, and deletes on the last one.

```cpp
~smart_ptr() {
    (*_refcount)--;
    checkIfDelete();
}
```

**Assigning** lets go of the old address, then joins the new one.

```cpp
smart_ptr& operator=(const smart_ptr& other) {
    if (this != &other) {
        (*_refcount)--;              // leave the old address
        checkIfDelete();
        _ptr = other._ptr;           // join the new one
        _refcount = other._refcount;
        (*_refcount)++;
    }
    return *this;
}
```

**A trace.**

```cpp
{
    smart_ptr<Student*> a(new Student(...));   // A: count 1
    smart_ptr<Student*> b(new Student(...));   // B: count 1
    smart_ptr<Student*> c = a;                 // A: count 2
    a = b;                                     // A: count 1, B: count 2
}                                              // c, b, a destroyed:
                                               // A reaches 0 and is deleted,
                                               // B reaches 0 and is deleted
```

Nobody wrote `delete`, and each student was deleted exactly once.

**A note on `template`.** `template <typename T>` lets one class work for any pointer type (`Student*`, `int*`, ...), with `T` filled in where the class is used. The standard library uses the same feature for data structures such as `vector` and `map`, and for algorithms such as `sort`.

The standard library already has smart pointers built on this idea.

### The rule of zero

:::definition id=def-raii title="RAII and the rule of zero" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
RAII means Resource Acquisition Is Initialization.

- **The idea of RAII:** a resource is acquired when an object is created and released in that object's destructor, so the resource lives exactly as long as the object.
- **The rule of zero:** hand each resource to a member that already manages it, such as a `std::vector` or a smart pointer (מצביע חכם).
- **The payoff:** the compiler then generates all five operations correctly, and the class does not need to write any of them.
:::

For example, `std::vector<char>` already owns its buffer.

- **Copying a vector** makes a deep copy (העתקה עמוקה), and moving a vector moves its buffer.
- **So an `Image` that stores `std::vector<char> _bytes`** gets five correct operations from the compiler, without writing any of them.

If the class really must allocate with `new`, store the result in a smart pointer instead of a raw pointer.

:::definition id=def-smart-pointers title="unique_ptr and shared_ptr" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"

- **`std::unique_ptr<T>`** means exclusive ownership: exactly one pointer owns the object. It cannot be copied, because its copy operations are deleted, but it can be moved. It is as cheap as a raw pointer.
- **`std::shared_ptr<T>`** means shared ownership. Each copy increments a reference count, and the object is released when the last owner is destroyed and the count drops to zero.
- **Prefer `std::make_unique` and `std::make_shared`** to writing `unique_ptr<T>(new T(...))` by hand.
- **Why:** each `make` function allocates the object and wraps it in a smart pointer in one step, so nothing can leak if an exception is thrown in between.
- **A bonus of `make_shared`:** it puts the object and its reference count in a single allocation.
:::

```cpp
std::unique_ptr<char[]> bytes = std::make_unique<char[]>(100);
std::shared_ptr<Filter> filter = std::make_shared<Filter>(args...);

```

Declaring some members stops the compiler from generating others.

- **Any constructor you declare** stops the compiler from generating the default constructor.
- **Declaring a copy constructor** (or copy assignment, or a destructor) also stops it from generating the move operations, so moves fall back to copies.
- **`= default`** asks the compiler to generate its own version of an operation anyway.
- **`= delete`** forbids an operation completely, as in the `NoCopy` class below, which cannot be copied.

```cpp
class NoCopy {
public:
    NoCopy(const NoCopy&) = delete;
    NoCopy& operator=(const NoCopy&) = delete;
};

```

## Copy elision

Copy elision is an optimization that lets the compiler skip the copy when a function returns an object by value.

- **How it works:** the compiler builds the returned object directly in the caller's return slot, the place in the caller's frame where the result will live, so nothing needs to be copied.
- **RVO (Return Value Optimization)** applies when the function returns an unnamed temporary, as in `return Image(...);`.
- **NRVO (Named Return Value Optimization)** applies when the function returns a named local variable, as in `return pic;`.

This `return` looks like an improvement, but it is a mistake.

```cpp
Image myPicture() {
    Image pic(1080, 1920, ...);
    return std::move(pic);   // Anti-pattern!
}

```

`std::move(pic)` casts the local variable to an rvalue.

- **Why it hurts:** NRVO only applies when you return the plain name `pic`. The cast turns it into a different expression, so NRVO is lost and the move constructor runs instead.
- **What to write:** `return pic;`. The compiler can then build `pic` directly in the caller's return slot, which costs nothing at all.

:::problem id=worked-move-image title="Moving an image" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx" kind=worked solution_origin=source
The object `avi` owns a pixel buffer. What do `benny._bytes` and `avi._bytes` hold after the move, and what does `avi`'s destructor `~Image` release?

```cpp
Image avi(1080, 1920, pixels);
Image benny(std::move(avi));

```

:::solution
The move constructor copies the pointer into `benny` and then sets `avi._bytes` to `nullptr`.

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}

```

- **`benny._bytes`** now holds the address of the pixel buffer, so `benny` owns the pixels.
- **`avi._bytes`** is `nullptr`, so `avi`'s destructor runs `delete[]` on a null pointer and releases nothing.
- **At the end of the scope**, both objects are destroyed, and the buffer is released exactly once, by `benny`.
:::
:::

:::check id=chk-move-cast
What does `std::move` do?

- [ ] Allocates a new buffer and copies the bytes
- [x] Casts an lvalue to an rvalue so overload resolution can select the move overload
- [ ] Destroys the original object

- **`std::move` is only a cast.** It neither allocates, copies, nor destroys anything.
- **The move constructor** is the function that actually steals the resource.
:::

:::trap
An object that was moved from still exists, in a valid but unspecified state.

- **For `Image`**, that state is an empty image with a null buffer.
- **So `processImage(avi)` after `std::move(avi)`** runs on an empty image, which is almost certainly a bug.
:::

:::trap
- **Mixing up `new` and a stack object:** `Image avi = new Image(...)` does not compile, because `new` returns an `Image*`, not an `Image`.
- **The fix:** write `Image avi(...)` for an object on the stack, or `Image* avi = new Image(...)` for one on the heap.
:::

:::trap
A cycle of `shared_ptr`s keeps every reference count above zero forever.

- **The leak:** if two objects each hold a `shared_ptr` to the other, neither count ever reaches zero, so neither object is ever destroyed.
- **The fix:** make one of the two links a `std::weak_ptr`, which observes an object without owning it, so it does not count toward the reference count.
:::

## Practice

:::problem id=ps4-copy-count title="How many copies" source="materials/sessions/SPL_PS4.pptx" kind=exercise solution_origin=derived
These two functions return a `MyClass` by value.

```cpp
MyClass pass(MyClass value) {
    return value;
}

MyClass passRef(const MyClass& value) {
    MyClass local(value);
    return local;
}

```

:::check id=ps4-copy-count-q1
With no NRVO and no elision, how many times does the copy constructor run in `pass`?

- [ ] Once, on the return only
- [x] Twice: one copy initializes `value`, and a second copy returns it
- [ ] Three times: the argument, a local, and the return

The first copy initializes the parameter `value` from the argument. The second copy builds the return value from `value`. (NRVO never applies to a parameter, and if `MyClass` had a move constructor, the return would use it instead.)
:::

:::check id=ps4-copy-count-q2
Which of these hold for `passRef`?

- [x] Entering the function copies nothing, because the parameter is a const reference
- [ ] `MyClass local(value)` is skipped when NRVO is off
- [x] With no NRVO, `local(value)` is one copy and returning `local` is a second copy

- **On entry:** the parameter is a `const` reference, so nothing is copied.
- **Inside:** `local(value)` is one explicit copy, and it always runs, with or without NRVO.
- **On return:** without NRVO, returning `local` makes a second copy.
:::

:::check id=ps4-copy-count-q3
Under NRVO, `local` is constructed directly in the caller's {{=return slot|parameter|heap}}.

With NRVO, `local` is built directly where the caller expects the result, so the return makes no copy at all.
:::
:::

:::problem id=ps4-unique-vs-shared title="shared versus unique" source="materials/sessions/SPL_PS4.pptx" kind=exercise solution_origin=source
Compare these two fragments.

```cpp
auto sp1 = std::make_shared<int>(1);
{
    auto sp2 = sp1;
}

```

```cpp
auto up1 = std::make_unique<int>(1);
auto up2 = up1;

```

:::check id=ps4-unique-vs-shared-q1
After `sp2 = sp1`, and before the inner block ends, what is the reference count?

- [ ] 0
- [ ] 1
- [x] 2

`sp1` and `sp2` now both own the same `int`, so the reference count is 2.
:::

:::check id=ps4-unique-vs-shared-q2
Which of these hold when the inner block ends?

- [x] `sp2` is destroyed and the count drops to 1
- [ ] The `int` on the heap is deleted
- [x] `sp1` can still reach the `int`

Destroying `sp2` drops the count from 2 to 1. Since the count is not zero, the `int` stays alive, and `sp1` can still reach it.
:::

:::check id=ps4-unique-vs-shared-q3
`auto up2 = up1` tries to copy a {{=unique_ptr|shared_ptr|weak_ptr}}. That copy constructor is deleted, so the program fails to compile.

A `unique_ptr` cannot be copied, but its ownership can be transferred with `auto up2 = std::move(up1);`, after which `up1` is null.
:::
:::

:::examnote
- **What the question looks like:** it often asks for a move that transfers a resource by copying only a pointer, or for a copy-on-write class.
- **Points to remember:** after a move, the source must be reset, and copying a `unique_ptr` does not compile.
:::

:::problem id=exam-16b-q2 title="A collection by value" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
`ITEM_COLLECTION<T>` manages a collection of items in a heap array, and the function `byVal` takes a collection by value.

:::check id=exam-16b-q2-q1
Which copy-constructor body is required for a deep copy?

- [x] Initialize `_capacity`, `_size`, and `new T[other._capacity]`, then assign each live element `_items[i] = other._items[i]`
- [ ] Copy the pointer `_items` and share the other collection's array
- [ ] Allocate `new T[other._capacity]` and leave the new elements unassigned

A deep copy constructor copies the capacity and the size, allocates its own array with `new T[other._capacity]`, and then copies each live element into it. Sharing the pointer is a shallow copy, and leaving the elements unassigned copies nothing.
:::

:::check id=exam-16b-q2-q2
Which holdings share one object instead of copying the `T` value?

- [ ] `ITEM_COLLECTION<T>` that stores each element by value
- [x] `ITEM_COLLECTION<T*>`
- [x] `ITEM_COLLECTION<std::shared_ptr<T>>`

- **Storing `T` by value:** copying the collection copies every `T`.
- **Storing `T*` or `std::shared_ptr<T>`:** copying the collection copies only the pointers, so both collections share the same `T` objects.
:::

:::check id=exam-16b-q2-q3
What does `byVal(myShapeCollection)` do when the class uses the default copy constructor?

- [ ] It gives the parameter its own array, so both destructors are safe
- [ ] The call fails to compile
- [x] It shallow-copies the array pointer. The parameter's destructor `delete[]`s that array, the original is left dangling, and destroying the original is a double free

- **The default copy constructor** makes a shallow copy (העתקה רדודה): it copies only the pointer to the array.
- **When `byVal` returns**, the parameter's destructor releases that shared array with `delete[]`.
- **The result:** the original collection is left with a dangling pointer, and destroying it later frees the same array a second time.
:::

:::check id=exam-16b-q2-q4
A copied collection of {{=shared_ptr|unique_ptr|raw pointer}} elements copies smart pointers, and each copy increments a reference count.

- **When the copy is destroyed**, each reference count drops by one again.
- **The shapes themselves** stay alive until their last owner is gone, so no copy can leave another with a dangling pointer.
:::
:::

:::problem id=exam-20b-q1 title="A smart pointer" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
`SmartPointer<T>` implements shared ownership by hand.

- **It holds** a pointer to a `T` and a pointer to a reference count, which lives on the heap so that all copies can share it.
- **Copying it** shares the same object and the same count.
- **It releases the memory** only when the count reaches zero.

```cpp
template <typename T>
class SmartPointer {
    T* ptr_;
    int* count_;
};
```

:::check id=exam-20b-q1-q1
Which constructor is required?

- [ ] `SmartPointer(T value) : ptr_(new T(value)), count_(nullptr) {}`
- [ ] `explicit SmartPointer(T* p = nullptr) : ptr_(p), count_(new int(0)) {}`
- [x] `explicit SmartPointer(T* p = nullptr) : ptr_(p), count_(p ? new int(1) : new int(0)) {}`

If `p` points at an object, this smart pointer is its first owner, so the count starts at 1. If `p` is null, there is nothing to own, so the count starts at 0. `explicit` prevents a raw pointer from being converted into a `SmartPointer` by accident.
:::

:::check id=exam-20b-q1-q2
Which of these match the copy constructor and `release`?

- [x] The copy constructor copies both pointers and increments the count when `ptr_` is non-null
- [ ] `release` deletes both blocks on every call
- [x] `release` deletes both blocks only when `ptr_` is non-null and the decremented count is 0
- [ ] The destructor deletes `ptr_` and leaves `count_` allocated

- **The copy constructor** copies both pointers, so it shares the object and the count, and increments the count if there is an object.
- **`release`** decrements the count, and deletes `ptr_` and `count_` only when the count reaches zero. Then it sets both pointers to null.
- **The wrong options** delete on every call, which breaks the other owners, or leak the count.
:::

:::check id=exam-20b-q1-q3
Which copy-assignment body is required?

- [ ] Call `release()` and then copy the pointers, including when `this == &other`
- [x] When `this != &other`, call `release()`, copy both pointers, and increment the count when `ptr_` is non-null. Return `*this`
- [ ] Swap the pointers and leave the count unchanged

- **Self-assignment:** when `this == &other`, the body does nothing, so the count is unchanged. Without the check, `release()` could delete the object that is about to be copied.
- **Assigning from a different object:** first `release()` the current object, then copy both pointers from `other` and increment the shared count.
:::

:::check id=exam-20b-q1-q4
`operator*` returns {{=*ptr_|ptr_|count_}}.

`operator*` returns the object itself, `*ptr_`, usually as a `T&`. By contrast, `operator->` returns the raw pointer `ptr_`.
:::
:::

:::problem id=exam-24a-q1 title="A tree under the rule of five" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
`BinaryTree<T>` stores a value `T data` and two child pointers, `BinaryTree* left` and `BinaryTree* right`, which own their subtrees. All nodes are allocated on the heap. The class implements move, and the question asks about the call `f(BinaryTree<int>(...))`.

:::check id=exam-24a-q1-q1
Which destructor body is required?

- [ ] `left = nullptr; right = nullptr;`
- [x] `delete left; delete right;`
- [ ] `delete this;`

The tree owns its children, so the destructor runs `delete left; delete right;`. Each `delete` runs that child's destructor, which deletes its children in turn, so the whole subtree is released. Deleting a null pointer is safe.
:::

:::check id=exam-24a-q1-q2
Which of these bodies are required?

- [x] Copy constructor: `new BinaryTree(*other.left)` when `left` is non-null, and the same for `right`
- [x] Move constructor: move `data`, take `left` and `right`, then set the source pointers to null
- [ ] Copy assignment: `delete left` and `delete right` before the copy, with no temporary
- [x] Move assignment: delete the old children, take the source pointers, and null the source
- [x] `insert` sends a smaller value to the left and a larger value to the right, and it does not insert an equal key

- **The copy constructor** allocates a new node for each non-null child, which copies the whole subtree recursively.
- **Copy assignment** builds a temporary copy and swaps with it. Deleting the children first without a temporary would break `t = t`.
- **The move constructor** takes the child pointers and then sets the source's pointers to null.
- **Move assignment** first deletes its own old children, then takes the source's pointers and nulls them in the source.
- **`insert`** keeps the tree sorted: smaller values go left, larger values go right, and an equal value is not inserted again.
:::

:::check id=exam-24a-q1-q3
Copy assignment, when `this` is not the other object, builds a {{=temporary|shared node|raw alias}} and swaps `data`, `left`, and `right`.

The body builds `BinaryTree temp(other)`, swaps `data`, `left`, and `right` with it, and returns `*this`. When `temp` is destroyed, it releases the old children.
:::

:::check id=exam-24a-q1-q4
Which description of `f(BinaryTree<int>(...))` is right?

- [x] The argument is an unnamed rvalue. The move constructor takes `left` and `right`, nulls the temporary, and the parameter on the stack frame of `f` owns the nodes that stay on the heap
- [ ] The nodes leave the heap and are stored inside the stack frame of `f`
- [ ] The argument is an lvalue, so every node is deep-copied before `f` starts

`BinaryTree<int>(...)` is an unnamed temporary, which is an rvalue, so the parameter is initialized with the move constructor. Only the root object is in `f`'s frame; the child nodes stay on the heap and now belong to the parameter.
:::
:::

:::problem id=exam-24c-q1 title="Copy on write" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived
`copy_on_write<T>` lets several copies share one heap `T` until one of them wants to write. At that point, `on_write()` gives the writer its own private clone.

```cpp
template <typename T>
class copy_on_write {
    T* ptr;
    int* users;
};
```

:::check id=exam-24c-q1-q1
Which copy-constructor body is required?

- [x] Copy `ptr` and `users`, then `++(*users)`
- [ ] Clone the `T` in the copy constructor and set `users` to `new int(1)`
- [ ] Copy `ptr` and set `users` to null

Copying is cheap, which is the point of the class: the copy constructor shares `ptr` and `users`, then increments the user count. Cloning happens later, only on a write.
:::

:::check id=exam-24c-q1-q2
Which of these hold?

- [ ] `on_write` clones even when `*users` is 1
- [x] `on_write` clones only when `*users` is greater than 1: it decrements the shared count, clones the `T`, and allocates a fresh count of 1
- [x] The destructor deletes `ptr` and `users` only when the decremented count is 0

- **Only clone when sharing:** if `*users` is 1, this object is the only user, so it can write in place without cloning.
- **When shared:** `on_write` decrements the shared count, clones the `T`, and gives the clone a fresh count of 1.
- **The destructor** decrements the count and deletes both blocks only when it reaches zero.
:::

:::check id=exam-24c-q1-q3
The non-const `operator->` calls {{=on_write|clone|release}} and then returns `ptr`.

The non-const `operator->` may be used to write, so it must call `on_write` first. The const `operator->` can only read, so it returns `ptr` without cloning.
:::

:::check id=exam-24c-q1-q4
Which constructor body is required?

- [ ] `: ptr(p), users(nullptr)`
- [ ] `: ptr(nullptr), users(new int(0))`
- [x] `explicit copy_on_write(T* p) : ptr(p), users(new int(1))`

The object that receives the new pointer is its first and only user, so the count starts at 1.
:::
:::

To sum up, a class that owns a resource either writes all five special members, or, better, hands the resource to a member that manages it and writes none.

- **Next:** [Inheritance and polymorphism](topic:inheritance) shows what changes when objects are used through a pointer to their base class.
