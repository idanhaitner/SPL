---
title: Reach the real object
chapter: inheritance
order: 1
---

Make `area` work through a `Shape*`, so that each call reaches the real object's version.

**What to write**

- In `Shape`: make `area` a pure virtual function, one with `= 0` and no body.
- In `Shape`: change the destructor so that `delete` through a `Shape*` reaches the derived class's destructor.
- `Rectangle(int width, int height)` and `Square(int side)`: store the sizes.
- `area()` in `Rectangle` and `Square`: return the area, overriding `Shape`'s.
- `int totalArea(Shape** shapes, int count)`: `shapes` is an array of `count` pointers to `Shape`. Return the sum of their areas.

**Good to know**

- Without `virtual`, a call through a `Shape*` is fixed at compile time and always reaches `Shape`'s version.
- A class with a pure virtual function is abstract, so no plain `Shape` object can be made.

:::example
**Input:** `Rectangle r(2, 3); Square s(4); Shape* shapes[] = {&r, &s}; totalArea(shapes, 2);`

**Result:** 22, which is 6 plus 16
:::

:::hint
Which class's function does `p->area()` call, if `p` has the type `Shape*` and `area` is not virtual?
:::

:::hint
`totalArea` does not need to know any kind of shape. It loops, and each call finds its own class through the object.
:::

:::hint
A virtual destructor is a normal destructor with one more word in front of it. It still needs a body, and an empty one is fine here.
:::

:::case name="delete through a base pointer"
Only `~Shape` ran. A destructor follows the same binding rules as any other function, so `~Shape` has to be declared `virtual` too.
:::

:::case name="Shape is abstract"
A class is abstract when it has at least one pure virtual function. Look at how the chapter writes `show` with `= 0`.
:::
