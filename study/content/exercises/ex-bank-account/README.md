---
title: Build a bank account class
chapter: classes-and-objects
order: 1
---

Finish the class `Account`, which holds an account's id, its owner's name, and its balance.

**What to write**

- Two private fields: the id, of type `const int`, and the balance. The `_owner` field is already there.
- `Account(int id, const std::string& owner)`: give every field its first value in the initializer list. The balance starts at 0.
- `int id() const` and `int balance() const`: return those values. `owner()` already returns `_owner`.
- `void deposit(int amount)`: add `amount` to the balance.

**Good to know**

- The initializer list is the part after a colon, before the constructor's body: `Account(...) : _a(1), _b(2) { }`.
- A `const` member function, like `id() const`, promises not to change the object.

:::example
**Input:** `Account a(7, "Noa"); a.deposit(50); a.deposit(20);`

**Result:** `a.id()` is 7, `a.owner()` is `"Noa"`, and `a.balance()` is 70
:::

:::hint
Try writing `_id = id;` in the constructor's body and read the compile error. By the time the body runs, the field already exists, and a `const` field cannot be assigned.
:::

:::hint
The initializer list names each field and puts its first value in parentheses. List the fields in the order you declared them.
:::

:::hint
The fields of a class are private unless you say otherwise, so put the new ones above `public:`.
:::

:::case name="starts at zero"
An `int` field gets no value by itself. If it is missing from the initializer list, it holds whatever was in that memory before.
:::

:::case name="id is const"
This test fails while the id field is a plain `int`. Add `const` to its type. The compiler will then make you set it in the initializer list.
:::
