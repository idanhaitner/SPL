---
title: Reach the real object
chapter: inheritance
order: 1
---

`Rectangle` and `Square` are kinds of `Shape`. Code that holds a `Shape*` should get the area of the real object, whichever kind it is. The starter does not do that yet: nothing is marked `virtual`, so a call through a `Shape*` is fixed at compile time and reaches `Shape`.

Fix the base class, and fill in the rest.

- **`Shape`** has no area of its own, so make `area` a pure virtual function, one with `= 0` and no body. That makes `Shape` an abstract class, which means no plain `Shape` object can be created.
- **The destructor of `Shape`** must let `delete` through a `Shape*` reach the derived destructor.
- **`Rectangle(width, height)` and `Square(side)`** store their sizes, and override `area`.
- **`totalArea(shapes, count)`** gets an array of `count` pointers to `Shape`, and returns the sum of their areas.

You are done when Submit shows every test passing.

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
