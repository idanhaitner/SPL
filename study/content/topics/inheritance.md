---
id: inheritance
title: Inheritance and polymorphism
blurb: "Relations between types, a derived object in memory, static and dynamic binding, the vtable, and double dispatch."
sources:
  - "materials/lectures/Chapter 6 - Inheritance.pptx"
  - "materials/sessions/SPL_PS3.pptx"
  - "materials/exams/15-b.pdf"
  - "materials/exams/15-b-solution.pdf"
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

Programming languages let you define different relations between the types in a program. This chapter goes through those relations, and then shows how C++ carries out inheritance and polymorphism in memory.

- **Relations between types:** is-a, is-implemented-in-terms-of, and has-a, and how Java and C++ express each one.
- **A derived object in memory:** its structure, and the order of initialization, deletion, copying, and assignment.
- **Polymorphism:** static and dynamic binding, the vtable that carries out dynamic binding, and the double-dispatch pattern.

## Relations between types

Programming languages let you state how types relate to each other. The notes distinguish three relations.

### A is-a B

A `Student` **is a** `Person`: everything true of a person is true of a student, and a student adds more.

```java
class Person { protected String _name; }                 // Java
class Student extends Person { protected Bag _bag; }
```

```cpp
class Person { protected: string _name; };               // C++
class Student : public Person { protected: Bag* _bag; };
```

### A is-implemented-in-terms-of B

`Learning` is a capability, not a kind of thing. A student **can learn**, so `Student` implements the `Learning` interface. In Java that is an interface.

```java
interface Learning { void learn(); }

class Student extends Person implements Learning {
    public void learn() { ... }
}
```

C++ has no separate syntax for interfaces. Instead, a class can inherit from several classes, and an interface is written as an **abstract class**: only method declarations, each `= 0`, with no bodies and no fields.

```cpp
class Learning {
    virtual void learn() = 0;
};

class Student : public Person, public Learning {
    void learn() { ... }
};
```

C++ does not stop you from mixing the two relations, so keep a convention:

- **the first base class** is the is-a relation (`Person`),
- **every other base class** is an abstract class that plays the role of an interface (`Learning`).

### A has-a B

A `Student` **has a** `Bag`. That is not inheritance at all, but **composition**: a field of type `Bag` (or `Bag*`) inside `Student`, in both languages.

## Derived classes in C++

A derived class (מחלקה נגזרת) extends a base class (מחלקת בסיס).

- **What a derived class can do:** add its own fields, and override (replace) a virtual function (פונקציה וירטואלית) of the base.
- **The challenge:** a call through a base pointer must find the override that belongs to the actual object, which is known only at run time.
- **How C++ solves it:** each such object stores a hidden pointer, the vptr, which points at its class's table of functions, the vtable.
- **The condition for safety:** substituting a derived object is correct only if the derived class still keeps the base class's contract.

A derived class names its base after a colon, and calls a base constructor from its member-initializer list.

```cpp
class BlurFilter : public Filter {
    double _str;
public:
    BlurFilter(double strength) : Filter("blur"), _str(strength) {}
    double getStrength() const { return _str; }
};

```

- **The base is built first:** the derived constructor calls a base constructor in its initializer list, here `Filter("blur")`.
- **If you leave that call out,** the compiler calls the base class's default constructor, and the code does not compile if the base has none.

### Access levels and inheritance in C++

The word after the colon, here `public`, sets how the base class's members can be reached through the derived class.

| Kind of inheritance | A public member of the base becomes | A protected member of the base becomes | A private member of the base |
| --- | --- | --- | --- |
| `public` | `public` (an "is-a" relationship) | `protected` | inaccessible |
| `protected` | `protected` | `protected` | inaccessible |
| `private` | `private` (used like composition: "implemented in terms of") | `private` | inaccessible |

## The Liskov substitution principle

:::definition id=def-lsp title="The Liskov substitution principle" source="materials/lectures/Chapter 6 - Inheritance.pptx"
The Liskov substitution principle says that an object of a derived class must be substitutable in every context that expects an object of the base class.

- **The program must stay correct** when a derived object replaces a base object.
- **Whatever is always true of a base object** must still be true of the derived object.
:::

The classic example that breaks the principle is deriving `Square` from `Rectangle`.

- **For a rectangle,** `setWidth(w)` changes the width and leaves the height as it is.
- **For a square,** the same call must also change the height, or it would stop being a square.
- **The result:** code written for a `Rectangle` that sets the width and expects the height to stay the same breaks when it receives a `Square`. The override does something the base class's contract does not allow.

## A derived object in memory

**Structure.** A derived object is laid out as its base classes, in the order they are listed, followed by its own fields. Each base is laid out the same way, recursively.

```cpp
class Student : public Person, public Learning { Bag* _bag; ... };
```

| Part of a `Student` | Cells |
| --- | --- |
| `Person` | `_id`, `_name` |
| `Learning` | (no fields) |
| `Student` | `_bag`, `_books`, `_univ` |

**Order of construction and destruction.** The easiest way to see the order is a class that prints.

```cpp
struct A { A() { cout << "A "; }  ~A() { cout << "~A "; } };
struct B { B() { cout << "B "; }  ~B() { cout << "~B "; } };
struct C : public A, public B {
    C()  { cout << "C "; }
    ~C() { cout << "~C "; }
};

{ C c; }    // prints: A B C ~C ~B ~A
```

- **Construction** goes base by base, in the order listed, then the derived class.
- **Destruction** goes in exactly the reverse order.

**Choosing a base constructor.** By default each base is built with its empty constructor. To pass it arguments, name it in the initializer list.

```cpp
Student(int id, const string& name, Bag* bag)
    : Person(id, name), _bag(bag) { }
```

**Copying.** The same applies to the copy constructor: unless you name the base's copy constructor, the base is built with its *empty* constructor, and the `Person` part of the copy is lost.

```cpp
Student(const Student& other)
    : Person(other),                    // copy the Person part
      _bag(other._bag->clone()) { }     // then the Student part
```

**Assigning.** The assignment operator is different: the compiler does **not** call the base's assignment for you. You must call it yourself, inside the body.

```cpp
Student& operator=(const Student& other) {
    if (this != &other) {
        Person::operator=(other);       // assign the Person part
        delete _bag;
        _bag = other._bag->clone();     // then the Student part
    }
    return *this;
}
```

For the rule of five, the move versions pass `std::move(other)` to the base, so the base receives an rvalue too.

**The destructor must be `virtual`.**

```cpp
Person* p = new Student(...);
delete p;
```

Without `virtual`, `delete p` looks only at the type `Person*`, runs `~Person`, and never runs `~Student`, so the student's bag is leaked. The next section explains what `virtual` does.

## Polymorphism in memory

Remember that the program's code is loaded when the process is initialized, by the operating system, into the process's memory, in the region called the code section. In particular, each function is stored at some address in memory. A call to a function is translated into setting the program counter to the address where the function's code starts. That translation, from a call to a function to setting the `pc` to its address, is called **binding**.

When is binding done?

- **Option A:** at compile time. This is **static binding**.
- **Option B:** at run time. This is **dynamic binding**.

In Java, binding is always dynamic, at run time. In C++, programmers decide, for each function, whether calls to it are translated statically (at compile time) or dynamically (at run time). The default is compile time.

Why would you want the translation to happen only at run time?

```cpp
class A { void F() { cout << "A"; } };          // F's code is at address 1000
class B : public A { void F() { cout << "B"; } };  // F's code is at address 2000

A* a = new B();
a->F();
```

- **With static binding,** the compiler sees only the declared type of `a`, which is `A*`, and translates the call into `pc = 1000`. It prints `A`, although the object is a `B`.
- **With dynamic binding,** the compiler cannot write a fixed address. It writes a small formula that finds the address at run time, from the object itself, so the call prints `B`.

To support polymorphism, the binding of the function must be dynamic. How do you tell the C++ compiler? The keyword `virtual` marks the requirement that calls to the function be translated only at run time.

- **The `virtual` property of a function is inherited.**
- **Now it is clear why abstract functions must be virtual:** you cannot ask the compiler to translate calls to them at compile time, because they have no implementation.

:::definition id=def-virtual title="Virtual function and vtable" source="materials/lectures/Chapter 6 - Inheritance.pptx"
A function that is not virtual is selected by **static binding** (קשירה סטטית).

- **How it works:** the compiler looks at the declared (static) type of the pointer or reference, and fixes which function to call at compile time.

A function declared `virtual` is selected by **dynamic binding** (קשירה דינמית), also called late binding.

- **How it works:** the function is chosen at run time, from the dynamic type, which is the actual class of the object.
- **What the call does:** it reads the object's vptr, looks up the function's address in that class's vtable, and calls it with the object's address as `this`.
- **A polymorphic class** is one with at least one virtual function. The compiler puts a hidden vptr in every object of such a class.
- **The vptr** points at the vtable of the object's own class. There is one vtable per class, shared by all its objects.
:::

:::problem id=worked-virtual-call title="Tracing a virtual call" source="materials/lectures/Chapter 6 - Inheritance.pptx" kind=worked solution_origin=source
Which method runs when `apply` is declared `virtual`, and which method runs when it is not?

```cpp
Filter* filter = new BlurFilter();
filter->apply(img);

```

:::solution

- **When `apply` is `virtual`:** the call uses dynamic binding. The object's vptr leads to the vtable of `BlurFilter`, so the call runs `BlurFilter::apply`.
- **When `apply` is not `virtual`:** the call uses static binding. The pointer's declared type is `Filter*`, so the call runs `Filter::apply`, even though the object is a `BlurFilter`.
:::
:::

![A BlurFilter object holds a vptr. The call follows it to the class vtable and finds BlurFilter::apply](../../web/public/figures/vtable-call.svg)

A pure virtual function is declared with `= 0`, and has no implementation in the base class.

- **An abstract class** (מחלקה מופשטת) is a class with at least one pure virtual function.
- **You cannot create objects of an abstract class.** You can only create objects of derived classes that override every pure virtual function.

### How dynamic binding is carried out

Take this pair of classes.

```cpp
class Person {
    virtual void live() { ... }     // code at address 7000
    virtual void love() { ... }     // code at address 4000
};

class Student : public Person {
    virtual void live() { ... }     // overrides: code at address 8000
    virtual void learn() { ... }    // new: code at address 9000
};
```

**The tables.** For every class that has a virtual method, the compiler builds a table in memory with the addresses of that class's virtual methods, in a fixed order. It is called the **v-table**.

```text
Person v-table, at address 100: [7000, 4000]
Student v-table, at address 200: [8000, 4000, 9000]

```

Read the `Student` table as: entry 0 (`live`) is `Student`'s own version, entry 1 (`love`) is inherited from `Person`, so it is the same address, 4000, and entry 2 (`learn`) is new. Every class keeps the same order for the methods they share, so `live` is always entry 0.

**The extra cell.** Every object of a class with a v-table gets one more cell, at its start, holding the address of its class's table. `new` (or `push`, on the stack) fills it in when the object is created, according to the object's real class.

| Cell of a `Student` | Content |
| --- | --- |
| first | 200, the address of `Student`'s v-table |
| then | the `Person` fields, then the `Student` fields |

**The call.** Now the compiler can write a formula instead of a fixed address.

```cpp
Person* p = new Student(...);
p->live();      // pc = (*((*p) + 0))
```

1. **`*p`:** read the object's first cell, the table's address: 200.
2. **`+ 0`:** `live` is entry 0 of every table in this hierarchy.
3. **`*(...)`:** read that entry: 8000, so `Student::live` runs.

If `p` pointed at a plain `Person`, step 1 would read 100, and step 3 would read 7000.

Dynamic binding has two costs.

- **Memory:** the virtual tables, and one more cell in every object.
- **Time:** two more memory accesses on every call to a virtual method.

### The virtual destructor

:::theorem id=thm-virtual-dtor title="A polymorphic base needs a virtual destructor" source="materials/lectures/Chapter 6 - Inheritance.pptx"
If a class has virtual functions, it is meant to be used as a polymorphic base class, and its destructor must be declared `virtual`.

:::proof
- **The setup:** `Base* p = new Derived();` followed by `delete p;`. The destructor call follows the same binding rules as any other call.
- **If the destructor is not virtual,** static binding picks `~Base` from the pointer's type, and only `~Base` runs.
- **The consequence:** `~Derived` never runs, so whatever the derived class acquired is leaked. Formally, the behavior is undefined.
:::
:::

:::check id=chk-virtual-dtor
You are about to `delete` a `BlurFilter` through a `Filter*`. What must be true of `~Filter`?

- [ ] It must be pure virtual and have no body
- [x] It must be virtual
- [ ] It must be private

- **What must happen:** `~BlurFilter` has to run, followed by `~Filter`.
- **How to make it happen:** declare `~Filter` virtual. The `delete` then dispatches through the vptr and reaches `~BlurFilter` first.
:::

### Copying through a base pointer: clone

[The rule of three](topic:rule-of-three) copied a student's bag with `new Bag(*other._bag)`. Once `Bag` has derived classes, that is no longer enough.

- **The problem:** `_bag` has the type `Bag*`, but the object may really be a `Bag7`, or some other kind of bag the `Student` class does not know. `new Bag(*other._bag)` always builds a plain `Bag`, and loses whatever the `Bag7` added.
- **The fix:** each class copies itself, through a `virtual` method.

```cpp
class Bag7 : public Bag {
    virtual Bag* clone() { return new Bag7(*this); }
};

_bag = other._bag->clone();     // a copy of the object's real class
```

`clone` is virtual, so dynamic binding reaches the version of the object's real class, which knows how to copy all of its fields.

## The double-dispatch design pattern

The memory chapters end with a design pattern that pushes polymorphism one step further.

**The setup.** There are two hierarchies, and the right code depends on the real class of **both** objects.

```cpp
class Printer { virtual void print(const Doc& doc) = 0; };
class HP    : public Printer { ... };
class Xerox : public Printer { ... };

class Doc { ... };
class PDF  : public Doc { ... };
class Word : public Doc { ... };
```

```cpp
Printer* hp = new HP();
Doc* pdf = new PDF();
hp->print(*pdf);      // should run the HP-PDF code
```

`print` is virtual, so the call reaches `HP::print`. That is one dispatch, on the printer. But inside `HP::print`, the parameter is just a `Doc`. How does it know it got a PDF?

**Attempt 1: check the type by hand.**

```cpp
void HP::print(const Doc& doc) {
    if (dynamic_cast<const PDF*>(&doc))  { /* HP-PDF code */ }
    if (dynamic_cast<const Word*>(&doc)) { /* HP-Word code */ }
}
```

It works, but every new kind of document means editing every printer's `print`, recompiling, and testing again.

**Attempt 2: one overload per document.**

```cpp
class Printer {
    virtual void print(const Doc& doc) = 0;
    virtual void print(const PDF& pdf) = 0;
    virtual void print(const Word& word) = 0;
};
```

Now a new document means adding a method, not editing existing code. But `hp->print(*pdf)` still runs `print(const Doc&)`:

- **Which class's method runs** is decided at run time, through the vtable. That part works.
- **Which overload runs** is decided at compile time, from the declared type of the argument. `*pdf` is declared `Doc`, so the compiler picks `print(const Doc&)`.

**The solution: dispatch a second time, on the document.** Let the document call the printer back, at a point where its own type is known exactly.

```cpp
class Doc {
    virtual void printMe(const Printer& printer) = 0;
};

class PDF : public Doc {
    void printMe(const Printer& printer) { printer.print(*this); }
};
```

```cpp
void HP::print(const Doc& doc)  { doc.printMe(*this); }   // bounce back
void HP::print(const PDF& pdf)  { /* HP-PDF code */ }
void HP::print(const Word& w)   { /* HP-Word code */ }
```

Follow `hp->print(*pdf)`:

1. **Dispatch on the printer:** `print` is virtual, so it reaches `HP::print(const Doc&)`.
2. **Dispatch on the document:** `doc.printMe(*this)` is virtual, so it reaches `PDF::printMe`.
3. **The right overload:** inside `PDF::printMe`, `*this` is declared `PDF`, so the compiler picks `print(const PDF&)`. It runs on the HP printer, so it is the HP-PDF code.

:::check id=chk-double-dispatch
In the overload-only version, `Doc* pdf = new PDF();` and `hp->print(*pdf)` runs. Which `print` is called?

- [ ] `HP::print(const PDF&)`
- [x] `HP::print(const Doc&)`
- [ ] `Printer::print(const PDF&)`

- **The printer is chosen at run time:** `print` is virtual, so the call reaches `HP`.
- **The overload is chosen at compile time:** `*pdf` has the declared type `Doc`, so the compiler picks the signature that takes a `Doc`.
- **Double dispatch fixes it** by calling `doc.printMe(*this)`, where the document's own `*this` has the exact type.
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

Deleting a derived object through a base pointer whose destructor is not virtual is undefined behavior. The standard does not promise anything about what happens.
:::

:::check id=ps3-virtual-destructor-q2
Which of these hold in a typical implementation of that `delete`?

- [x] The derived destructor is skipped, so resources the derived class owns are leaked
- [ ] The derived destructor still runs
- [x] The deallocation may use the size of the base subobject

- **In practice,** compilers usually run only `~Base`, so whatever the derived class owns is leaked.
- **Memory may also be freed incorrectly,** because the deallocation can use the size of the base part rather than of the whole object.
:::

:::check id=ps3-virtual-destructor-q3
If a class is meant to be inherited from, give it a {{=virtual|non-virtual|private}} destructor.

- **The rule:** a class that is meant to be inherited from should have a virtual destructor.
- **In particular,** any class with a virtual function is polymorphic, so it must have one.
:::

:::check id=ps3-virtual-destructor-q4
Which claim matches the rest of that rule?

- [x] A pure virtual function, written `= 0`, makes the base an abstract class, and the virtual destructor remains a requirement of its own
- [ ] Constructors are virtual, so the base constructor dispatches to the derived constructor
- [ ] A pure virtual function removes the need for a virtual destructor

- **Constructors cannot be virtual.** When an object is being built, its exact type is already known.
- **A pure virtual function** (`= 0`) makes the base abstract, but that does not make its destructor virtual.
- **So the virtual destructor is still required** and must be declared separately.
:::
:::

:::examnote
- **What the question looks like:** two derived types are used through one base pointer, and you must explain why a call reaches the base-class version. The cause is usually a non-virtual function, a non-virtual destructor, or an overload written where an override was needed.
- **The usual traps:** a memory diagram that leaves out the vptr, or a `delete` through the base pointer that never runs the derived destructor.
:::

:::problem id=exam-16a-q2 title="A visitor for shapes" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
A game engine has shapes (`SPHERE` and `BOX`, both derived from `SHAPE`) that are drawn by shaders (`BASIC_SHADER` and `COMPLEX_SHADER`, both derived from `SHADER`).

- **Each shader** has two overloads, `Render(SPHERE*)` and `Render(BOX*)`.
- **`RENDER_MGR::Render`** goes over every pair of shape and shader.
- **The problem:** overloads are chosen at compile time, so calling `Render` with a `SHAPE*` cannot pick `Render(SPHERE*)`. The fix is the visitor pattern, also called double dispatch.

:::check id=exam-16a-q2-q1
Which `Sphere::Accept` body is correct?

- [ ] `Render(static_cast<Shape*>(this));`
- [ ] `shader->Render(static_cast<Shape*>(this));`
- [x] `sh->Render(this);`

- **The answer:** `void Accept(Shader* sh) override { sh->Render(this); }`.
- **Why it works:** inside `Sphere::Accept`, `this` has the type `Sphere*`, so the compiler picks `Render(Sphere*)`. The call on `sh` is virtual, so it reaches the right shader.
- **`Box::Accept`** is the same code, where `this` is a `Box*`.
- **Why the others fail:** casting `this` to `Shape*` throws away exactly the type information the overload needs.
:::

:::check id=exam-16a-q2-q2
`Shader::Render` and `Shape::Accept` are declared {{== 0|inline|static}}.

- **`Shader`** declares `virtual void Render(Sphere* s) = 0` and `virtual void Render(Box* b) = 0`.
- **`Shape`** declares `virtual void Accept(Shader* sh) = 0`.
- **Both bases** are therefore abstract, and each also declares a virtual destructor with `= default`.
:::

:::check id=exam-16a-q2-q3
Which of these hold?

- [x] `RENDER_MGR::Render` calls `shape->Accept(shader)` for each pair
- [ ] Copying the manager's pointer array gives the copy its own shapes and shaders
- [x] `BasicShader` and `ComplexShader` override both `Render` overloads

- **`RENDER_MGR::Render`** calls `shape->Accept(shader)` for each pair, which starts the double dispatch.
- **`BasicShader` and `ComplexShader`** each override both `Render` overloads.
- **Copying the array of pointers is a bug,** because both managers would then share the same shapes and shaders. A correct copy constructor allocates new ones.
:::

:::check id=exam-16a-q2-q4
Which copy of `RENDER_MGR` is correct?

- [x] The copy constructor allocates new shapes and new shaders. A virtual `clone()` is that deep copy when the hierarchy provides one
- [ ] The copy constructor copies the pointer values, so the two managers share the objects
- [ ] The copy constructor allocates new shaders and keeps the original shapes

- **The correct copy constructor** allocates new shapes and new shaders, so the copy owns its own objects.
- **How to copy a shape you only know through a base pointer:** call a virtual `clone()`, which each derived class overrides to return a copy of its own real type.
:::
:::

:::problem id=exam-18a-q1 title="An image destructor" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
`Image` is an abstract base class with a field `int n_pixels` and a pure virtual function `virtual void show() = 0`. `ColorImage` inherits from it and holds a heap array of pixels.

- **In one place,** a `ColorImage` is destroyed through an `Image*`.
- **In another,** a `ColorImage` is passed by value.

:::check id=exam-18a-q1-q1
What does `delete` through an `Image*` do when the destructor is not virtual?

- [ ] `~ColorImage` runs and releases the pixel array
- [x] `~Image` runs alone, so `~ColorImage` never releases the pixel array
- [ ] There is no leak, because `show` is already virtual

- **What runs:** with a non-virtual destructor, `delete` through an `Image*` uses static binding, so only `~Image` runs.
- **The result:** `~ColorImage` never runs, so the pixel array is never released, which is a leak.
- **Why the third option is wrong:** `show` being virtual does not make the destructor virtual. Each function is virtual only if it is declared so.
:::

:::check id=exam-18a-q1-q2
The declaration that makes `delete` dispatch to `~ColorImage` is {{=virtual ~Image() = default|~Image() = default|virtual ~ColorImage() = default}}.

The destructor that must be virtual is the base class's, because `delete` looks it up through the `Image*`. Declaring `virtual ~Image() = default` makes the `delete` dispatch to `~ColorImage`.
:::

:::check id=exam-18a-q1-q3
Which of these hold when `ColorImage` owns a raw array?

- [x] `~ColorImage` must apply `delete[]` to the array
- [x] The copy constructor and the assignment operator must copy the array deeply
- [ ] A virtual `~Image` releases the pixel array by itself

- **`~ColorImage`** must release its raw array with `delete[]`. A virtual `~Image` only makes sure `~ColorImage` runs; it releases nothing by itself.
- **The copy constructor and the assignment operator** must make a deep copy of the array, which is the rule of three.
:::

:::check id=exam-18a-q1-q4
Which of these hold for the other repairs?

- [x] Declaring the variable in `main` with the dynamic type fixes that one line. The next `delete` through an `Image*` is still wrong
- [ ] That change of `main` makes every later `delete` through an `Image*` run `~ColorImage`
- [x] The copy the compiler generates shares the array, and each of the two destructors releases that same array

- **Changing `main`:** declaring the variable as a `ColorImage*` fixes that one line only. Any other `delete` through an `Image*` is still wrong, so the real fix is the virtual destructor.
- **The by-value call:** the compiler-generated copy shares the pixel array, so both destructors release the same array, which is a double free.
:::
:::

:::problem id=exam-18b-q1 title="Memory of an image hierarchy" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
`Image` is an abstract base class with a field `int n_pixels` and a pure virtual function `virtual void show() = 0`. `GrayImage` and `ColorImage` inherit from it. They store different pixel types, and each holds its own pixel array on the heap. The questions ask about memory during a call to `show`, and about `dynamic_cast`.

:::check id=exam-18b-q1-q1
Which description of the layout is right during that call?

- [ ] The stack frame holds the pixel buffer. The heap object starts with `n_pixels` and has no vptr
- [x] The heap object begins with the vptr, then `n_pixels`, then the derived class's pointer to the pixel buffer. The buffer is a further block on the heap
- [ ] The vptr and the pixel array both sit in the stack frame, next to the return address

- **The image object on the heap** starts with the vptr, then the base field `n_pixels`, then the derived class's own field, a pointer to the pixel buffer.
- **The pixel buffer** is a separate block on the heap.
- **The stack frame** holds neither the buffer nor the vptr.
:::

:::check id=exam-18b-q1-q2
What does the stack hold during the call?

- [x] The pointer parameter and the return address
- [ ] The pixel buffer and the vtable
- [ ] The vptr and `n_pixels`

During the call, the stack frame holds the pointer parameter and the return address. The vptr and `n_pixels` are inside the object on the heap, and the vtable lives in the program's static data, not on the stack.
:::

:::check id=exam-18b-q1-q3
`dynamic_cast<ColorImage*>(p)` returns {{=null|the same pointer p|a new ColorImage}} when `p` does not point at a color image.

- **`dynamic_cast<ColorImage*>(p)`** checks the object's real type at run time. It returns a valid pointer if `p` points at a `ColorImage`, and null if it does not.
- **A C-style cast** performs no check. It converts the pointer regardless, so a wrong cast goes unnoticed.
:::

:::check id=exam-18b-q1-q4
Which of these hold?

- [x] A grayscale image and a color image have different vtables, so `show` through an `Image*` reaches the override
- [ ] A C-style cast consults the vtable and returns null when the type does not match
- [x] The layout is right when every polymorphic subobject shows a vptr and the pixel array is outside the stack frame

- **Different vtables:** each class has its own vtable, so `show` called through an `Image*` reaches the right override.
- **A C-style cast** never checks the type and never returns null on a mismatch. Only `dynamic_cast` does that.
- **A correct drawing** shows a vptr in every polymorphic object, and the pixel array outside the stack frame.
:::
:::

:::problem id=exam-19a-q1 title="An application repository" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
`APP` is an abstract class with `virtual void run() = 0`, and `PAY_APP` and `PLAY_APP` override it.

- **`MY_APPS_REPO`** stores both kinds of application in one array.
- **Clients must not create a repository with `new`** directly.
- **`Clone` and `test_apps_repo` are already correct,** and the question looks at the call `repo->test_apps_repo(test->Clone())`.

:::check id=exam-19a-q1-q1
Which types can hold both kinds in one collection?

- [x] `APP** apps_repo_arr_`
- [ ] An array of `APP` objects
- [x] `std::vector<std::unique_ptr<APP>>`

- **The rule:** to hold different derived types in one collection, store pointers to the base class.
- **So both `APP**` and `std::vector<std::unique_ptr<APP>>` work.**
- **Why an array of `APP` fails:** `APP` is abstract, so no `APP` object can exist. Even for a non-abstract base, storing objects by value would slice off their derived parts.
:::

:::check id=exam-19a-q1-q2
Which constructor body is correct for `MY_APPS_REPO(int n_pay_app, int n_play_app)`?

- [x] Allocate `n_pay_app + n_play_app` slots. The first `n_pay_app` slots hold `new PAY_APP`. The remaining slots hold `new PLAY_APP`
- [ ] Allocate one array of `PAY_APP` and a second array of `PLAY_APP`
- [ ] Store both kinds by value in an array of `APP`

- **The array** has `n_pay_app + n_play_app` slots of type `APP*`.
- **The first `n_pay_app` slots** hold `new PAY_APP`, and the remaining slots hold `new PLAY_APP`.
- **Why not two arrays or values:** the repository must keep both kinds in one array, which only works through base-class pointers.
:::

:::check id=exam-19a-q1-q3
Every constructor is private. A client obtains an instance by calling {{=create|new|Clone}}.

- **Private constructors** stop any code outside the class from writing `new MY_APPS_REPO`.
- **Clients use a factory instead:** the public `static MY_APPS_REPO* create(...)`, which can call the private constructors because it is a member of the class.
:::

:::check id=exam-19a-q1-q4
Which of these hold for `repo->test_apps_repo(test->Clone())`?

- [ ] `Clone` returns the original repository, so the argument is that same object
- [x] If `Clone` returns by value, the argument is a temporary and the move constructor takes ownership of the pointer array
- [x] `APP` needs a virtual destructor so that destroying the repository applies `delete` to the real application objects

- **`Clone` creates a new repository.** It deep-copies the applications into it, so the argument is not the original object.
- **If `Clone` returns by value,** the argument is a temporary, so the move constructor can take its pointer array instead of copying it.
- **`APP` needs a virtual destructor,** so that when the repository deletes its `APP*` pointers, each real `PAY_APP` or `PLAY_APP` destructor runs.
:::
:::

:::problem id=exam-19b-q1 title="Overload resolution and the dynamic type" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
`TESTER` declares three overloads, `test(APP*)`, `test(PAY_APP*)`, and `test(PLAY_APP*)`, and all three are virtual.

- **The call** is `tester->test(app)`.
- **The variable `app`** is declared as `APP*`, but the object it points at is a `PAY_APP`.

:::check id=exam-19b-q1-q1
Which signature does `tester->test(app)` select?

- [ ] `test(PAY_APP*)`, because the object is a `PAY_APP`
- [x] `TESTER::test(APP*)`, at compile time, from the static type of `app`
- [ ] `test(PLAY_APP*)`, because that overload is also virtual

Overloads are chosen at compile time, from the declared types of the arguments. `app` is declared as `APP*`, so the compiler picks `test(APP*)`, even though `app` points at a `PAY_APP`. `virtual` affects only which class's version of that signature runs, not which overload is picked.
:::

:::check id=exam-19b-q1-q2
Dispatch that follows the application's dynamic type needs a virtual {{=accept|test|run}} on `APP`, or a chain of `dynamic_cast`.

- **A virtual `accept` on `APP`** is the visitor pattern: each application calls `tester->test(this)`, where `this` already has the precise type, so the right overload is chosen.
- **A chain of `dynamic_cast`** also works, but it is weaker: every new application type means editing the chain.
:::

:::check id=exam-19b-q1-q3
Which description of the layout is right?

- [ ] The pointer variable sits on the heap, and neither object has a vptr
- [ ] Callable addresses sit in the application object, and the vtables hold the fields
- [x] Each polymorphic object has a vptr, the pointer variable sits on the stack, and the argument stores the address of the application object

- **The objects:** the picture contains the tester object and the application object, and each has a vptr because each class is polymorphic.
- **The pointer variable** is a local, so it sits on the stack. As an argument, it holds the address of the application object.
- **The function addresses** live in the vtables, not inside the objects, and the objects' fields live in the objects, not in the vtables.
:::

:::check id=exam-19b-q1-q4
Which of these hold?

- [x] The application's further fields sit in the derived part of its block
- [ ] The dynamic type of `app` changes which overload was selected at compile time
- [x] Marking the three overloads `virtual` selects the tester's override of the signature that was already chosen

- **The derived fields:** fields added by `PAY_APP` sit in the derived part of the same object, after the base part.
- **What `virtual` does here:** it chooses which tester class's version of `test(APP*)` runs, at run time.
- **What `virtual` does not do:** the signature `test(APP*)` was fixed at compile time from the declared type of `app`, and the object's real type cannot change that.
:::
:::

:::problem id=exam-24b-q1 title="A tree under an inorder walk" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
`BinaryTree<T>` has child pointers `left` and `right`. `InorderBinaryTree` inherits from it, and also implements the abstract traversal interface `Traversable`, which makes it polymorphic.

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

- **`t1` itself** is a pointer in the stack frame, holding the address of a heap object.
- **That heap object** is an `InorderBinaryTree`. Its base part stores the value 2, and it holds two child pointers.
- **Each child** is a separate `InorderBinaryTree` on the heap, one holding 1 and one holding 3.
- **All three objects** have a vptr, because the class is polymorphic through `Traversable`.
:::

:::check id=exam-24b-q1-q2
Which description of the layout of `t2` is right?

- [ ] `t2` is a pointer in the frame, and datum 2 lives on the heap
- [ ] `t2` and both children sit in the frame, and none of them has a vptr
- [x] `t2` is the whole derived object in the frame: datum 2, a vptr, and two pointers. The children with data 1 and 3 are heap objects, and each has a vptr

- **`t2` is not a pointer:** the whole object lives in the stack frame, including the value 2, a vptr, and two child pointers.
- **Its children** were created with `new`, so they are heap objects holding 1 and 3, each with its own vptr.
- **In short:** `t2`'s own fields are in the frame, and each child's fields are in that child's own heap block.
:::

:::check id=exam-24b-q1-q3
The `BinaryTree<int>(2)` argument was {{=copied into the parent|shared with the caller|left on the heap as a third child}}.

- **The argument `BinaryTree<int>(2)`** is a temporary. The constructor copies it into the parent's base part, and the temporary is then destroyed.
- **After the constructor returns,** only three trees remain: the parent and its two children.
:::

:::check id=exam-24b-q1-q4
Which of these hold?

- [x] Each of the three objects reachable from `t1` has a vptr, because the class is polymorphic through `Traversable`
- [ ] The children of `t2` are embedded in the frame and have no vptr
- [x] The fields of those children belong in their own heap blocks

- **Every object reachable from `t1`** has a vptr, because the class is polymorphic through `Traversable`.
- **The children of `t2`** were created with `new`, so they are on the heap, not in the frame, and they too have a vptr.
- **Each child's fields** are in its own heap block.
:::
:::

:::problem id=exam-15b-q2 title="A vector that grows" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
The class `mvector` stores its elements in a dynamic array of `node*`.

- **Growing:** when `insertAt` goes past the current size, it grows the array to the smallest power of 2 that is greater than `pos`.
- **Shrinking:** `removeAt` halves the array when its entire upper half is unused.
- **Copying nodes:** `node` is polymorphic, and has a pure virtual method `duplicate()` that returns a copy of the real object.

```cpp
void foo(mvector vec) {
    mvector my_vec(vec);
    // ***** here *****
}
void main() {
    mvector vec;
    node* n = new my_node("test");
    vec.insertAt(*n, 3);
    foo(vec);
}

```

At the end of `main`, the code adds the line `my_node* m = (my_node*)(vec.getAt(0));`.

:::check id=exam-15b-q2-q1
Which copy constructor is correct?

```cpp
// A
node* buf = new node[n];
for (int i = 0; i < n; ++i)
    buf[i] = *src[i];
```

```cpp
// B
node** buf = src;
```

```cpp
// C
node** buf = new node*[n];
for (int i = 0; i < n; ++i)
    buf[i] = src[i]->duplicate();
```

- [ ] A. Copying a `node` by value keeps the derived part.
- [ ] B. The copy stores the source array pointer and allocates no new array.
- [x] C. Allocate a new array on the heap and copy every node by calling `duplicate()`.

- **The copy constructor** allocates a new array of the right size on the heap, and copies every node into it.
- **Why `duplicate()`:** `node` is polymorphic, so only a virtual function knows the real type of each node and can copy it correctly.
- **Why A fails:** copying a `node` by value keeps only the base part and drops the derived part, which is called object slicing. Since `node` is abstract, `new node[n]` does not even compile.
- **Why B fails:** it shares the source's array instead of copying it.
:::

:::check id=exam-15b-q2-q2
Which description of the stack and the heap is right at the marked line?

- [ ] `my_vec` is another name for `vec` in `main`, so one vector object sits on the heap.
- [x] Three vectors sit on the stack: `vec` in `main`, the parameter `vec` in `foo`, and `my_vec`. After a deep copy, each has its own array on the heap, and `my_node` has a vtable.
- [ ] The three vectors share one array in `foo`'s frame, and `my_node` has no vtable.

- **There are three vector objects on the stack:** `vec` in `main`'s frame, the parameter `vec` in `foo`'s frame (passing by value made a copy), and the local `my_vec`, also in `foo`'s frame.
- **With a deep copy,** each of the three has its own array on the heap.
- **`my_node` has a vtable,** because it inherits virtual functions from `node`.
:::

:::check id=exam-15b-q2-q3
`getAt` returns `node*`, and the added line is a C-style cast. Which statement is correct?

- [ ] 1. Downcasting is forbidden in C++.
- [ ] 2. A C-style cast is checked only at compile time.
- [ ] 3. A downcast is safe only when there are no virtual methods.
- [x] 4. Virtual methods are bound at run time (dynamic binding).
- [ ] 5. None of the answers is correct.

- **The answer:** statement 4 is correct. A virtual call is resolved at run time, from the real object on the heap.
- **Why the others are wrong:** downcasting is allowed in C++, and a C-style cast is not "checked" at all; it simply converts the pointer.
- **The safe alternative:** `dynamic_cast` performs a run-time type check.
:::
:::

- **Next:** [Threads](topic:concurrency) starts the concurrency part: several tasks running at once inside one process.
