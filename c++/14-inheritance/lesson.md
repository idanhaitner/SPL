# 14 — Inheritance

Inheritance (ירושה) defines a derived class (מחלקה נגזרת) that extends a base class (מחלקת בסיס): it keeps the base's members and can add its own, and it can replace behavior the base marked as replaceable.

```cpp
class BlurFilter : public Filter {
    double strength_;
public:
    BlurFilter(double strength) : Filter("blur"), strength_(strength) {}
    double strength() const { return strength_; }
};
```

`: public Filter` is the inheritance this course uses. Public inheritance means "is a": a `BlurFilter` may be used where a `Filter` is required. The derived constructor calls a base constructor in the initializer list, before its own members. If you omit that call, the base's default constructor runs. If the base has no default constructor, the code does not compile until you call one.

## Substitution

The Liskov substitution principle, as the lecture states it: a derived object must be usable wherever a base object is required, without breaking the base's rules. A `Square` class that inherits from `Rectangle` and makes `setWidth` also change the height breaks that rule. Callers of `Rectangle` were entitled to change the width alone. The course's filters do not do this. A blur filter is a filter.

`protected` members are visible to the class and to derived classes, and hidden from everyone else. `private` stays hidden even from the derived class. With `public` inheritance, a public member of the base stays public. This course writes `public` inheritance.

## Virtual functions

A function that is not virtual is bound statically (קשירה סטטית). The compiler picks it from the type written in the source.

A function marked `virtual` is bound dynamically (קשירה דינמית). The call uses the type of the actual object at run time.

```cpp
Filter* filter = new BlurFilter(0.5);
filter->apply(img);
```

If `apply` is virtual, this calls `BlurFilter::apply`. If it is not, this calls `Filter::apply`, because the pointer's static type is `Filter*`.

A class with at least one virtual function is polymorphic. The compiler places a hidden pointer, the `vptr`, in each object. That pointer addresses the class's virtual table, the `vtable`, which holds the addresses of the virtual functions. A virtual call loads the `vptr`, indexes the table, and calls the function it finds. `override` on the derived function asks the compiler to reject the code when it does not actually override a base virtual. Use it.

A pure virtual function is written `= 0`. A class with one is abstract (מחלקה מופשטת). You cannot write `Filter f;`. You can write `Filter* p` and point it at a derived object. A derived class that does not override every pure virtual is itself abstract.

## The destructor has to be virtual

If you will `delete` a derived object through a base pointer, the base destructor is virtual.

```cpp
Filter* filter = new BlurFilter(0.5);
delete filter;
```

A non-virtual destructor is bound statically. This `delete` would run `~Filter` and would not run `~BlurFilter`. Anything `BlurFilter` allocated would leak, and the behavior is undefined. A virtual destructor is dispatched through the `vptr`, so `~BlurFilter` runs, and then `~Filter` runs as part of that.

`virtual ~Filter() = default;` asks for the compiler's destructor and makes it virtual. A pure virtual destructor is unnecessary here. An empty virtual destructor you write yourself is also fine.

## Slicing

```cpp
BlurFilter blur(0.5);
Filter copy = blur;          // copy is a Filter, not a BlurFilter
```

`copy` is a `Filter` object. The extra members of `blur` are not part of that object. This is slicing. Virtual calls on `copy` use `Filter`'s table, because the dynamic type of `copy` is `Filter`.

Pass and return polymorphic objects by reference or by pointer.

```cpp
void apply(const Filter& filter);     // the BlurFilter is still a BlurFilter
void apply(Filter filter);            // the parameter is sliced on the way in
```

## Exercise

`make try LESSON=14-inheritance`

`Rect` is a `Shape`. Its constructor must initialize the base and the two sides. `area` is `w * h`. `total_area` calls `area` through two `const Shape&` parameters, so it works for any shape.

`call_ref` keeps the `Loud` object intact and returns `"HI"`. `call_value` takes a `Greeter` by value. Passing a `Loud` slices it, and the result is `"hi"`.

Next: [the capstone](../15-capstone/lesson.md).
