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

When an object is defined, on the stack or on the heap, it gets memory according to its size. Its inner layout follows a fixed rule, so the compiler always knows where each field is, relative to the start of the object.

**The rule:** the fields are placed one after another, in the order they are declared. The first field starts at the object's address.

Start small.

```cpp
class Point {
    int x;
    int y;
};

Point p;
```

| Cell | Field |
| --- | --- |
| the address of `p` | `x` |
| the next cell | `y` |

So `p.y` is translated to "the cell one after the address of `p`". The compiler never searches for a field.

**When a field is itself an object,** its own fields are laid out in its place, by the same rule. A `string` is an object with two fields, a pointer to its characters and a length, so a `string` field takes two cells.

```cpp
class Named {
    int id;
    string name;
};
```

| Cell | Field |
| --- | --- |
| 1 | `id` |
| 2 | `name.chars` (the address of the characters, on the heap) |
| 3 | `name.length` |

The rest of the memory chapters use a richer class, `Student`. Each field is a different kind of variable, so it is worth going through them one by one.

```cpp
class Student {
    const int _id;             // content, a simple type
    string _name;              // content, an object (two cells)
    Bag* _bag;                 // an address of a Bag on the heap
    vector<Book*> _books;      // an object holding addresses of Books
    const University& _univ;   // an alias for a University that lives elsewhere
};
```

- **`_id`** is a plain number, stored in the object. `const` means it can never change after construction.
- **`_name`** is stored in the object, as its two cells. The characters themselves are on the heap, owned by the `string`.
- **`_bag`** is one cell holding an address. The `Bag` it points at is a separate object on the heap, and the student is responsible for it.
- **`_books`** is a `vector`, an object of two cells (the address of its array, and its size). The array holds addresses of `Book` objects, which are also on the heap.
- **`_univ`** is an alias. The `University` is not part of the student, and the student is not responsible for it.

**Where the whole object goes** depends only on how you define it.

```cpp
Student s(...);                  // all of s's cells are on the stack
Student* ps = new Student(...);  // ps is one cell on the stack;
                                 // the Student's cells are on the heap
```

The getters follow the rule from [Variables, pointers, and references](topic:pointers): a simple type is returned by value, and an object by `const` reference.

```cpp
int getId() const { return _id; }
const string& getName() const { return _name; }
const Bag& getBag() const { return *_bag; }
```

## Initializing an object

As we have said several times, the compiler translates the definition of an object in memory, on the stack or on the heap, into two main operations.

- **Allocating the memory:** on the stack with `push` operations according to the object's size, and on the heap with `new`, which searches at run time for free cells that fit the object's size.
- **Running the initialization mechanism,** which makes sure that every part of the object goes through initialization, automatically.
  - First, the initialization mechanism runs on every field of the object that is itself an object (not on simple types, and not on addresses of objects).
  - Then the object's constructor runs.

A first attempt at a constructor assigns the fields in its body. Look at just two fields of `Student`.

```cpp
Student(int id, const string& name) {
    _id = id;        // error: _id is const, it cannot be assigned
    _name = name;    // works, but wastefully
}
```

That attempt has two problems.

- **`const` fields, and reference fields,** cannot be assigned after they exist. By the time the body runs, they already exist.
- **Object fields are built twice.** The initialization mechanism already built `_name` as an empty string before the body ran, and the body then assigns it again.

The fix is to say how each field is initialized, before the body, in an **initializer list** after a colon.

```cpp
Student(int id, const string& name)
    : _id(id), _name(name)    // each field is built once, with its value
{ }
```

The full constructor of `Student` does the same for every field, and uses its body only for the work that is not a plain initialization: creating the student's books.

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
- **On the stack:** `this` is one more cell the caller pushes into the new frame, next to the return address and the arguments ([The memory model](topic:memory-model)), so the function can reach the object's fields, which are not in its own frame.
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
    Student s(7, "ringo", new Bag(7), univ);
    Student* ps = new Student(8, "jango", new Bag(5), univ);
    delete ps;
}

```

- **`delete ps`** runs `~Student` on the student at heap address 100, which deletes its `Bag` and its two books. Then the destruction mechanism destroys `name` and `books`, which release their own arrays, and finally the student's own memory is released.
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

## Practice

:::problem id=prac-classes-layout title="The cells of a Reader" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Reader` has three fields. Count cells the way this chapter does: an `int` or a pointer takes one cell, and a `string` takes two. These questions look only at where things live.

```cpp
class Bag { };

class Reader {
    int _id;
    std::string _name;
    Bag* _bag;
public:
    Reader(int id, const std::string& name, Bag* bag)
        : _id(id), _name(name), _bag(bag) { }
};

void open() {
    Reader* pr = new Reader(7, "Avi", new Bag());
}
```

:::check id=prac-classes-layout-q1
Which cell of the `Reader` object holds `_bag`?

- [ ] Cell 2, because pointers are placed before objects
- [ ] Cell 3, because `_name` is one field, so it takes one cell
- [x] Cell 4
- [ ] None, because the `Bag` is stored directly in the `Reader`

- **Why cell 4:** the fields go in the order they are declared. `_id` is cell 1, `_name` is cells 2 and 3, and `_bag` is cell 4.
- **Why not cell 2:** the type of a field does not change its place. Only the order of declaration does.
- **Why not cell 3:** a `string` is an object with two fields of its own, and they are laid out in its place.
- **Why not "none":** `_bag` is one cell holding an address. The `Bag` it points at is a separate object.
:::

:::check id=prac-classes-layout-q2
While `open` runs, which of these are on the heap?

- [ ] The variable `pr`
- [x] The four cells of the `Reader`
- [x] The characters of `_name`
- [x] The `Bag`

- **`pr` is on the stack:** it is a local variable, one cell in the frame of `open`. Only what `new` created is on the heap.
- **The `Reader` is on the heap:** it was created with `new`, so all of its cells are there, including the cell of `_bag`.
- **The characters are on the heap too:** `_name` keeps only their address and the length in its two cells, and the `string` owns the characters.
- **The `Bag` is on the heap:** it has its own `new`, so it is a separate object, and `_bag` only holds its address.
:::

:::check id=prac-classes-layout-q3
To reach `pr->_bag`, the compiler uses {{=a fixed position from the start of the object|a search through the fields at run time|the field's name stored in the object}}. That works because the fields are placed {{=in the order they are declared|in alphabetical order|wherever memory is free}}.

The layout follows a fixed rule, so the compiler always knows where each field is, relative to the start of the object. It never searches for a field, and no names are kept in the cells.
:::
:::

:::problem id=prac-classes-seat title="A constructor for Seat" source="materials/lectures/Chapter 3 - Classes and Objects.pptx" kind=exercise solution_origin=derived
This constructor assigns both fields in its body.

```cpp
class Seat {
    const int _number;
    std::string _owner;
public:
    Seat(int number, const std::string& owner) {
        _number = number;
        _owner = owner;
    }
};
```

:::check id=prac-classes-seat-q1
What happens when you compile this class?

- [ ] It compiles, because the first assignment to a `const` member counts as its first value
- [ ] It fails, because `_owner = owner` assigns from a `const` reference
- [x] It fails, because `_number` is `const`, and it already exists by the time the body runs
- [ ] It compiles, but `_number` holds garbage when the program runs

- **Why it fails:** the body runs after every member already exists, so `_number = number` is an assignment to a `const` member. That is a compile error.
- **Why the first assignment does not count:** a `const` member gets its value in the initializer list, the only place it can be initialized.
- **Why `_owner` is not the problem:** `const` on `owner` only promises not to change the caller's string. Reading it is fine, so `_owner = owner` works, only wastefully.
- **Why it is not a run-time problem:** the compiler rejects the class, so the program never runs.
:::

:::check id=prac-classes-seat-q2
Here is the repaired `Seat` constructor. Which statements about its initializer list are true?

```cpp
class Seat {
    const int _number;
    std::string _owner;
public:
    Seat(int number, const std::string& owner)
        : _number(number), _owner(owner) { }
};
```

- [x] `_number` now gets its value in the only place a `const` member can get it
- [x] `_owner` is built once, instead of being built empty and then assigned
- [ ] The `const` in `const std::string& owner` means `_owner` can never change later
- [ ] The initializer list runs after the constructor body

- **`_number`:** the initializer list comes before the body, while the member is being created.
- **`_owner`:** in the old version it was first built as an empty string and then assigned, which did the work twice.
- **The `const` on the parameter:** it is a promise about the caller's string during the call. It says nothing about the member `_owner`, which is not `const`.
- **The order:** the list comes first, and the body runs once every member exists.
:::

:::check id=prac-classes-seat-q3
A reference member such as `const University& _univ` must get its value in {{=the initializer list|the constructor body|the destructor}}. An ordinary member such as `int _year` is {{=also best initialized there|only allowed in the body|never initialized at all}}.

`const` members and reference members cannot be assigned after they exist, so the list is the only place for them. Other members may be assigned in the body, but the list gives each one its value directly, so it is the better habit.
:::
:::

:::problem id=prac-classes-const-calls title="Calls on a const object" source="materials/lectures/Chapter 3 - Classes and Objects.pptx" kind=exercise solution_origin=derived
This `Student` has a `const` member function, an ordinary one, and a `static` one. The object `a` is `const`.

```cpp
class Student {
    std::string _name;
    int _year;
public:
    Student(const std::string& name, int year) : _name(name), _year(year) { }
    void print() const { std::cout << _name; }
    void setYear(int year) { _year = year; }
    static int passingGrade() { return 56; }
};

const Student a("Avi", 2000);
```

:::check id=prac-classes-const-calls-q1
Inside a function that can see `a`, which of these lines compile?

- [x] `a.print();`
- [ ] `a.setYear(2001);`
- [x] `Student::passingGrade();`
- [ ] `Student::print();`

- **`a.print()`:** `print` is a `const` member function, so a `const` object may call it.
- **`a.setYear(2001)`:** a `const` object may call only `const` member functions, and `setYear` is not one. It changes the object.
- **`Student::passingGrade()`:** a `static` function belongs to the class, so it needs no object.
- **`Student::print()`:** `print` is not `static`, so it needs an object to work on. Here there is none for `this` to point at.
:::

:::check id=prac-classes-const-calls-q2
Someone adds `static int getYear() { return _year; }` to the class. The compiler rejects it. Why?

- [x] A `static` function has no `this`, so it cannot reach the non-static member `_year`
- [ ] `_year` is `private`, and a `static` function cannot reach `private` members
- [ ] A `static` function must also be marked `const`

- **The reason:** each object has its own `_year`. A `static` function has no object, so it cannot tell which `_year` you mean.
- **Why `private` is not the problem:** a `static` function is still part of the class. The factory's `create` calls a `private` constructor in just this way.
- **Why `const` does not help:** `const` on a member function is a promise about the object in `this`, and a `static` function has no `this`.
:::

:::check id=prac-classes-const-calls-q3
In the call `a.print()`, the hidden pointer `this` holds {{=the address of a|a copy of a|the address of print}}, and inside `print` its type is {{=const Student*|Student*|Student&}}.

There is only one copy of `print`, shared by all the objects, so `this` is how it knows which object to print. In a `const` member function, `this` is a pointer to a `const` object, which is why the function cannot change the members.
:::
:::

:::problem id=prac-classes-factory title="Creating through a factory" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
This `Student` uses the factory pattern.

```cpp
class Student {
    std::string _name;
    Student(const std::string& name) : _name(name) { }
public:
    static Student* create(const std::string& name) {
        Student* ret = new Student(name);
        return ret;
    }
};
```

:::check id=prac-classes-factory-q1
Which line compiles in a function outside the class?

- [ ] `Student a("Avi");`
- [ ] `Student* b = new Student("Benni");`
- [x] `Student* c = Student::create("Gadi");`

- **The constructor is `private`:** in a `class`, members are `private` unless you say otherwise, and the constructor comes before `public:`. So nobody outside the class can call it.
- **The first two lines:** both call the constructor directly. Using `new` does not change that.
- **The third line:** `create` is `public` and `static`, so it needs no object. It is inside the class, so it may call the `private` constructor.
:::

:::check id=prac-classes-factory-q2
After `Student* c = Student::create("Gadi");`, which statements are true?

- [x] The `Student` that `c` points at is on the heap
- [ ] `create` deletes the `Student` when it returns
- [x] Whoever holds `c` must call `delete c`
- [ ] Other code can get a `Student` on the stack by calling `create` differently

- **It is on the heap:** `create` uses `new` and returns the address.
- **`create` does not delete it:** only the local variable `ret` goes away when `create` returns. The object stays, and the caller now has its address.
- **Who deletes:** whoever holds the variable with the object's address must call `delete` on it.
- **No stack version:** this is the pattern's drawback. Every instance must be created on the heap.
:::

:::check id=prac-classes-factory-q3
Registering a student with the university server belongs in {{=create, after the constructor has finished|the constructor body|the destructor}}, so the server is never sent {{=a student whose constructor has not finished|a student on the stack|a copy of the factory}}.

That is one of the reasons for the pattern. `create` first builds the object completely, then does the extra initialization, and only then returns the address.
:::
:::

:::problem id=prac-classes-destructor title="Which destructor prints first" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Each destructor prints its own name. `_tag` is an object field, and `_bag` holds the address of a `Bag` on the heap.

```cpp
struct Bag { ~Bag() { std::cout << "Bag "; } };
struct Tag { ~Tag() { std::cout << "Tag "; } };

class Student {
    Tag _tag;
    Bag* _bag;
public:
    Student() : _bag(new Bag()) { }
    ~Student() {
        std::cout << "Student ";
        delete _bag;
    }
};

int main() {
    Student* ps = new Student();
    delete ps;
}
```

:::check id=prac-classes-destructor-q1
What does the program print?

- [ ] `Tag Bag Student`
- [x] `Student Bag Tag`
- [ ] `Student Tag Bag`
- [ ] `Bag Tag Student`

- **`Student` comes first:** `delete ps` runs the object's destructor first, while every field still exists.
- **`Bag` comes next:** the body of `~Student` prints its name and then runs `delete _bag`, so `~Bag` runs inside that body.
- **`Tag` comes last:** after the body ends, the destruction mechanism runs on every field that is itself an object. Then the memory is released.
- **Why not the fields first:** if they went first, the destructor could no longer use them to release what they point at.
:::

:::check id=prac-classes-destructor-q2
Now remove the line `delete _bag;`. What happens?

- [x] It prints `Student Tag`, and the `Bag` stays on the heap and is never released
- [ ] It prints `Student Bag Tag`, because the destruction mechanism follows the pointer
- [ ] It prints `Student Tag Bag`, because the `Bag` is released when the program ends
- [ ] It no longer compiles, because a class with a pointer field must delete it

- **Why no `Bag`:** the mechanism runs only on fields that are themselves objects. `_bag` is one cell holding an address, so releasing that cell does nothing to the `Bag`.
- **The result is a leak:** nothing calls `~Bag`, and nothing has the address anymore.
- **Why it still compiles:** the compiler does not check that you deleted your pointers. That is your job, in the destructor.
:::

:::check id=prac-classes-destructor-q3
If `main` used `Student s;` in a block instead, you would write {{=no delete at all|one delete for s|one delete for the block}}. The same destructors would run {{=when the block ends|when the program ends|only if you call them}}.

An object on the stack is removed when the block it was defined in ends. It goes through the same steps, and then its cells are popped. So you never delete a variable on the stack, but its destructor still releases the `Bag`.
:::
:::

To sum up, an object's fields are laid out one after another, the initializer list is how a constructor gives them their first values, and the destructor releases what the object is responsible for before its memory goes.

- **Next:** [The rule of three](topic:rule-of-three) shows what must change when an object like `Student` is copied or assigned, since it holds pointers to memory it owns.
- **Later:** [Inheritance and polymorphism](topic:inheritance) shows how a call through a base-class pointer can reach the function defined in the derived class.
