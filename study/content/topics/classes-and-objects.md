---
id: classes-and-objects
title: Classes and objects
blurb: "How an object is laid out in memory, initialized, created through a factory, and deleted."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 3 - Classes and Objects.pptx"
  - "materials/sessions/SPL_PS3.pptx"
---

Programming languages let you define information with a given structure, an object that holds fields and methods. This chapter follows an object through its life in memory.

- **Structure:** how an object's fields are laid out in memory, on the stack or on the heap.
- **Initialization:** how an object is created, how its fields get their first values, and the factory pattern for objects that need more than a constructor.
- **Deletion:** how an object is removed from memory, and what its destructor must release.

Copying and assigning objects come in [The rule of three](topic:rule-of-three), and moving them in [The rule of five](topic:rule-of-five).

## Classes in C++

A class bundles data with the functions that work on it. Before the first class, here are the library types the examples use, compared with their Java counterparts.

- **Fundamental types:** `int`, `double`, `bool`, and `char` work as in Java.
- **`const`** marks a value that cannot change, the job `final` does in Java.
- **`std::string`** is a string you can modify. Two strings are compared by content with `==`, unlike Java, where `==` compares references.
- **`std::vector<T>`** is an array that grows as you add elements, like Java's `ArrayList`.

A class defines the memory layout of its objects and the member functions that operate on them.

- **Non-static data members:** each object gets its own copy of them.
- **Member functions:** there is only one copy of each function, shared by all the objects of the class. How one shared function knows which object to work on is explained below, under `this`.

:::definition id=def-class title="Class and struct" source="materials/lectures/Chapter 3 - Classes and Objects.pptx"
A class is a set of data members and member functions, together with access rules.

- **`class`:** its members are `private` unless you say otherwise.
- **`struct`:** its members are `public` unless you say otherwise. This default is the only difference between the two.
- **The closing semicolon:** a semicolon must end the definition, because the same statement may also declare objects, as `p1` and `p2` are declared below.

```cpp
struct Point {
    const int x, y;
    Point(int x, int y);
} p1(1, 1), p2(2, 2);

```

:::

:::trap
- **The mistake:** forgetting the semicolon after a `class` or `struct` definition is one of the most common compile errors.
- **Why the error message is confusing:** the grammar allows objects to be declared right after the closing brace, so the compiler keeps reading into the next line and reports the error there, not where the semicolon is missing.
:::

## The structure of an object in memory

When an object is defined, on the stack or on the heap, it is given memory according to its size. When the structure of the object is fixed, its inner layout is set in advance by a fixed rule, so the compiler can translate every access to a field into the exact place of that field in memory, relative to the object's address.

The usual layout is that the fields are placed one after another, each one starting in a new cell, in the order they are declared in the class. The first field starts at the object's address, the lowest one. When a field is itself an object, its inner structure is laid out recursively in the same way.

This `Student` class is the example for the rest of the memory chapters.

```cpp
class Student {
private:
    const int id;
    string name;
    Bag* bag;
    vector<Book*> books;
    const University& univ;

public:
    int getId() const { return id; }
    const string& getName() const { return name; }
    const Bag& getBag() const { return *bag; }
    const vector<Book*>& getBooks() const { return books; }
    const University& getUniv() const { return univ; }
};

{
    Student s(...);
    Student* ps = new Student(...);
}

```

- **The getters follow the rule** from [Variables, pointers, and references](topic:pointers): the simple type `id` is returned by value, and every object is returned by `const` reference.
- **`s` is defined on the stack,** so all of its fields are on the stack.
- **`ps` is a pointer on the stack,** and the `Student` it points at, with all of its fields, is on the heap.

| Field of `s` | Takes the cells | What they hold |
| --- | --- | --- |
| `id` | one cell | the number |
| `name` | two cells: `chars`, `length` | the address of the characters on the heap, and their count |
| `bag` | one cell | the address of a `Bag` on the heap |
| `books` | two cells: `lst`, `size` | the address of the vector's array on the heap, and its size |
| `univ` | one cell | the address of the `University` it is an alias for |

The `Student` on the heap that `ps` points at has exactly the same inner layout, starting at the address that `ps` holds.

## Initializing an object

As we have said several times, the compiler translates the definition of an object in memory, on the stack or on the heap, into two main operations.

- **Allocating the memory:** on the stack with `push` operations according to the object's size, and on the heap with `new`, which searches at run time for free cells that fit the object's size.
- **Running the initialization mechanism,** which makes sure that every part of the object goes through initialization, automatically.
  - First, the initialization mechanism runs on every field of the object that is itself an object (not on simple types, and not on addresses of objects).
  - Then the object's constructor runs.

A first attempt at the constructor of `Student` assigns every field in the body.

```cpp
Student(int id, const string& name, Bag* bag, const University& univ) {
    _id = id;
    _name = name;
    _bag = bag;
    _univ = univ;
    _books.push_back(new DigitalBook());
    _books.push_back(new HardCopyBook());
}

```

That attempt has two problems.

- **Inefficiency:** a field of object type is first initialized (empty), and only then assigned. It is better to initialize it once, with the assignment you need.
- **Fields that are `const`, and fields that are references,** cannot be assigned after they are defined at all.

So you state in advance how each field is initialized.

```cpp
Student(int id, const string& name, Bag* bag, const University& univ)
    : _id(id), _name(name), _bag(bag), _univ(univ)
{
    _books.push_back(new DigitalBook());
    _books.push_back(new HardCopyBook());
}

```

A constructor (בנאי) gives the members their first values in an initializer list, which is written after a colon and before the constructor body.

- **`const` members and reference members** must receive their values in that list, because it is the only place they can be initialized.
- **The constructor body** runs after every member already exists, so assigning to a `const` member there is a compile error.
- **Other members** are also best initialized in the list. An assignment in the body would first default-construct the member and then assign it again, which does the work twice.
- **A delegating constructor** names another constructor of the same class in its initializer list, and lets that constructor do the work.

In a real project a class is split between a header and a source file. This smaller version of `Student`, with a name and a year, shows the split. The header only declares the constructor.

```cpp
// student.h
class Student {
    std::string _name;
    int _year;
public:
    Student(const std::string& name, int year);
    void print() const;
};
```

The source file defines it, and the initializer list comes after the colon.

```cpp
// student.cpp
Student::Student(const std::string& name, int year)
    : _name(name), _year(year) {
    std::cout << "Student " << name << " created";
}

```

The constructor takes `name` as `const std::string&`, a reference to const. This is the usual way to pass a large object.

- **The reference** names the caller's object itself, so the call skips the copy.
- **`const`** promises that the function will not change that object.

### A picture of two students

```cpp
{
    University univ(...);
    ...
    Student s(7, "ringo", new Bag7(), univ);
    Student* ps = new Student(8, "jango", new Bag5(), univ);
}

```

| Stack address | Content | Field of `s` |
| --- | --- | --- |
| 9952 | 7 | `id` |
| 9960 | 200 | `name.chars` |
| 9968 | 5 | `name.length` |
| 9976 | 300 | `bag` |
| 9984 | 350 | `books.lst` |
| 9992 | 2 | `books.size` |
| 10000 | the address of `univ` | `univ` |

And `ps`, at stack address 9944, holds 100.

| Heap address | What is there |
| --- | --- |
| 100 | The `Student` of `ps`: `id` 8, `name` (400, 5), `bag` 500, `books` (550, 2), `univ` |
| 200 | The characters `ringo` |
| 240, 260 | The `DigitalBook` and `HardCopyBook` of `s` |
| 300 | The `Bag7` of `s` |
| 350 | The array of `s.books`: the addresses 240 and 260 |
| 400 | The characters `jango` |
| 440, 460 | The two books of the `Student` at 100 |
| 500 | The `Bag5` of the `Student` at 100 |
| 550 | The array of its `books`: the addresses 440 and 460 |

### The factory pattern

Sometimes a constructor is not enough.

- **Initialization may need more than setting the fields,** such as connecting to the university server and registering the student in the university database. You would rather keep that out of the constructor, for example because you do not want to send the server a student whose constructor has not finished yet (the next chapters show why).
- **A constructor may throw an exception.** If it does that for an object on the heap, its address is not known, because creating it failed.

The **factory** pattern solves both.

- **Make the constructor `private`,** so nobody outside the class can create an instance by calling it.
- **Define a `static` method** of the class that creates an instance on the heap, does the extra initialization, and returns its address.

```cpp
class Student {
private:
    Student(...) { ... }
    ...
public:
    static Student* create(...) {
        Student* ret = new Student(...);
        // additional initialization code
        UniversityServer.register(*ret);
        return ret;
    }
};

Student* s = Student::create(...);
...
delete s;

```

- **The drawback:** every instance must be created on the heap.

## Using an object

### Reaching an object's members

Where an object lives decides how you reach its members.

- **On the stack:** an object created without `new` lives in automatic storage, in the current function's stack frame. You reach its members with the dot operator `.`.
- **On the heap:** an object created with `new` is reached through a pointer. You reach its members with the arrow operator `->`, and you must eventually `delete` it.

```cpp
Student a("Avi", 2000);
a.print();
Student* pb = new Student("Benni", 2000);
pb->print();
delete pb;

```

:::check id=chk-dot-arrow
Given `Student* pb = new Student("Benni", 2000);`, how do you call `print`?

- [ ] `pb.print()`
- [x] `pb->print()`
- [ ] `(*pb)->print()`

- **`pb` is a pointer**, so the dot operator does not work on it directly.
- **`->`** first dereferences the pointer and then reaches the member.
- **`(*pb).print()`** is the same call, written with an explicit dereference followed by a dot. `(*pb)->print()` fails, because `*pb` is already an object, not a pointer.
:::

### The this pointer, const member functions, and static

A call like `a.print()` runs the one shared `print` function. The function knows to print `a` because every non-static member function receives a hidden pointer named `this`.

- **`this`** holds the address of the object the function was called on. In `a.print()`, `this` is `&a`.
- **A `const` member function**, like `print() const` above, promises not to change the object's members. Inside it, `this` has the type `const ClassName*`.
- **A `const` object** may call only `const` member functions, because only they promise to leave it unchanged.
- **A `static` member function** belongs to the class, not to an object, so it has no `this` and cannot reach the non-static members.

The next example puts the initializer list and a `static` function together.

:::problem id=worked-initializer title="The initializer list" source="materials/lectures/Chapter 3 - Classes and Objects.pptx" kind=worked solution_origin=source
Why must `Point` initialize `x` and `y` in the initializer list, and why does `Line` use a static function to initialize `len`?

```cpp
struct Point {
    const int x, y;
    Point(int x, int y) : x(x), y(y) {}
};

struct Line {
    Point p1, p2;
    const int len;
    Line(Point a, Point b)
        : p1(a), p2(b), len(calcLen(a, b)) {}
    static int calcLen(const Point& a, const Point& b);
};

```

:::solution
- **`x` and `y`:** they are `const`, so they must get their values in the initializer list. By the time the constructor body runs, they already exist, and a `const` member cannot be assigned.
- **`len`:** it is also `const`, so it too must be initialized in the list.
- **Why not an ordinary member function:** calling one from the list is legal, but it runs on an object that is only half built, and it could read members that have no value yet.
- **Why a `static` function:** `calcLen` has no object and no `this`, so it can use only its arguments. That makes it a safe call from the list.
:::
:::

## Deleting an object

The compiler translates the removal of an object from memory, when the block it was defined in ends if it is on the stack, or when `delete` is called on its address if it is on the heap, into two operations.

- **Running the destruction mechanism:**
  - First the object's destructor runs.
  - Then the destruction mechanism runs automatically on every field of the object that is itself an object.
- **Releasing the object's memory,** from the stack or from the heap.

So you never need to delete a variable on the stack. You must call `delete` on every object stored on the heap. By the design rule from [Variables, pointers, and references](topic:pointers), whoever holds the variable with the object's address is the one who must call `delete` on it.

```cpp
class Student {
    ...
    ~Student() {
        delete _bag;
        for (int i = 0; i < _books.size(); i++)
            delete _books.at(i);
    }
};

{
    University univ(...);
    ...
    Student s(7, "ringo", new Bag7(), univ);
    Student* ps = new Student(8, "jango", new Bag5(), univ);
    delete ps;
}

```

- **`delete ps`** runs `~Student` on the student at heap address 100, which deletes its `Bag5` and its two books. Then the destruction mechanism destroys `name` and `books`, which release their own arrays, and finally the student's own memory is released.
- **At the end of the block,** `s` goes through the same steps, and its cells on the stack are popped.
- **In the destructor, delete the pointers the class is responsible for.** Usually that means every pointer in the class, unless there are technical constraints, such as how hard it is to define a vector of references.

:::check id=chk-delete-order
`delete ps` runs on a `Student`. In what order do things happen?

- [ ] The memory is released, then `~Student` runs
- [x] `~Student` runs, then the destructors of the object fields, then the memory is released
- [ ] The destructors of the object fields run, then `~Student`

- **The destructor runs first,** while every field still exists, so it can still read `_bag` and `_books` and delete what they point at.
- **Then the fields that are objects are destroyed** automatically, here `name` and `books`.
- **Last, the object's own memory is released.**
:::

## Returning objects, and the special member functions

### Returning an object from a member function

Returning an object by value creates a copy. Returning a reference avoids the copy, but only if the object is still alive after the call.

- **Returning a reference to a local is undefined behavior.** The local object is destroyed when the function returns, so the caller is left holding a reference to an object that no longer exists.
- **Returning a reference is safe only when the object outlives the call.** A data member is a good example, because it lives as long as the object it belongs to.

```cpp
Image& myPicture() {
    Image avi(...);
    return avi;          // Undefined Behavior: avi is destroyed at function exit
}

```

### The special member functions

Creating, copying, and destroying objects is handled by four special member functions. If you do not write them, the compiler writes them for you.

- **Default constructor:** this constructor takes no arguments. The compiler generates one only when the class declares no constructor of its own.
- **Copy constructor (בנאי העתקה):** this constructor builds a new object from an existing one, which it receives as `const ClassName&`. It is what makes the copy when an object is passed or returned by value.
- **Copy assignment operator (אופרטור השמה):** runs when one existing object is assigned to another existing object.
- **Destructor (הורס):** runs at the end of the object's lifetime and releases the resources the object acquired.

The versions the compiler writes copy each member one by one. That is correct for the small `Student` with a `std::string` and an `int`, whose members manage their own memory. It is wrong for the full `Student`, which holds a `Bag*` and pointers to books. The next chapter shows why.

To sum up, an object's fields are laid out one after another, the initializer list is how a constructor gives them their first values, and the destructor releases what the object is responsible for before its memory goes.

- **Next:** [The rule of three](topic:rule-of-three) shows what must change when an object like `Student` is copied or assigned, since it holds pointers to memory it owns.
- **Later:** [Inheritance and polymorphism](topic:inheritance) shows how a call through a base-class pointer can reach the function defined in the derived class.
