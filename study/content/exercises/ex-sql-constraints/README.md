---
title: Let the database refuse bad data
chapter: persistence
order: 4
lang: python
---

Constraints make the database itself refuse data that breaks the rules, whichever program sends it. Finish `create_library`, which creates the two tables of a small library.

**Requirements**

- Table `members`: `id` is an integer primary key. `email` is text that is **unique** and **not null**. `age` is an integer that must be **at least 0**.
- Table `loans`: `id` is an integer primary key. `member_id` is an integer that is **not null** and is a **foreign key** to `members(id)`.
- Create both tables with `conn.execute(...)`. The test inserts bad rows and expects each to fail.

**Background**

- `UNIQUE` forbids two rows with the same value. `NOT NULL` forbids a missing value. `CHECK (age >= 0)` forbids any row for which the condition is false.
- `REFERENCES members(id)` is a foreign key: every `member_id` must be the id of a row that exists in `members`.
- A broken constraint makes `execute` raise `sqlite3.IntegrityError`. SQLite only checks foreign keys when `PRAGMA foreign_keys = ON` has been run, and the test turns it on.

:::example
**Input:** insert a member with age -1

**Result:** the database raises `sqlite3.IntegrityError`, and no row is added
:::

:::hint
`email TEXT UNIQUE NOT NULL` puts both rules on one column, and `age INTEGER CHECK (age >= 0)` adds the check.
:::

:::hint
Write the foreign key right in the column: `member_id INTEGER NOT NULL REFERENCES members(id)`.
:::

:::case name="duplicate email"
Two members with the same email must be refused. That needs `UNIQUE` on the `email` column.
:::

:::case name="loan for a member who does not exist"
`REFERENCES members(id)` makes the database check that the member is real. Without it, a loan for member 99 would be accepted.
:::
