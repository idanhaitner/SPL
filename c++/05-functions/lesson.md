# 05 — Functions

A function has a name, a parameter list, a return type, and a body. The lectures separate two words that sound similar:

- A **declaration** (הצהרה) introduces the name and the signature. It ends at the semicolon. The body is elsewhere.
- A **definition** (הגדרה) is the declaration plus the body.

```cpp
int add(int a, int b);          // declaration, also called a prototype

int add(int a, int b) {         // definition
    return a + b;
}
```

You may declare a function as many times as you like. You define it once in the whole program. That rule is the One Definition Rule (ODR). Lesson 10 is what happens when two `.cpp` files each define it.

A caller must see a declaration before the call. The definition can come later in the file. If the definition appears first, it is also a declaration, and no extra prototype is required.

## Pass by value

```cpp
void add_one(int x) {
    x = x + 1;
}

int n = 10;
add_one(n);       // n is still 10
```

The parameter `x` is a new `int`. The call copies `n` into `x`. Assigning to `x` changes the copy. `n` is untouched. This is pass by value (העברה לפי ערך).

For an `int`, the copy is exactly what you want. For a large object, the copy is the expensive part, and lesson 7 shows the alternative. For an object that owns a heap buffer, the copy is also the dangerous part, and lesson 12 exists because of it.

## Return

`return expression;` evaluates the expression and hands that value back. A function with return type `void` returns nothing: write `return;` or just let the closing brace end it.

Reaching the end of a non-`void` function without `return` is undefined behavior. Turn warnings on, and do not leave a path that falls off the end.

## Overloading

Two functions may share a name when the parameter lists differ.

```cpp
int area(int w, int h) { return w * h; }
double area(double w, double h) { return w * h; }
```

The compiler picks the overload from the argument types at the call. `area(2, 3)` calls the `int` version. `area(2.5, 4.0)` calls the `double` version. The return type alone is not enough to overload: you cannot have `int f()` and `double f()` with the same parameters.

## A function can call itself

```cpp
int factorial(int n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
```

Each call gets its own parameters and local variables. Lesson 9 draws those as stack frames (מסגרות מחסנית). The lecture's recursion picture is this mechanism. A recursive function needs a base case that does not call itself, or it will run until the stack runs out.

Use a loop when the loop is clearer. Use recursion when the data is recursive (a list of nodes, a tree). Both are legal.

## Scope

A name is visible from its declaration to the end of the block it was declared in. A parameter is a local of the function. A name in an inner block can hide a name outside it:

```cpp
int x = 1;
{
    int x = 2;     // this x is a different variable
}
// the outer x is still 1
```

Hiding is legal and easy to misread. Pick a different name.

## Exercise

`make try LESSON=05-functions`

`power(2, 10)` is 1024. `power(base, 0)` is 1. `is_prime` is false for every integer less than 2. Write both `area` overloads.

Next: [arrays and text](../06-arrays-and-text/lesson.md).
