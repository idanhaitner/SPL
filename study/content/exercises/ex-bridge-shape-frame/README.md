---
title: A frame that owns a shape
chapter: bridge-ownership-and-polymorphism
order: 1
---

Finish the class `Frame`. It owns one `Shape` on the heap through a base pointer, so it needs all five special member functions, and its copies must keep the shape's real class.

`Shape`, `Square`, and `Rect` are already written. `Shape::alive` counts the shapes that exist right now, so the tests can see every leak and every double delete.

**Requirements**

- `~Frame()`: deletes the shape.
- `Frame(const Frame& other)`: a deep copy. The new frame owns a new shape of the same real class. An empty frame copies to an empty frame.
- `Frame(Frame&& other)`: takes the shape from `other` and leaves `other` empty.
- `Frame& operator=(const Frame& other)`: deletes the shape this frame had, then deep copies `other`'s. Safe for `f = f;`.
- `Frame& operator=(Frame&& other)`: deletes the shape this frame had, takes `other`'s, and leaves `other` empty. Safe for `f = std::move(f);`.
- `Frame(Shape* shape)`, `empty()`, and `area()` are already written. A frame with no shape holds `nullptr`.

**Background**

- `Frame` only knows the type `Shape*`. The object may be a `Square` or a `Rect`, so the copy has to be made by the object itself, with `clone()`.
- `delete` on `nullptr` is legal and does nothing.
- A moved-from frame is still destroyed, so it must not keep the address it gave away.

:::example
**Input:** `Frame a(new Rect(2, 3)); Frame b = a; Frame c = std::move(a);`

**Result:** `b.area()` and `c.area()` are both 6, `a.empty()` is true, and `Shape::alive` is 2.
:::

:::hint
For the copy constructor, ask the shape to copy itself: `other._shape->clone()`. Check for `nullptr` first, because an empty frame has no shape to ask.
:::

:::hint
The move constructor is two steps: take `other._shape`, then set `other._shape` to `nullptr`.
:::

:::hint
Both assignment operators start with `if (this != &other)`. Inside it, `delete _shape;` comes before the new shape is stored.
:::
