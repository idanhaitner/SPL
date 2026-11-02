---
id: inheritance
title: Inheritance and polymorphism
blurb: "Relations between types, a derived object in memory, static and dynamic binding, the vtable, and double dispatch."
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

:::problem id=prac-inh-order title="The order of construction" source="materials/lectures/Chapter 6 - Inheritance.pptx" kind=exercise solution_origin=derived
Each class prints when it is built and when it is destroyed.

```cpp
struct Person {
    Person()  { cout << "P "; }
    ~Person() { cout << "~P "; }
};

struct Learning {
    Learning()  { cout << "L "; }
    ~Learning() { cout << "~L "; }
};

struct Student : public Person, public Learning {
    Student()  { cout << "S "; }
    ~Student() { cout << "~S "; }
};
```

:::check id=prac-inh-order-q1
The block `{ Student s; }` prints {{=P L S ~S ~L ~P|S L P ~P ~L ~S|P L S ~P ~L ~S}}.

- **Construction** builds the bases first, in the order they are listed after the colon, `Person` then `Learning`, and the `Student` part last.
- **Destruction** runs in exactly the reverse order, so `~S` comes first and `~P` last.
:::

:::check id=prac-inh-order-q2
If the declaration were `struct Student : public Learning, public Person`, the same block would print {{=L P S ~S ~P ~L|P L S ~S ~L ~P|L P S ~L ~P ~S}}.

The order of the bases comes from the declaration, so swapping them swaps `L` and `P`. Destruction is still the exact reverse of construction.
:::

:::check id=prac-inh-order-q3
Now `Person` has fields, and `Student`'s copy constructor does not mention `Person`.

```cpp
class Person {
protected:
    int _id;
    std::string _name;
public:
    Person() : _id(0), _name("nobody") { }
    Person(int id, const std::string& name) : _id(id), _name(name) { }
};

class Student : public Person {
    Bag* _bag;
public:
    Student(int id, const std::string& name, Bag* bag)
        : Person(id, name), _bag(bag) { }
    Student(const Student& other)
        : _bag(other._bag->clone()) { }      // no Person(...) here
};
```

`ringo` was built as `Student(7, "ringo", new Bag(7))`. What is the `Person` part of `Student copy(ringo);`?

- [ ] `_id` is 7 and `_name` is `"ringo"`
- [x] `_id` is 0 and `_name` is `"nobody"`
- [ ] The class does not compile

- **A base that the initializer list does not name** is built with its empty constructor, so the copy gets `Person()`'s values, and `ringo`'s id and name are lost.
- **The fix** names the base's copy constructor first: `: Person(other), _bag(other._bag->clone())`.
:::
:::

:::problem id=prac-inh-binding title="Static or dynamic binding?" source="materials/lectures/Chapter 6 - Inheritance.pptx" kind=exercise solution_origin=derived
`name` is an ordinary method. `draw` is virtual.

```cpp
class Shape {
public:
    void name()         { cout << "shape "; }
    virtual void draw() { cout << "Shape::draw "; }
    virtual ~Shape() { }
};

class Circle : public Shape {
public:
    void name() { cout << "circle "; }
    void draw() { cout << "Circle::draw "; }
};

Shape* s = new Circle();
Circle* c = new Circle();
```

:::check id=prac-inh-binding-q1
`s->name();` prints {{=shape|circle}}. `s->draw();` prints {{=Circle::draw|Shape::draw}}. `c->name();` prints {{=circle|shape}}.

- **`s->name()` uses static binding,** because `name` is not virtual. The compiler sees only the declared type, `Shape*`, so it calls `Shape::name`, although the object is a `Circle`.
- **`s->draw()` uses dynamic binding,** because `draw` is virtual. The call follows the object's vptr to `Circle`'s vtable, and runs `Circle::draw`.
- **`c->name()`** is declared `Circle*`, so static binding picks `Circle::name`.
:::

:::check id=prac-inh-binding-q2
Which of these are true?

- [x] There is one vtable for `Circle`, shared by every `Circle` object
- [x] Each `Circle` object holds a vptr that points at that table
- [ ] The vtable has an entry for `name`
- [x] `Circle::draw` is virtual, even though `Circle` does not write the word `virtual`

- **One table per class,** and one hidden vptr in each object, in its first cell.
- **Only virtual methods** get entries in the vtable. `name` is bound at compile time, so it needs none.
- **The `virtual` property is inherited:** `Circle::draw` overrides a virtual method, so it is virtual too.
:::

:::check id=prac-inh-binding-q3
`delete s;` runs {{=~Circle and then ~Shape|only ~Shape|only ~Circle}}.

`~Shape` is virtual, so the `delete` uses dynamic binding and reaches `~Circle` first. As with any derived object, the `Shape` part is destroyed after the `Circle` part.
:::
:::

:::problem id=prac-inh-vtable title="Reading a v-table" source="materials/lectures/Chapter 6 - Inheritance.pptx" kind=exercise solution_origin=derived
The comments give the address where each method's code starts. `Animal`'s v-table is at address 100, and `Dog`'s is at address 200.

```cpp
class Animal {
public:
    virtual void eat()   { ... }   // at 3000
    virtual void sleep() { ... }   // at 3100
};

class Dog : public Animal {
public:
    virtual void eat()   { ... }   // overrides, at 5000
    virtual void bark()  { ... }   // new, at 5100
};
```

:::check id=prac-inh-vtable-q1
`Animal`'s v-table is `[3000, 3100]`. In `Dog`'s v-table, entry 0 holds {{=5000|3000|5100}}, entry 1 holds {{=3100|5100|5000}}, and entry 2 holds {{=5100|3100|3000}}.

- **Entry 0, `eat`:** `Dog` overrides it, so the entry holds `Dog`'s own code, 5000.
- **Entry 1, `sleep`:** `Dog` inherits it, so the entry holds the same address as in `Animal`'s table, 3100.
- **Entry 2, `bark`:** a new virtual method goes after the inherited ones, 5100.
:::

:::check id=prac-inh-vtable-q2
The code runs `Animal* a = new Dog();` and then `a->sleep();`. The object's first cell holds {{=200|100|5000}}. The call reads entry {{=1|0|2}} of that table, and runs the code at address {{=3100|5100|3000}}.

- **The first cell** is the vptr. `new Dog()` filled it with the address of `Dog`'s table, 200, whatever the pointer's declared type is.
- **`sleep` is entry 1** in every table of this hierarchy, so the call reads entry 1 of table 200, which holds 3100: `Animal::sleep`, inherited by `Dog`.
:::

:::check id=prac-inh-vtable-q3
What does `a->bark();` do?

- [ ] It runs `Dog::bark`, through entry 2 of `Dog`'s table
- [x] It does not compile
- [ ] It runs `Animal::sleep`

- **The compiler checks every call against the declared type.** `a` is an `Animal*`, and `Animal` has no `bark`, so the call is rejected before the program runs.
- **To call `bark`,** the code needs a `Dog*`, for example from `dynamic_cast<Dog*>(a)`.
:::
:::

:::problem id=prac-inh-clone title="Copying a bag through its base" source="materials/lectures/Chapter 6 - Inheritance.pptx" kind=exercise solution_origin=derived
`Bag7` is a bag with a combination lock. The code only knows it through a `Bag*`.

```cpp
class Bag {
public:
    virtual Bag* clone() { return new Bag(*this); }
    virtual ~Bag() { }
};

class Bag7 : public Bag {
    int _code;    // the combination of the lock
public:
    Bag7(int code) : _code(code) { }
    virtual Bag* clone() { return new Bag7(*this); }
};

Bag* b = new Bag7(1234);
```

:::check id=prac-inh-clone-q1
What is the real class of the object that `new Bag(*b)` creates?

- [x] A plain `Bag`, without `_code`
- [ ] A `Bag7`, with `_code` copied
- [ ] It does not compile

- **`new Bag(...)`** always runs `Bag`'s copy constructor, which copies only the `Bag` part of `*b`.
- **The lock is lost.** The new object is a plain `Bag`, whatever the real class of `*b` was.
:::

:::check id=prac-inh-clone-q2
What is the real class of the object that `b->clone()` returns?

- [ ] A plain `Bag`, because `b` is declared `Bag*`
- [x] A `Bag7`, with `_code` copied
- [ ] It depends on the order of the fields

- **`clone` is virtual,** so the call follows `*b`'s vptr to `Bag7`'s table and runs `Bag7::clone`.
- **`Bag7::clone`** runs `new Bag7(*this)`, the copy constructor of the real class, which copies `_code` too.
:::

:::check id=prac-inh-clone-q3
If `Bag7` did not write its own `clone`, `b->clone()` would run {{=Bag::clone|Bag7::clone}} and return {{=a plain Bag|a Bag7}}. If `clone` in `Bag` were not virtual, `b->clone()` would run {{=Bag::clone|Bag7::clone}}.

- **Without an override,** `Bag7`'s vtable entry for `clone` holds `Bag::clone`, which builds a plain `Bag`.
- **Without `virtual`,** the call uses static binding on the declared type `Bag*`, so it runs `Bag::clone` even when `Bag7` writes its own.
- **So `clone` works only when** it is virtual in the base, and every derived class overrides it.
:::
:::

:::examnote
- **What the question looks like:** two derived types are used through one base pointer, and you must explain why a call reaches the base-class version. The cause is usually a non-virtual function, a non-virtual destructor, or an overload written where an override was needed.
- **The usual traps:** a memory diagram that leaves out the vptr, or a `delete` through the base pointer that never runs the derived destructor.
:::

:::problem id=exam-16a-q2 title="A visitor for shapes" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
A game engine draws shapes with shaders. There are two kinds of shape, `SPHERE` and `BOX`, both derived from `SHAPE`, and two kinds of shader, `BASIC_SHADER` and `COMPLEX_SHADER`, both derived from `SHADER`. Each shader has one `Render` overload for each kind of shape.

```cpp
class SHAPE { ... };
class SPHERE : public SHAPE { ... };
class BOX : public SHAPE { ... };

class SHADER { ... };
class BASIC_SHADER : public SHADER {
public:
    void Render(SPHERE* s) { /* draw a sphere */ }
    void Render(BOX* b)    { /* draw a box */ }
};
// COMPLEX_SHADER: the same two overloads

class RENDER_MGR {
public:
    RENDER_MGR(int n);   // n shaders, n shapes
    void Render();
private:
    SHADER** _r;         // n shaders
    SHAPE** _s;          // n shapes
    int _N;
};

void RENDER_MGR::Render() {
    for (int i = 0; i < _N; i++)
        _r[i]->Render(_s[i]);   // shader i draws shape i
}
```

- **The problem:** the compiler picks an overload by the declared type of the argument. `_s[i]` is declared `SHAPE*`, and no shader has a `Render(SHAPE*)`, so this line does not compile, even when the shape really is a `SPHERE`.
- **The fix, the visitor pattern (also called double dispatch):** every shape gets a virtual method `Accept(SHADER* sh)`, where `sh` is the shader that should draw it. The loop calls `_s[i]->Accept(_r[i])` instead.
- **The task:** write `Accept`, and make `SHAPE` and `SHADER` pure abstract.

:::check id=exam-16a-q2-q1
Which body of `SPHERE::Accept(SHADER* sh)` is correct?

- [ ] `sh->Render((SHAPE*)this);`
- [ ] `Render(this);`
- [x] `sh->Render(this);`

- **The answer:** `virtual void Accept(SHADER* sh) { sh->Render(this); }`.
- **Why it works:** the call `_s[i]->Accept(...)` is virtual, so it reaches `SPHERE::Accept`. Inside it, `this` has the type `SPHERE*`, so the compiler picks `Render(SPHERE*)`. The call on `sh` is virtual too, so it reaches the right shader.
- **`BOX::Accept`** is the same code, where `this` is a `BOX*`.
- **Casting `this` to `SHAPE*`** throws away exactly the type that the overload needs, so it fails to compile, just like the original loop.
- **`Render(this)` alone** looks for a `Render` method in `SPHERE`, and a shape has none. The shader is the one that draws.
:::

:::check id=exam-16a-q2-q2
`SHADER::Render` and `SHAPE::Accept` have no body in the base classes, so they are pure virtual: each declaration ends with {{== 0|= default|const}}.

- **`SHADER`** declares `virtual void Render(SPHERE* s) = 0` and `virtual void Render(BOX* b) = 0`.
- **`SHAPE`** declares `virtual void Accept(SHADER* sh) = 0`.
- **Both bases** are therefore abstract, and each also declares a virtual destructor with `= default`.
:::

:::check id=exam-16a-q2-q3
Which of these hold?

- [x] `SHADER` must declare both `Render` overloads `virtual`, so that `sh->Render(this)` reaches the real shader
- [ ] Copying the manager's pointer arrays gives the copy its own shapes and shaders
- [x] `BASIC_SHADER` and `COMPLEX_SHADER` override both `Render` overloads

- **`sh` is declared `SHADER*`,** so without `virtual` the call would run `SHADER::Render`, not the real shader's version.
- **`BASIC_SHADER` and `COMPLEX_SHADER`** each override both `Render` overloads.
- **Copying the arrays of pointers is a bug,** because both managers would then share the same shapes and shaders. A correct copy constructor allocates new ones.
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

- **Next:** [Threads](topic:concurrency) starts the concurrency part: several tasks running at once inside one process.
