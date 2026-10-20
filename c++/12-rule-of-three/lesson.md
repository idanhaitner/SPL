# 12 — The rule of three

The lecture's `Image` holds `char* _bytes` from `new[]`. Copying the object one member at a time copies the pointer. Both objects then believe they own one buffer. The first destructor runs `delete[]`, and the second object is holding a dead address.

If a class needs a destructor you wrote, a copy constructor you wrote, or an assignment operator you wrote, it almost always needs all three. That is the rule of three (חוק השלושה).

| Operation | When it runs | Job |
| --- | --- | --- |
| Destructor `~Image()` | the object is being destroyed | free the resource |
| Copy constructor `Image(const Image&)` | a new object is born as a copy | allocate a new buffer and copy the bytes |
| Copy assignment `operator=(const Image&)` | both objects already exist | free what this object holds, then take a deep copy |

```cpp
Image a(...);
Image b = a;     // copy constructor. b is being born.
b = a;           // assignment. b already exists.
```

In Java, dropping the last reference to an image also drops the byte array, because the garbage collector traces references. In C++, destroying the `Image` destroys the pointer variable. The bytes stay allocated unless the destructor says `delete[]`.

## Shallow copy, then the crash

The compiler-generated copy copies `_width`, `_height`, and `_bytes`. This is a shallow copy (העתקה רדודה).

`void process(Image img)` takes the image by value, so the copy constructor runs on the way in and the destructor runs on the way out. The parameter's destructor frees the caller's buffer. After the call, the caller's `_bytes` is dangling.

A deep copy (העתקה עמוקה) allocates.

```cpp
Image::Image(const Image& other)
    : _width(other._width), _height(other._height),
      _bytes(new char[_width * _height]) {
    for (int i = 0; i < _width * _height; ++i) {
        _bytes[i] = other._bytes[i];
    }
}
```

The lecture also writes this by delegating to `Image(int, int, char*)`, so the allocation lives in one constructor. Either form is a deep copy. After that, `process` has its own buffer, and its destructor frees only that buffer.

## Assignment is not construction

```cpp
Image avi(...);
Image benni(...);
avi = benni;
```

Both objects already own a buffer. The compiler-generated assignment copies `benni._bytes` into `avi._bytes` and abandons `avi`'s old array: a leak, and a shared buffer.

An assignment you write by hand has to free the old buffer and then copy. It also has to survive self-assignment. `avi = avi` must still hold the pixels afterwards. The wrong order is:

```cpp
delete[] _bytes;
_bytes = new char[other._width * other._height];
// then copy from other._bytes
```

When `other` is `*this`, the `delete[]` already freed the bytes you are about to read.

The test for self-assignment, if you write it by hand, is `if (this == &other)`. `this` is a pointer. `&other` is the address of the parameter. `this == other` does not compile: a pointer and an object are different types.

## Copy-and-swap

The lecture's preferred assignment does the allocating first, in a temporary, and only then touches `*this`.

```cpp
void Image::swap(Image& other) {
    std::swap(_width, other._width);
    std::swap(_height, other._height);
    std::swap(_bytes, other._bytes);
}

Image& Image::operator=(const Image& other) {
    Image temp(other);     // deep copy, through the copy constructor
    swap(temp);
    return *this;          // temp's destructor frees what used to be ours
}
```

Follow one assignment `avi = benni`. `avi` owns buffer A. `benni` owns buffer B.

1. `temp` is a third image. It owns a new buffer B2, a deep copy of B. `avi` still owns A.
2. `swap` makes `avi` own B2 and `temp` own A.
3. `temp` dies at the end of the function. `~Image` does `delete[]` on A.
4. `benni` still owns B. `avi` owns B2. No pointer is shared.

Self-assignment is harmless. `temp` is a copy, and swapping with your own copy puts the same pixels back. If `new[]` throws, it throws while building `temp`, and `avi` has not changed. That is the exception-safety remark in the session: an assignment that deletes first and then fails to allocate leaves a broken object.

`operator=` returns `Image&` because `avi = benni = carmi` is `avi = (benni = carmi)`. The inner call has to return an object the outer call can bind to. Returning `*this` is that object. Returning `void` will not chain.

## What is not one of the three

Overloading `operator()` so that `avi(x, y)` reads a pixel is ordinary overloading. It does not, by itself, mean you must write the rule of three. Owning a raw pointer does.

`data_ptr` and `abandon` in the exercise exist so a shallow copy prints `[fail]` instead of freeing one block twice and crashing. A class you submit for a lab does not have `abandon`.

## Exercise

`make try LESSON=12-rule-of-three`

The constructor, the destructor, and `swap` are written. You write the copy constructor and `operator=`. Use the copy constructor from `operator=`. After a copy, changing one buffer must leave the other alone.

Then run:

```bash
make test-asan
```

A leak or a double free fails that target even when the values look right.

Next: [the rule of five](../13-rule-of-five/lesson.md).
