---
id: rule-of-five
title: The rule of five and smart pointers
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
University univ(...);
Student ringo(Student(1, "yosi", new Bag(7), univ));
```

The `Student(...)` in parentheses is a temporary, an rvalue. It is destroyed right after this line. Copying its bag and books, only to delete the originals a moment later, is pointless. Better to **take** them.

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

It runs for a line like `ringo = Student(2, "danny", new Bag(5), univ);`, where the right side is a temporary.

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
The object `avi` owns a pixel buffer. What do `benni._bytes` and `avi._bytes` hold after the move, and what does `avi`'s destructor `~Image` release?

```cpp
Image avi(1080, 1920, pixels);
Image benni(std::move(avi));

```

:::solution
The move constructor copies the pointer into `benni` and then sets `avi._bytes` to `nullptr`.

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}

```

- **`benni._bytes`** now holds the address of the pixel buffer, so `benni` owns the pixels.
- **`avi._bytes`** is `nullptr`, so `avi`'s destructor runs `delete[]` on a null pointer and releases nothing.
- **At the end of the scope**, both objects are destroyed, and the buffer is released exactly once, by `benni`.
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
Compare these two fragments. `auto` in a declaration tells the compiler to work out the variable's type by itself, from the value it is initialized with.

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

:::problem id=prac-r5-copy-or-move title="Copy or move?" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx" kind=exercise solution_origin=derived
`Image` now has all five special members. Its constructor `Image(int width, int height)` allocates a buffer of `width * height` bytes, and its move operations take the other image's buffer and leave it with `nullptr`.

```cpp
void keep(Image img) { ... }    // by value

Image a(2, 2);
Image b(a);                 // line 1
Image c(std::move(a));      // line 2
b = c;                      // line 3
b = Image(4, 4);            // line 4
keep(std::move(c));         // line 5
```

:::check id=prac-r5-copy-or-move-q1
Line 1 runs {{=the copy constructor|the move constructor|copy assignment|move assignment}}.

Line 2 runs {{=the move constructor|the copy constructor|copy assignment|move assignment}}.

Line 3 runs {{=copy assignment|move assignment|the copy constructor|the move constructor}}.

Line 4 runs {{=move assignment|copy assignment|the copy constructor|the move constructor}}.

Line 5 builds `img` with {{=the move constructor|the copy constructor|copy assignment|move assignment}}.

- **Lines 1 and 2 create `b` and `c`,** so they run constructors. `a` is an lvalue, so line 1 copies. `std::move(a)` is an rvalue, so line 2 moves.
- **Lines 3 and 4 assign to `b`,** which already exists, so they run assignment operators. `c` is an lvalue, so line 3 copies. `Image(4, 4)` is a temporary, an rvalue, so line 4 moves.
- **Line 5 creates the parameter `img`** from the rvalue `std::move(c)`, so it moves.
:::

:::check id=prac-r5-copy-or-move-q2
What is left in `a` after line 2?

- [x] A null `_bytes` and a size of 0: an empty image that is still safe to destroy
- [ ] The same buffer as `c`, so the two images share it
- [ ] Nothing at all, because `std::move` destroyed `a`

- **The move constructor** copied `a`'s pointer into `c`, then set `a._bytes` to `nullptr` and its dimensions to 0.
- **`a` still exists.** When it is destroyed, its destructor runs `delete[]` on a null pointer, which does nothing.
- **`std::move` destroys nothing.** It is only a cast that lets the compiler choose the move constructor.
:::

:::check id=prac-r5-copy-or-move-q3
Which of these expressions are rvalues?

- [ ] `a`
- [x] `Image(4, 4)`
- [x] `std::move(a)`
- [ ] `b`

- **`a` and `b` are lvalues:** they have names and addresses, and the code may still use them.
- **`Image(4, 4)`** is a temporary, destroyed at the end of its line.
- **`std::move(a)`** is `a` cast to an rvalue. `a` itself is still an lvalue.
:::
:::

:::problem id=prac-r5-move-playlist title="A move constructor for Playlist" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx" kind=exercise solution_origin=derived
`Playlist` owns an array of song numbers on the heap, as in [The rule of three](topic:rule-of-three): `int* _songs` and `int _size`, with a destructor that runs `delete[] _songs`. Here are three candidates for its move constructor.

```cpp
// Version A
Playlist(Playlist&& other)
    : _songs(other._songs), _size(other._size) { }

// Version B
Playlist(Playlist&& other)
    : _songs(other._songs), _size(other._size) {
    other._songs = nullptr;
    other._size = 0;
}

// Version C
Playlist(Playlist&& other)
    : _songs(new int[other._size]), _size(other._size) {
    for (int i = 0; i < _size; i++)
        _songs[i] = other._songs[i];
}
```

:::check id=prac-r5-move-playlist-q1
Which version is the right move constructor?

- [ ] Version A
- [x] Version B
- [ ] Version C

Version B takes the other playlist's array, then leaves `other` with `nullptr`, so `other`'s destructor releases nothing.
:::

:::check id=prac-r5-move-playlist-q2
With Version A, the code runs `Playlist p(std::move(q));`, and later both `p` and `q` are destroyed. What happens?

- [x] `p` and `q` hold the same array
- [x] The array is released twice
- [ ] `q` is left empty, so only `p` releases the array

- **Version A copies the pointer and stops there.** `q._songs` still holds the address, so both objects own one array.
- **Each destructor runs `delete[]` on it,** which is a double free, the same bug as a shallow copy.
:::

:::check id=prac-r5-move-playlist-q3
Version C works, but it is {{=a copy, not a move|a move, not a copy|a leak}}: it {{=allocates a new array|takes the other's array|releases the other's array}}. The parameter type `Playlist&&` binds only to {{=rvalues|lvalues|both lvalues and rvalues}}.

- **Version C** does everything the copy constructor does. The point of a move is to hand over the pointer and copy nothing else.
- **`Playlist&&`** is an rvalue reference: it binds to a temporary or to the result of `std::move`, a source that nobody will read again.
:::
:::

:::problem id=prac-r5-five-or-zero title="Five or zero" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx" kind=exercise solution_origin=derived
Two ways to store the songs of a `Playlist`.

```cpp
// Version 1: a raw pointer
class Playlist {
    int* _songs;     // allocated with new[]
    int _size;
    ...
};

// Version 2: a vector
class Playlist {
    std::vector<int> _songs;
    ...
};
```

:::check id=prac-r5-five-or-zero-q1
To be copied safely and moved cheaply, Version 1 writes {{=all five special members|only the destructor|none of them}}. Version 2 writes {{=none of them|only the destructor|all five special members}}.

- **Version 1** owns the array through a raw pointer, so it needs the rule of five: a destructor, the two copy operations, and the two move operations.
- **Version 2** follows the rule of zero. The vector already manages its own buffer, so the operations that the compiler generates are correct.
:::

:::check id=prac-r5-five-or-zero-q2
Which of these hold for Version 2, with only the members that the compiler generates?

- [x] Copying a `Playlist` copies the vector, and the vector makes a deep copy of the songs
- [x] Moving a `Playlist` moves the vector, which hands over its buffer
- [ ] It still needs a destructor that releases the vector's buffer
- [ ] Two copies of a `Playlist` share one buffer of songs

- **Copying:** the generated copy constructor copies each member, and copying a `std::vector` is a deep copy.
- **Moving:** the generated move constructor moves each member, and moving a vector moves its buffer.
- **No destructor needed:** the vector's own destructor releases its buffer. That is RAII: the resource lives exactly as long as the object that holds it.
:::

:::check id=prac-r5-five-or-zero-q3
Suppose Version 1 writes a destructor and a copy constructor, but no move constructor. What does `Playlist p(std::move(q));` run?

- [x] The copy constructor
- [ ] A move constructor that the compiler generates
- [ ] Nothing, because the line does not compile

- **Declaring a copy constructor** (or a destructor) stops the compiler from generating the move operations.
- **So the move falls back to a copy.** The rvalue `std::move(q)` binds to the `const Playlist&` parameter of the copy constructor. The code is correct, only slower.
:::
:::

:::problem id=prac-r5-unique-bag title="A student who owns a unique bag" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx" kind=exercise solution_origin=derived
This `Student` holds its bag in a `std::unique_ptr` instead of a raw `Bag*`, and writes none of the five special members.

```cpp
class Student {
    int _id;
    std::unique_ptr<Bag> _bag;
public:
    Student(int id) : _id(id), _bag(std::make_unique<Bag>(7)) { }
};

Student ringo(1);
Student jango(2);
Student copy(ringo);               // line 1
Student moved(std::move(jango));   // line 2
```

:::check id=prac-r5-unique-bag-q1
Which of these hold?

- [x] `Student` needs no destructor: `_bag` deletes the `Bag` when the student is destroyed
- [ ] `Student` must write `~Student() { delete _bag; }`
- [x] Line 1 does not compile, because a `unique_ptr` cannot be copied
- [x] Line 2 compiles, and `moved` now owns the bag that `jango` had

- **No destructor:** the `unique_ptr` is the owner, and its own destructor deletes the `Bag`. `delete _bag` would not even compile, because `_bag` is not a raw pointer.
- **Line 1:** the generated copy constructor would have to copy `_bag`, and a `unique_ptr`'s copy operations are deleted.
- **Line 2:** the generated move constructor moves `_bag`, so ownership passes to `moved`.
:::

:::check id=prac-r5-unique-bag-q2
After line 2, `jango._bag` is {{=null|still pointing at the bag|pointing at a copy of the bag}}, and that bag is deleted {{=once, when moved is destroyed|twice, once for each student|never}}.

A moved-from `unique_ptr` is null, so exactly one owner is left. When `moved` is destroyed, its `_bag` deletes the bag, and `jango`'s null `_bag` deletes nothing.
:::

:::check id=prac-r5-unique-bag-q3
To let several students share one bag, `_bag` would be a {{=std::shared_ptr<Bag>|std::unique_ptr<Bag>|Bag*}}, and the bag would be deleted when {{=the last student holding it is destroyed|the first student holding it is destroyed|main returns}}.

A `shared_ptr` counts its owners. Copying a student copies `_bag` and adds one to the count, and each destroyed student takes one away. The bag is deleted when the count reaches zero.
:::
:::

:::examnote
- **What the question looks like:** it often asks for a move that transfers a resource by copying only a pointer, or for a copy-on-write class.
- **Points to remember:** after a move, the source must be reset, and copying a `unique_ptr` does not compile.
:::

To sum up, a class that owns a resource either writes all five special members, or, better, hands the resource to a member that manages it and writes none.

- **Next:** [Inheritance and polymorphism](topic:inheritance) shows what changes when objects are used through a pointer to their base class.
