---
id: inheritance
title: Inheritance and polymorphism
sources:
  - "materials/lectures/Chapter 6 - Inheritance.pptx"
  - "materials/sessions/SPL_PS3.pptx"
  - "materials/exams/16-a.pdf"
  - "materials/exams/16-a-solution.pdf"
  - "materials/exams/18-a.pdf"
  - "materials/exams/18-a-solution.pdf"
  - "materials/exams/18-b.pdf"
  - "materials/exams/18-b-solution.pdf"
  - "materials/exams/19-a.pdf"
  - "materials/exams/19-a-solution.pdf"
  - "materials/exams/19-b.pdf"
  - "materials/exams/19-b-solution.pdf"
  - "materials/exams/24-b.pdf"
  - "materials/exams/24-b-solution.pdf"
---

Inheritance (ירושה) lets a derived class (מחלקה נגזרת) extend a base class (מחלקת בסיס), so a derived object can be used where the base type is expected. The derived class adds its own fields and can replace a virtual function (פונקציה וירטואלית) of the base. The call has to select that replacement from the object that exists at run time. C++ records the choice with a hidden vptr in the object layout and a vtable for the class. The substitution is sound only when the derived class still honors the base class's contract.

A derived class names its base after the colon and calls a base constructor from the member-initializer list:

```cpp
class BlurFilter : public Filter {
    double _str;
public:
    BlurFilter(double strength) : Filter("blur"), _str(strength) {}
    double getStrength() const { return _str; }
};

```

The constructor of the derived class must invoke a constructor of the base class from that initializer list. If the list omits the call, the compiler invokes the base class's default constructor.

## The Liskov substitution principle

:::definition id=def-lsp title="The Liskov substitution principle" source="materials/lectures/Chapter 6 - Inheritance.pptx"
The Liskov substitution principle says that an object of a derived class must be substitutable in every context that expects an object of the base class. The substitution must preserve the correctness of the program and the invariants of the base class.
:::

Deriving `Square` from `Rectangle` breaks the principle. On a rectangle, `setWidth(w)` changes the width and leaves the height as it is. On a square, the same call has to change the height as well. That override replaces the base-class operation with behavior the base contract does not permit.

### Access levels and inheritance in C++

| Kind of inheritance | A public member of the base becomes | A protected member of the base becomes | A private member of the base |
| --- | --- | --- | --- |
| `public` | `public` (is-a) | `protected` | inaccessible |
| `protected` | `protected` | `protected` | inaccessible |
| `private` | `private` (composition) | `private` | inaccessible |

### Virtual functions and the vtable

:::definition id=def-virtual title="Virtual function and vtable" source="materials/lectures/Chapter 6 - Inheritance.pptx"
A function that is not virtual is selected by **static binding** (קשירה סטטית). The compiler uses the static type of the pointer or reference and fixes the callee when it compiles the call.

A function declared `virtual` is selected by **dynamic binding** (קשירה דינמית), also called late binding. The callee is chosen at run time from the dynamic type of the object. The call loads the object's vptr, reads the function's address from the class vtable, and passes the object's address as the implicit `this` parameter.

A class with at least one virtual function is a polymorphic class. The compiler places a hidden vptr in every instance. The vptr points at the vtable of that instance's class.
:::

### The virtual destructor

:::theorem id=thm-virtual-dtor title="A polymorphic base needs a virtual destructor" source="materials/lectures/Chapter 6 - Inheritance.pptx"
If a class has virtual functions, it is meant to be used as a polymorphic base class, and its destructor must be declared `virtual`.

:::proof
Deleting a derived object through a pointer to the base, as in `Base* p = new Derived(); delete p;`, follows the same binding rule as any other call. When the destructor is not virtual, the call uses static binding and runs `~Base` alone. `~Derived` does not run. Resources the derived class acquired are leaked, and the behavior is undefined.
:::
:::

A pure virtual function is declared with `= 0`. A class that contains at least one pure virtual function is an **abstract class** (מחלקה מופשטת). The program cannot create instances of it.

:::problem id=worked-virtual-call title="Tracing a virtual call" source="materials/lectures/Chapter 6 - Inheritance.pptx" kind=worked solution_origin=source
Which method runs when `apply` is declared `virtual`, and which method runs when it is not?

```cpp
Filter* filter = new BlurFilter();
filter->apply(img);

```

:::solution

- **When `apply` is `virtual`:** the call uses dynamic binding (late binding). The vptr leads to the vtable of `BlurFilter`, and the call runs `BlurFilter::apply`.
- **When `apply` is not `virtual`:** the call uses static binding. The static type of the pointer is `Filter*`, so the call runs `Filter::apply`.
:::
:::

![A BlurFilter object holds a vptr. The call follows it to the class vtable and finds BlurFilter::apply](../assets/figures/vtable-call.svg)

:::check id=chk-virtual-dtor
You are about to `delete` a `BlurFilter` through a `Filter*`. What must be true of `~Filter`?

- [ ] It must be pure virtual and have no body
- [x] It must be virtual
- [ ] It must be private

The derived destructor has to run. A virtual destructor is dispatched through the vptr.
:::

## Practice

:::problem id=ps3-virtual-destructor title="Deletion through a base pointer" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
A derived object is destroyed with `delete` through a base-class pointer, and the destructor is not virtual.

```cpp
Base* p = new Derived();
delete p;
```

:::check id=ps3-virtual-destructor-q1
What does this `delete` do?

- [ ] The derived destructor runs, then the base destructor
- [ ] The behavior is defined, and only the base subobject is destroyed
- [x] The behavior is undefined

The behavior is undefined.
:::

:::check id=ps3-virtual-destructor-q2
Which of these hold in a typical implementation of that `delete`?

- [x] The derived destructor is skipped, so resources the derived class owns are leaked
- [ ] The derived destructor still runs
- [x] The deallocation may use the size of the base subobject

In a typical implementation the derived destructor is skipped, so resources the derived class owns are leaked, and the deallocation may use the size of the base subobject.
:::

:::check id=ps3-virtual-destructor-q3
If a class is meant to be inherited from, give it a {{=virtual|non-virtual|private}} destructor.

The exercise states the rule this way: if a class is meant to be inherited from, give it a virtual destructor. The lecture uses a stricter wording and reaches the same outcome: a polymorphic class must have a virtual destructor.
:::

:::check id=ps3-virtual-destructor-q4
Which claim matches the rest of that rule?

- [x] A pure virtual function, written `= 0`, makes the base an abstract class, and the virtual destructor remains a requirement of its own
- [ ] Constructors are virtual, so the base constructor dispatches to the derived constructor
- [ ] A pure virtual function removes the need for a virtual destructor

Constructors are non-virtual. A pure virtual function, written `= 0`, makes the base an abstract class. The virtual destructor remains a requirement of its own.
:::
:::

:::examnote
The question places two derived types behind one base pointer and asks why a non-virtual call, a non-virtual destructor, or an overload written where an override was required, all select the base-class operation. The trap is a memory diagram that omits the vptr, or a `delete` through the base that never runs the destructor of the derived object.
:::

:::problem id=exam-16a-q2 title="A visitor for shapes" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
A game engine has `SHAPE` objects (`SPHERE`, `BOX`) that are drawn by `SHADER` objects (`BASIC_SHADER`, `COMPLEX_SHADER`). Each shader has `Render(SPHERE*)` and `Render(BOX*)`. `RENDER_MGR::Render` walks the shapes and the shaders. Overload resolution on a `SHAPE*` cannot select `Render(SPHERE*)`.

:::check id=exam-16a-q2-q1
Which `Sphere::Accept` body is correct?

- [ ] `Render(static_cast<Shape*>(this));`
- [ ] `shader->Render(static_cast<Shape*>(this));`
- [x] `sh->Render(this);`

`Sphere::Accept` is `void Accept(Shader* sh) override { sh->Render(this); }`. `Box::Accept` is the same call with a `Box*`.
:::

:::check id=exam-16a-q2-q2
`Shader::Render` and `Shape::Accept` are declared {{== 0|inline|static}}.

`Shader` declares `virtual void Render(Sphere* s) = 0` and `virtual void Render(Box* b) = 0`. `Shape` declares `virtual void Accept(Shader* sh) = 0`. Both bases also declare a virtual destructor with `= default`.
:::

:::check id=exam-16a-q2-q3
Which of these hold?

- [x] `RENDER_MGR::Render` calls `shape->Accept(shader)` for each pair
- [ ] Copying the manager's pointer array gives the copy its own shapes and shaders
- [x] `BasicShader` and `ComplexShader` override both `Render` overloads

`RENDER_MGR::Render` calls `shape->Accept(shader)` for each pair. `BasicShader` and `ComplexShader` override both `Render` overloads. Copying the array of pointers is the bug. The copy constructor allocates new shapes and new shaders.
:::

:::check id=exam-16a-q2-q4
Which copy of `RENDER_MGR` is correct?

- [x] The copy constructor allocates new shapes and new shaders. A virtual `clone()` is that deep copy when the hierarchy provides one
- [ ] The copy constructor copies the pointer values, so the two managers share the objects
- [ ] The copy constructor allocates new shaders and keeps the original shapes

The copy constructor allocates new shapes and new shaders. When the hierarchy provides a virtual `clone()`, that function is the deep copy.
:::
:::

:::problem id=exam-18a-q1 title="An image destructor" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
`Image` is an abstract base with `int n_pixels` and `virtual void show() = 0`. `ColorImage` inherits from it and holds an array of pixels. A `ColorImage` is destroyed through an `Image*`. A separate `ColorImage` is also passed by value.

:::check id=exam-18a-q1-q1
What does `delete` through an `Image*` do when the destructor is not virtual?

- [ ] `~ColorImage` runs and releases the pixel array
- [x] `~Image` runs alone, so `~ColorImage` never releases the pixel array
- [ ] There is no leak, because `show` is already virtual

`delete` through an `Image*` runs `~Image` alone when the destructor is not virtual, so `~ColorImage` never releases the pixel array. That is a leak. A claim that there is no leak is false.
:::

:::check id=exam-18a-q1-q2
The declaration that makes `delete` dispatch to `~ColorImage` is {{=virtual ~Image() = default|~Image() = default|virtual ~ColorImage() = default}}.

The declaration `virtual ~Image() = default` makes `delete` dispatch to `~ColorImage`.
:::

:::check id=exam-18a-q1-q3
Which of these hold when `ColorImage` owns a raw array?

- [x] `~ColorImage` must apply `delete[]` to the array
- [x] The copy constructor and the assignment operator must copy the array deeply
- [ ] A virtual `~Image` releases the pixel array by itself

If `ColorImage` owns a raw array, `~ColorImage` must apply `delete[]` to it, and the copy constructor and the assignment operator must copy it deeply.
:::

:::check id=exam-18a-q1-q4
Which of these hold for the other repairs?

- [x] Declaring the variable in `main` with the dynamic type fixes that one line. The next `delete` through an `Image*` is still wrong
- [ ] That change of `main` makes every later `delete` through an `Image*` run `~ColorImage`
- [x] The copy the compiler generates shares the array, and each of the two destructors releases that same array

A repair that only changes `main` so the variable is declared with the dynamic type fixes that one line. The next `delete` through an `Image*` is still wrong. Copying under the rule of three is a separate bug: the copy the compiler generates shares the array, and each of the two destructors releases that same array.
:::
:::

:::problem id=exam-18b-q1 title="Memory of an image hierarchy" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
`Image` is an abstract base with `int n_pixels` and `virtual void show() = 0`. `GrayImage` and `ColorImage` inherit from it, differ in the pixel type, and each holds its own pixel array. The call under discussion is inside `show`. The cast under discussion is `dynamic_cast`.

:::check id=exam-18b-q1-q1
Which description of the layout is right during that call?

- [ ] The stack frame holds the pixel buffer. The heap object starts with `n_pixels` and has no vptr
- [x] The heap object begins with the vptr, then `n_pixels`, then the derived class's pointer to the pixel buffer. The buffer is a further block on the heap
- [ ] The vptr and the pixel array both sit in the stack frame, next to the return address

The object layout on the heap begins with the vptr, then `n_pixels`, then the derived class's pointer to the pixel buffer. The buffer itself is a further block on the heap.
:::

:::check id=exam-18b-q1-q2
What does the stack hold during the call?

- [x] The pointer parameter and the return address
- [ ] The pixel buffer and the vtable
- [ ] The vptr and `n_pixels`

During the call, the stack holds the pointer parameter and the return address.
:::

:::check id=exam-18b-q1-q3
`dynamic_cast<ColorImage*>(p)` returns {{=null|the same pointer p|a new ColorImage}} when `p` does not point at a color image.

`dynamic_cast<ColorImage*>(p)` returns null when `p` does not point at a color image, and it returns the pointer when it does. A C-style cast converts the pointer without consulting the vtable.
:::

:::check id=exam-18b-q1-q4
Which of these hold?

- [x] A grayscale image and a color image have different vtables, so `show` through an `Image*` reaches the override
- [ ] A C-style cast consults the vtable and returns null when the type does not match
- [x] The layout is right when every polymorphic subobject shows a vptr and the pixel array is outside the stack frame

A grayscale image and a color image have different vtables, so `show` through an `Image*` reaches the override. A C-style cast converts the pointer without consulting the vtable. The layout is right when every polymorphic subobject shows a vptr and the pixel array is outside the stack frame.
:::
:::

:::problem id=exam-19a-q1 title="An application repository" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
`APP` is abstract, with `virtual void run() = 0`. `PAY_APP` and `PLAY_APP` override it. `MY_APPS_REPO` stores both kinds in one array. Clients are kept from writing `new` on the repository. `Clone` and `test_apps_repo` are already correct, and the call is `repo->test_apps_repo(test->Clone())`.

:::check id=exam-19a-q1-q1
Which types can hold both kinds in one collection?

- [x] `APP** apps_repo_arr_`
- [ ] An array of `APP` objects
- [x] `std::vector<std::unique_ptr<APP>>`

`APP** apps_repo_arr_` or `std::vector<std::unique_ptr<APP>>`. The static type is a pointer to the base class.
:::

:::check id=exam-19a-q1-q2
Which constructor body is correct for `MY_APPS_REPO(int n_pay_app, int n_play_app)`?

- [x] Allocate `n_pay_app + n_play_app` slots. The first `n_pay_app` slots hold `new PAY_APP`. The remaining slots hold `new PLAY_APP`
- [ ] Allocate one array of `PAY_APP` and a second array of `PLAY_APP`
- [ ] Store both kinds by value in an array of `APP`

Allocate `n_pay_app + n_play_app` slots. The first `n_pay_app` slots hold `new PAY_APP`. The remaining slots hold `new PLAY_APP`.
:::

:::check id=exam-19a-q1-q3
Every constructor is private. A client obtains an instance by calling {{=create|new|Clone}}.

Make every constructor private, and publish `static MY_APPS_REPO* create(...)`. The private constructor stops client code outside the class from writing `new MY_APPS_REPO`. The client obtains an instance by calling `create`.
:::

:::check id=exam-19a-q1-q4
Which of these hold for `repo->test_apps_repo(test->Clone())`?

- [ ] `Clone` returns the original repository, so the argument is that same object
- [x] If `Clone` returns by value, the argument is a temporary and the move constructor takes ownership of the pointer array
- [x] `APP` needs a virtual destructor so that destroying the repository applies `delete` to the real application objects

`Clone` must move the pointer array into a new repository, or deep-copy it there. If `Clone` returns by value, the argument of `test_apps_repo` is a temporary, and the repository's move constructor takes ownership of the pointer array. `APP` needs a virtual destructor so that destroying the repository applies `delete` to the real application objects.
:::
:::

:::problem id=exam-19b-q1 title="Overload resolution and the dynamic type" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
`TESTER` declares three overloads, `test(APP*)`, `test(PAY_APP*)`, and `test(PLAY_APP*)`. Each of them is virtual on the base class. The call is `tester->test(app)`. The variable `app` has static type `APP*`, and the object it points at is a `PAY_APP`.

:::check id=exam-19b-q1-q1
Which signature does `tester->test(app)` select?

- [ ] `test(PAY_APP*)`, because the object is a `PAY_APP`
- [x] `TESTER::test(APP*)`, at compile time, from the static type of `app`
- [ ] `test(PLAY_APP*)`, because that overload is also virtual

`test(app)`, with `app` declared as `APP*`, selects `TESTER::test(APP*)` at compile time, including when `app` points at a `PAY_APP`.
:::

:::check id=exam-19b-q1-q2
Dispatch that follows the application's dynamic type needs a virtual {{=accept|test|run}} on `APP`, or a chain of `dynamic_cast`.

Dispatch that follows the application's dynamic type needs a virtual `accept` on `APP`, which is the visitor, or a chain of `dynamic_cast`. The lecture presents the `dynamic_cast` chain as the weaker of those two tools.
:::

:::check id=exam-19b-q1-q3
Which description of the layout is right?

- [ ] The pointer variable sits on the heap, and neither object has a vptr
- [ ] Callable addresses sit in the application object, and the vtables hold the fields
- [x] Each polymorphic object has a vptr, the pointer variable sits on the stack, and the argument stores the address of the application object

The memory picture contains the tester object and the application object. Each has a vptr when it is polymorphic. The pointer variable sits on the stack. Callable addresses sit in the vtables. The argument stores the address of the application object.
:::

:::check id=exam-19b-q1-q4
Which of these hold?

- [x] The application's further fields sit in the derived part of its block
- [ ] The dynamic type of `app` changes which overload was selected at compile time
- [x] Marking the three overloads `virtual` selects the tester's override of the signature that was already chosen

The application's further fields sit in the derived part of its block. Declaring the three overloads `virtual` selects the tester's override of that exact signature. The signature itself was fixed from the static type of `app`.
:::
:::

:::problem id=exam-24b-q1 title="A tree under an inorder walk" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
`BinaryTree<T>` has `left` and `right`. `InorderBinaryTree` inherits from it and also implements a traversal interface.

```cpp
Traversable<BinaryTree<int>>* t1 = new InorderBinaryTree<BinaryTree<int>>(
    BinaryTree<int>(2),
    new InorderBinaryTree<BinaryTree<int>>(BinaryTree<int>(1)),
    new InorderBinaryTree<BinaryTree<int>>(BinaryTree<int>(3)));
InorderBinaryTree<int> t2(2,
    new InorderBinaryTree<int>(1),
    new InorderBinaryTree<int>(3));
```

:::check id=exam-24b-q1-q1
Which description of the layout of `t1` is right?

- [x] `t1` is a pointer in the frame and holds a heap address. That heap object has a vptr, stores datum 2 in the base subobject, and holds two child pointers. Each child is its own heap object, one with datum 1 and one with datum 3
- [ ] `t1` is the whole tree in the frame, and the children with data 1 and 3 are embedded beside datum 2
- [ ] `t1` points at one heap block that contains datum 2 together with both children

`t1` lives in the frame and holds a heap address. That heap object is an `InorderBinaryTree` whose base subobject stores the datum 2 and two child pointers. Each child is an `InorderBinaryTree` of its own on the heap, one with datum 1 and one with datum 3. The class is polymorphic through `Traversable`, so each of these three objects has a vptr.
:::

:::check id=exam-24b-q1-q2
Which description of the layout of `t2` is right?

- [ ] `t2` is a pointer in the frame, and datum 2 lives on the heap
- [ ] `t2` and both children sit in the frame, and none of them has a vptr
- [x] `t2` is the whole derived object in the frame: datum 2, a vptr, and two pointers. The children with data 1 and 3 are heap objects, and each has a vptr

`t2` is the whole derived object in the frame: the datum 2, a vptr, and two pointers. The children with data 1 and 3 are heap objects, and each has a vptr. The fields of `t2` belong in the frame. The fields of the children belong in their own heap blocks.
:::

:::check id=exam-24b-q1-q3
The `BinaryTree<int>(2)` argument was {{=copied into the parent|shared with the caller|left on the heap as a third child}}.

The value `BinaryTree<int>(2)` that was passed as an argument was copied into the parent. Once the constructor returns, the live trees are the parent and the two children.
:::

:::check id=exam-24b-q1-q4
Which of these hold?

- [x] Each of the three objects reachable from `t1` has a vptr, because the class is polymorphic through `Traversable`
- [ ] The children of `t2` are embedded in the frame and have no vptr
- [x] The fields of those children belong in their own heap blocks

Each of the three objects behind `t1` has a vptr because the class is polymorphic through `Traversable`. The fields of the children belong in their own heap blocks.
:::
:::

The vptr is the last hidden pointer in this object model. [Back to Java](topic:java-runtime) uses the same dispatch under a different rule: every method that is not `static` is virtual, and the garbage collector ends the object's lifetime. C++ ends that lifetime with `delete`.
