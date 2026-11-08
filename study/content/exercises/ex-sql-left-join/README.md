---
title: Find the rows with no match
chapter: persistence
order: 2
lang: python
---

An inner join keeps only the rows that found a partner. A **left join** keeps every row of the left table, and fills the partner's columns with `NULL` where nothing matched. That makes it the tool for "who has none?" and for counts that include zero.

**The tables**

- `students(id, name, dept)`
- `courses(id, title, credits)`
- `enrollments(student_id, course_id, grade)`: one row for each course a student takes. `student_id` points at `students.id`, and `course_id` at `courses.id`.

**Requirements**

- `students_without_courses(conn)`: return the names of the students who are in no course at all, sorted.
- `course_sizes(conn)`: return rows `(title, how_many_students)` for **every** course, including a course nobody takes (its count is 0), sorted by title.

**Background**

- `FROM students s LEFT JOIN enrollments e ON e.student_id = s.id` keeps every student. For a student with no enrollment, all the `e.` columns are `NULL`.
- `WHERE e.student_id IS NULL` then keeps exactly those students. (`= NULL` never matches; `IS NULL` is the test.)
- `COUNT(*)` counts rows, so a course with no students would still count 1 (its own row). `COUNT(e.student_id)` counts only non-`NULL` values, so it correctly gives 0.

:::example
**Input:** Finn is in no course, and the course Poetry has no students

**Result:** `students_without_courses` gives `["Finn"]`, and `course_sizes` includes `("Poetry", 0)`
:::

:::hint
The first query is a `LEFT JOIN` from students to enrollments, with `WHERE e.student_id IS NULL`.
:::

:::hint
For the second, start from `courses c LEFT JOIN enrollments e ON e.course_id = c.id`, use `GROUP BY c.id`, and select `COUNT(e.student_id)`.
:::

:::case name="a course nobody takes"
Poetry must appear with a count of 0. An inner join would drop it, and `COUNT(*)` would turn its single empty row into a 1.
:::

:::case name="students without courses"
Only Finn has no row in `enrollments`. Students who take at least one course must not appear.
:::
