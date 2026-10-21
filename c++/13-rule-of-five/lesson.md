# 13 — The rule of five

Copying a buffer gives two objects the same pixels, and it also walks every byte. A temporary that is about to die does not need a second copy. Move (העברה) steals the pointer and leaves the source empty.

## lvalues and rvalues

An lvalue (ערך מיקום) is an object with a name and an address. You can assign to it, and you can bind an ordinary reference to it. `avi` is an lvalue.

An rvalue (ערך זמני) is a temporary. It has no name you can come back to. The return value of a function, and the result of `Image(1080, 1920, pixels)` used as an expression, are rvalues. A `const Image&` can bind to either. Binding a const reference to a temporary keeps that temporary alive until the reference dies.

`Image&&` is an rvalue reference. It binds only to an rvalue. The move constructor and the move-assignment operator use that parameter so the overload is chosen for temporaries, and for objects you have explicitly allowed to be stolen.

## What std::move does

`std::move(avi)` is a cast. It produces an rvalue referring to `avi`, so overload resolution can pick `Image(Image&&)`. The cast itself copies nothing and frees nothing. The move constructor does the steal.

After a move, the source is still an object. It is in a valid, empty state: safe to destroy, safe to assign over. It is not safe to treat as a picture. A moved-from `Image` holds `nullptr`, and `delete[] nullptr` does nothing, so the destructor is safe.

```cpp
Image avi(1080, 1920, pixels);
Image benny(std::move(avi));
// benny owns the pixels. avi._bytes is nullptr.
```

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}
```

Move assignment can swap. The source, which is about to be irrelevant or is a named object you promised not to rely on, receives the destination's old buffer. Its destructor, whenever it runs, frees that old buffer.

```cpp
Image& Image::operator=(Image&& other) {
    swap(other);
    return *this;
}
```

Swapping an object with itself is harmless, so self-move needs no extra test. A hand-written steal that starts with `delete[] _bytes` does need `if (this != &other)`, for the same reason lesson 12 needed it.

## The rule of five, and the rule of zero

The rule of five (חוק החמישה) extends the rule of three. If you write any one of the five, write all five: destructor, copy constructor, copy assignment, move constructor, move assignment.

The rule of zero (חוק האפס) is the design to use when you can. Do not own a raw resource. Store a `std::vector`, a `std::string`, or a smart pointer. Those members already copy, move, and free themselves. The compiler-generated five are then correct, and you write none of them.

```cpp
class Image {
    int width_;
    int height_;
    std::vector<char> bytes_;     // deep copy and move come from vector
};
```

Writing any constructor of your own suppresses the implicit default constructor. Writing a copy operation suppresses implicit move. You can ask for the compiler's version back, or refuse it:

```cpp
Image() = default;
Image(const Image&) = delete;
Image& operator=(const Image&) = delete;
```

`unique_ptr` is the standard example of a type that deletes its copy operations and keeps its move operations.

## Smart pointers

`std::unique_ptr<T>` is sole ownership. It is not copyable. It is movable. After the move, the source is null. Destroying the owner runs `delete` (or `delete[]` for `unique_ptr<T[]>`). After optimization it costs the same as a raw pointer.

`std::shared_ptr<T>` is shared ownership. Copying it increments a reference count. The last destructor to drop the count to zero frees the object.

Prefer the factory functions:

```cpp
auto bytes = std::make_unique<char[]>(100);
auto filter = std::make_shared<Filter>(args...);
```

`make_shared` allocates the object and the count in one block. Both factories avoid a leak window that `unique_ptr<T>(new T(...))` can have when an expression contains several `new`s and one of them throws.

`shared_ptr` does not collect cycles. If two objects each hold a `shared_ptr` to the other, the count never reaches zero. `std::weak_ptr` is the tool for the back-edge. It observes without owning.

## Returning a local

Returning a local by value is already the fast path. The compiler may build the object directly in the caller's slot (copy elision: RVO for an unnamed temporary, NRVO for a named local).

```cpp
Image picture() {
    Image pic(1080, 1920, pixels);
    return pic;                 // leave it. NRVO, or a move the compiler inserts.
    // return std::move(pic);   // this blocks NRVO and forces a move
}
```

## Exercise

`make try LESSON=13-rule-of-five`

The copy operations of `MoveBuf` are done. You write the move constructor and the move assignment. The constructor must leave the source with a null pointer and size 0, which is the empty state. Assignment may swap; the source then holds whatever the destination used to hold, and that is a valid empty-enough state as long as the two objects do not share a pointer.

`owned_int` returns a `unique_ptr<int>`. `shared_users` returns the `use_count` after one copy, which is 2. `ScoreList` holds a `vector` and needs no destructor. Write `sum`.

Next: [inheritance](../14-inheritance/lesson.md).
