# 11 — Classes

A class (מחלקה) is a layout of data plus functions that receive a hidden pointer to that layout. The pointer's name is `this`. A `struct` is the same tool with a different default access: members of a `struct` are public unless you say otherwise, and members of a `class` are private.

```cpp
class Student {
    std::string name_;
    int year_;
public:
    Student(const std::string& name, int year);
    void print() const;
};
```

The definition ends with `;`. Forgetting it is a compile error, often reported on the next line, because the language allows you to declare variables in the same sentence as the type:

```cpp
struct Point { int x; int y; } p1, p2;
```

## Access

`public` members are usable by anyone who has an object. `private` members are usable by the class's own methods. `protected` matters once you inherit; lesson 14. Put data private. Expose operations.

## Constructors and the initializer list

A constructor (בנאי) has the class's name and no return type. It runs when an object is created.

```cpp
Student::Student(const std::string& name, int year)
    : name_(name), year_(year) {
}
```

The list after the colon is the initializer list (רשימת אתחול). It initializes members before the body runs. Members are initialized in the order they are **declared in the class**, not the order written in the list. Write the list in declaration order so the two match.

This is the only way to initialize a `const` member or a reference member. By the time the body runs, those members already exist, and a `const` member cannot be assigned.

```cpp
struct Point {
    const int x;
    const int y;
    Point(int x, int y) : x(x), y(y) {}
};
```

`Point(int x, int y) { this->x = x; }` does not compile. `x` is const.

A constructor can hand off to another constructor of the same class. That is a delegating constructor, and it occupies the initializer list alone:

```cpp
Student(const std::string& name) : Student(name, 1) {}
```

If you write any constructor yourself, the compiler does not also generate a default constructor (the zero-argument one). `Student s;` then fails to compile until you write `Student() = default;` or a real default constructor.

## this, const methods, static methods

Every non-static method receives `this`, a pointer to the object it was called on. `name_` inside `Student::print` means `this->name_`.

A method marked `const` promises not to modify the object's members. Inside it, `this` has type `const Student*`. A `const` object, and a `const Student&`, can call only `const` methods.

```cpp
void print() const;
const Student s("Avi", 2000);
s.print();                 // legal because print is const
```

A `static` method has no `this`. It cannot touch `name_` or `year_`. It can touch static data and other static methods. The initializer list may call a static method, because that call does not need an object that is still under construction. Calling an ordinary method from the initializer list is a bad idea: the object is not finished.

## Dot and arrow

An object uses `.`. A pointer to an object uses `->`.

```cpp
Student a("Avi", 2000);
a.print();

Student* pb = new Student("Benni", 2000);
pb->print();               // same as (*pb).print()
delete pb;
```

`pb.print()` does not compile. `pb` is a pointer. `(*pb)->print()` does not compile either. `*pb` is the object, and the object uses `.`.

The object `a` lives in `main`'s stack frame. The object `*pb` lives on the heap. The pointer `pb` itself lives in the frame. `delete pb` runs the destructor and frees the heap object. Lesson 12 is what you write in that destructor when the object owns a second heap block.

## Initialization is not assignment

```cpp
Image b = a;     // constructs b. Copy constructor. Lesson 12.
b = a;           // b already exists. Assignment. Lesson 12.
```

The `=` in `Image b = a` is initialization, not assignment. The punctuation looks the same. The compiler chooses from whether the left object is being born on this line.

## Returning a member

Returning a member by value copies it. Returning `T&` to a member is legal when the caller still holds the object. Returning `T&` to a local is the same bug as in lesson 7.

`operator=` returns `T&` to `*this` so that `a = b = c` works. `=` associates to the right, so that expression is `a = (b = c)`, and the inner call must produce something the outer call can bind to.

## Exercise

`make try LESSON=11-classes`

`Point`'s constructor is already the initializer list. Read it, then write `manhattan`. `Counter` starts at the value you pass. `bumped` must use `->`.

Next: [the rule of three](../12-rule-of-three/lesson.md).
