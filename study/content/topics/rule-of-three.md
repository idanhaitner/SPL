---
id: rule-of-three
title: The rule of three
sources:
  - "materials/lectures/Chapter 4 - Rule of Thee.pptx"
  - "materials/sessions/SPL_PS3.pptx"
  - "materials/exams/15-a.pdf"
  - "materials/exams/15-a-solution.pdf"
  - "materials/exams/20-a.pdf"
  - "materials/exams/20-a-solution.pdf"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
---

This chapter is what goes wrong when a class owns a resource and the compiler's memberwise copy is left in charge.

- **The bug** — two objects that think they own one buffer.
- **The three operations** — destructor, copy constructor, and copy assignment.
- **Deep copy** — how those three keep ownership correct.

## The three operations

When a class owns a resource, a memberwise copy copies the pointer and leaves both objects believing they own one buffer.

- **`Image`** holds a `char* _bytes` that its constructor (בנאי) allocated.
- **Copy** of the `Image` copies that pointer.
- **First destructor** (הורס) then releases the buffer while the other object is still using it.

:::definition id=def-rule-of-three title="The rule of three (חוק השלושה)" source="materials/lectures/Chapter 4 - Rule of Thee.pptx"
The rule of three: if you write the destructor, the copy constructor (בנאי העתקה), or the copy assignment operator (אופרטור השמה), write all three.

- **Destructor** releases the resource.
- **Copy constructor** allocates a new resource and copies the contents into it.
- **Copy assignment** does both. It releases the resource this object already holds, and it takes a deep copy (העתקה עמוקה) of the other object.
- **`Image b = a`** initializes a new object, so the copy constructor runs.
- **`b = a`** assigns one existing object to another, so the copy assignment operator runs.

```cpp
Image a(...);
Image b = a;   // copy constructor, not assignment
b = a;         // assignment, both objects already exist
```
:::

A destructor has an empty parameter list and no return type.

- **`~Image()`** calls `delete[] _bytes`.
- **Java** makes the byte array unreachable once the last reference to an `Image` is unreachable.
- **C++** destroys the pointer when the `Image` ends. The bytes remain allocated until the destructor releases them.

![An Image object on the stack: width, height, and a pointer to a separate byte buffer on the heap](../../web/public/figures/image-object-layout.svg)

### Shallow copy (העתקה רדודה)

`void processImage(Image img)` takes the image by value.

- **Copy constructor** runs at the call, and the destructor runs when the function returns.
- **Generated copy** copies `_width`, `_height`, and `_bytes`. Both objects point at one array.
- **Parameter destructor** runs `delete[]` on that array. The caller's `_bytes` is then a dangling pointer: the pointer is still inside the object, and the heap block is gone.

The repair allocates a new buffer and copies the other image's bytes into it.

```cpp
Image::Image(const Image& other)
    : _width(other._width), _height(other._height),
      _bytes(new char[_width * _height]) {
    std::memcpy(_bytes, other._bytes, _width * _height);
}
```

The same constructor can delegate to `Image(int, int, char*)`, so the allocation lives in one place.

- **`processImage`** then has a buffer of its own.
- **Its destructor** releases only that buffer. The caller's image is intact.

![A shallow copy shares one buffer, so one destructor releases it while the other object still uses it. A deep copy gives each Image a buffer of its own](../../web/public/figures/shallow-copy.svg)

### Assignment and construction

```cpp
Image avi(1080, 1920, bytesAvi);
Image benni(1080, 1920, bytesBenni);
avi = benni;
```

Both objects already hold a buffer.

- **Generated assignment** copies `benni._bytes` into `avi._bytes` and abandons `avi`'s old array.
- **Leak** is that abandoned array. The two objects now share one buffer.
- **Self-assignment** breaks a hand-written `assign` that runs `delete[]` first. `avi.assign(avi)` would release the buffer and then copy from the memory it had just released.

The form to use is copy-and-swap.

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

Before the call, `avi` and `benni` each hold a buffer.

- **`temp`** is a third image, a deep copy of `benni`.
- **`swap`** exchanges `avi` with `temp`, so `avi` holds the new buffer and `temp` holds the old one.
- **Return** destroys `temp`, and that destructor releases the old buffer.
- **Self-assignment** is safe because `temp` is a separate copy. Swapping an object with a copy of itself leaves the values as they were.

Assignment returns `Image&` because `=` associates to the right.

- **`avi = benni = carmi`** is parsed as `avi = (benni = carmi)`.
- **Inner call** has to return an object the outer call can bind as a `const Image&`.
- **`*this`** is that object, which is why the return type is `Image&` and the calls can be chained.

![Copy-and-swap: temp receives a new buffer B2, the swap gives B2 to avi, and temp's destructor releases the old buffer A](../../web/public/figures/copy-swap.svg)

If assignment throws after it has already released the old buffer, the object is left broken.

- **Copy-and-swap** does the allocating first, inside `temp`.
- **Throw** from that allocation leaves `avi` unchanged.

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
- **`Image temp(other)`** makes a deep copy of B in a new buffer, B2. `avi` still owns A.
- **`swap(temp)`** makes `avi._bytes` point at B2 and `temp._bytes` point at A.
- **`~Image`** on `temp` runs `delete[]` on A.
- **Result:** `benni` still owns B. `avi` owns B2. Each object has its own buffer.
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

- **`Image b = a`** initializes a new object, so the copy constructor runs.
- **`b = a`** assigns to an object that already exists, so the copy assignment operator runs.
- **`=` token** appears in both lines. The first line is initialization.
:::

:::trap
- **`if (this == other)`** compares a pointer with an object.
- **Self-assignment test** is `if (this == &other)`.
- **Copy-and-swap** is correct without that test: it releases `*this` only after the copy exists, and the copy is a different object.
:::

:::trap
- **`operator()`** on `Image` makes `avi(x, y)` return `_bytes[y * _width + x]`.
- **Outside the three** special members. An overload that only computes a value leaves those three functions to the compiler.
- **Raw pointer** ownership is what requires the rule of three.
:::

## Practice

:::problem id=ps3-rule-of-three title="The three functions of List" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
`List` holds a `Node* head` allocated with `new`. The special members the compiler generates are still in place.

```cpp
class List {
    Node* head;
};
```

:::check id=ps3-rule-of-three-q1
`List b = a` uses the generated copy. What breaks?

- [ ] The program fails to compile, because a `Node*` cannot be copied
- [ ] `b` allocates its own chain
- [x] `b` and `a` share one chain. One destructor deletes the nodes, and the other deletes those same nodes again

The generated copy copies `head`. After one destructor walks the chain, the other list holds a dangling pointer.
:::

:::check id=ps3-rule-of-three-q2
Which bodies are required?

- [x] The destructor walks the chain and `delete`s every node
- [ ] The copy constructor copies `head` and shares the chain
- [x] The copy constructor allocates a new node for each element and points `head` at that new chain
- [x] Copy assignment releases the chain `this` already holds, then makes a deep copy, and returns `*this`

- **Generated members** are the right functions when each member already manages itself.
- **Raw `Node*`** leaves the chain for `List` to free.
:::

:::check id=ps3-rule-of-three-q3
Copy-and-swap builds a {{=temporary|second list|reference}}, swaps the two `head` pointers, and lets that object's destructor release the old chain.

That assignment reuses the copy constructor and the destructor.
:::
:::

:::examnote
The question gives a small class with a raw pointer or a raw array and asks for the destructor and a deep copy constructor, sometimes for both constructors of a two-dimensional board. The trap is the default memberwise copy, or an assignment that releases the buffer before it has a new one.
:::

:::problem id=exam-15a-q2 title="A vector as a list" source="materials/exams/15-a.pdf" kind=exam solution_origin=source
A class `mvector<T>` stores its elements as a dynamic linked list, using that list where another design would use a contiguous array. `insertAt` allocates a node when one is needed and inserts it at position `pos`. `removeAt` shrinks the structure. One proposal drops `_len` and uses `sizeof(_head)` as the length. The call `foo(mvector<T> vec)` passes the argument by value.

:::check id=exam-15a-q2-q1
Which destructor matches this list, and which copy goes with it?

```cpp
// A
delete[] _head;
```

```cpp
// B
node<T>* current = _head;
while (current != nullptr) {
    node<T>* upcoming = current->_next;
    delete current;
    current = upcoming;
}
```

```cpp
// C
delete _head;
```

- [ ] A, together with a copy constructor that copies `_head` only.
- [x] B, together with a copy constructor that makes a deep copy of every node.
- [ ] C, together with a copy constructor that leaves every vector sharing one chain.

- **Linked list** of `node<T>` nodes and length `_len` require a destructor that walks the nodes and releases each one with `delete`.
- **Copy constructor** makes a deep copy of every node so each vector owns its own nodes and the destructor of one vector releases only that vector's nodes.
:::

:::check id=exam-15a-q2-q2
`_len` is removed and the length is `sizeof(_head)`. Which statement is correct?

- [ ] 1. This works, and it returns the exact length.
- [ ] 2. The result has to be divided by `sizeof(T)`.
- [x] 3. On a 32-bit system the expression always returns 4.
- [ ] 4. A compilation error (`sizeof` cannot be applied to a template).
- [ ] 5. None of the answers is correct.

- **Statement 3** is correct.
- **`_head`** is a pointer.
- **32-bit system** makes the size of a pointer 4 bytes, for any number of elements in the list it addresses.
:::

:::check id=exam-15a-q2-q3
Which description of the stack and the heap is right for `foo(mvector<T> vec)`?

- [ ] The parameter is another name for the caller's vector, so both share one `_head` cell on the stack.
- [ ] The nodes live in `foo`'s frame, next to `_head`.
- [x] A new `mvector` is created in `foo`'s stack frame, with its own `_head` and `_len`. A deep copy puts a new chain on the heap. A shallow copy leaves both stack pointers on one heap chain.

- **Pass by value** creates a new `mvector` object in `foo`'s stack frame with its own `_head` and its own `_len`.
- **Deep copy** duplicates the nodes on the heap into a new chain.
- **Shallow copy** leaves the two pointers on the stack addressing one chain of nodes on the heap.
:::
:::

:::examnote
The question builds an image repository behind an array of pointers, then returns that repository by value from a function whose local was built by the default constructor. The trap is to treat the returned object as a copy of the pixels, and to treat the `sizeof` of a pointer as a length.
:::

:::problem id=exam-20a-q1 title="An image repository" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
`Portrait` and `Scenery` are images. Each pixel is a gray level in `0..255`. The pixels of one image are stored in a one-dimensional `BYTES` array, row after row. `ImageRepository` holds many images in an array named `_images`. The constructor allocates an array of `capacity` pointers. `Insert` receives an array of images, allocates a new array, and copies the pointers into it. The `BYTES` arrays of the images stay as they are.

```cpp
ImageRepository CreateEmptyRep() {
    ImageRepository rep;
    return rep;
}
```

:::check id=exam-20a-q1-q1
Which constructor and `Insert` match that design?

```cpp
// A
ImageRepository(int capacity)
    : _images(new Image*[capacity]), _capacity(capacity), _size(0) {}
void Insert(Image** src, int n) {
    Image** copy = new Image*[n];
    for (int i = 0; i < n; ++i) copy[i] = new Image(*src[i]);
    delete[] _images;
    _images = copy;
    _capacity = n;
    _size = n;
}
```

```cpp
// B
ImageRepository(int capacity)
    : _images(new Image*[capacity]), _capacity(capacity), _size(0) {}
void Insert(Image** src, int n) {
    Image** copy = new Image*[n];
    for (int i = 0; i < n; ++i) copy[i] = src[i]; // pointers only
    delete[] _images;
    _images = copy;
    _capacity = n;
    _size = n;
}
```

```cpp
// C
ImageRepository(int capacity)
    : _images(nullptr), _capacity(capacity), _size(0) {}
void Insert(Image** src, int n) {
    _images = src;
    _size = n;
}
```

- [ ] A. `Insert` allocates a new `Image` for each element, so the pixels are copied.
- [x] B. The constructor allocates `new Image*[capacity]`. `Insert` copies pointers into a new array. The `BYTES` blocks stay where they are.
- [ ] C. The constructor leaves `_images` null. `Insert` stores the caller's array and does not allocate.

- **Constructor** allocates `_images` with `new Image*[capacity]` and records `capacity` and `_size == 0`.
- **`Insert`** allocates a new array of pointers and copies those pointers.
- **Byte arrays** stay where the images already allocated them.
:::

:::check id=exam-20a-q1-q2
`Insert` releases the previous `_images` array with {{=delete[]|delete|no delete}}. It copies {{=pointers|pixels|BYTES blocks}}. Two repositories can hold the same {{=Image*|stack frame|BYTES block}}. A `delete` of an `Image` is safe only for a {{=sole owner|second repository|null pointer}}.

`Insert` copies the pointer and releases the previous array with `delete[]`. The byte arrays stay where the images already allocated them. Two repositories can hold the same `Image*`. A `delete` of an `Image` is safe only for a sole owner.
:::

:::check id=exam-20a-q1-q3
What does `CreateEmptyRep` return?

- [ ] `return rep` returns the local object itself, so the destructor of `rep` does not run.
- [ ] The default copy constructor duplicates every `BYTES` array, so the caller owns new pixels.
- [x] `return rep` copies `_images`. If the destructor then executes `delete[] _images`, the returned object holds a dangling pointer. If it leaves the array allocated, the caller shares that buffer with a destroyed local, and other paths leak.

- **`rep`** is constructed in the frame of `CreateEmptyRep`.
- **`return rep`** is a return by value, so it uses the copy constructor.
- **Default copy** copies the pointer `_images`. The destructor of `rep` then runs.
- **`delete[] _images`** in that destructor leaves the returned object with a dangling pointer.
- **Leaving the array allocated** makes every other path a memory leak, and the caller shares the buffer with a local that has already been destroyed.
:::

:::check id=exam-20a-q1-q4
Which object is an empty repository?

- [x] `ImageRepository(capacity)` with `_size == 0` and a live array of pointers.
- [ ] The object returned by `CreateEmptyRep` after its destructor has executed `delete[] _images`.
- [ ] A repository whose `_images` still addresses the array of a local that has been destroyed.

- **Return by value** copies `_images` and then runs the local destructor.
- **Empty repository** is `ImageRepository(capacity)` with `_size == 0` and a live array of pointers.
- **Destroyed local** that already executed `delete[] _images` does not leave a usable repository.
:::
:::

:::problem id=exam-17a-q2 title="Ownership of a description" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
`TestRes` holds a `char* description_`. `Test` manages a collection of those results. A result owns its description buffer, and a copied test owns a separate copy of that buffer. Assignment releases the previous description exactly once.

:::check id=exam-17a-q2-q1
Which constructor body is required for that buffer?

- [ ] `: description_(s)`, so both objects share one buffer
- [x] `: description_(new char[std::strlen(s) + 1])`, then `std::strcpy(description_, s)`
- [ ] `: description_(new char[1])`, with no copy of the characters

The constructor allocates a new buffer large enough for the characters and the terminator, then copies them.
:::

:::check id=exam-17a-q2-q2
Which of these hold for the other special members?

- [x] The destructor is `delete[] description_`
- [ ] Assignment `delete[]`s `description_` and then reads that same buffer to build the new one
- [x] Assignment returns immediately when `this == &other`. Otherwise it builds a temporary, swaps the pointers, and returns `*this`

- **Swap** hands the previous buffer to the temporary, and the temporary's destructor releases it once.
- **Self-assignment** does not release it.
:::

:::check id=exam-17a-q2-q3
The copy constructor delegates with {{=TestRes(other.description_)|other|nullptr}}.

That call reuses the constructor that allocates and copies the characters.
:::

:::check id=exam-17a-q2-q4
Which of these hold for `Test`?

- [x] An array of `TestRes*` is released with `delete[]` in the destructor
- [ ] Copying that array's pointer is enough
- [x] The copy constructor allocates a new array and copies each element
- [x] If `Test` stores `TestRes` by value in a container that already has the right special members, `Test` can keep the members the compiler generates

- **Same three operations** apply to an array of `TestRes*`: `delete[]`, a new array with a per-element copy, and copy-and-swap for assignment.
- **Raw `char*`** is the bug the question is aimed at.
:::
:::

:::problem id=exam-17b-q2 title="A deep copy of a board" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
`Terrain<T>` stores a board as one `T*` block of `height_ * width_` cells.

```cpp
template <typename T>
class Terrain {
public:
    Terrain(int w, int h);
    Terrain(const Terrain& other);
    ~Terrain();
};
```

:::check id=exam-17b-q2-q1
Which body is required for `Terrain(int w, int h)`?

- [x] `: _w(w), _h(h), _cells(new T[w * h])`
- [ ] `: _w(w), _h(h), _cells(nullptr)`
- [ ] `: _cells(new T[w + h])`

The constructor stores `w`, `h`, and `new T[w * h]`.
:::

:::check id=exam-17b-q2-q2
Which copy-constructor body is the deep copy?

- [ ] `: _w(other._w), _h(other._h), _cells(other._cells)`
- [ ] `: _w(other._w), _h(other._h), _cells(new T[_w * _h])`, with no assignment of the cells
- [x] `: _w(other._w), _h(other._h), _cells(new T[_w * _h])`, then `_cells[i] = other._cells[i]` for each cell

The copy allocates an array of its own and assigns each cell.
:::

:::check id=exam-17b-q2-q3
Which of these hold?

- [x] The destructor is `delete[] _cells`
- [x] The default copy would copy `_cells` and share one board, and the copy's destructor would release the original's board
- [ ] `_w` and `_h` are allocated with `new`

- **Destructor** is `delete[] _cells`.
- **Default copy** shares `_cells`, and the copy's destructor releases the original board.
- **That destructor** requires the copy constructor.
:::

:::check id=exam-17b-q2-q4
If the class allows `a = b`, a complete class also writes copy assignment with copy-and-swap, or removes it with {{== delete|= default|friend}}.

The question asks for the constructors and the destructor. A complete class also writes the assignment with copy-and-swap, or removes it with `= delete`.
:::
:::

Copy-and-swap is the bridge to the [rule of five](topic:rule-of-five) (חוק החמישה).

- **Same swap** takes a buffer from a temporary, and that transfer is a move (העברה).
- **This chapter** still allocates a new buffer for every copy.
