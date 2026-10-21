# 06 — Arrays and text

An image is a pointer plus a block of bytes. Before that pointer means anything, you need a block of values sitting next to each other. That block is an array.

## A C array

```cpp
int scores[4] = {10, 20, 30, 40};
```

`scores` holds four `int`s in one contiguous block. The first index is 0. `scores[2]` is 30. The length is not stored in the array. You keep it yourself, or you write it as a constant:

```cpp
int n = 4;
scores[n]          // out of range. Undefined behavior. There is no exception.
```

The array lives in the block where you declared it. An array declared in a function lives in that function's stack frame and dies when the function returns. You cannot return it by value in the way you return an `int`. Returning `int*` to a local array is a dangling pointer. Lesson 9 shows the legal way to return a block that outlives the function: allocate it on the heap.

A function receives a C array as a pointer to the first element, together with a length:

```cpp
int sum(const int a[], int n) {
    int total = 0;
    for (int i = 0; i < n; ++i) {
        total += a[i];
    }
    return total;
}
```

`const int a[]` means "I will read these ints, and I will not write them." Inside the function, `a` is a pointer. `sizeof(a)` is the size of a pointer, not the size of the caller's array. That is why `n` is a separate argument. Lesson 8 explains the pointer. For now, use the pattern `array, length`.

## std::vector

`std::vector<T>` is the array to use when the length changes, and it is the member to store inside a class when you want the rule of zero.

```cpp
#include <vector>

std::vector<int> scores;
scores.push_back(10);
scores.push_back(20);
scores.size();          // 2
scores[0];              // 10
scores.at(0);           // 10, and throws std::out_of_range if the index is illegal
```

The `<int>` is a template argument. It means "a vector of int." This course does not ask you to write your own templates. You do need to read `std::vector<char>` and `std::unique_ptr<Filter>`.

A vector knows its length, grows as you `push_back`, and frees its buffer when the vector dies. Passing `const std::vector<int>&` lets a function read it without copying the whole buffer. The `&` is a reference, taught in the next lesson. Copy the signature for now:

```cpp
int total(const std::vector<int>& values) {
    int sum = 0;
    for (int x : values) {
        sum += x;
    }
    return sum;
}
```

`for (int x : values)` is a range-based for. `x` is a copy of each element in order.

## std::string

`std::string` is the text type. It compares with `==`, which compares the characters. It grows. It frees itself.

```cpp
#include <string>

std::string name = "Avi";
name.size();             // 3
name[0];                 // 'A'
name + "!";              // a new string "Avi!"
name == "Avi";           // true
```

Double quotes create a string literal. Its type is "array of `const char`," including a hidden `'\0'` at the end. `std::string name = "Avi";` copies those characters into the string.

## A C string

```cpp
const char* word = "Avi";
char buffer[] = "Avi";
```

`"Avi"` in memory is the four bytes `'A'`, `'v'`, `'i'`, `'\0'`. Functions inherited from C, such as `std::strlen`, walk until they see that zero. `buffer` is a mutable array of those four chars. `word` points at a literal, which you must not write through.

`Image` does not store a C string. It stores `char* _bytes` of length `_width * _height`, and those bytes are pixel data, not text. There may be no `'\0'`. Do not run `strlen` on a pixel buffer. Keep the length beside the pointer.

## Choosing a representation

| You have | Use |
| --- | --- |
| a fixed handful of ints inside a function | `int a[4]` |
| text | `std::string` |
| a growable sequence, or a member of a class | `std::vector<T>` |
| a pixel buffer from `new char[...]` | `char*` plus a length, and lesson 12 |

## Exercise

`make try LESSON=06-arrays-and-text`

`index_of` returns the first index of `target`, or `-1` when it is absent. `shout("hi")` returns `"hi!"`.

Next: [references](../07-references/lesson.md).
