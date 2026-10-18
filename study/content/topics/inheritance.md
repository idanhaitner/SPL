---
id: inheritance
title: Inheritance and polymorphism
sources:
  - "Classes/Chapter 6 - Inheritance.pptx"
  - "Exrecises/SPL_PS3.pptx"
  - "Exams/16-a.pdf"
  - "Exams/16-a-solution.pdf"
  - "Exams/18-a.pdf"
  - "Exams/18-a-solution.pdf"
  - "Exams/18-b.pdf"
  - "Exams/18-b-solution.pdf"
  - "Exams/19-a.pdf"
  - "Exams/19-a-solution.pdf"
  - "Exams/19-b.pdf"
  - "Exams/19-b-solution.pdf"
  - "Exams/24-b.pdf"
  - "Exams/24-b-solution.pdf"
---

Inheritance (ירושה) builds a new class on an existing one. The base class (מחלקת בסיס) is the one that already exists. The derived class (מחלקה נגזרת) adds members and can replace behavior. The colon in the class head is the C++ spelling of Java's `extends`.

```cpp
class BlurFilter : public Filter {
    double _str;
public:
    BlurFilter(double strength) : Filter("blur"), _str(strength) {}
    double getStrength() { return _str; }
};
```

The derived constructor must call a base constructor. If it does not, the compiler tries the base default constructor, and the program fails to compile when the base has none. Session 3 shows both the explicit `Student(...) : Person(name) {}` and the implicit form that only compiles when `Person` can be built with no arguments.

## What is-a actually requires

An upcast (המרה למעלה) stores a derived object in a base pointer or a base reference. The justification on the slide is the is-a relation: a `BlurFilter` is a `Filter`.

```cpp
void process(Image& img, const Filter& filter);
BlurFilter blur(50.0);
process(img, blur);
```

The same upcast works with `unique_ptr<Filter>` holding a `BlurFilter`.

:::definition id=def-lsp title="Liskov substitution" source="Classes/Chapter 6 - Inheritance.pptx"
The Liskov substitution principle (עקרון ההחלפה של ליסקוב): a derived object must be usable wherever a base object is required, without breaking the base invariants. It is a statement about behavior, not about sharing field names.
:::

The lecture's counterexample is `SquareImage : Image` whose `crop` can change the width and the height independently, so the result is no longer square. Overriding `crop` to refuse that change breaks the base contract, which promised a crop. The inheritance is the wrong tool. A square is not an image-that-you-may-crop-freely.

### Public, protected, private

Encapsulation (אנקפסולציה) is giving access only to the code that needs it. The three levels are `public`, `protected`, and `private`. C++ also has three kinds of inheritance. Java has only the public kind.

| inheritance | public member becomes | protected member becomes | private member |
| --- | --- | --- | --- |
| public | public | protected | inaccessible |
| protected | protected | protected | inaccessible |
| private | private | private | inaccessible |

Public inheritance is is-a. Private inheritance is a has-a spelling the lecture tells you not to use for a filter stuck onto an image. Composition is the has-a the lecture wants: `Image` holds a `Filter*` and calls `filter->apply(*this)`. Protected inheritance is the "limited" middle the slide names and then does not use.

### Shadowing and virtual functions

A non-virtual function in the derived class hides the base function of the same name. The call is bound from the static type of the expression. Through a `Filter*`, you get `Filter::apply`, even if the object is a `BlurFilter`. Fields can hide too: a second `_name` in the derived class is a different member, and an unqualified `_name` in the derived method is the derived one.

:::definition id=def-virtual title="Virtual function and vtable" source="Classes/Chapter 6 - Inheritance.pptx"
A virtual function uses dynamic binding, also called late binding. The call goes to the override of the dynamic type. A non-virtual function uses static, or early, binding.

A class is polymorphic when it has at least one virtual function. The compiler then adds, to each object, a hidden pointer `vptr` to that class's virtual table (`vtable`), which holds the addresses of the virtual functions.

`override` checks that you really overrode a base virtual. `final` on a function forbids further overrides. `final` on a class forbids further derivation.
:::

The call, as the lecture draws it: load the object's `vptr`, index the function in the vtable, call that address. A `Filter*` that actually points at a `BlurFilter` still finds `BlurFilter::apply` if `apply` is virtual.

```cpp
struct Filter {
    virtual void apply(Image& img) const { std::cout << "Apply Filter\n"; }
    virtual ~Filter() = default;
};
struct BlurFilter : Filter {
    void apply(Image& img) const override { std::cout << "Apply BlurFilter\n"; }
};
const Filter* p = new BlurFilter();
p->apply(img);     // "Apply BlurFilter"
```

![A BlurFilter object holds a vptr. The call follows it into that class's vtable and finds BlurFilter::apply](../assets/figures/vtable-call.svg)

### Downcasts, and the virtual destructor

A downcast (המרה למטה) turns a base pointer back into a derived pointer. A C-style cast tries too many conversions and will accept nonsense such as `(BlurFilter*)3`. `static_cast` is checked at compile time and still trusts you at run time. `dynamic_cast` looks at the vtable and returns null (for a pointer) when the object is not of that derived type. It needs a polymorphic type. `const_cast` adds or removes `const`. `reinterpret_cast` reinterprets the bits.

:::theorem id=thm-virtual-dtor title="Virtual destructor" source="Classes/Chapter 6 - Inheritance.pptx"
If a class is polymorphic, its destructor must be virtual. That remains true when the derived class adds no fields of its own. Otherwise `delete` through a base pointer is undefined: the derived destructor may not run, and the memory may be released with the wrong size.

:::proof
**Intuition.** `delete p` has to know the real object, not the type written on the pointer. The vtable is how every other virtual call knows. The destructor is that call for the end of the object's life.

**Proof.** `Filter* p = new BlurFilter(...); delete p;` looks up the destructor the same way it looks up `apply`, but only if `~Filter` is virtual. If it is not, the static type wins: `~Filter` runs, `~BlurFilter` does not, and a member `BlurFilter` allocated is leaked. The lecture also warns that the allocator may free only `sizeof(Filter)` bytes. Declaring `virtual ~Filter() = default;` puts the destructor in the vtable, so `delete p` reaches `~BlurFilter` and then the base.

**What the proof used.** Dynamic binding, and the fact that a polymorphic class already has a vptr. A class with no virtual functions has no vtable to put a destructor in, which is why the rule is stated for polymorphic classes.
:::
:::

A pure virtual function is written `= 0` and has no body that you are required to call. A class with one is abstract: it cannot be instantiated. That is the C++ form of a Java abstract method, which session 3 also states. Constructors cannot be virtual. A virtual function cannot be static. The signature in the override must match, or you have hidden the base function instead of overriding it.

An object of a derived class is one block: the base subobject first, then the derived members. The lecture's table for a stack `BlurFilter` shows `_str` beside the base fields, one allocation, not two objects.

## A call trace

| expression | static type | function that runs if `apply` is virtual | if it is not |
| --- | --- | --- | --- |
| `filter.apply(img)` | `Filter` | `Filter::apply` | `Filter::apply` |
| `blur.apply(img)` | `BlurFilter` | `BlurFilter::apply` | `BlurFilter::apply` |
| `Filter* p = &blur; p->apply(img)` | `Filter` | `BlurFilter::apply` | `Filter::apply` |

:::problem id=worked-virtual-call source="Classes/Chapter 6 - Inheritance.pptx" kind=worked solution_origin=source
`Filter* filter = new BlurFilter(); filter->apply(...);` with `apply` virtual. Which function runs, and what changes if you remove `virtual`?

:::solution
With `virtual`, the call loads the vptr of the `BlurFilter` object and calls `BlurFilter::apply`. The output on the slide is "Apply BlurFilter". Without `virtual`, the compiler binds `Filter::apply` from the pointer's type, and the output is "Apply Filter". The object did not change. The binding did.
:::
:::

:::check id=chk-virtual-dtor
You will `delete` a `BlurFilter` through a `Filter*`. What must be true of `~Filter`?

- [ ] It must be pure virtual and have no body
- [x] It must be virtual
- [ ] It must be private

The derived destructor has to run. Only a virtual destructor is dispatched through the vptr.
:::

:::trap
Hiding is not overriding. A derived `apply` that is not marked virtual, on a base that is not virtual, does not change calls through a base pointer. `override` turns that mistake into a compile error.
:::

:::trap
Public inheritance of a type whose operations break your invariant is not saved by a tighter override. The square-image `crop` is the lecture's example.
:::

## Practice

:::problem id=ps3-virtual-destructor source="Exrecises/SPL_PS3.pptx" kind=exercise solution_origin=source
Session 3: a derived object is deleted through a base pointer, and the destructor is not virtual. What is the result, and what is the rule the session states for a class that is meant to be a base?

:::hint
The static type of the pointer is the base. Non-virtual calls use that type.
:::
:::hint
The session's phrase is "undefined result", not "the derived destructor still runs."
:::
:::hint
Tie the rule to "if a class is supposed to be inherited from."
:::
:::solution
The behavior is undefined. In practice the derived destructor is skipped, so resources the derived class owns leak, and the deallocation may use the base size. The session's rule: if a class is meant to be inherited from, give it a virtual destructor. The lecture is stricter in wording and equivalent in effect: a polymorphic class must have one. Constructors stay non-virtual. A pure virtual method, written `= 0`, makes the base abstract, which is a separate decision from the destructor.
:::
:::


:::examnote
The question puts two derived types behind one base pointer and asks why a non-virtual call, a non-virtual destructor, or an overload (instead of an override) uses the base. The trap is a memory drawing that omits the vptr, or a `delete` through the base that never runs the derived destructor.
:::

:::problem id=exam-16a-q2 source="Exams/16-a.pdf" kind=exam solution_origin=derived
A game engine has `SHAPE`s (`SPHERE`, `BOX`) drawn by `SHADER`s (`BASIC_SHADER`, `COMPLEX_SHADER`). Each shader has `Render(SPHERE*)` and `Render(BOX*)`. `RENDER_MGR::Render` loops over shapes and shaders. Overload resolution on a `SHAPE*` cannot pick `Render(SPHERE*)`.

a. (20) Implement the visitor pattern so the loop dispatches to the right pair. `SHAPE` and `SHADER` must be abstract. Add code only in the classes named in the question.

b. (10) Write a deep copy constructor for `RENDER_MGR`.

:::hint
Double dispatch needs two virtual calls: the shape accepts the shader, and the shader then receives the concrete shape.
:::
:::hint
`Accept` on `SPHERE` calls `shader->Render(this)` where `this` is `SPHERE*`, so the overload is resolved in the derived class.
:::
:::hint
A manager that holds owning pointers deep-copies by cloning each shape and each shader, not by copying the pointers.
:::
:::solution
```cpp
struct Shader {
    virtual ~Shader() = default;
    virtual void Render(Sphere* s) = 0;
    virtual void Render(Box* b) = 0;
};
struct Shape {
    virtual ~Shape() = default;
    virtual void Accept(Shader* sh) = 0;
};
struct Sphere : Shape {
    void Accept(Shader* sh) override { sh->Render(this); }
};
struct Box : Shape {
    void Accept(Shader* sh) override { sh->Render(this); }
};
```

`RENDER_MGR::Render` calls `shape->Accept(shader)` for each pair. `BasicShader` and `ComplexShader` override both `Render` overloads. The copy constructor allocates new shapes and shaders. If the hierarchy has a virtual `clone()`, that is the deep copy; copying the pointer array is the bug part (b) is there to catch.
:::
:::

:::problem id=exam-18a-q1 source="Exams/18-a.pdf" kind=exam solution_origin=derived
`Image` is an abstract base with `int n_pixels` and `virtual void show() = 0`. `ColorImage` derives from it and owns a pixel array. The multiple-choice claims include: the program leaks because `~ColorImage` never runs; the fix is `virtual ~Image() {}`; `ColorImage` also needs its own destructor that `delete[]`s the array; there is no leak. Choose the right claim, and say what a by-value copy of a `ColorImage` does to the array under the rule of three.

:::hint
`Image* p = new ColorImage(...); delete p;` uses `~Image` unless that destructor is virtual.
:::
:::hint
Making the destructor virtual runs `~ColorImage`. It does not, by itself, free a raw array. The derived destructor has to.
:::
:::hint
The official options treat "add `virtual ~Image`" as necessary and not sufficient when a second array exists.
:::
:::solution
`delete` through an `Image*` runs only `~Image` when the destructor is not virtual, so `~ColorImage` never frees the pixel array. That is a leak. Declaring `virtual ~Image() = default` makes the delete dispatch to `~ColorImage`. If `ColorImage` owns a raw array, `~ColorImage` must `delete[]` it, and the copy constructor and assignment must deep-copy it. A claim that says there is no leak is false. A claim that only changes `main` to name the dynamic type fixes this one line and leaves the next `Image*` delete broken. The rule-of-three copy is a separate bug: the generated copy shares the array, and the two destructors free it twice.
:::
:::

:::problem id=exam-18b-q1 source="Exams/18-b.pdf" kind=exam solution_origin=derived
The same image hierarchy, rewritten so black-and-white and color images share one abstract base and differ in the pixel type. Draw the stack and the heap at the comment inside `show`, including vptrs. A later part asks which cast finds the dynamic type. The official discussion includes `dynamic_cast`.

:::hint
One derived object is one block: base subobject, then derived members, plus a vptr because the class is polymorphic.
:::
:::hint
A pointer variable on the stack stores the address of that block. The pixel array, if allocated with `new`, is a second heap block.
:::
:::hint
`dynamic_cast` needs the vtable. It fails at run time when the object is not of the target type. It is not a compile-time-only conversion.
:::
:::solution
At the call, the stack holds the pointer parameter (and the return address). The heap object starts with the vptr, then `n_pixels`, then the derived pointer to the pixel buffer, then the buffer itself as another heap block. A black-and-white image and a color image have different vtables, so `show` through an `Image*` reaches the override. `dynamic_cast<ColorImage*>(p)` returns null when `p` is not a color image, and returns the pointer when it is. A C-style cast does not perform that test. The drawing the question prints is right when every polymorphic subobject shows a vptr and the pixel array is not drawn inside the stack frame.
:::
:::

:::problem id=exam-19a-q1 source="Exams/19-a.pdf" kind=exam solution_origin=derived
`APP` is abstract with `virtual void run() = 0`. `PAY_APP` and `PLAY_APP` override it. `MY_APPS_REPO` must store both kinds in one array.

a. (5) Give `apps_repo_arr_` a single type that can hold both.

b. (5) Implement `MY_APPS_REPO(int n_pay_app, int n_play_app)` to allocate and store that many of each.

c. (10) The class learned a way to stop clients calling `new` on the repository, by hiding construction. Implement that, and show how a client still obtains an instance.

d. (10) `Clone` and `test_apps_repo` are already correct. Make `repo->test_apps_repo(test->Clone())` do the copy efficiently. Implement only the functions that line needs.

:::hint
One array of `APP*` holds both derived types. An array of `APP` would slice, and an array of one derived type cannot hold the other.
:::
:::hint
Hiding `new` is a private constructor plus a static factory, or a private `operator new`. The factory returns a pointer or a smart pointer.
:::
:::hint
`Clone` returns a new repository. If it returns by value, the copy constructor runs. A move, or a pointer return, is the efficient version the line is asking for.
:::
:::solution
a. `APP** apps_repo_arr_;` or `std::vector<std::unique_ptr<APP>>`. The static type is the base pointer.

b. Allocate `n_pay_app + n_play_app` slots. The first `n_pay_app` are `new PAY_APP`, the rest `new PLAY_APP`.

c. Make every constructor private and publish `static MY_APPS_REPO* create(...)`. Clients cannot write `new MY_APPS_REPO` from outside the class. They call `create`.

d. `Clone` should move or deep-copy the pointer array into a new repository. The argument of `test_apps_repo` is a temporary if `Clone` returns by value, so a move constructor on the repository steals the pointer array instead of cloning it again. The virtual destructor on `APP` is required so destroying the repository deletes the real apps. Implement `Clone` and the constructor or move operation the call uses, not the whole class.
:::
:::

:::problem id=exam-19b-q1 source="Exams/19-b.pdf" kind=exam solution_origin=derived
`TESTER` declares three overloads, `test(APP*)`, `test(PAY_APP*)`, `test(PLAY_APP*)`, all virtual in the sense of the base, but a call `tester->test(app)` where `app` has static type `APP*` binds the `APP*` overload at compile time. Overload resolution does not use the dynamic type. Draw the memory for the run up to the comment (10 points), and explain why a `PAY_APP` object still hits `test(APP*)`.

:::hint
Overload resolution looks at the static type of the argument. Virtual dispatch then looks at the dynamic type of the object the method is called on, not of the argument.
:::
:::hint
The visitor from 2016 is the way to make the argument's dynamic type participate. A single overload does not.
:::
:::hint
The memory drawing still needs a vptr if any function in the object is virtual.
:::
:::solution
`test(app)` with `APP* app` selects `TESTER::test(APP*)` during compilation, even when `app` points at a `PAY_APP`. Virtual on those three overloads only chooses the tester's override for that exact signature. It does not look inside `app`. To dispatch on the app you need a virtual `accept` on `APP` (visitor), or a `dynamic_cast` chain, which the lecture treats as the inferior tool. The memory picture is the tester object and the app object, each with a vptr if they are polymorphic, the app's extra fields in the derived part, and the pointer on the stack. There is no second function pointer hiding in the argument.
:::
:::

:::problem id=exam-24b-q1 source="Exams/24-b.pdf" kind=exam solution_origin=derived
`BinaryTree<T>` has `left` and `right`. `InorderBinaryTree` derives from it and also implements a traversal interface. Draw memory at the end of:

```cpp
Traversable<BinaryTree<int>>* t1 = new InorderBinaryTree<BinaryTree<int>>(
    BinaryTree<int>(2),
    new InorderBinaryTree<BinaryTree<int>>(BinaryTree<int>(1)),
    new InorderBinaryTree<BinaryTree<int>>(BinaryTree<int>(3)));
InorderBinaryTree<int> t2(2,
    new InorderBinaryTree<int>(1),
    new InorderBinaryTree<int>(3));
```

:::hint
`t1` is one pointer on the stack. The object is on the heap, and it contains a `BinaryTree` subobject plus the derived part.
:::
:::hint
`t2` is an automatic object. Its children were allocated with `new`, so those children are on the heap even though `t2` is not.
:::
:::hint
A by-value `BinaryTree<int>(2)` member is embedded, not pointed at. A `new InorderBinaryTree` child is a separate block with its own vptr.
:::
:::solution
`t1` lives in the frame and holds a heap address. That heap object is an `InorderBinaryTree` whose base subobject stores data 2 and two child pointers. Each child is its own heap `InorderBinaryTree`, data 1 and data 3. Because the class is polymorphic through `Traversable`, each of those three objects has a vptr.

`t2` is the whole derived object in the frame: data 2, a vptr, and two pointers. The children 1 and 3 are heap objects, each with a vptr. Do not draw `t2`'s own fields on the heap. Do not draw the children's fields inside `t2`. The by-value node `BinaryTree<int>(2)` used as an argument was copied into the parent; it is not a fourth live tree after the constructor returns.
:::
:::

The vptr is the last hidden pointer in the object model. [Back to Java](topic:java-runtime) uses the same idea with a different spelling: every non-static method is virtual, and the collector, not `delete`, ends the object's life.
