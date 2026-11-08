---
title: Count with GROUP BY and HAVING
chapter: persistence
order: 1
lang: python
---

Finish two Python functions that each run one SQL query. Both read the `students` table through the connection `conn`.

**The tables**

- `students(id, name, dept)`
- `courses(id, title, credits)`
- `enrollments(student_id, course_id, grade)`: one row for each course a student takes. `student_id` points at `students.id`, and `course_id` at `courses.id`.

**Requirements**

- `students_per_dept(conn)`: return a list of `(dept, how_many)` rows, one for each department, sorted by department name.
- `big_departments(conn)`: return a list of the names of the departments that have **at least 2** students, sorted.

**Background**

- `conn.execute("SELECT ...").fetchall()` runs a query and returns its rows as a list of tuples.
- `GROUP BY dept` makes one row for each distinct department, and `COUNT(*)` then counts the rows inside each group.
- `WHERE` filters rows **before** they are grouped. `HAVING` filters the groups **after** they are made. A condition on `COUNT(*)` can only go in `HAVING`, because the count does not exist yet when `WHERE` runs.

:::example
**Input:** a table with Ana, Ben and Finn in CS, Cleo and Dan in Math, and Eve in Physics

**Result:** `students_per_dept` gives `[("CS", 3), ("Math", 2), ("Physics", 1)]`, and `big_departments` gives `["CS", "Math"]`
:::

:::hint
`SELECT dept, COUNT(*) FROM students GROUP BY dept ORDER BY dept` is the whole first query.
:::

:::hint
For the second, put `HAVING COUNT(*) >= 2` after the `GROUP BY`. Then turn the rows `("CS",)` into plain names with a list comprehension.
:::

:::case name="counts per department"
Each row is a tuple `(dept, how_many)`. Order the rows with `ORDER BY dept`.
:::

:::case name="only big departments"
Physics has one student. A `HAVING COUNT(*) >= 2` drops it, while a `WHERE` cannot express this.
:::
