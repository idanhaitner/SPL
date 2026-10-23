---
id: rule-of-five
title: The rule of five and zero
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

This chapter is how C++ copies and moves owned resources without sharing one buffer by accident.

- **Value categories** — what may be moved from, and what must stay put.
- **Rule of five** — the special members that make copying and moving correct.
- **Rule of zero** — when the compiler's defaults are already enough.

## lvalues and rvalues

A copy gives two objects the same data, and it is also the expensive way to return a large object from a function.

- **Move** (העברה), added in C++11, lets a temporary hand its resource to the new owner. The bytes stay where they are.
- **Rule of five** (חוק החמישה) is the set of special members that make copying and moving correct.
- **Rule of zero** (חוק האפס) leaves every one of those members to the compiler, because each data member already manages its own resource.

:::definition id=def-value-category title="lvalue and rvalue" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
An lvalue names an object that has an address.

- **Address** can be formed, and you can assign to the object and bind a reference to it.
- **Name** records an older rule: an lvalue may stand on the left of an assignment.
- **Rvalue** is a value that may be consumed. It stands on the right of an assignment.
- **Temporary** is an rvalue: the result of a computation, or an object returned by value from a function.
- **Lifetime** of that temporary ends with the full expression that created it, unless a reference extends it.
- **`const T&`** binds to an lvalue and also to an rvalue. Binding a temporary extends that temporary's lifetime to the end of the reference's scope.
- **Const** means code cannot modify the object through that reference.
:::

`std::move(x)` is a cast.

- **Cast** tells the compiler to treat the lvalue `x` as an rvalue, so overload resolution can select the function that takes an rvalue reference and steals the resource.
- **Transfer** is not done by the cast itself.
- **After the move**, `x` is in a valid but unspecified state.
- **Moved-from `Image`** holds a null pointer, and destroying it is safe.

An rvalue reference is written `&&`, as in `Image&&`.

- **Binding** is only to an rvalue.
- **Parameter type** of a move constructor and of a move-assignment operator is that reference.

The two overloads below are how a function chooses between reading an image and taking its buffer:

```cpp
void convert(const Image& img);   // binds a named image or a temporary, does not steal
void convert(Image&& img);        // binds only a temporary, may steal

```

### Move operations

:::definition id=def-rule-of-five title="The rule of five" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
The rule of five extends the rule of three (חוק השלושה).

- **Any of the five** means write all five: the destructor (הורס), the copy constructor (בנאי העתקה), the copy assignment operator (אופרטור השמה), the move constructor, and the move-assignment operator.
- **Ownership** stays correct through the destructor, the copy constructor, and the copy assignment operator. They are how the class avoids a double free and a leak.
- **Move** is what the move constructor and the move-assignment operator carry out. A temporary transfers its resource, and the only thing copied is the pointer.
:::

The move constructor copies the pointer and leaves the bytes where they are.

- **Source** pointer is then set to `nullptr`, and the dimensions to 0.
- **Source destructor** later runs `delete[]` on a null pointer. That call is safe, and it releases nothing.

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}

```

The move-assignment operator already holds a buffer, and it has to give that buffer up before it takes the new one. `swap` does the exchange:

```cpp
Image& Image::operator=(Image&& other) {
    swap(other);
    return *this;
}

```

When the operator returns, `other` holds the resource that used to belong to `*this`, and the destructor of `other` releases it.

Two further mistakes belong with this material.

- **`Image avi = new Image(...)`** initializes an `Image` from an `Image*`, which is the type `new` returns.
- **Automatic `Image`** is created by calling a constructor, as in `Image avi(...)`.
- **After `std::move(avi)`**, `avi` is in a valid but unspecified state, and any later use reads that moved-from object.

### The rule of zero

:::definition id=def-raii title="RAII and the rule of zero" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
RAII means Resource Acquisition Is Initialization.

- **Lifetime** of a resource is the object's lifetime, so the destructor is the release.
- **Rule of zero:** give the resource to a member that already manages it, such as `std::vector` or a smart pointer (מצביע חכם).
- **Compiler** then generates the right five operations, and the class leaves all five to the compiler.
:::

`std::vector<char>` already owns its buffer.

- **Deep copy** (העתקה עמוקה) is what the vector makes when it is copied, and it moves when it is moved.
- **`Image`** that stores `std::vector<char> _bytes` receives those five operations from the compiler.

When the class does allocate with `new`, put that pointer in a smart pointer:

:::definition id=def-smart-pointers title="unique_ptr and shared_ptr" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"

- **`std::unique_ptr<T>`** is exclusive ownership. Its copy constructor and copy assignment operator are deleted, and it can be moved. After inlining, it costs the same as a raw pointer.
- **`std::shared_ptr<T>`** is shared ownership. Copying it increments a reference count. The destructor that brings the count to zero releases the object.
- **`std::make_unique` and `std::make_shared`** are preferred to a hand-written `unique_ptr<T>(new T(...))`.
- **Each `make` function** allocates the object and builds the smart pointer as one step, so an exception in a later argument still releases the object.
- **`make_shared`** places the object and the reference count in a single allocation.
:::

```cpp
std::unique_ptr<char[]> bytes = std::make_unique<char[]>(100);
std::shared_ptr<Filter> filter = std::make_shared<Filter>(args...);

```

Declaring any constructor suppresses the implicit default constructor.

- **Copy constructor** declaration also suppresses the implicit move operations.
- **`= default`** asks the compiler for its version of an operation.
- **`= delete`** removes the operation.

```cpp
class NoCopy {
public:
    NoCopy(const NoCopy&) = delete;
    NoCopy& operator=(const NoCopy&) = delete;
};

```

### Copy elision

Copy elision is an optimization the compiler may apply when a function returns an object by value.

- **Return slot** is where the returned object is constructed directly, in the caller's frame.
- **RVO (Return Value Optimization):** the function returns an unnamed temporary, as in `return Image(...);`.
- **NRVO (Named Return Value Optimization):** the function returns a named local, as in `return pic;`.

This return is the one to avoid:

```cpp
Image myPicture() {
    Image pic(1080, 1920, ...);
    return std::move(pic);   // Anti-pattern!
}

```

`std::move(pic)` casts the local to an rvalue.

- **NRVO** needs the plain name `pic`. The cast hides that name, so the return calls the move constructor.
- **`return pic;`** keeps the name, and NRVO can construct `pic` directly in the caller's slot.

:::problem id=worked-move-image title="Moving an image" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx" kind=worked solution_origin=source
The object `avi` owns a pixel buffer. What do `benny._bytes` and `avi._bytes` hold after the move, and what does `avi`'s destructor `~Image` release?

```cpp
Image avi(1080, 1920, pixels);
Image benny(std::move(avi));

```

:::solution
The move constructor copies the pointer into `benny` and sets `avi._bytes` to `nullptr`:

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}

```

- **`benny`** now owns the pixels.
- **`avi`'s destructor** runs `delete[]` on a null pointer, so it releases nothing.
- **End of the function** destroys both objects, and the buffer is released once.
:::
:::

:::check id=chk-move-cast
What does `std::move` do?

- [ ] Allocates a new buffer and copies the bytes
- [x] Casts an lvalue to an rvalue so overload resolution can select the move overload
- [ ] Destroys the original object

- **`std::move`** is a cast.
- **Move constructor** is the function that steals the resource.
:::

:::trap
An object that was moved from is still in memory, in a valid but unspecified state.

- **`Image`** in that state is empty.
- **`processImage(avi)`** after `std::move(avi)` runs on that empty image.
:::

:::trap
A cycle of `shared_ptr` keeps every reference count above zero.

- **Two objects** that each hold a `shared_ptr` to the other never run a destructor that releases the memory, and the allocation leaks.
- **`std::weak_ptr`** observes an object without owning it, and that is how the cycle is broken.
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

One copy initializes the parameter `value`. A second copy returns it.
:::

:::check id=ps4-copy-count-q2
Which of these hold for `passRef`?

- [x] Entering the function copies nothing, because the parameter is a const reference
- [ ] `MyClass local(value)` is skipped when NRVO is off
- [x] With no NRVO, `local(value)` is one copy and returning `local` is a second copy

- **Parameter** is a const reference, so entry copies nothing.
- **`local(value)`** is one explicit copy, and returning `local` is a second copy.
:::

:::check id=ps4-copy-count-q3
Under NRVO, `local` is constructed directly in the caller's {{=return slot|parameter|heap}}.

That return uses the same object.
:::
:::

:::problem id=ps4-unique-vs-shared title="shared versus unique" source="materials/sessions/SPL_PS4.pptx" kind=exercise solution_origin=source
Two fragments.

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

Copying the shared pointer raises the reference count to 2.
:::

:::check id=ps4-unique-vs-shared-q2
Which of these hold when the inner block ends?

- [x] `sp2` is destroyed and the count drops to 1
- [ ] The `int` on the heap is deleted
- [x] `sp1` can still reach the `int`

Destroying `sp2` drops the count to 1. The `int` stays alive, and `sp1` can still reach it.
:::

:::check id=ps4-unique-vs-shared-q3
`auto up2 = up1` tries to copy a {{=unique_ptr|shared_ptr|weak_ptr}}. That copy constructor is deleted, so the program fails to compile.

Ownership moves with an explicit `auto up2 = std::move(up1)`.
:::
:::

:::examnote
Exam questions on the rule of five, or on smart pointers, often ask for a transfer of a resource that copies only a pointer, or for copy-on-write. After a move, the source has to be reset. Copying a `unique_ptr` fails to compile.
:::

:::problem id=exam-16b-q2 title="A collection by value" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
`ITEM_COLLECTION<T>` manages a collection of items. `byVal` takes the collection by value.

:::check id=exam-16b-q2-q1
Which copy-constructor body is required for a deep copy?

- [x] Initialize `_capacity`, `_size`, and `new T[other._capacity]`, then assign each live element `_items[i] = other._items[i]`
- [ ] Copy the pointer `_items` and share the other collection's array
- [ ] Allocate `new T[other._capacity]` and leave the new elements unassigned

The deep copy constructor copies the capacity and the size, allocates `new T[other._capacity]`, and assigns each live element.
:::

:::check id=exam-16b-q2-q2
Which holdings share one object instead of copying the `T` value?

- [ ] `ITEM_COLLECTION<T>` that stores each element by value
- [x] `ITEM_COLLECTION<T*>`
- [x] `ITEM_COLLECTION<std::shared_ptr<T>>`

- **By value** copies each `T`.
- **`T*` or `std::shared_ptr<T>`** shares the object the pointer already owns.
:::

:::check id=exam-16b-q2-q3
What does `byVal(myShapeCollection)` do when the class uses the default copy constructor?

- [ ] It gives the parameter its own array, so both destructors are safe
- [ ] The call fails to compile
- [x] It shallow-copies the array pointer. The parameter's destructor `delete[]`s that array, the original is left dangling, and destroying the original is a double free

- **Default copy constructor** makes a shallow copy (העתקה רדודה) of the pointer to the array.
- **`byVal` return** runs the parameter's destructor, which releases the array with `delete[]`.
:::

:::check id=exam-16b-q2-q4
A copied collection of {{=shared_ptr|unique_ptr|raw pointer}} elements copies smart pointers, and each copy increments a reference count.

- **Destroying the temporary** drops those counts.
- **Shapes** stay alive until the last owner is gone.
:::
:::

:::problem id=exam-20b-q1 title="A smart pointer" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
`SmartPointer<T>` uses shared ownership: a pointer to a `T`, a reference count on the heap, a copy that shares the object, and a release of the memory only when the count reaches zero.

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

A non-null pointer starts the count at 1. A null pointer starts it at 0.
:::

:::check id=exam-20b-q1-q2
Which of these match the copy constructor and `release`?

- [x] The copy constructor copies both pointers and increments the count when `ptr_` is non-null
- [ ] `release` deletes both blocks on every call
- [x] `release` deletes both blocks only when `ptr_` is non-null and the decremented count is 0
- [ ] The destructor deletes `ptr_` and leaves `count_` allocated

- **Copy** shares both pointers and increments when there is an object.
- **`release`** deletes `ptr_` and `count_` only when the count reaches zero, then nulls both pointers.
:::

:::check id=exam-20b-q1-q3
Which copy-assignment body is required?

- [ ] Call `release()` and then copy the pointers, including when `this == &other`
- [x] When `this != &other`, call `release()`, copy both pointers, and increment the count when `ptr_` is non-null. Return `*this`
- [ ] Swap the pointers and leave the count unchanged

- **Self-assignment** leaves the count as it is.
- **Different object** is released first, then adopted.
:::

:::check id=exam-20b-q1-q4
`operator*` returns {{=*ptr_|ptr_|count_}}.

`operator->` returns `ptr_`.
:::
:::

:::problem id=exam-24a-q1 title="A tree under the rule of five" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
`BinaryTree<T>` stores `T data` and owning children `BinaryTree* left` and `BinaryTree* right`. Nodes are allocated on the heap. The call is `f(BinaryTree<int>(...))`, and the class implements move.

:::check id=exam-24a-q1-q1
Which destructor body is required?

- [ ] `left = nullptr; right = nullptr;`
- [x] `delete left; delete right;`
- [ ] `delete this;`

The destructor is `delete left; delete right;`.
:::

:::check id=exam-24a-q1-q2
Which of these bodies are required?

- [x] Copy constructor: `new BinaryTree(*other.left)` when `left` is non-null, and the same for `right`
- [x] Move constructor: move `data`, take `left` and `right`, then set the source pointers to null
- [ ] Copy assignment: `delete left` and `delete right` before the copy, with no temporary
- [x] Move assignment: delete the old children, take the source pointers, and null the source
- [x] `insert` sends a smaller value to the left and a larger value to the right, and it does not insert an equal key

- **Copy constructor** allocates a new node for each child.
- **Copy assignment** builds a temporary and swaps.
- **Move operations** take the pointers and then null the source.
- **Move assignment** deletes the old children first.
- **`insert`** places a smaller value on the left and a larger value on the right.
:::

:::check id=exam-24a-q1-q3
Copy assignment, when `this` is not the other object, builds a {{=temporary|shared node|raw alias}} and swaps `data`, `left`, and `right`.

The body builds `BinaryTree temp(other)`, swaps `data`, `left`, and `right`, and returns `*this`.
:::

:::check id=exam-24a-q1-q4
Which description of `f(BinaryTree<int>(...))` is right?

- [x] The argument is an unnamed rvalue. The move constructor takes `left` and `right`, nulls the temporary, and the parameter on the stack frame of `f` owns the nodes that stay on the heap
- [ ] The nodes leave the heap and are stored inside the stack frame of `f`
- [ ] The argument is an lvalue, so every node is deep-copied before `f` starts

The argument is an unnamed rvalue, so the parameter is initialized by the move constructor. The nodes remain on the heap.
:::
:::

:::problem id=exam-24c-q1 title="Copy on write" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived
`copy_on_write<T>` shares one heap `T` across copies until the first write. `on_write()` makes a private clone.

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

The copy constructor copies `ptr` and `users`, then increments the count.
:::

:::check id=exam-24c-q1-q2
Which of these hold?

- [ ] `on_write` clones even when `*users` is 1
- [x] `on_write` clones only when `*users` is greater than 1: it decrements the shared count, clones the `T`, and allocates a fresh count of 1
- [x] The destructor deletes `ptr` and `users` only when the decremented count is 0

- **Single owner** does not clone.
- **Destructor** deletes both blocks only when the count reaches zero.
:::

:::check id=exam-24c-q1-q3
The non-const `operator->` calls {{=on_write|clone|release}} and then returns `ptr`.

The const `operator->` returns `ptr` and does not copy.
:::

:::check id=exam-24c-q1-q4
Which constructor body is required?

- [ ] `: ptr(p), users(nullptr)`
- [ ] `: ptr(nullptr), users(new int(0))`
- [x] `explicit copy_on_write(T* p) : ptr(p), users(new int(1))`

The first owner starts the count at 1.
:::
:::
