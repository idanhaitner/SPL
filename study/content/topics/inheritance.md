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
A derived object is destroyed with `delete` through a base-class pointer, and the destructor is not virtual. What is the result, and what rule applies to a class that is meant to be a base?

```cpp
Base* p = new Derived();
delete p;
```

:::hint
The static type of the pointer is the base class. A non-virtual call uses that type.
:::
:::hint
The exercise calls the result undefined behavior. A solution that says the derived destructor still runs contradicts that wording.
:::
:::hint
Tie the rule to the case in which a class is meant to be inherited from.
:::
:::solution
The behavior is undefined. In a typical implementation the derived destructor is skipped, so resources the derived class owns are leaked, and the deallocation may use the size of the base subobject. The exercise states the rule this way: if a class is meant to be inherited from, give it a virtual destructor. The lecture uses a stricter wording and reaches the same outcome: a polymorphic class must have a virtual destructor. Constructors are non-virtual. A pure virtual function, written `= 0`, makes the base an abstract class. The virtual destructor remains a requirement of its own.
:::
:::

:::examnote
The question places two derived types behind one base pointer and asks why a non-virtual call, a non-virtual destructor, or an overload written where an override was required, all select the base-class operation. The trap is a memory diagram that omits the vptr, or a `delete` through the base that never runs the destructor of the derived object.
:::

:::problem id=exam-16a-q2 title="A visitor for shapes" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
A game engine has `SHAPE` objects (`SPHERE`, `BOX`) that are drawn by `SHADER` objects (`BASIC_SHADER`, `COMPLEX_SHADER`). Each shader has `Render(SPHERE*)` and `Render(BOX*)`. `RENDER_MGR::Render` walks the shapes and the shaders. Overload resolution on a `SHAPE*` cannot select `Render(SPHERE*)`.

a. Implement the visitor so that the loop dispatches to the matching pair. `SHAPE` and `SHADER` must be abstract. Add code only in the classes whose names appear in the question.

b. Write a deep copy constructor for `RENDER_MGR`.

:::hint
Double dispatch needs two virtual calls. The shape receives the shader, and the shader then receives the concrete shape.
:::
:::hint
`Accept` on `SPHERE` calls `shader->Render(this)` when the implicit `this` parameter has type `SPHERE*`, so the overload is resolved in the derived class.
:::
:::hint
A manager that owns its pointers makes a deep copy by cloning every shape and every shader. Copying the pointer values shares the objects.
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

`RENDER_MGR::Render` calls `shape->Accept(shader)` for each pair. `BasicShader` and `ComplexShader` override both `Render` overloads. The copy constructor allocates new shapes and new shaders. When the hierarchy provides a virtual `clone()`, that function is the deep copy. Copying the array of pointers is the bug that part (b) is written to catch.
:::
:::

:::problem id=exam-18a-q1 title="An image destructor" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
`Image` is an abstract base with `int n_pixels` and `virtual void show() = 0`. `ColorImage` inherits from it and holds an array of pixels. The claims to choose among are these: the program leaks because `~ColorImage` never runs; the repair is `virtual ~Image() {}`; `ColorImage` also needs a destructor of its own that applies `delete[]` to the array; there is no leak. Choose the correct claim, and say what a pass-by-value copy of `ColorImage` does to the array under the rule of three.

:::hint
`Image* p = new ColorImage(...); delete p;` uses `~Image` unless that destructor is virtual.
:::
:::hint
Making the destructor virtual runs `~ColorImage`. Releasing a raw array is the job of the derived destructor.
:::
:::hint
The options treat "add `virtual ~Image`" as required. When the object owns a further array, the derived destructor still has to release that array.
:::
:::solution
`delete` through an `Image*` runs `~Image` alone when the destructor is not virtual, so `~ColorImage` never releases the pixel array. That is a leak. The declaration `virtual ~Image() = default` makes `delete` dispatch to `~ColorImage`. If `ColorImage` owns a raw array, `~ColorImage` must apply `delete[]` to it, and the copy constructor and the assignment operator must copy it deeply. A claim that there is no leak is false. A repair that only changes `main` so the variable is declared with the dynamic type fixes that one line. The next `delete` through an `Image*` is still wrong. Copying under the rule of three is a separate bug: the copy the compiler generates shares the array, and each of the two destructors releases that same array.
:::
:::

:::problem id=exam-18b-q1 title="Memory of an image hierarchy" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
`Image` is an abstract base with `int n_pixels` and `virtual void show() = 0`. `GrayImage` and `ColorImage` inherit from it, differ in the pixel type, and each holds its own pixel array. Draw the stack and the heap at the comment inside `show`, including the vptrs. A later part asks which cast recovers the dynamic type. The discussion of the question includes `dynamic_cast`.

:::hint
One derived object is a single block in the object layout: the base subobject, then the derived members, and a vptr because the class is polymorphic.
:::
:::hint
A pointer variable on the stack stores the address of that block. The pixel array, when it was allocated with `new`, is a second block on the heap.
:::
:::hint
`dynamic_cast` needs the vtable. Failure is a run-time result: the cast fails when the object is not of the target type.
:::
:::solution
During the call, the stack holds the pointer parameter and the return address. The object layout on the heap begins with the vptr, then `n_pixels`, then the derived class's pointer to the pixel buffer. The buffer itself is a further block on the heap. A grayscale image and a color image have different vtables, so `show` through an `Image*` reaches the override. `dynamic_cast<ColorImage*>(p)` returns null when `p` does not point at a color image, and it returns the pointer when it does. A C-style cast converts the pointer without consulting the vtable. The diagram the question prints is correct when every polymorphic subobject shows a vptr and the pixel array is drawn outside the stack frame.
:::
:::

:::problem id=exam-19a-q1 title="An application repository" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
`APP` is abstract, with `virtual void run() = 0`. `PAY_APP` and `PLAY_APP` override it. `MY_APPS_REPO` must store both kinds in one array.

a. Give `apps_repo_arr_` a single type that can hold both.

b. Implement `MY_APPS_REPO(int n_pay_app, int n_play_app)` so that it allocates and stores that many of each.

c. The class stops clients from calling `new` on the repository by hiding construction. Implement that, and show how a client still obtains an instance.

d. `Clone` and `test_apps_repo` are already correct. Make `repo->test_apps_repo(test->Clone())` perform the copy efficiently. Implement only the functions that line needs.

:::hint
One array of `APP*` holds both derived types. An array of `APP` slices each object down to the base subobject. An array of one derived type has no place for the other.
:::
:::hint
Hiding `new` means a private constructor together with a static factory, or a private `operator new`. The factory returns a pointer or a smart pointer.
:::
:::hint
`Clone` returns a new repository. If it returns by value, the copy constructor runs. A move, or returning a pointer, is the efficient version the line asks for.
:::
:::solution
a. `APP** apps_repo_arr_;` or `std::vector<std::unique_ptr<APP>>`. The static type is a pointer to the base class.

b. Allocate `n_pay_app + n_play_app` slots. The first `n_pay_app` slots hold `new PAY_APP`. The remaining slots hold `new PLAY_APP`.

c. Make every constructor private, and publish `static MY_APPS_REPO* create(...)`. The private constructor stops client code outside the class from writing `new MY_APPS_REPO`. The client obtains an instance by calling `create`.

d. `Clone` must move the pointer array into a new repository, or deep-copy it there. If `Clone` returns by value, the argument of `test_apps_repo` is a temporary, and the repository's move constructor takes ownership of the pointer array. `APP` needs a virtual destructor so that destroying the repository applies `delete` to the real application objects. Implement `Clone` and the constructor or move operation this call uses.
:::
:::

:::problem id=exam-19b-q1 title="Overload resolution and the dynamic type" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
`TESTER` declares three overloads, `test(APP*)`, `test(PAY_APP*)`, and `test(PLAY_APP*)`. Each of them is virtual on the base class. The call `tester->test(app)`, where `app` has static type `APP*`, binds the `APP*` overload at compile time. Overload resolution reads the static type of the argument. Draw the memory of the run up to the comment, and explain why a `PAY_APP` object still reaches `test(APP*)`.

:::hint
Overload resolution reads the static type of the argument. Virtual dispatch then reads the dynamic type of the receiver, the object on which the method is called. The receiver's dynamic type selects the override of the signature that overload resolution already chose.
:::
:::hint
The visitor pattern is what lets the dynamic type of the argument take part. A single set of overloads resolves the argument from its static type.
:::
:::hint
The memory diagram still needs a vptr when any function of the object is virtual.
:::
:::solution
`test(app)`, with `app` declared as `APP*`, selects `TESTER::test(APP*)` at compile time, including when `app` points at a `PAY_APP`. Declaring the three overloads `virtual` selects the tester's override of that exact signature. The signature itself was fixed from the static type of `app`. Dispatch that follows the application's dynamic type needs a virtual `accept` on `APP`, which is the visitor, or a chain of `dynamic_cast`. The lecture presents the `dynamic_cast` chain as the weaker of those two tools. The memory picture contains the tester object and the application object. Each has a vptr when it is polymorphic. The application's further fields sit in the derived part of its block, and the pointer variable sits on the stack. Callable addresses sit in the vtables. The argument stores the address of the application object.
:::
:::

:::problem id=exam-24b-q1 title="A tree under an inorder walk" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
`BinaryTree<T>` has `left` and `right`. `InorderBinaryTree` inherits from it and also implements a traversal interface. Draw the memory at the end of this fragment:

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
`t1` is one pointer on the stack. The object is on the heap, and its object layout contains a `BinaryTree` subobject plus the derived part.
:::
:::hint
`t2` is an automatic object. Its children were allocated with `new`, so those children are on the heap while `t2` itself sits in the frame.
:::
:::hint
A `BinaryTree<int>(2)` argument passed by value is embedded in the parent. A child created with `new InorderBinaryTree` is a separate block with its own vptr.
:::
:::solution
`t1` lives in the frame and holds a heap address. That heap object is an `InorderBinaryTree` whose base subobject stores the datum 2 and two child pointers. Each child is an `InorderBinaryTree` of its own on the heap, one with datum 1 and one with datum 3. The class is polymorphic through `Traversable`, so each of these three objects has a vptr.

`t2` is the whole derived object in the frame: the datum 2, a vptr, and two pointers. The children with data 1 and 3 are heap objects, and each has a vptr. The fields of `t2` belong in the frame. The fields of the children belong in their own heap blocks. The value `BinaryTree<int>(2)` that was passed as an argument was copied into the parent. Once the constructor returns, the live trees are the parent and the two children.
:::
:::

The vptr is the last hidden pointer in this object model. [Back to Java](topic:java-runtime) uses the same dispatch under a different rule: every method that is not `static` is virtual, and the garbage collector ends the object's lifetime. C++ ends that lifetime with `delete`.
