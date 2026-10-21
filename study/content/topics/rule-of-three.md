---
id: rule-of-three
title: The rule of three
sources:
  - "materials/lectures/Chapter 4 - Rule of Thee.pptx"
  - "materials/sessions/SPL_PS3.pptx"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
---

When a class owns a resource, a memberwise copy copies the pointer and leaves both objects believing they own one buffer. The `Image` in the lecture holds a `char* _bytes` that its constructor (בנאי) allocated. Copying the `Image` copies that pointer. The first destructor (הורס) then releases the buffer while the other object is still using it.

## The three operations

:::definition id=def-rule-of-three title="The rule of three (חוק השלושה)" source="materials/lectures/Chapter 4 - Rule of Thee.pptx"
The rule of three: if you write the destructor, the copy constructor (בנאי העתקה), or the copy assignment operator (אופרטור השמה), write all three.

- The destructor releases the resource.
- The copy constructor allocates a new resource and copies the contents into it.
- The copy assignment operator does both. It releases the resource this object already holds, and it takes a deep copy (העתקה עמוקה) of the other object.

`Image b = a` initializes a new object, so the copy constructor runs. `b = a` assigns one existing object to another, so the copy assignment operator runs.

```cpp
Image a(...);
Image b = a;   // copy constructor, not assignment
b = a;         // assignment, both objects already exist
```
:::

A destructor has an empty parameter list and no return type. The lecture writes it as `~Image()`, and that function calls `delete[] _bytes`. In Java, once the last reference to an `Image` becomes unreachable, the byte array becomes unreachable with it. In C++, ending the `Image` object's lifetime destroys the pointer. The bytes remain allocated, and the destructor is the function that releases them.

![An Image object on the stack: width, height, and a pointer to a separate byte buffer on the heap](../assets/figures/image-object-layout.svg)

### Shallow copy (העתקה רדודה), then the crash

`void processImage(Image img)` takes the image by value, so the copy constructor runs at the call and the destructor runs when the function returns. The copy constructor the compiler generates copies `_width`, `_height`, and `_bytes`. Both objects point at one array. The parameter's destructor runs `delete[]` on that array. The caller's `_bytes` is then a dangling pointer. The lecture's last drawing still shows the caller's pointer inside the object, and the heap block is gone.

The repair allocates a new buffer and copies the other image's bytes into it.

```cpp
Image::Image(const Image& other)
    : _width(other._width), _height(other._height),
      _bytes(new char[_width * _height]) {
    std::memcpy(_bytes, other._bytes, _width * _height);
}
```

The lecture also writes that constructor as a delegating constructor, forwarding to `Image(int, int, char*)`, so the allocation lives in one place. After that change, `processImage` has a buffer of its own. Its destructor releases only that buffer. The caller's image is intact.

![A shallow copy shares one buffer, so one destructor releases it while the other object still uses it. A deep copy gives each Image a buffer of its own](../assets/figures/shallow-copy.svg)

### Assignment and construction

```cpp
Image avi(1080, 1920, bytesAvi);
Image benni(1080, 1920, bytesBenni);
avi = benni;
```

Both objects already hold a buffer. The assignment the compiler generates copies `benni._bytes` into `avi._bytes` and abandons `avi`'s old array. That array has leaked, and the two objects now share one buffer. A hand-written `assign` that runs `delete[]` first and then allocates also has to survive self-assignment. `avi.assign(avi)` would release the buffer and then copy from the memory it had just released.

The form the lecture prefers is copy-and-swap.

```cpp
void Image::swap(Image& other) {
    std::swap(_width, other._width);
    std::swap(_height, other._height);
    std::swap(_bytes, other._bytes);
}

Image& Image::operator=(const Image& other) {
    Image temp(other);   // deep copy, through the copy constructor
    swap(temp);
    return *this;        // temp's destructor frees what used to be ours
}
```

The slides draw the steps. Before the call, `avi` and `benni` each hold a buffer. `temp` is a third image, a deep copy of `benni`. `swap` exchanges `avi` with `temp`, so `avi` holds the new buffer and `temp` holds the old one. When the function returns, `temp`'s destructor runs and releases the old buffer. Self-assignment is safe because `temp` is a separate copy. Swapping an object with a copy of itself leaves the values as they were.

Assignment returns `Image&` because `=` associates to the right. The expression `avi = benni = carmi` is parsed as `avi = (benni = carmi)`, so the inner call has to return an object the outer call can bind as a `const Image&`. Returning `*this` provides that object, which is why the return type is `Image&` and the calls can be chained.

![Copy-and-swap: temp receives a new buffer B2, the swap gives B2 to avi, and temp's destructor releases the old buffer A](../assets/figures/copy-swap.svg)

Session 3 states the same rule in one sentence and adds a note about exceptions. If assignment throws after it has already released the old buffer, the object is left broken. Copy-and-swap does the allocating first, inside `temp`. If that allocation throws, `avi` is unchanged.

| | Copy constructor | Copy assignment operator |
| --- | --- | --- |
| The object on the left | does not exist yet | already holds a resource |
| Self-assignment | cannot occur | must be harmless |
| Releases the old buffer | no | yes |

:::problem id=worked-copy-and-swap title="Assignment by copy and swap" source="materials/lectures/Chapter 4 - Rule of Thee.pptx" kind=worked solution_origin=source
`avi` holds buffer A. `benni` holds buffer B. Follow `avi = benni` and say which buffer is released.

```cpp
Image& Image::operator=(const Image& other) {
    Image temp(other);   // deep copy of B into a new buffer B2
    swap(temp);          // avi gets B2, temp gets A
    return *this;        // ~Image on temp runs delete[] on A
}
```

:::solution
`Image temp(other)` makes a deep copy of B in a new buffer, B2. `avi` still owns A. `swap(temp)` makes `avi._bytes` point at B2 and `temp._bytes` point at A. `temp` is destroyed at the end of the operator, and `~Image` runs `delete[]` on A. `benni` still owns B. `avi` owns B2. Each object has its own buffer.
:::
:::

:::check id=chk-init-vs-assign
Which line calls the copy constructor?

```cpp
Image a(...);
Image b = a;
b = a;
```

- [ ] Both lines
- [x] Only `Image b = a`
- [ ] Only `b = a`

`Image b = a` initializes a new object, so the copy constructor runs. `b = a` assigns to an object that already exists, so the copy assignment operator runs. The `=` token appears in both lines. The first line is initialization.
:::

:::trap
`if (this == other)` compares a pointer with an object. The test for self-assignment is `if (this == &other)`. Copy-and-swap is correct without that test: it releases `*this` only after the copy exists, and the copy is a different object.
:::

:::trap
`operator()` on the lecture's `Image` is the overload that makes `avi(x, y)` return `_bytes[y * _width + x]`. It sits outside the three special members. An overload that only computes a value leaves those three functions to the compiler. Owning a raw pointer is what requires the rule of three.
:::

## Practice

:::problem id=ps3-rule-of-three title="The three functions of List" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
If a class needs a user-defined destructor, copy constructor, or copy assignment operator, it almost always needs all three. `List` holds a `Node* head` allocated with `new`, and the special members the compiler generates are still in place. What breaks, and which three functions do you write?

```cpp
class List {
    Node* head;
};
```

:::hint
The operations the compiler generates copy the pointer, so both lists end up owning one chain.
:::
:::hint
Two objects, one `head`, two destructors.
:::
:::hint
Name the three: the destructor, the copy constructor, and the copy assignment operator. Say what each one does with `head`.
:::
:::solution
`List b = a` copies `head`. `b` and `a` share one chain. When one destructor walks the chain and `delete`s each node, the other list is left with a dangling pointer, and its destructor `delete`s those same nodes again.

Write all three. The destructor walks the chain and `delete`s every node. The copy constructor allocates a new node for each element and points `head` at that new chain. The copy assignment operator releases the chain `this` already holds, then makes a deep copy, and returns `*this`. Copy-and-swap is the assignment that reuses the copy constructor and the destructor: build a temporary copy, swap the two `head` pointers, and let the temporary's destructor release the old chain.

The session's note on compiler-generated members: they are the right functions when each member already manages itself. A raw `Node*` leaves the chain for `List` to free.
:::
:::

:::examnote
The question gives a small class with a raw pointer or a raw array and asks for the destructor and a deep copy constructor, sometimes for both constructors of a two-dimensional board. The trap is the default memberwise copy, or an assignment that releases the buffer before it has a new one.
:::

:::problem id=exam-17a-q2 title="Ownership of a description" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
Students in "C-Kalkel" store exam results in C++. `TestRes` holds a `char* description_`. `Test` manages a collection of those results. Make the classes correct under copying and destruction: the result owns its description buffer, and a copied test owns a separate copy of that buffer. Implement the special functions that this ownership requires. On assignment, release the previous description exactly once.

:::hint
A `char*` member is `Image::_bytes` under another name.
:::
:::hint
The copy builds a new buffer with `new char[...]` and with `memcpy` or `strcpy`. The destructor is `delete[]`.
:::
:::hint
For assignment, use copy-and-swap, or allocate the new buffer and only then `delete` the old one, so that a throw or a self-assignment cannot release the only copy.
:::
:::solution
```cpp
class TestRes {
    char* description_;
public:
    explicit TestRes(const char* s)
        : description_(new char[std::strlen(s) + 1]) {
        std::strcpy(description_, s);
    }
    ~TestRes() { delete[] description_; }
    TestRes(const TestRes& other) : TestRes(other.description_) {}
    TestRes& operator=(const TestRes& other) {
        if (this == &other) return *this;
        TestRes temp(other);
        std::swap(description_, temp.description_);
        return *this;
    }
};
```

A `Test` that holds an array of `TestRes*` uses the same three operations on that array: `delete[]` in the destructor, a new array and a per-element copy in the copy constructor, and copy-and-swap for assignment. If `Test` instead stores `TestRes` by value in a container that already has the right special members, `Test` itself can keep the members the compiler generates. The bug the question is aimed at is the raw `char*`.
:::
:::

:::problem id=exam-17b-q2 title="A deep copy of a board" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
`Terrain<T>` stores a board as one `T*` block of `height_ * width_` cells. Implement the two constructors and the destructor. The copy constructor has to be a deep copy.

```cpp
template <typename T>
class Terrain {
public:
    Terrain(int w, int h);
    Terrain(const Terrain& other);
    ~Terrain();
};
```

:::hint
One `new T[w * h]` owns the board. The width and the height are plain integers, and they copy themselves.
:::
:::hint
The copy allocates an array of its own. Assigning each cell copies a `T`. If `T` is itself only a pointer, the result is as deep as the copy that `T` performs.
:::
:::hint
Start the copy constructor with `_w(other._w), _h(other._h), _cells(new T[_w * _h])`.
:::
:::solution
```cpp
template <typename T>
Terrain<T>::Terrain(int w, int h)
    : _w(w), _h(h), _cells(new T[w * h]) {}

template <typename T>
Terrain<T>::Terrain(const Terrain& other)
    : _w(other._w), _h(other._h), _cells(new T[_w * _h]) {
    for (int i = 0; i < _w * _h; ++i)
        _cells[i] = other._cells[i];
}

template <typename T>
Terrain<T>::~Terrain() { delete[] _cells; }
```

The default copy would copy `_cells` and share one board. The copy's destructor would then release the original's board. The rule of three says that the destructor just written requires the copy constructor, and that it also requires a copy assignment operator if the class allows `a = b`. The question asks for the constructors and the destructor. A complete class also writes the assignment, with copy-and-swap, or removes it with `= delete`.
:::
:::

Copy-and-swap is the bridge to the [rule of five](topic:rule-of-five) (חוק החמישה). The same swap takes a buffer from a temporary, and that transfer is a move (העברה). In this chapter, every copy still allocates a new buffer.
