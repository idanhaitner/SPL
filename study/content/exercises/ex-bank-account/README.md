---
title: Build a bank account class
chapter: classes-and-objects
order: 1
---

A class bundles data with the functions that work on it. Here the data is an account's id, its owner's name, and its balance.

Finish the class `Account`.

- The constructor takes an id and an owner's name. A new account has a balance of 0.
- The id can never change, so store it in a private field of type `const int`.
- `id()`, `owner()`, and `balance()` read those values. They are `const` member functions, which means they promise not to change the object.
- `deposit(amount)` adds `amount` to the balance.

The starter already has the `_owner` field. You add the fields for the id and the balance. Give every field its first value in the initializer list, the part after a colon that comes before the constructor's body.

You are done when Submit shows every test passing.

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
