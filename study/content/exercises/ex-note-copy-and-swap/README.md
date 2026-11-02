---
title: Assignment by copy and swap
chapter: rule-of-three
order: 3
---

Write `Note`, which keeps its text in a buffer on the heap, and write its assignment with copy and swap.

**Requirements**

- `Note(const char* text)`: allocate a buffer of your own, and copy the characters into it. `std::strlen` counts them, and `std::strcpy` copies them.
- `const char* text() const`: return the buffer's address.
- `~Note()`: release the buffer.
- `Note(const Note& other)`: give the new note its own buffer with the same text.
- `void swap(Note& other)`: trade buffers with `other`. Only the pointers change hands, no characters are copied.
- `Note& operator=(const Note& other)`: copy and swap. Copy `other` into a temporary `Note`, swap with it, and return `*this`. The temporary's destructor then releases the old buffer.

**Background**

- The text ends with the character `'\0'`, so the buffer needs one more cell than `std::strlen` counts.

:::example
**Input:** `Note a("one"); Note b("two"); a.swap(b);`

**Result:** `a.text()` is `two`, and `b.text()` is `one`
:::

:::example
**Input:** `Note a("hi"); Note b("a longer note"); a = b;`

**Result:** `a.text()` is `a longer note`, and `a.text()` and `b.text()` are different addresses
:::

:::hint
Which kind of `delete` matches a buffer made with `new char[...]`?
:::

:::hint
`std::swap(x, y)` trades two variables. Here the only thing `swap` needs to trade is the pointer.
:::

:::hint
The assignment operator needs three lines and no `delete`. The first line makes a copy of `other` with a name. Who releases the old buffer once the swap has moved it into that object?
:::

:::case name="swap trades the buffers"
The test compares addresses. If the two notes kept their buffers and traded the characters, this fails. Trade the pointers instead.
:::

:::case name="the constructor copies the text"
The note must keep its own characters. Storing the address it was given leaves it pointing at someone else's array.
:::
