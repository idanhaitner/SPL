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

A copy gives two objects the same data, and it is also the expensive way to return a large object from a function. C++11 adds a second mechanism, move (העברה): a temporary hands its resource to the new owner, and the bytes themselves stay where they are. The rule of five (חוק החמישה) is the set of special members that make copying and moving correct. The rule of zero (חוק האפס) leaves every one of those members to the compiler, because each data member already manages its own resource.

## Values that have an address, and values that do not

:::definition id=def-value-category title="lvalue and rvalue" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
An lvalue names an object that has an address. You can form that address, assign to the object, and bind a reference to it. The name records an older rule: an lvalue may stand on the left of an assignment.

An rvalue is a value that may be consumed. It stands on the right of an assignment. A temporary is an rvalue: the result of a computation, or an object returned by value from a function. That temporary's lifetime ends with the full expression that created it, unless a reference extends it.

A const lvalue reference, written `const T&`, binds to an lvalue and also to an rvalue. When the rvalue is a temporary, the binding extends that temporary's lifetime to the end of the reference's scope. The reference is const, so code cannot modify the object through it.
:::

`std::move(x)` is a cast. It tells the compiler to treat the lvalue `x` as an rvalue, so overload resolution can select the function that takes an rvalue reference and steals the resource. The cast itself transfers nothing. After the selected function runs, `x` is in a valid but unspecified state. The lecture's moved-from `Image` holds a null pointer, and destroying it is safe.

An rvalue reference is written `&&`, as in `Image&&`. It binds only to an rvalue. That is the parameter type of a move constructor and of a move-assignment operator.

The two overloads below are how a function chooses between reading an image and taking its buffer:

```cpp
void convert(const Image& img);   // binds a named image or a temporary, does not steal
void convert(Image&& img);        // binds only a temporary, may steal

```

### Move operations

:::definition id=def-rule-of-five title="The rule of five" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
The rule of five extends the rule of three (חוק השלושה). If you write any of the five — the destructor (הורס), the copy constructor (בנאי העתקה), the copy assignment operator (אופרטור השמה), the move constructor, or the move-assignment operator — write all five.

The destructor, the copy constructor, and the copy assignment operator keep ownership correct. They are how the class avoids a double free and a leak. The move constructor and the move-assignment operator carry out the move: a temporary transfers its resource, and the only thing copied is the pointer.
:::

The move constructor copies the pointer and leaves the bytes where they are. It then sets the source pointer to `nullptr` and the dimensions to 0, so the source's destructor later runs `delete[]` on a null pointer. That call is safe, and it releases nothing.

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

Two further mistakes belong with this material. `Image avi = new Image(...)` initializes an `Image` from an `Image*`, which is the type `new` returns. An automatic `Image` is created by calling a constructor, as in `Image avi(...)`. After `std::move(avi)`, `avi` is in a valid but unspecified state, and any later use reads that moved-from object.

### The rule of zero

:::definition id=def-raii title="RAII and the rule of zero" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
RAII means Resource Acquisition Is Initialization. A resource's lifetime is the object's lifetime, so the destructor is the release.

**Rule of zero:** give the resource to a member that already manages it, such as `std::vector` or a smart pointer (מצביע חכם). The five operations the compiler generates are then the right ones, and the class leaves all five to the compiler.
:::

`std::vector<char>` already owns its buffer. It makes a deep copy (העתקה עמוקה) when it is copied, and it moves when it is moved. An `Image` that stores `std::vector<char> _bytes` receives those five operations from the compiler.

When the class does allocate with `new`, put that pointer in a smart pointer:

:::definition id=def-smart-pointers title="unique_ptr and shared_ptr" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"

* `std::unique_ptr<T>` is exclusive ownership. Its copy constructor and copy assignment operator are deleted, and it can be moved. After inlining, it costs the same as a raw pointer.
* `std::shared_ptr<T>` is shared ownership. Copying it increments a reference count. The destructor that brings the count to zero releases the object.

Prefer `std::make_unique<T>(...)` and `std::make_shared<T>(...)` to a hand-written `unique_ptr<T>(new T(...))`. Each `make` function allocates the object and builds the smart pointer as one step, so an exception in a later argument still releases the object. `make_shared` places the object and the reference count in a single allocation.
:::

```cpp
std::unique_ptr<char[]> bytes = std::make_unique<char[]>(100);
std::shared_ptr<Filter> filter = std::make_shared<Filter>(args...);

```

Declaring any constructor suppresses the implicit default constructor. Declaring a copy constructor suppresses the implicit move operations. `= default` asks the compiler for its version of an operation. `= delete` removes the operation:

```cpp
class NoCopy {
public:
    NoCopy(const NoCopy&) = delete;
    NoCopy& operator=(const NoCopy&) = delete;
};

```

### Copy elision

Copy elision is an optimization the compiler may apply when a function returns an object by value. The returned object is constructed directly in the caller's return slot.

* **RVO (Return Value Optimization):** the function returns an unnamed temporary, as in `return Image(...);`.
* **NRVO (Named Return Value Optimization):** the function returns a named local, as in `return pic;`.

The lecture warns about this return in particular:

```cpp
Image myPicture() {
    Image pic(1080, 1920, ...);
    return std::move(pic);   // Anti-pattern!
}

```

`std::move(pic)` casts the local to an rvalue. NRVO needs the plain name `pic`. The cast hides that name, so the return calls the move constructor. A plain `return pic;` keeps the name, and NRVO can construct `pic` directly in the caller's slot.

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

`benny` now owns the pixels. `avi`'s destructor runs `delete[]` on a null pointer, so it releases nothing. At the end of the function both objects are destroyed, and the buffer is released once.
:::
:::

:::check id=chk-move-cast
What does `std::move` do?

- [ ] Allocates a new buffer and copies the bytes
- [x] Casts an lvalue to an rvalue so overload resolution can select the move overload
- [ ] Destroys the original object

`std::move` is a cast. The move constructor is the function that steals the resource.
:::

:::trap
An object that was moved from is still in memory, in a valid but unspecified state. For the lecture's `Image`, that state is empty. `processImage(avi)` after `std::move(avi)` runs on that empty image.
:::

:::trap
A cycle of `shared_ptr` keeps every reference count above zero. If two objects each hold a `shared_ptr` to the other, neither destructor releases the memory, and the allocation leaks. `std::weak_ptr` observes an object without owning it, and that is how the cycle is broken.
:::

## Practice

:::problem id=ps4-copy-count title="How many copies" source="materials/sessions/SPL_PS4.pptx" kind=exercise solution_origin=derived
How many times does the copy constructor run if there is no copy elision, and what changes when the parameter is passed as `const MyClass&`? Which of those copies may NRVO remove?

```cpp
MyClass pass(MyClass value) {
    return value;
}

MyClass passRef(const MyClass& value) {
    MyClass local(value);
    return local;
}

```

:::hint
A parameter passed by value is copied on the way in. A return by value is copied on the way out when the compiler does not elide that copy.
:::
:::hint
A parameter passed as `const MyClass&` binds to the caller's object. Entering the function copies nothing.
:::
:::hint
NRVO may construct the named local directly in the caller's return slot, which drops the copy on the way out. The explicit `MyClass local(value)` remains.
:::
:::solution
In `pass`, with no NRVO and no elision, one copy initializes the parameter `value` and a second copy returns it. That is two calls to the copy constructor.

In `passRef`, the parameter is a const reference, so entry copies nothing. `local(value)` is one explicit copy, and returning `local` is a second copy. When NRVO is applied, `local` is constructed directly in the caller's return slot, and that return uses the same object.
:::
:::

:::problem id=ps4-unique-vs-shared title="shared versus unique" source="materials/sessions/SPL_PS4.pptx" kind=exercise solution_origin=source
What happens in each of the following fragments?

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

:::hint
Copying a `shared_ptr` increments the reference count.
:::
:::hint
`unique_ptr` has its copy constructor deleted (`= delete`).
:::
:::hint
The inner block ends by destroying `sp2`, which decrements the count. Transferring `up1` into `up2` is a move: `auto up2 = std::move(up1);`.
:::
:::solution
In the first fragment, `sp2 = sp1` copies the shared pointer and raises the reference count to 2. At the end of the inner block, `sp2` is destroyed and the count drops to 1. The `int` on the heap stays alive, and `sp1` can still reach it.

In the second fragment, `auto up2 = up1;` tries to copy a `unique_ptr`. That copy constructor is deleted, so the program fails to compile. The ownership moves with an explicit `auto up2 = std::move(up1);`.
:::
:::

:::examnote
Exam questions on the rule of five, or on smart pointers, often ask for a transfer of a resource that copies only a pointer, or for copy-on-write. After a move, the source has to be reset. Copying a `unique_ptr` fails to compile.
:::

:::problem id=exam-16b-q2 title="A collection by value" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
`ITEM_COLLECTION<T>` manages a collection of items. The function `byVal` takes the collection by value.

a. Write a deep copy constructor, and keep the template syntax.

b. Complete `main` so the collection can hold both a `SPHERE` and a `BOX`. Both inherit from `SHAPE`.

c. What happens in the call `byVal(myShapeCollection)` if the class uses the default copy constructor?

d. Repair the ownership with `shared_ptr`.

:::hint
`byVal` takes the collection by value, so a copy constructor runs. A raw pointer to the array is the same ownership problem as `Image::_bytes`.
:::
:::hint
`SPHERE` and `BOX` derive from `SHAPE`. Storing a `SHAPE` by value slices the derived object. A `shared_ptr<SHAPE>` keeps the derived object and shares ownership of it.
:::
:::hint
The deep copy constructor initializes the capacity, the size, and a `new T[other._capacity]`, then assigns each live element. The default copy copies the pointer, and the parameter's destructor `delete[]`s that array.
:::
:::solution
a. A deep copy constructor:

```cpp
template <typename T>
ITEM_COLLECTION<T>::ITEM_COLLECTION(const ITEM_COLLECTION<T>& other)
    : _capacity(other._capacity), _size(other._size), _items(new T[other._capacity]) {
    for (int i = 0; i < _size; ++i) {
        _items[i] = other._items[i];
    }
}

```

b. To keep the dynamic type, and to avoid slicing the derived object, store pointers: `ITEM_COLLECTION<SHAPE*>`, or, with shared ownership, `ITEM_COLLECTION<std::shared_ptr<SHAPE>>`.

c. The default copy constructor makes a shallow copy (העתקה רדודה) of the pointer to the array. Passing the collection to `byVal` by value builds that shallow copy. When `byVal` returns, the parameter's destructor releases the array with `delete[]`. The original collection is left with a dangling pointer, and destroying it is a double free.

d. `ITEM_COLLECTION<std::shared_ptr<SHAPE>>` copies smart pointers when the collection is copied, and each copy increments a reference count. Destroying the temporary drops those counts. The shapes stay alive until the last owner is gone.
:::
:::

:::problem id=exam-20b-q1 title="A smart pointer" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
Implement `SmartPointer<T>` on the shared-ownership model of `shared_ptr`: a dynamically allocated reference count, a copy that shares the object, and a release of the memory only when the reference count reaches zero.

:::hint
Shared ownership uses two allocations: the `T`, and an `int` on the heap that counts the owners.
:::
:::hint
The copy constructor copies both pointers and increments the count. The destructor decrements the count, and it deletes both blocks only when the count reaches zero.
:::
:::hint
Assignment releases `*this` before it adopts the other pointer and the other count. When `this` and `other` are the same object, the count stays as it is.
:::
:::solution

```cpp
template <typename T>
class SmartPointer {
    T* ptr_;
    int* count_;
public:
    explicit SmartPointer(T* p = nullptr)
        : ptr_(p), count_(p ? new int(1) : new int(0)) {}

    SmartPointer(const SmartPointer& other)
        : ptr_(other.ptr_), count_(other.count_) {
        if (ptr_) {
            ++(*count_);
        }
    }

    ~SmartPointer() {
        release();
    }

    SmartPointer& operator=(const SmartPointer& other) {
        if (this != &other) {
            release();
            ptr_ = other.ptr_;
            count_ = other.count_;
            if (ptr_) {
                ++(*count_);
            }
        }
        return *this;
    }

    T& operator*() const { return *ptr_; }
    T* operator->() const { return ptr_; }

private:
    void release() {
        if (ptr_ && --(*count_) == 0) {
            delete ptr_;
            delete count_;
            ptr_ = nullptr;
            count_ = nullptr;
        }
    }
};

```

:::
:::

:::problem id=exam-24a-q1 title="A tree under the rule of five" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
`BinaryTree<T>` is a binary tree whose nodes are allocated on the heap.

a. Define the class in C++, including the data members, the constructors, `insert`, and the getters.

b. Continue the class and implement the rule of five: the destructor, the copy constructor, the copy assignment operator, the move constructor, and the move-assignment operator.

c. Draw the stack and the heap for the call `f(BinaryTree<int>(1, ...))`, assuming the class implements move.

:::hint
`left` and `right` are owning pointers. A memberwise copy would share one tree between two objects, and both destructors would delete it.
:::
:::hint
The copy constructor allocates a new node for each child. The move constructor copies the pointers and then sets the source pointers to `nullptr`. Copy assignment can build a temporary and swap.
:::
:::hint
The argument `BinaryTree<int>(...)` is an rvalue, so the parameter of `f` is initialized by the move constructor. The nodes stay on the heap. The stack frame of `f` holds their new owner.
:::
:::solution
a and b. The class, with the rule of five:

```cpp
template <typename T>
class BinaryTree {
    T data;
    BinaryTree* left;
    BinaryTree* right;

public:
    BinaryTree(const T& val) : data(val), left(nullptr), right(nullptr) {}
    BinaryTree(const T& val, BinaryTree* l, BinaryTree* r)
        : data(val), left(l), right(r) {}

    // Destructor
    ~BinaryTree() {
        delete left;
        delete right;
    }

    // Copy Constructor
    BinaryTree(const BinaryTree& other)
        : data(other.data),
          left(other.left ? new BinaryTree(*other.left) : nullptr),
          right(other.right ? new BinaryTree(*other.right) : nullptr) {}

    // Copy Assignment Operator
    BinaryTree& operator=(const BinaryTree& other) {
        if (this != &other) {
            BinaryTree temp(other);
            std::swap(data, temp.data);
            std::swap(left, temp.left);
            std::swap(right, temp.right);
        }
        return *this;
    }

    // Move Constructor
    BinaryTree(BinaryTree&& other) noexcept
        : data(std::move(other.data)), left(other.left), right(other.right) {
        other.left = nullptr;
        other.right = nullptr;
    }

    // Move Assignment Operator
    BinaryTree& operator=(BinaryTree&& other) noexcept {
        if (this != &other) {
            delete left;
            delete right;
            data = std::move(other.data);
            left = other.left;
            right = other.right;
            other.left = nullptr;
            other.right = nullptr;
        }
        return *this;
    }

    void insert(const T& val) {
        if (val < data) {
            if (left) left->insert(val);
            else left = new BinaryTree(val);
        } else if (val > data) {
            if (right) right->insert(val);
            else right = new BinaryTree(val);
        }
    }
};

```

c. In the call `f(BinaryTree<int>(...))`, the argument is an unnamed rvalue. The move constructor takes `left` and `right` from the temporary and sets the temporary's pointers to null. On the stack frame of `f`, the parameter `t` receives ownership of the nodes that remain on the heap.
:::
:::

:::problem id=exam-24c-q1 title="Copy on write" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived
Implement the wrapper `copy_on_write<T>`. It implements copy-on-write: copied objects share the same data on the heap until the first write, `on_write()`, which makes a private clone.

:::hint
The copy constructor copies `ptr` and `users` and increments the count. The clone waits until something writes.
:::
:::hint
`on_write` clones only when `*users` is greater than 1. It decrements the shared count, clones the `T`, and allocates a fresh count of 1.
:::
:::hint
The destructor decrements the count and deletes both blocks only when the count reaches zero. The const `operator->` returns the shared pointer. A non-const use is what calls `on_write`.
:::
:::solution

```cpp
template <typename T>
class copy_on_write {
    T* ptr;
    int* users;

public:
    explicit copy_on_write(T* p)
        : ptr(p), users(new int(1)) {}

    // Copy Constructor: share data, increment reference count
    copy_on_write(const copy_on_write& other)
        : ptr(other.ptr), users(other.users) {
        ++(*users);
    }

    // Called before any mutating operation
    void on_write() {
        if (*users > 1) {
            --(*users);
            ptr = ptr->clone(); // Allocate private copy
            users = new int(1);
        }
    }

    ~copy_on_write() {
        if (--(*users) == 0) {
            delete ptr;
            delete users;
        }
    }

    T* operator->() {
        on_write();
        return ptr;
    }

    const T* operator->() const {
        return ptr; // Const access does not trigger copy
    }
};

```

:::
:::
