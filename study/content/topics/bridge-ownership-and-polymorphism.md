---
id: bridge-ownership-and-polymorphism
title: "Review: ownership and polymorphism"
kind: bridge
reviews: [rule-of-five, inheritance]
blurb: "A look back at moving, smart pointers, and inheritance: who owns a heap object, and which function really runs when you reach it through a base pointer."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
---

The last two chapters answered two questions about a heap object: who is responsible for deleting it, and which class's code runs when you reach it through a pointer to its base. This review asks both at once, and closes the memory part of the course.

## Moving instead of copying

- **A copy leaves two full objects. A move leaves one.** The move constructor takes the source's pointer and then sets the source's pointer to `nullptr`. See [The rule of five and smart pointers](topic:rule-of-five).
- **Resetting the source is not optional.** Both objects will be destroyed. If both still hold the address, the block is released twice.
- **A move is chosen for an rvalue:** a temporary, or a variable relabelled with `std::move`. `std::move` itself moves nothing. It is only a cast.
- **A moved-from object is still an object.** Its destructor will run, so it must be left in a state the destructor can handle. Do not use its old contents.
- **The rule of five** is the rule of three plus the two moves: destructor, copy constructor, copy assignment, move constructor, move assignment.

```cpp
Image::Image(Image&& other) : _size(other._size), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._size = 0;
}
```

:::problem id=br3-after-the-move title="What is left after a move" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Image` owns a `char` array, and has a destructor that runs `delete[] _bytes;`, a deep copy constructor, and the move constructor shown above.

```cpp
int main() {
    Image a(100);
    Image b = a;
    Image c = std::move(a);
    return 0;
}
```

:::check id=br3-after-the-move-q1
Count what exists just before the `return`.

`Image b = a;` runs the {{=copy constructor|move constructor}}, and the number of heap arrays becomes {{=2|1|3}}.

`Image c = std::move(a);` runs the {{=move constructor|copy constructor}}, and the number of heap arrays {{=stays 2|becomes 3|becomes 1}}.

After that line, `a._bytes` is {{=nullptr|the address of c's array|the address of a released block}}.

At the `return`, the destructor runs {{=three times|twice|once}}, and `delete[]` releases an array {{=twice|three times|once}}.

- **A copy allocates. A move does not.** `b` gets a new array. `c` takes over the one that `a` had.
- **All three objects are destroyed,** because all three are locals of `main`. For `a`, the destructor runs `delete[]` on `nullptr`, which is legal and releases nothing.
:::

:::check id=br3-after-the-move-q2
Someone deletes the line `other._bytes = nullptr;` from the move constructor. What changes in this program?

- [ ] Nothing. `a` is not used after the move.
- [x] At the `return`, the destructors of `a` and `c` both run `delete[]` on the same array.
- [ ] `c` gets a copy of the array instead of the array itself.
- [ ] The program no longer compiles.

Not using `a` again is not enough, because its destructor still runs. This is the shallow-copy bug from [The rule of three](topic:rule-of-three) again: two objects that hold one address, and two destructors.
:::
:::

## Who owns the object

- **Ownership is the duty to delete.** With raw pointers, nothing in the code says which pointer has it.
- **`std::unique_ptr<T>` has exactly one owner.** It cannot be copied. It can be moved, and the move leaves the source null. When the owner is destroyed, it deletes the object.
- **`std::shared_ptr<T>` counts its owners.** Copying adds one, destroying a copy subtracts one, and the object is deleted when the count reaches zero.
- **The rule of zero:** if every resource is held by a member that manages itself, such as a `std::vector` or a smart pointer, the class writes none of the five.
- **A smart pointer deletes through the pointer type it holds.** A `std::unique_ptr<Shape>` runs `delete` on a `Shape*`, whatever the real class of the object is.

:::problem id=br3-unique-shape title="One owner, base type" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Circle` is derived from `Shape`, and its constructor allocates an array that `~Circle` releases.

```cpp
class Shape {
  public:
    ~Shape() {}
    virtual int area() const = 0;
};

void run() {
    std::unique_ptr<Shape> first = std::make_unique<Circle>(2);
    std::unique_ptr<Shape> second = std::move(first);
    int a = second->area();
}
```

:::check id=br3-unique-shape-q1
Follow the two smart pointers.

Writing `std::unique_ptr<Shape> second = first;` instead {{=does not compile, because a unique_ptr cannot be copied|makes two owners of one circle|makes a second circle}}.

After the move, `first` is {{=null|still the owner|a second owner}}.

`second->area()` runs {{=Circle's area, by dynamic binding|Shape's area, by static binding}}.

When `run` returns, the circle is deleted by {{=second's destructor|first's destructor|nobody: it leaks}}.

- **One owner at a time:** the move hands the circle from `first` to `second`, and leaves `first` null.
- **`area` is virtual,** so the call goes through the object's v-table and reaches `Circle`'s version.
- **`second` is a local,** so its destructor runs when the frame is popped, and it deletes what it owns.
:::

:::check id=br3-unique-shape-q2
The smart pointer does run `delete`. What is still wrong with this program?

- [ ] Nothing. A `unique_ptr` always releases everything.
- [x] `~Shape` is not virtual, so the `delete` through a `Shape*` runs only `~Shape`, and the array that `~Circle` should release is leaked.
- [ ] `area` should not be virtual in a class that is held by a smart pointer.
- [ ] The circle is deleted twice, once by `first` and once by `second`.

- **A smart pointer answers who deletes and when.** It does not change which destructor the `delete` reaches.
- **The `delete` is a call through a `Shape*`.** With a non-virtual destructor it is bound statically to `~Shape`. See [Inheritance and polymorphism](topic:inheritance).
- **The fix is one word:** `virtual ~Shape() {}`.
:::
:::

## One pointer type, many real classes

- **A derived object starts with its base part.** That is why a `Circle*` can be used as a `Shape*`.
- **Construction runs base first, then derived. Destruction runs in the opposite order.**
- **A non-virtual call is bound statically,** by the type of the pointer or reference. A `virtual` call is bound dynamically, by the real class of the object, through its v-table.
- **A class with virtual functions needs a virtual destructor,** or a `delete` through the base pointer skips the derived destructor.
- **Copying through a base pointer needs `clone`.** `new Shape(*p)` can only build a `Shape`. A virtual `clone()` lets each class copy itself.

```cpp
class Circle : public Shape {
  public:
    virtual Shape* clone() const { return new Circle(*this); }
};
```

:::problem id=br3-copy-a-frame title="Copying a class that owns a shape" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Frame` owns one shape through a base pointer, and its destructor runs `delete _shape;`. `Shape` has a virtual destructor, a pure virtual `area`, and a virtual `clone`.

```cpp
class Frame {
  public:
    Frame(Shape* shape) : _shape(shape) {}
    ~Frame() { delete _shape; }
    Frame(const Frame& other);       // three candidates below

  private:
    Shape* _shape;
};
```

:::check id=br3-copy-a-frame-q1
Match each candidate for the copy constructor to its result.

`: _shape(other._shape) {}` {{=compiles, and both frames delete the same shape|does not compile|makes a correct deep copy}}.

`: _shape(new Shape(*other._shape)) {}` {{=does not compile, because Shape is abstract|compiles, and copies the circle correctly|compiles, and both frames delete the same shape}}.

`: _shape(other._shape->clone()) {}` {{=makes a new object of the shape's real class|always makes a plain Shape|shares the shape between the frames}}.

- **Copying the address** is the shallow copy. It is what the default copy constructor would do.
- **`new Shape(...)` names the class at compile time,** and `Frame` only knows `Shape`. Here that class is abstract, so no object of it can be made. If it were not abstract, the copy would be a plain `Shape` that lost everything the circle added.
- **`clone` is virtual,** so the object's real class builds the copy.
:::

:::check id=br3-copy-a-frame-q2
Which move constructor is correct for `Frame`?

- [ ] `Frame(Frame&& other) : _shape(other._shape->clone()) {}`
- [ ] `Frame(Frame&& other) : _shape(other._shape) {}`
- [x] `Frame(Frame&& other) : _shape(other._shape) { other._shape = nullptr; }`
- [ ] `Frame(Frame&& other) : _shape(nullptr) { delete other._shape; }`

- **A move takes the pointer and resets the source.** No `clone`, and no `delete`.
- **Without the reset,** both frames delete the same shape.
- **Cloning** is correct but is a copy, and it throws away the reason for moving.
:::

:::check id=br3-copy-a-frame-q3
`Frame` now has the destructor, the `clone` copy constructor, and the move constructor. `{ Frame a(new Circle(2)); Frame b = a; Frame c = std::move(a); }` runs. How many `Circle` objects are created, and how many are destroyed, by the closing brace?

- [ ] One created, one destroyed.
- [x] Two created, two destroyed.
- [ ] Three created, three destroyed.
- [ ] Two created, three destroyed.

- **Created:** one by `new Circle(2)`, and one by `clone` in `Frame b = a;`. The move creates nothing.
- **Destroyed:** `b` deletes its clone, `c` deletes the original, and `a` deletes `nullptr`, which does nothing.
- **Each `delete` goes through a `Shape*`** and reaches `~Circle` because the destructor is virtual.
:::
:::
