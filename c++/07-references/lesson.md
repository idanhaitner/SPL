# 07 — References

A reference (רפרנס) is a second name for an object that already exists. It is not a copy, and it is not a pointer you can retarget.

```cpp
int x = 10;
int& ref = x;     // ref is another name for x
ref = 20;         // x is now 20
```

The `&` in the type `int&` means "reference to int." This is a different use of `&` from the address-of operator in the next lesson. In a declaration, `&` makes a reference. In an expression, `&x` asks for the address of `x`.

## Rules that never bend

- A reference is initialized when it is created. `int& ref;` is a compile error.
- After that, it cannot be reseated. `ref = y` writes into the object `ref` already names. It does not make `ref` name `y`.
- A reference has no independent storage you manage. There is nothing to `delete`.

```cpp
int x = 1;
int y = 2;
int& ref = x;
ref = y;          // x becomes 2. ref still names x.
```

## Why functions take references

Pass by value copies. A reference parameter is a name for the caller's object.

```cpp
void add_one(int& x) {
    x = x + 1;
}

int n = 10;
add_one(n);       // n is 11
```

Use that when the function's job is to change the caller's variable. `swap` is the classic case: both parameters are `int&`, and the function exchanges the two objects.

When the function only reads a large object, the parameter is a const reference:

```cpp
int bigger(const int& a, const int& b) {
    return a > b ? a : b;
}
```

`const` means the function will not assign through that name. For an `int`, the copy would have been cheap, and a const reference is still a good habit because the same signature is how you pass `std::string`, `std::vector`, and the course's `Image` when you do not want a copy.

A useful rule of thumb:

| The function | The parameter |
| --- | --- |
| only needs a small, cheap value | pass by value: `int n` |
| reads a large object and does not change it | `const T&` |
| changes the caller's object | `T&` |

Pointers, next lesson, are for "there might be no object," "I need to reseat which object I mean," and "this address is a heap block."

## Returning a reference

Returning `T&` is legal when the object will still be alive after the function returns: a parameter, a global, or a member of an object the caller still holds.

Returning a reference to a local is forbidden. The local dies at the closing brace. The caller would hold a name for storage that has already been reused. That is undefined behavior. The forbidden form is:

```cpp
int& bad() {
    int local = 1;
    return local;     // the local is gone as soon as bad() returns
}
```

Return the local by value instead. The caller receives a copy (or, later, a move).

## Exercise

`make try LESSON=07-references`

`sort2` leaves the smaller value in `a` and the larger in `b`. `clamp` pulls `x` into the closed range `[lo, hi]`.

Next: [pointers](../08-pointers/lesson.md).
