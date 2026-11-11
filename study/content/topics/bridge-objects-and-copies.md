---
id: bridge-objects-and-copies
title: "Review: objects that own memory"
kind: bridge
reviews: [classes-and-objects, rule-of-three]
blurb: "A look back at classes and the rule of three: where an object's parts live, what a copy really copies, and how an assignment replaces what an object owns."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
---

The last two chapters built objects and then copied them. This review puts the two together, on top of what you already know about frames, the heap, and pointers.

One class runs through every step: `Deck`, a class that owns an array of card numbers on the heap.

```cpp
class Deck {
  public:
    Deck(int size) : _size(size), _cards(new int[size]) {}
    ~Deck() { delete[] _cards; }
    int first() const { return _cards[0]; }
    void setFirst(int value) { _cards[0] = value; }

  private:
    int _size;
    int* _cards;
};
```

## An object and what it owns

- **An object is its fields, side by side.** A `Deck` is an `int` and a pointer. The array is not inside the object: the object only holds its address. See [Classes and objects](topic:classes-and-objects).
- **The object lives where it was defined.** `Deck a(3);` puts the two fields in the current frame. `new Deck(3)` puts them on the heap. Either way, the array is a separate heap block.
- **The constructor builds, the destructor releases.** The initializer list fills the fields in the order they are declared in the class. The destructor releases what the object owns.
- **A stack object is destroyed for you.** Its destructor runs when its frame is popped. A heap object is destroyed only when someone runs `delete` on its address.
- **A `const` member function promises not to change the object.** Only `const` member functions can be called on a `const` object or through a `const` reference.

:::problem id=br2-two-decks title="Two decks, three blocks" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`main` makes one `Deck` on the stack and one on the heap.

```cpp
int main() {
    Deck a(3);
    Deck* b = new Deck(5);
    return 0;
}
```

:::check id=br2-two-decks-q1
Place each piece just before the `return`.

The fields `_size` and `_cards` of `a` live in {{=main's stack frame|the heap|static data}}.

The three `int`s of `a` live on the {{=heap|stack}}.

The variable `b` lives in {{=main's stack frame|the heap}}.

The fields `_size` and `_cards` of the deck that `b` points at live on the {{=heap|stack}}.

The five `int`s of that deck live {{=on the heap, in a block of their own|inside the Deck object|in main's stack frame}}.

Each `Deck` is two fields. `a` is a local, so its fields are in the frame. `new Deck(5)` puts the other deck's fields on the heap. In both, the constructor's `new int[size]` makes a second, separate heap block for the cards.
:::

:::check id=br2-two-decks-q2
`main` returns without any `delete`. What is released?

- [x] The three `int`s of `a`, because `~Deck` runs for `a` when the frame is popped.
- [ ] The five `int`s of the other deck, because `b` is popped with the frame.
- [ ] The `Deck` object that `b` points at, because `b` is popped with the frame.
- [ ] Nothing, because no `delete` was written.

- **`a` is a stack object,** so its destructor runs automatically, and the destructor releases the array.
- **Popping `b` destroys only the pointer.** No destructor runs for the deck it pointed at, so two blocks leak: the `Deck` object and its array of five.
- **`delete b;`** would run `~Deck` on that object, releasing the array, and then release the object itself.
:::
:::

:::problem id=br2-lending-the-address title="Lending out the address" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
Someone adds a getter to `Deck` so that callers can read all the cards.

```cpp
int* cards() const { return _cards; }
```

:::check id=br2-lending-the-address-q1
The function is `const`, and it compiles. What can a caller still do with `int* p = deck.cards();`?

- [x] Change a card with `p[0] = 99;`, even when `deck` is a `const Deck`.
- [x] Run `delete[] p;` and leave `deck` holding the address of a released block.
- [ ] Nothing harmful: `const` on the function protects the cards as well.
- [ ] Change `deck._size`.

- **`const` on a member function protects the fields.** The field here is the pointer `_cards`, and the function does not change it.
- **The cards are not fields.** They sit in a separate heap block, and the function hands out their address as a plain `int*`, so the caller can write through it or even release the block.
:::

:::check id=br2-lending-the-address-q2
Which signature lets callers read the cards and nothing more?

- [ ] `int* cards() { return _cards; }`
- [x] `const int* cards() const { return _cards; }`
- [ ] `int*& cards() const { return _cards; }`
- [ ] `int* const cards() const { return _cards; }`

- **`const int*` is a pointer to constant `int`s.** The caller can read `p[0]` but cannot write it, and `delete[]` through a pointer to const is a clear sign of misuse to any reader.
- **`int* const`** makes the returned pointer itself constant, which protects nothing: the `int`s are still writable.
- **`int*&`** would be worse: it hands out the field itself.
:::
:::

## Copying is memberwise unless you say otherwise

- **A copy constructor builds a new object from an existing one.** It runs for `Deck b = a;`, for `Deck b(a);`, when an object is passed by value, and when one is returned by value. See [The rule of three](topic:rule-of-three).
- **The default copies each field.** For a pointer field that means copying the address. Now two objects hold the address of one array. This is a shallow copy.
- **A shallow copy fails twice.** A change through one object shows in the other, and when both are destroyed the same array is released twice.
- **A deep copy allocates a new array** and copies the values into it, so each object owns its own block.

```cpp
Deck(const Deck& other) : _size(other._size), _cards(new int[other._size]) {
    for (int i = 0; i < _size; i++) {
        _cards[i] = other._cards[i];
    }
}
```

:::problem id=br2-by-value-trap title="A deck passed by value" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Deck` is as written at the top of this review: it has a destructor, but no copy constructor of its own.

```cpp
int top(Deck d) {
    return d.first();
}

int main() {
    Deck a(3);
    a.setFirst(7);
    int t = top(a);
    return 0;
}
```

:::check id=br2-by-value-trap-q1
What does the call `top(a)` do before the body of `top` runs?

- [ ] Nothing is copied: `d` is another name for `a`.
- [x] The default copy constructor builds `d` in `top`'s frame, copying `_size` and the address in `_cards`.
- [ ] The copy assignment operator copies `a` into `d`.
- [ ] A new array of three `int`s is allocated for `d`.

- **Pass by value builds a new object** in the new frame, and building a new object from an existing one is the copy constructor's job.
- **The class did not write one,** so the default runs, and it copies the fields as they are. `d._cards` and `a._cards` now hold the same address.
:::

:::check id=br2-by-value-trap-q2
What happens when `top` returns, and then when `main` returns?

When `top` returns, `d` is destroyed, and its destructor {{=releases the array that a still points at|releases a private copy of the array|does nothing, because d was only a copy}}.

After that, `a._cards` {{=holds the address of a released block|is nullptr|still points at a live array}}.

When `main` returns, `~Deck` runs for `a` and {{=releases the same block a second time|releases nothing|releases a different block}}.

`d` lives in `top`'s frame, so its destructor runs when that frame is popped. The destructor cannot know that another object shares the array. It releases it, and `a` is left with a dangling pointer. The second `delete[]` on the same address is undefined behavior.
:::

:::check id=br2-by-value-trap-q3
Which changes make this program correct?

- [x] Give `Deck` a copy constructor that allocates a new array and copies the cards.
- [x] Change the parameter to `const Deck& d`.
- [ ] Remove the destructor from `Deck`.
- [ ] Change the parameter to `Deck* d` and call `top(&a)`, then `delete d;` inside `top`.

- **A deep copy** gives `d` its own array, so destroying `d` leaves `a` alone.
- **A `const` reference** builds no new object at all, so there is nothing to destroy. `first()` is a `const` member function, so the call through a `const` reference compiles.
- **Removing the destructor** stops the double release by leaking every deck's array instead.
:::
:::

## Assignment replaces what the object owns

- **Assignment works on an object that already exists.** `c = a;` calls the copy assignment operator of `c`. Unlike the copy constructor, the target already owns an array.
- **The default assigns each field.** The old address in `c._cards` is overwritten, so the old array leaks, and the two objects now share one array.
- **A correct operator does four things:** check for self-assignment, release the old array, allocate and copy the new one, and return `*this`.
- **Self-assignment is the trap.** In `a = a;`, releasing the old array first would destroy the very values that are about to be copied.
- **The rule of three:** a class that needs one of the destructor, the copy constructor, and the copy assignment operator almost always needs all three, because all three exist for the same reason: the class owns something.

```cpp
Deck& operator=(const Deck& other) {
    if (this != &other) {
        delete[] _cards;
        _size = other._size;
        _cards = new int[_size];
        for (int i = 0; i < _size; i++) {
            _cards[i] = other._cards[i];
        }
    }
    return *this;
}
```

:::problem id=br2-assign-and-lose title="Counting blocks after an assignment" source="materials/notes/lecture-notes.docx.pdf" kind=exercise solution_origin=derived
`Deck` now has the deep copy constructor shown above, but still no copy assignment operator of its own.

```cpp
int main() {
    Deck a(3);
    Deck b = a;
    Deck c(2);
    c = a;
    return 0;
}
```

:::check id=br2-assign-and-lose-q1
Count the card arrays just before the `return`.

`Deck b = a;` runs the {{=copy constructor|copy assignment operator|constructor Deck(int)}}, so `b` {{=owns its own array of three|shares a's array}}.

`c = a;` runs the {{=default copy assignment operator|copy constructor|destructor and then the copy constructor}}.

After it, the array of two that `c` had {{=is leaked: no pointer holds its address|was released by the assignment|is still owned by c}}.

After it, `a` and `c` {{=share one array|each own an array}}.

- **`Deck b = a;` defines a new object,** so it is a construction, and the deep copy constructor runs.
- **`c = a;` assigns to an existing object.** The default operator copies the fields, so `c._cards` is overwritten with `a`'s address. The array of two has no pointer left, and `a` and `c` now share.
- **At the `return`,** the destructors of `c` and `a` will both release the shared array.
:::

:::check id=br2-assign-and-lose-q2
Someone writes the operator like this. Which statement about it is true?

```cpp
Deck& operator=(const Deck& other) {
    delete[] _cards;
    _size = other._size;
    _cards = new int[_size];
    for (int i = 0; i < _size; i++) {
        _cards[i] = other._cards[i];
    }
    return *this;
}
```

- [ ] It is correct for every call.
- [x] `c = a;` works, but `a = a;` copies from an array that was just released.
- [ ] `c = a;` leaks the old array of `c`.
- [ ] It must return `Deck`, not `Deck&`.

- **For two different objects it is fine:** the old array is released, and a new one is filled from `other`.
- **In `a = a;`, `other` is `a` itself.** After `delete[] _cards;`, `other._cards` is the same released address, and the loop reads from it.
- **The fix** is the `if (this != &other)` check, or the copy-and-swap form, which never releases before the copy exists.
:::
:::
