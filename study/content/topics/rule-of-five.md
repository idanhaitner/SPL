---
id: rule-of-five
title: Rule of five and zero
sources:
  - "Classes/Chapter 5 - Rule of Five and Zero.pptx"
  - "Exrecises/SPL_PS4.pptx"
  - "Exams/16-b.pdf"
  - "Exams/16-b-solution.pdf"
  - "Exams/20-b.pdf"
  - "Exams/20-b-solution.pdf"
  - "Exams/24-a.pdf"
  - "Exams/24-a-solution.pdf"
  - "Exams/24-c.pdf"
  - "Exams/24-c-solution.pdf"
---

A copy is the honest way to give two objects the same picture. It is the expensive way to return a picture from a function. C++11 adds a second channel: a temporary can be gutted. The resource moves, the bytes do not.

## Values that have an address, and values that do not

:::definition id=def-value-category title="lvalue and rvalue" source="Classes/Chapter 5 - Rule of Five and Zero.pptx"
An lvalue (ערך מיקום, historically a left-hand value) is an object with an address you can take, assign through, and bind a reference to. An rvalue (ערך זמני) is a temporary. It can appear on the right of an assignment, and it is about to disappear: the result of a computation, or an object returned from a function.

A `const` lvalue reference binds to both. It extends the temporary's life to the reference's scope and refuses modification.
:::

`std::move(x)` does not move anything. It is a cast that lets the compiler treat the lvalue `x` as an rvalue, so an overload that steals resources becomes legal. After a real move, `x` must still be a valid object. The lecture's moved-from `Image` holds `nullptr` and must be safe to destroy.

An rvalue reference is written `&&`. It binds to a temporary. It is the parameter type of a move constructor and a move-assignment operator.

```cpp
void convert(const Image& img);   // binds to a named image or a temporary, does not steal
void convert(Image&& img);        // binds only to a temporary, may steal
```

### Move operations

:::definition id=def-rule-of-five title="Rule of five" source="Classes/Chapter 5 - Rule of Five and Zero.pptx"
The rule of three, extended. If you write any of the destructor, the copy constructor, the copy-assignment operator, the move constructor (בנאי העברה), or the move-assignment operator (אופרטור העברה), you write the set you actually need. The lecture calls the three obligatory once you manage a resource, and the two move operations the contract that keeps the program fast.

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}
```
:::

![A move steals the buffer pointer and leaves the source with nullptr. The bytes are not copied](../assets/figures/move-transfer.svg)

The move constructor copies the pointer, not the bytes, then zeros the source so its destructor will `delete[]` a null pointer, which is a no-op. The pictures on the slides are: both objects, then the pointer stolen, then `other._bytes == nullptr`, then `other`'s destructor running harmlessly.

Move assignment must drop the buffer `*this` already owns. The lecture's short form reuses `swap`:

```cpp
Image& Image::operator=(Image&& other) {
    swap(other);
    return *this;
}
```

`other` leaves the function holding the old buffer and destroys it. A bug the slide marks on purpose: `Image avi = new Image(...)` is not how you construct an automatic image, and using `avi` after `std::move(avi)` reads a moved-from object.

### Rule of zero

:::definition id=def-raii title="RAII and the rule of zero" source="Classes/Chapter 5 - Rule of Five and Zero.pptx"
RAII is Resource Acquisition Is Initialization. The paired slogan on the slide is RRID, Resource Release Is Destruction. You obtain the resource in the constructor and release it in the destructor.

The rule of zero (חוק האפס): do not manage the resource yourself. Hold a member that already implements the five operations. Then the compiler-generated five for your class are correct, and you write none of them.
:::

`std::vector<char>` already deletes its buffer, deep-copies, and moves. An `Image` that stores `std::vector<char> _bytes` instead of `char*` gets all five from the compiler. The lecture's opinion of the name RAII is that it is one of the worst names in the language. The idea is still the one to use.

When you do need a pointer, the slide's tools are the smart pointers.

:::definition id=def-smart-pointers title="unique_ptr and shared_ptr" source="Classes/Chapter 5 - Rule of Five and Zero.pptx"
`std::unique_ptr<T>` is sole ownership. It cannot be copied. It can be moved. After optimizations it is as cheap as a raw pointer. `std::shared_ptr<T>` is shared ownership. Copying it increments a count. The last destructor to drop the count frees the object. It is a bit slower than a raw pointer.

Prefer `std::make_unique<T>(...)` and `std::make_shared<T>(...)` to `unique_ptr<T>(new T(...))`. The lecture defers the reason to exception safety: the `new`-expression as a function argument can leak if another argument throws. `make_shared` also places the object and the count in one allocation.
:::

```cpp
std::unique_ptr<char[]> bytes = std::make_unique<char[]>(100);
std::shared_ptr<Filter> filter = std::make_shared<Filter>(args...);
```

The `Filter*` example on the slides is the ownership question: if `Image` stores a raw `Filter*`, who calls `delete`? A `shared_ptr<Filter>` answers it. The object dies when the last `shared_ptr` does. The slide's slip "ניתן להעתקה (non-copyable)" under `shared_ptr` is the opposite of the bullets around it: `shared_ptr` is copyable, `unique_ptr` is not. Trust the bullets, not that one parenthesis.

Writing any constructor suppresses the generated default constructor. Writing a copy constructor suppresses the generated move operations. You can ask for them back with `= default`, or refuse them with `= delete`:

```cpp
class NoCopy {
public:
    NoCopy(const NoCopy&) = delete;
    NoCopy& operator=(const NoCopy&) = delete;
};
```

### Do not move a return value

Copy elision (העלמת העתקה) builds the return value directly in the caller's slot. RVO is that optimization for a temporary `return Image(...)`. NRVO is the same for a named local, `return pic`. The slide's warning:

```cpp
Image myPicture() {
    Image pic(1080, 1920, ...);
    return std::move(pic);   // not a good idea
}
```

`std::move` forces the move constructor and blocks NRVO. A plain `return pic;` lets the compiler construct `pic` in the caller, so there is nothing to move.

:::problem id=worked-move-image source="Classes/Chapter 5 - Rule of Five and Zero.pptx" kind=worked solution_origin=source
`Image benny(std::move(avi));` where `avi` owns a pixel buffer. What does `benny._bytes` hold, what does `avi._bytes` hold, and what does `~Image` on `avi` free?

:::solution
The move constructor copies the pointer into `benny` and sets `avi._bytes` to `nullptr`, and zeros the dimensions the lecture zeros. `benny` owns the pixels. `avi`'s destructor runs `delete[]` on a null pointer and frees nothing. Both objects are destroyed at the end of the function; only one buffer exists.
:::
:::

:::check id=chk-move-cast
What does `std::move` do?

- [ ] It allocates a new buffer and copies the bytes
- [x] It casts an lvalue so a move overload may steal from it
- [ ] It deletes the object

The lecture's sentence is that `std::move` does not move anything. The move constructor does the steal, and only if overload resolution picks it.
:::

:::trap
A moved-from object is valid and empty, not gone. `processImage(avi)` after `std::move(avi)` reads the empty image. The slide marks that call with a bug comment.
:::

:::trap
`shared_ptr` does not make a cycle safe. If two objects each store a `shared_ptr` to the other, the count never hits zero. The lecture's `Filter` example is a one-way share, which is the case the count is for.
:::

## Practice

:::problem id=ps4-copy-count source="Exrecises/SPL_PS4.pptx" kind=exercise solution_origin=derived
Session 4 asks how many times the copy constructor runs for a function that takes `MyClass` by value and returns `MyClass` by value, and what changes when the parameter becomes `const MyClass&`. Assume no elision, so you can count the copies the language rules insert. Then say which of those copies NRVO is allowed to remove.

:::hint
Each by-value parameter is one copy at the call. Each by-value return is one copy at the return, unless elision applies.
:::
:::hint
A const reference parameter does not copy.
:::
:::hint
Count the call that passes the argument, and the return, as two separate events.
:::
:::solution
With a by-value parameter and a by-value return, and no elision: one copy into the parameter, one copy out of the return, so two copy-constructor calls. Temporaries along the way can add more if the body builds a temporary and then copies it into the return slot.

Changing the parameter to `const MyClass&` removes the copy at the call. The return copy remains, unless NRVO builds the named local directly in the caller's return slot, in which case that copy disappears too. The session's point is that the signature, not the body, decides the first copy.
:::
:::

:::problem id=ps4-unique-vs-shared source="Exrecises/SPL_PS4.pptx" kind=exercise solution_origin=source
The session's closing examples ask you to predict two programs. `sp2` is a `shared_ptr` copied from `sp1`, then `sp2` is destroyed. `up2` is a `unique_ptr` initialized from `up1` with copy initialization. What happens in each case?

:::hint
Copying a `shared_ptr` changes a count. Destroying one owner is not the last owner if another remains.
:::
:::hint
`unique_ptr` has a deleted copy constructor.
:::
:::hint
The session's note is "sp2 deleted and have the same pointer" and "compilation error".
:::
:::solution
After the copy, `sp1` and `sp2` own one object and the count is 2. Destroying `sp2` drops the count to 1. The object stays. `sp1` still holds that pointer.

`unique_ptr up2 = up1;` tries to copy. The copy constructor is deleted, so the program does not compile. `unique_ptr up2 = std::move(up1);` moves: `up2` owns the object and `up1` is empty.
:::
:::


:::examnote
The question says "Rule of 5" or "smart pointer" and asks you to steal a buffer instead of cloning it, or to delay the clone until a write. The trap is leaving the source pointer alive, so two destructors free one block, or copying a `unique_ptr`.
:::

:::problem id=exam-16b-q2 source="Exams/16-b.pdf" kind=exam solution_origin=derived
`ITEM_COLLECTION<T>` stores `T` items. `byVal` takes the collection by value.

a. (10) Write a deep copy constructor. Mind the template syntax.

b. (5) Complete a `main` so the collection can hold both `SPHERE` and `BOX`, which derive from `SHAPE`.

c. (5) The student switches to the default copy constructor. What breaks in `byVal(myShapeCollection)`?

d. (10) Repair the ownership with `shared_ptr`, without changing the collection's job. `shared_ptr` is the class from the lecture.

:::hint
A deep copy allocates its own array and copy-constructs each `T`. A default copy copies the pointer.
:::
:::hint
`SPHERE` and `BOX` in one collection means the collection stores pointers to `SHAPE`, not `SHAPE` by value, or the objects slice.
:::
:::hint
`byVal` by value plus a default copy means the parameter's destructor frees the caller's buffer.
:::
:::solution
a. `ITEM_COLLECTION(const ITEM_COLLECTION<T>& other)` allocates a new array of the same size and copy-constructs each element. The destructor `delete[]`s that array.

b. Store `SHAPE*`, or better `shared_ptr<SHAPE>`, so a `SPHERE` and a `BOX` fit in one array without slicing. `Add` takes the base pointer.

c. The default copy copies the pointer. `byVal`'s parameter is that shallow copy. Its destructor frees the array. The caller's collection is left with a dangling pointer. The next use, or the caller's destructor, is a double free.

d. Replace the raw array of owning pointers with `std::shared_ptr<SHAPE>` elements, or hold the array in a `shared_ptr`. Copying the collection copies the `shared_ptr`s and increments counts. `byVal`'s destructor drops its counts and does not free an object the caller still holds. The lecture's `make_shared` is the way to create the shapes.
:::
:::

:::problem id=exam-20b-q1 source="Exams/20-b.pdf" kind=exam solution_origin=derived
The question is the smart-pointer pattern from class. Efi is implementing `SmartPointer<T>` with a `T* ptr_`, and parts of the class were erased. Complete it as the lecture's `shared_ptr`: a reference count, copy that shares the object, destruction that frees only at count zero, and no double free. Helpers are allowed. (15 points for the class.)

:::hint
The count has to live in a place every copy can see. It cannot be an ordinary member that gets copied by value without being shared.
:::
:::hint
The last destructor, the one that drops the count from 1 to 0, is the one that `delete`s `ptr_`.
:::
:::hint
Copy constructor: copy both pointers, then `++*count_`. Destructor: `--*count_`, and delete both the object and the count when it hits zero.
:::
:::solution
```cpp
template <typename T>
class SmartPointer {
    T* ptr_;
    int* count_;
public:
    explicit SmartPointer(T* p) : ptr_(p), count_(new int(1)) {}
    SmartPointer(const SmartPointer& other) : ptr_(other.ptr_), count_(other.count_) {
        ++*count_;
    }
    ~SmartPointer() {
        if (--*count_ == 0) {
            delete ptr_;
            delete count_;
        }
    }
    SmartPointer& operator=(const SmartPointer& other) {
        if (this == &other) return *this;
        if (--*count_ == 0) { delete ptr_; delete count_; }
        ptr_ = other.ptr_;
        count_ = other.count_;
        ++*count_;
        return *this;
    }
    T& operator*() const { return *ptr_; }
    T* operator->() const { return ptr_; }
};
```

This is the lecture's shared ownership, written out. A `unique_ptr`-shaped answer deletes the copy operations and implements move by stealing `ptr_` and nulling the source. The question's wording, "the smart pointer pattern as learned in class," matches the shared count on the Chapter 5 slides when the pointer is copyable. If the erased code shows a deleted copy constructor, it is the unique pointer instead: move only, one owner, `delete ptr_` in the destructor.
:::
:::

:::problem id=exam-24a-q1 source="Exams/24-a.pdf" kind=exam solution_origin=derived
A Java `BinaryTree<T extends Comparable<T>>` stores `data`, `left`, and `right`, and `insert` walks left when `compareTo` is positive and right otherwise, ignoring duplicates. `compareTo` returns 1 when `this` is greater than `other`, and -1 when it is smaller. Assume `T` supports the operators you need.

a. (10) Write the basic C++ class: fields, the two constructors, getters, and `insert`.

b. (15) Complete the class under the rule of five.

c. (10) Draw the memory at the comment.

```cpp
BinaryTree<int> t(1);
t.insert(2);
t.insert(3);
f(BinaryTree<int>(1, new BinaryTree<int>(2), new BinaryTree<int>(3)));

void f(BinaryTree<int> t) {
    // @@ draw the memory here
}
```

:::hint
The tree nodes that `insert` creates are heap objects. The variable `t` in `main` is an automatic object whose children are pointers.
:::
:::hint
Rule of five here means: if the children are owning raw pointers, write the destructor, deep copy, deep assignment, and the two moves that steal the pointers and null the source.
:::
:::hint
`f` takes the tree by value. The argument is a temporary built by the three-argument constructor. At the comment you are looking at the parameter, not at `main`'s `t`.
:::
:::solution
a. Fields `T data`, `BinaryTree* left`, `BinaryTree* right`. The one-argument constructor nulls both children. The three-argument constructor stores the two pointers it is given and does not allocate. `insert` compares with `data < value` / `data > value` (the Java `compareTo > 0` branch goes left). A missing child is `new BinaryTree(value)`.

b. The destructor deletes `left` and `right`, which recurses. The copy constructor allocates a new node for each non-null child. Assignment is copy-and-swap. The move constructor steals both pointers and sets the source's pointers to null. Move assignment swaps. A class that instead stores `std::unique_ptr<BinaryTree>` children writes none of this: that is the rule of zero, and it also satisfies the question if the interface still behaves as a tree.

c. `main`'s `t` is on the stack: data 1, left null, right a heap node 2 whose right is a heap node 3. Separately, the call builds a temporary: a stack (or temporary) node 1 whose left and right pointers aim at two heap nodes, 2 and 3, allocated by the two `new` expressions. `f`'s parameter is a by-value copy of that temporary. With a deep copy, the parameter has its own two heap children. With a move from the temporary, the parameter stole those pointers and the temporary's children are null. The drawing must show `main`'s tree and `f`'s tree as different objects. They are not aliases.
:::
:::

:::problem id=exam-24c-q1 source="Exams/24-c.pdf" kind=exam solution_origin=derived
Copy-on-write: a clone shares the object until a write happens. Only the first modification allocates a private copy.

a. Complete `copy_on_write<T>`. It holds `T* ptr`. `T` has `clone()`. `on_write()` is called before the first assignment through this wrapper, and that is when the clone must happen if the object is still shared.

b. Adjust the fragment so the optimization actually applies, and draw memory at the marked points.

```cpp
A* a = new A(3);
A* b = a->clone();
```

The question's example is that `a` and `b` should point at one `A` until one of them is written.

:::hint
A raw `clone()` that always allocates never shares. The sharing has to be in the wrapper, with a count of readers.
:::
:::hint
`on_write` clones only when the count is greater than one, then drops this wrapper off the old count.
:::
:::hint
Before any write, one `A` on the heap and two wrappers pointing at it. After `b` writes, two `A` objects.
:::
:::solution
```cpp
template <typename T>
class copy_on_write {
public:
    T* ptr;
    int* users;
    explicit copy_on_write(T* p) : ptr(p), users(new int(1)) {}
    copy_on_write(const copy_on_write& o) : ptr(o.ptr), users(o.users) { ++*users; }
    void on_write() {
        if (*users > 1) {
            --*users;
            ptr = ptr->clone();
            users = new int(1);
        }
    }
    ~copy_on_write() {
        if (--*users == 0) { delete ptr; delete users; }
    }
};
```

b. Replace the eager `a->clone()` with a copy of the wrapper. Immediately after the copy, the drawing is one heap `A` with value 3, and two wrappers whose `ptr` both aim at it, `users == 2`. The first `on_write` through `b` calls `clone`, so `b.ptr` aims at a new `A` and `a` keeps the original. That is the picture the question means by "the object is not copied yet."
:::
:::

The five operations are what you write when you insist on a raw pointer. [Inheritance](topic:inheritance) adds one more special member to that list: if the destructor is virtual, it is because a base pointer will be the one to delete the object.
