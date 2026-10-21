# 08 — Pointers

A pointer (מצביע) is a variable that stores the address of an object.

```cpp
int x = 10;
int* p = &x;     // p holds the address of x
*p = 20;         // the int at that address is now 20, so x is 20
```

Two operators, each with its own name:

| In an expression | Name | What it does |
| --- | --- | --- |
| `&x` | address-of | the address of the object `x` |
| `*p` | dereference (חילול) | the object at the address stored in `p` |

`int* p` is pronounced "p is a pointer to int." The `*` in the declaration is part of the type. The `*` in `*p = 20` is an operator. They are related and they are not the same token doing the same job.

Read `int* p = &x` as: take the address of `x`, and store it in a pointer-to-int named `p`.

## nullptr

`nullptr` is the pointer that points at no object. Dereferencing it is undefined behavior. On this operating system it usually becomes a segmentation fault.

```cpp
int* p = nullptr;
if (p != nullptr) {
    *p = 1;
}
```

Check before you dereference, unless you already know the pointer came from a live object. `&&` stops early, so `p != nullptr && *p > 0` does not dereference a null pointer.

## A pointer can be reseated

This is the useful difference from a reference.

```cpp
int x = 10;
int y = 20;
int* p = &x;
p = &y;          // p now holds the address of y. x is unchanged.
*p = 30;         // y is 30
```

A reference cannot do that second assignment. It would write into `x`.

## const and pointers

Read the `const` relative to the `*`.

```cpp
int x = 10;
int y = 20;

const int* p1 = &x;         // pointer to const int: *p1 = 3 is an error, p1 = &y is fine
int* const p2 = &x;         // const pointer to int: *p2 = 3 is fine, p2 = &y is an error
const int* const p3 = &x;   // neither the int nor the pointer can change
```

A short way to read it: `const` applies to whatever is on its left. When `const` is the first word, it applies to the `int`. `*ps1 = 3` fails to compile when `ps1` has type `const short*`.

A const reference and a pointer to const are the two ways to say "I will not write this object." Prefer the reference for a required object. Use the pointer when the object is optional.

## Pointer arithmetic

Adding 1 to a pointer moves it forward by one object, not by one byte.

```cpp
int a[5] = {10, 20, 30, 40, 50};
int* p = a;          // same as &a[0]
p = p + 1;           // now points at a[1]
```

If `sizeof(int)` is 4 and `p` held address 16, then `p + 1` holds address 20. That is one step of the pointer. `*(p + 1)` is the int that starts 4 bytes later. It is also spelled `p[1]`. `a[i]` means `*(a + i)`.

Two pointers into the same array can mark a half-open range `[begin, end)`. `end` points one past the last element. You may form that address. You may not dereference it.

```cpp
int sum = 0;
for (int* q = begin; q != end; ++q) {
    sum += *q;
}
```

Subtracting two pointers into the same array gives the number of elements between them, as a `ptrdiff_t`. Subtracting pointers from different arrays is undefined.

## A pointer to a pointer

```cpp
int i = 2;
int* pi = &i;
int** ppi = &pi;
```

| Expression | What it is |
| --- | --- |
| `i` | the int 2 |
| `pi` | the address of `i` |
| `*pi` | 2 |
| `ppi` | the address of `pi` |
| `*ppi` | the address of `i` (the value stored in `pi`) |
| `**ppi` | 2 |

You will see `T**` when a function needs to change the caller's pointer, and inside the language's own implementation of a virtual call. You do not need it for ordinary code.

## Which `&` am I looking at?

| Code | Meaning |
| --- | --- |
| `int& r = x;` | `r` is a reference, another name for `x` |
| `int* p = &x;` | `&` is address-of |
| `void f(const Image& img)` | parameter is a const reference |
| `void f(int* p)` | parameter is a pointer |

## Exercise

`make try LESSON=08-pointers`

`sum_range` adds the ints in `[begin, end)`. `find_min` returns a pointer to the smallest int in that range. `n` is at least 1 for `find_min`, so the range is not empty. `set_through` does nothing when `p` is null.

Next: [memory](../09-memory/lesson.md). The study site's pointers chapter covers the same material, with diagrams. Read it after this lesson, not instead of the exercises.
