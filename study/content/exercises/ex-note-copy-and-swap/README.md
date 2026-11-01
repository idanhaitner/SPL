---
title: Assignment by copy and swap
chapter: rule-of-three
order: 3
---

A `Note` keeps its text in a character buffer on the heap. It ends with the character `'\0'`, as the chapter's `description_` does, so a buffer needs room for every character plus one more.

Write the class, and write the assignment operator with **copy and swap**: copy first into a temporary object, then swap with it, and let the temporary's destructor release the old buffer.

- **`Note(text)`** allocates its own buffer and copies the characters into it. `std::strlen` counts the characters, and `std::strcpy` copies them.
- **`text()`** returns the address of the buffer.
- **The destructor** releases the buffer.
- **The copy constructor** gives the new note its own buffer with the same text.
- **`a.swap(b)`** makes the two notes trade buffers. No characters are copied, only the pointers change hands.
- **`a = b`** gives `a` its own copy of `b`'s text, using the copy constructor, `swap`, and the destructor.

You are done when Submit shows every test passing.

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
