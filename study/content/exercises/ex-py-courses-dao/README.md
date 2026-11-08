---
title: A DAO for the courses table
chapter: persistence
order: 3
lang: python
---

Application code should not be full of SQL. A **DTO** is a plain object shaped like one row, and a **DAO** is the one object that talks SQL for a table. Finish `Course` and `CoursesDao`.

**The table**

- `courses(id, title, credits)`

**Requirements**

- `Course(id, title, credits)`: a DTO that stores its three arguments in fields of the same names.
- `CoursesDao.insert(course)`: insert one row from a `Course`.
- `CoursesDao.find(course_id)`: return the `Course` with that id, or `None` if there is no such row.
- `CoursesDao.find_all()`: return a list of every `Course`, sorted by id.

**Background**

- Always pass values with `?` placeholders and a tuple: `conn.execute("... WHERE id = ?", (course_id,))`. A one-element tuple needs its trailing comma.
- `fetchone()` returns one row as a tuple, or `None` when there are no rows. `fetchall()` returns a list of tuples.
- `Course(*row)` unpacks a tuple `(id, title, credits)` into the three constructor arguments.

:::example
**Input:** `dao.insert(Course(9, "Logic", 2))`, then `dao.find(9)`

**Result:** a `Course` whose `title` is `"Logic"` and whose `credits` is 2
:::

:::hint
`__init__` is three assignments: `self.id = id`, and so on.
:::

:::hint
In `find`, run `SELECT id, title, credits FROM courses WHERE id = ?`. If `fetchone()` gives `None`, return `None`. Otherwise build the `Course` from the row.
:::

:::case name="find an id that is missing"
`fetchone()` returns `None` when no row matches. `find` should pass that on as `None`, not try to build a `Course` from it.
:::

:::case name="find_all is sorted by id"
Add `ORDER BY id` to the query, so the list does not depend on insertion order.
:::
