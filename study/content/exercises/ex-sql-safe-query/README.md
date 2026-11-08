---
title: Pass values as data, not as SQL
chapter: persistence
order: 5
lang: python
---

If you build a query by gluing a string into the SQL text, the string can change the meaning of the query. That is **SQL injection**. Finish `find_students_named`, which must stay safe whatever name it is given.

**The tables**

- `students(id, name, dept)`
- `courses(id, title, credits)`
- `enrollments(student_id, course_id, grade)`: one row for each course a student takes. `student_id` points at `students.id`, and `course_id` at `courses.id`.

**Requirements**

- `find_students_named(conn, name)`: return the rows `(id, name)` of the students whose name is exactly `name`.
- Pass `name` through a `?` placeholder. Do **not** build the query with an f-string or `+`.

**Background**

- With `f"... WHERE name = '{name}'"`, a name such as `x' OR '1'='1` turns the condition into one that is always true, and the query returns every student.
- With `conn.execute("... WHERE name = ?", (name,))`, the value travels separately from the SQL. The database treats it as data, never as part of the command, so quotes inside it are harmless.
- Placeholders also handle names like `O'Neil` correctly, which a glued string would break.

:::example
**Input:** `find_students_named(conn, "Ana")`

**Result:** `[(1, "Ana")]`. The name `x' OR '1'='1` gives `[]`.
:::

:::hint
`conn.execute("SELECT id, name FROM students WHERE name = ?", (name,))`, with the tuple's trailing comma, then `.fetchall()`.
:::

:::case name="injection finds nobody"
The text `x' OR '1'='1` is just a name that no student has. A glued query would turn it into SQL and return everyone.
:::

:::case name="an apostrophe is only data"
`O'Neil` contains a quote. With a placeholder it is looked up like any other name.
:::
