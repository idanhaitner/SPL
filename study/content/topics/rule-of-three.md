---
id: rule-of-three
title: Rule of three
sources:
  - "Classes/Chapter 4 - Rule of Thee.pptx"
  - "Exrecises/SPL_PS3.pptx"
  - "Exams/17-a.pdf"
  - "Exams/17-a-solution.pdf"
  - "Exams/17-b.pdf"
  - "Exams/17-b-solution.pdf"
---

If a class owns a resource, a memberwise copy is a lie. The lecture's `Image` owns a `char* _bytes` allocated in the constructor. Copying the object copies the pointer. Both objects then believe they own one buffer, and the first destructor frees it out from under the second.

## The three operations

:::definition id=def-rule-of-three title="Rule of three" source="Classes/Chapter 4 - Rule of Thee.pptx"
If a class needs a user-written destructor, a user-written copy constructor, or a user-written copy-assignment operator, it almost certainly needs all three.

- The destructor (דיסטרקטור) frees the resource.
- The copy constructor (בנאי העתקה) allocates a new resource and copies the contents into it.
- The assignment operator (אופרטור השמה) does both: it frees what this object already owns, and it takes a deep copy of the other object.

```cpp
Image a(...);
Image b = a;   // copy constructor, not assignment
b = a;         // assignment, both objects already exist
```
:::

The destructor has an empty parameter list and no return type. The lecture writes it `~Image()` and calls `delete[] _bytes`. In Java, dropping the last reference to an `Image` would also make the byte array unreachable. In C++, destroying the `Image` object destroys the pointer, not the bytes, unless the destructor says so.

![Image object on the stack: width, height, and a pointer to a separate byte buffer on the heap](../assets/figures/image-object-layout.svg)

### Shallow copy, then the crash

`void processImage(Image img)` takes the image by value, so the copy constructor runs at the call and the destructor runs at the return. The generated copy constructor copies `_width`, `_height`, and `_bytes`. Both objects point at one array. The parameter's destructor `delete[]`s that array. The caller's `_bytes` is now a bad pointer. The lecture draws that last frame with the caller's pointer still in the object and the heap block gone.

The repair allocates.

```cpp
Image::Image(const Image& other)
    : _width(other._width), _height(other._height),
      _bytes(new char[_width * _height]) {
    std::memcpy(_bytes, other._bytes, _width * _height);
}
```

The lecture also shows the same constructor written by delegating to `Image(int, int, char*)`, so the allocation lives in one place. After that, `processImage` has its own buffer. Its destructor frees only that buffer. The caller's picture is intact.

![A shallow copy shares one buffer, so one destructor frees it out from under the other object. A deep copy gives each Image its own buffer](../assets/figures/shallow-copy.svg)

### Assignment is not construction

```cpp
Image avi(1080, 1920, bytesAvi);
Image benni(1080, 1920, bytesBenni);
avi = benni;
```

Both objects already own a buffer. The generated assignment copies `benni._bytes` into `avi._bytes` and abandons `avi`'s old array: a leak, and a shared buffer. A hand-written `assign` that `delete[]`s first and then allocates must also refuse self-assignment. `avi.assign(avi)` would free the buffer and then copy from the freed memory.

The lecture's preferred shape is copy-and-swap.

```cpp
void Image::swap(Image& other) {
    std::swap(_width, other._width);
    std::swap(_height, other._height);
    std::swap(_bytes, other._bytes);
}

Image& Image::operator=(const Image& other) {
    Image temp(other);   // deep copy, using the copy constructor
    swap(temp);
    return *this;        // temp's destructor frees what used to be ours
}
```

Walk the pictures on the slides. Before the call, `avi` and `benni` each have a buffer. `temp` is a third image, a deep copy of `benni`. `swap` exchanges `avi` with `temp`, so `avi` now holds the new buffer and `temp` holds the old one. Leaving the function destroys `temp` and frees the old buffer. Self-assignment is safe: `temp` is a copy, and swapping with a copy of yourself is a no-op on the values.

Assignment returns `Image&` because `=` associates to the right. `avi = benni = carmi` is `avi = (benni = carmi)`, so the inner call must produce something the outer call can bind as `const Image&`. Returning `*this` is that object. Returning `void` will not chain.

Session 3 states the same rule in one sentence, and adds the exception note: if assignment throws after it has already freed the old buffer, the object is broken. Copy-and-swap does the allocating work in `temp` first. If that throws, `avi` is unchanged.

| | copy constructor | copy assignment |
| --- | --- | --- |
| the left-hand object | does not exist yet | already owns a resource |
| self-assignment | cannot happen | must be harmless |
| frees an old buffer | no | yes |

:::problem id=worked-copy-and-swap source="Classes/Chapter 4 - Rule of Thee.pptx" kind=worked solution_origin=source
`avi` holds a 1080 by 1920 buffer A. `benni` holds buffer B. Trace `avi = benni` implemented as copy-and-swap, and say which buffer is freed.

:::solution
`Image temp(other)` deep-copies B into a new buffer B2. `avi` still owns A. `swap(temp)` makes `avi._bytes` point at B2 and `temp._bytes` point at A. `temp` is destroyed at the end of the operator, and `~Image` executes `delete[]` on A. `benni` still owns B. `avi` owns B2. No pointer is shared.
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

`Image b = a` initializes a new object. `b = a` assigns to an object that already exists. The punctuation looks like assignment in both lines. It is not.
:::

:::trap
`if (this == other)` compares a pointer with an object. The self-check is `if (this == &other)`. The copy-and-swap form does not need the test for correctness, because it never frees `*this` before the copy exists.
:::

:::trap
`operator()` on the lecture's `Image` is just an overload for `avi(x, y)`, returning `_bytes[y * _width + x]`. It is not one of the three special members. Overloading a cosmetic operator does not force you to write the rule of three. Owning a raw pointer does.
:::

## Practice

:::problem id=ps3-rule-of-three source="Exrecises/SPL_PS3.pptx" kind=exercise solution_origin=source
Session 3 quotes the rule as: if a class needs a user-defined destructor, copy constructor, or copy-assignment operator, it almost certainly needs all three. A `List` holds `Node* head` allocated with `new`. The compiler's generated special members are still in place. What breaks, and which three functions do you write?

:::hint
The generated operations copy the pointer and do not allocate a second list.
:::
:::hint
Two objects, one `head`, two destructors.
:::
:::hint
Name the three: destructor, copy constructor, copy assignment. Say what each does to `head`.
:::
:::solution
`List b = a` copies `head`. `b` and `a` share one chain. When one destructor runs `delete` along the chain, the other list's pointer is dangling, and its destructor deletes the same nodes again.

Write all three. The destructor walks the chain and deletes every node. The copy constructor allocates a new node per element and sets `head` to that chain. The assignment operator frees the chain `this` already owns, then deep-copies, and returns `*this`. Copy-and-swap is the assignment that reuses the copy constructor and the destructor: build a temporary copy, swap the two `head` pointers, let the temporary's destructor free the old chain.

The session's note on generated members: they are correct for a class whose members already manage themselves. A raw `Node*` is not such a member.
:::
:::


:::examnote
The question gives a small class with a raw pointer or a raw array and asks for the destructor and a deep copy constructor, sometimes both constructors of a two-dimensional board. The trap is the default memberwise copy, or an assignment that frees the buffer before it has a new one.
:::

:::problem id=exam-17a-q2 source="Exams/17-a.pdf" kind=exam solution_origin=derived
Students in "C-Kalkel" store test results in C++. `TestRes` holds a `char* description_`. `Test` manages a collection of those results. The question asks you to make the classes correct under copy and destruction: the description buffer is owned by the result, and a copied test must not share that buffer. Implement the special members the ownership requires. Do not leak the previous description on assignment.

:::hint
A `char*` member is the `Image::_bytes` situation with a different name.
:::
:::hint
Copy constructs a new buffer with `new char[...]` and `memcpy` or `strcpy`. The destructor is `delete[]`.
:::
:::hint
For assignment, either copy-and-swap or the order "allocate the new buffer, then delete the old one", so a throw or a self-assignment cannot free the only copy.
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

A `Test` that owns a `TestRes*` array uses the same three operations on the array: `delete[]` in the destructor, a new array plus element copy in the copy constructor, and copy-and-swap for assignment. If `Test` instead stores `TestRes` by value in a container that already has the right special members, `Test` itself can stay with the generated ones. The bug the question is aiming at is the raw `char*`.
:::
:::

:::problem id=exam-17b-q2 source="Exams/17-b.pdf" kind=exam solution_origin=derived
`Terrain<T>` stores a board as a `T*` block of `height_ * width_` cells. Implement the two constructors and the destructor. The copy constructor must be a deep copy. (8 points on the copy.)

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
One `new T[w * h]` owns the board. The width and height are plain integers and copy themselves.
:::
:::hint
The copy allocates its own array. Assigning each cell copies a `T`. If `T` is only a pointer, that is as deep as `T`'s own copy.
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

The default copy would copy `_cells` and share one board. The destructor of the copy would then free the original's board. The rule of three says the destructor you just wrote forces the copy constructor, and it also forces an assignment operator if the class allows `a = b`. The question asks for the constructors and the destructor; a complete class writes assignment too, by copy-and-swap, or deletes it.
:::
:::

Copy-and-swap is the bridge into [Rule of five](topic:rule-of-five): the same `swap` steals a buffer from a temporary instead of cloning it. Until then, every copy in this topic really does allocate.
