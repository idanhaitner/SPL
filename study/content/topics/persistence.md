---
id: persistence
title: Persistence and SQL
sources:
  - "materials/lectures/Chapter 13 - Persistance.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS12.pptx"
  - "materials/sessions/SPL_PS13_PRES.pptx"
  - "materials/exams/15-a.pdf"
  - "materials/exams/15-a-solution.pdf"
  - "materials/exams/15-b.pdf"
  - "materials/exams/15-b-solution.pdf"
  - "materials/exams/16-a.pdf"
  - "materials/exams/16-a-solution.pdf"
  - "materials/exams/16-b.pdf"
  - "materials/exams/16-b-solution.pdf"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
  - "materials/exams/18-a.pdf"
  - "materials/exams/18-a-solution.pdf"
  - "materials/exams/18-b.pdf"
  - "materials/exams/18-b-solution.pdf"
  - "materials/exams/19-a.pdf"
  - "materials/exams/19-a-solution.pdf"
  - "materials/exams/19-b.pdf"
  - "materials/exams/19-b-solution.pdf"
  - "materials/exams/20-a.pdf"
  - "materials/exams/20-a-solution.pdf"
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
---

This chapter is persistence and the SQL a program sends to the DBMS.

- **Process memory:** lasts only as long as the process, and when the process exits those values are gone so another program cannot see them.
- **Files:** can outlive the process, but the application then owns the byte layout, the search, and the rules for two writers at once.
- **DBMS (database management system):** adds durable storage, a query language, integrity constraints, and transactions, so a concurrent update is one atomic unit of work.

## The relational model

The relational model (מודל רלציוני) stores data as tables.

- **Table:** a set of rows that share the same columns, and each column holds a single value.
- **SQL:** the language that defines those tables and asks questions of them.

:::definition id=def-relational title="Principles of the relational model" source="materials/lectures/Chapter 13 - Persistance.pptx"

- **Table:** an entity or a relationship. A row is one record. A column is one attribute.
- **Primary key (מפתח ראשי):** a column, or a set of columns, that identifies each row of the table uniquely.
- **Foreign key (מפתח זר):** the relational form of a pointer. Its values must equal a key of another table. The DBMS rejects a value that matches no row there. That rule is the referential integrity constraint.
:::

Mapping classes to tables:

- **Class:** becomes a table.
- **One-to-many (1:N):** a foreign key on the N side.
- **Many-to-many (N:M):** a **junction table** that holds foreign keys to both tables.
- **Repeated columns:** such as `course1`, `course2`, and `course3` freeze the length of the list, and a query cannot treat those columns as rows.

```sql
CREATE TABLE Students (
  Id INTEGER PRIMARY KEY,
  Name TEXT NOT NULL
);

CREATE TABLE Courses (
  Id INTEGER PRIMARY KEY,
  Title TEXT NOT NULL
);

CREATE TABLE Enrollment (
  StudentId INTEGER REFERENCES Students(Id),
  CourseId INTEGER REFERENCES Courses(Id),
  PRIMARY KEY (StudentId, CourseId)
);

```

### JOIN operations in SQL

SQL joins combine rows from two or more tables.

- **Inner join:** keeps the rows that satisfy the condition in both tables.
- **Left join:** keeps every row of the left table and fills the right side with null when nothing matches.
- **Join with no condition:** is the Cartesian product—every row of the left table paired with every row of the right table.
- **Relational algebra:** a join is that product followed by a selection.
- **`SELECT`:** the SQL statement that projects the columns you ask for.

```sql
-- Inner Join: returns only rows that match in both tables
SELECT S.Name, C.Title
FROM Students S
INNER JOIN Enrollment E ON S.Id = E.StudentId
INNER JOIN Courses C ON E.CourseId = C.Id;

-- Left Join: returns every row from the left table, even with no match on the right
SELECT S.Name, C.Title
FROM Students S
LEFT JOIN Enrollment E ON S.Id = E.StudentId
LEFT JOIN Courses C ON E.CourseId = C.Id;

```

![INNER JOIN of Alice to prog. Bob and systems are marked because they have no junction row, so they are absent from the result](../assets/figures/sql-join.svg)

## DTO, DAO, and repository

- **DTO (data transfer object):** an object that stands for one row of a table.
- **DAO (data access object):** a class that runs CRUD (`Create`, `Read`, `Update`, `Delete`) against a single table.
- **Repository:** a higher layer that holds business logic and queries spanning several tables or several DAOs.

:::problem id=worked-inner-join title="What an inner join returns" source="materials/lectures/Chapter 13 - Persistance.pptx" kind=worked solution_origin=source
Alice is enrolled in `prog`. Bob is enrolled in nothing. Both `prog` and `systems` exist. What does this query return, and what does a left join add?

```sql
SELECT S.name, C.name
FROM Students S
INNER JOIN StudentsCourses SC ON S.id = SC.student_id
INNER JOIN Courses C ON SC.course_id = C.id;
```

:::solution
- **Inner join:** returns one row—Alice with `prog`.
- **Bob:** has no junction row, so he is absent.
- **Unused course:** a course that nobody takes is absent as well.
- **Left join from students:** still returns Alice with `prog`, and returns Bob with a course name that is null, because the left table is kept.
- **`systems`:** is still absent, because the join started from students.
- **Right join from students toward courses:** would show `systems` with a null student and would leave Bob out.
:::
:::

:::check id=chk-fk
The value 9 in `Students.DeptId`, when `Departments` contains the ids 1 and 2, breaks which constraint?

- [ ] `PRIMARY KEY` on `Students.Id`
- [x] the foreign key from `DeptId` to `Departments.Id`
- [ ] `NOT NULL` on `Students.Name`

- **Foreign key:** requires every `DeptId` to equal the key of some row in `Departments`.
- **Primary key:** the uniqueness of `Students.Id` is the primary-key constraint.
:::

## Practice

:::problem id=ps12-foreign-key title="A teaching assistant's foreign key" source="materials/sessions/SPL_PS12.pptx" kind=exercise solution_origin=source
In session 12, `PRACTICAL_SESSIONS` has the columns `TA_ID`, `GroupNum`, `Location`, and `Time`. `TEACHING_ASSISTANTS` has `ID`, `Name`, and `OfficeHours`. `GroupNum` is the primary key of a practical session. `ID` is the primary key of a teaching assistant. A session's `TA_ID` refers to a teaching assistant.

:::check id=ps12-foreign-key-q1
`TA_ID` is an integer column declared {{=REFERENCES TEACHING_ASSISTANTS(ID)|PRIMARY KEY|REFERENCES PRACTICAL_SESSIONS(GroupNum)}}.

- **`TA_ID`:** refers to a teaching assistant.
- **`GroupNum`:** is the primary key of a practical session, and `ID` is the primary key of a teaching assistant.
:::

:::check id=ps12-foreign-key-q2
Which of these hold?

- [x] `GroupNum` is `INTEGER PRIMARY KEY` on `PRACTICAL_SESSIONS`
- [ ] `TA_ID` is the primary key of `PRACTICAL_SESSIONS`
- [x] `ID` is `INTEGER PRIMARY KEY` on `TEACHING_ASSISTANTS`
- [x] `Name` is `TEXT NOT NULL`, and `OfficeHours`, `Location`, and `Time` are text

- **`Name`:** is `TEXT NOT NULL` on `TEACHING_ASSISTANTS`.
- **`OfficeHours`, `Location`, and `Time`:** are text columns, and `TA_ID` is the foreign key.
:::

:::check id=ps12-foreign-key-q3
Inserting a practical session with `TA_ID = 8` fails when:

- [ ] `OfficeHours` is null
- [ ] `GroupNum` is already 8
- [x] no teaching assistant has `ID` 8

That is the constraint the insert example in session 12 is about to hit.
:::

:::problem id=ps12-join title="Joining a session and a teaching assistant" source="materials/sessions/SPL_PS12.pptx" kind=exercise solution_origin=source
Here are the two tables. In the example, Shaked is on two groups and Matan is on none.

```sql
CREATE TABLE TEACHING_ASSISTANTS (
  ID INTEGER PRIMARY KEY,
  Name TEXT NOT NULL,
  OfficeHours TEXT
);
CREATE TABLE PRACTICAL_SESSIONS (
  GroupNum INTEGER PRIMARY KEY,
  TA_ID INTEGER REFERENCES TEACHING_ASSISTANTS(ID),
  Location TEXT,
  Time TEXT
);
```

:::check id=ps12-join-q1
Which statement returns `Time`, `Location`, `GroupNum`, and the teaching assistant's `Name` for every practical session that has a teaching assistant?

- [ ] `SELECT * FROM TEACHING_ASSISTANTS LEFT JOIN PRACTICAL_SESSIONS ON ID = GroupNum`
- [ ] `SELECT ps.Time, ps.Location, ps.GroupNum, ta.Name FROM PRACTICAL_SESSIONS ps CROSS JOIN TEACHING_ASSISTANTS ta`
- [x] `SELECT ps.Time, ps.Location, ps.GroupNum, ta.Name FROM PRACTICAL_SESSIONS ps INNER JOIN TEACHING_ASSISTANTS ta ON ps.TA_ID = ta.ID`

The inner join matches `ps.TA_ID` to `ta.ID` and selects those four columns.
:::

:::check id=ps12-join-q2
Matan and Yair stay in the result, with `Time`, `Location`, and `GroupNum` all null, under a {{=LEFT JOIN|INNER JOIN|CROSS JOIN}} from `TEACHING_ASSISTANTS` to the practical sessions.

A `LEFT JOIN` from `TEACHING_ASSISTANTS` keeps Matan and Yair with those three columns null.
:::

:::check id=ps12-join-q3
Which of these hold for the inner join in the example?

- [ ] Matan appears once
- [x] Shaked appears twice, once for each group
- [x] Matan is absent

- **Shaked:** is on two groups, so the inner join emits one row per group.
- **Matan:** is on none, so he is absent.
:::

:::problem id=ps13-dto-dao title="DTO versus DAO" source="materials/sessions/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
The tester in session 13 has tables `students(id, name)`, `assignments(num, expected_output)`, and `grades(student_id, assignment_num, grade)`.

:::check id=ps13-dto-dao-q1
Which of these are DTOs?

- [x] `Student`
- [ ] `_Students`
- [x] `Assignment`
- [x] `Grade`

`Student`, `Assignment`, and `Grade` are the DTOs. `_Students`, `_Assignments`, and `_Grades` are the DAOs.
:::

:::check id=ps13-dto-dao-q2
`repo.get_grades_with_names()` belongs on the repository because:

- [ ] it implements `insert` and `find` for the `grades` table only
- [ ] it holds the connection for one table
- [x] it joins `grades` to `students` and returns rows with both `assignment_num` and `name`

- **Repository method:** is about more than one table.
- **Each DAO:** holds the connection and implements `insert` and `find` for a single table.
:::

:::check id=ps13-dto-dao-q3
Bob's submission `"main"` against `expected_output` `"Main"` is recorded as a mismatch because the comparison is {{=case-sensitive|case-insensitive|skipped}}.

- **Grade row:** records the mismatch, and the comparison reports a failure.
:::

:::check id=ps13-dto-dao-q4
`create_tables` is a method of the repository because:

- [ ] it maps one `students` row onto `Student`
- [x] it creates all three tables
- [ ] it is `_Grades.find`

It belongs on the repository for the same reason as the join: it is about more than one table.
:::

:::problem id=ps13-orm-find title="Mapping columns onto a DTO" source="materials/sessions/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
Session 13 replaces a hand-written `find` with generic row mapping.

- **`row_map(row, col_mapping, dto_type)`:** builds constructor arguments by field index and calls the DTO's constructor.
- **ORM (object-relational mapping):** is what this pattern implements; `row_map` is the row mapper.
- **`Assignment.find` (before):** used to be `return Assignment(*c.fetchone())`.
- **Generic `find`:** still builds `Assignment(num, expected_output)`.

:::check id=ps13-orm-find-q1
When the row is `(num, expected_output)`, `col_mapping` is {{=[0, 1]|[1, 0]|[0]}}.

- **`col_mapping`:** is the list of indexes in constructor order.
- **`dto_type(*ctor_args)`:** is `Assignment(num, expected_output)`.
:::

:::check id=ps13-orm-find-q2
When the query selected `expected_output` before `num`, `col_mapping` is:

- [ ] `[0, 1]`, because the mapping always follows the row from left to right
- [x] `[1, 0]`, so the constructor still receives `num` first
- [ ] `[0]`, because only `num` is passed

The constructor still receives `num` first, and `dto_type(*ctor_args)` is `Assignment(num, expected_output)`.
:::

:::check id=ps13-orm-find-q3
Which of these hold?

- [x] `col_mapping` lists indexes in constructor order
- [ ] `row_map` ignores `col_mapping` and always calls `Assignment(*row)`
- [x] A mapping that follows `SELECT *` blindly breaks when the table's column order changes

- **`SELECT *` mapping:** breaks as soon as the table's column order changes.
- **`INSERT` without column list:** has the same problem—the statement depends on a column order that can change.
:::

:::examnote
The question describes a small business in a few sentences and asks for tables, keys, and one `SELECT`. The trap is a list crammed into one column, or a join that multiplies rows because the junction table was left out.
:::

:::problem id=exam-15a-q4 title="The BigApple schema" source="materials/exams/15-a.pdf" kind=exam solution_origin=derived
BigApple stores a customer (name, phone, join date, and links to other customers who are family) and every action on the account (date and kind: a message sent, an outgoing call, a missed call, a message received, together with the other phone number).

:::check id=exam-15a-q4-q1
Which of these hold?

- [x] `Customers.phone` is `TEXT PRIMARY KEY`, with `name TEXT NOT NULL` and `joined DATE NOT NULL`
- [ ] A text column `relatives` on `Customers` is what the family query joins
- [x] `Family` has primary key `(phone, relative)`, and both columns reference `Customers(phone)`
- [x] `Actions.kind` is `TEXT NOT NULL`, `other_phone` is text, `at` is `TIMESTAMP NOT NULL`, and `phone` references `Customers(phone)`

- **`relatives` column:** a single text column on `Customers` cannot be joined.
- **`Actions.id`:** is `INTEGER PRIMARY KEY`.
:::

:::check id=exam-15a-q4-q2
Messages received by a family member are actions whose `kind` is {{='received'|'sent'|'missed call'}}.

The query joins `Family` on `f.phone = c.phone`, then `Actions` on `a.phone = f.relative` and `a.kind = 'received'`, where `c.name = 'Ringo Starr'`.
:::

:::check id=exam-15a-q4-q3
Which statement returns the messages received by the family members of Ringo Starr?

- [ ] `SELECT relatives FROM Customers WHERE name = 'Ringo Starr'`
- [ ] `SELECT a.* FROM Customers c JOIN Actions a ON a.phone = c.phone AND a.kind = 'received' WHERE c.name = 'Ringo Starr'`
- [x] `SELECT a.* FROM Customers c JOIN Family f ON f.phone = c.phone JOIN Actions a ON a.phone = f.relative AND a.kind = 'received' WHERE c.name = 'Ringo Starr'`

- **Action row:** is the relative's received message.
- **Path from Ringo:** goes through `Family`.
:::

:::check id=exam-15a-q4-q4
When family is symmetric, the rows in `Family` are stored as:

- [x] both directions, or the pair inserted in both orders
- [ ] one text column `relatives` on `Customers`
- [ ] a single `Actions` row whose `kind` is the relative's name

Store both directions in `Family`, or insert the pair in both orders, when family is symmetric.
:::

:::problem id=exam-15b-q4 title="Number porting" source="materials/exams/15-b.pdf" kind=exam solution_origin=derived
Extend BigApple with the kind of family relationship (parent, sibling, child), a table of competing carriers, and a history of number porting: the date the customer left, and the carrier they left for.

:::check id=exam-15b-q4-q1
The relationship kind is a {{=kind|left_on|carrier_id}} column added to `Family`.

- **`Family.kind`:** add `kind TEXT` to `Family`.
- **Carriers and porting:** are their own tables.
:::

:::check id=exam-15b-q4-q2
Which of these hold?

- [x] `Carriers` has `id INTEGER PRIMARY KEY` and `name TEXT UNIQUE NOT NULL`
- [ ] A porting history is two columns on `Customers`
- [x] `Portings` has primary key `(phone, left_on)`, `phone` referencing `Customers(phone)`, and `carrier_id` referencing `Carriers(id)`

- **`Portings`:** stores `phone`, `left_on`, and `carrier_id`.
- **Primary key `(phone, left_on)`:** allows more than one departure for the same phone.
:::

:::check id=exam-15b-q4-q3
Which statement lists every carrier Ringo Starr moved to, with the date?

- [ ] `SELECT kind, left_on FROM Family WHERE phone = 'Ringo Starr'`
- [x] `SELECT car.name, p.left_on FROM Customers c JOIN Portings p ON p.phone = c.phone JOIN Carriers car ON car.id = p.carrier_id WHERE c.name = 'Ringo Starr' ORDER BY p.left_on`
- [ ] `SELECT car.name FROM Actions a JOIN Carriers car ON a.kind = car.name WHERE a.phone = 'Ringo Starr'`

The query joins `Customers` to `Portings` to `Carriers` and orders by `p.left_on`.
:::

:::problem id=exam-16a-q4 title="Abbey Road sessions" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
Abbey Road stores recording sessions. A session has a date, a song, a band, and many takes. A take has people in roles: players (a person may play several instruments on one take), singers, and technicians. Billy Preston played keyboards during the Beatles' Get Back sessions, from January 1969.

:::check id=exam-16a-q4-q1
Which of these hold?

- [x] `Takes` has primary key `(session_id, take_no)`, and `session_id` references `Sessions(id)`
- [x] `Participations.person_id` references `People(id)`, and `(session_id, take_no)` references `Takes`
- [ ] `Takes.take_no` alone is the primary key of a take
- [x] The primary key of `Participations` is `(session_id, take_no, person_id, role, instrument)`

- **`Sessions`:** stores `id`, `on_date DATE NOT NULL`, `song TEXT NOT NULL`, and `band TEXT NOT NULL`.
- **`role` and `instrument`:** `role` is `TEXT NOT NULL` and `instrument` is text, and `instrument` is part of the participation primary key.
:::

:::check id=exam-16a-q4-q2
January 1969 is `s.on_date >= '1969-01-01' AND s.on_date` {{=< '1969-02-01'|= '1969-01-01'|> '1969-12-31'}}.

The query also requires `s.band = 'Beatles'`, `s.song = 'Get Back'`, `pe.name = 'Billy Preston'`, and `p.instrument = 'keyboards'`, and it orders by `s.on_date`.
:::

:::check id=exam-16a-q4-q3
Which join path returns `t.take_no` and `s.song`?

- [ ] `Sessions` joined to `People` on `s.band = pe.name`
- [x] `Sessions` to `Takes` on `t.session_id = s.id`, then `Participations` on `session_id` and `take_no`, then `People` on `pe.id = p.person_id`
- [ ] `Takes` joined to `Participations` on `t.take_no = p.person_id`

- **Select list:** is `t.take_no, s.song`.
- **Filters:** band, song, date, person, and instrument are filters on that join.
:::

:::problem id=exam-16b-q4 title="A fixed set of roles" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
The Abbey Road schema: a recording session has a date, a song, a band, and many takes. A take has people in roles (player, singer, technician), and the role is stored as text.

:::check id=exam-16b-q4-q1
While `role` is free text, Kim Philby appears as a double agent by:

- [ ] adding a boolean column for each role on `People`
- [ ] refusing every participation insert until a `Roles` table exists
- [x] inserting Kim into `People` and a `Participations` row with `role = 'double agent'`

The schema allows any role text, so this is data in the existing table.
:::

:::check id=exam-16b-q4-q2
After `CREATE TABLE Roles (name TEXT PRIMARY KEY)`, `Participations.role` {{=REFERENCES Roles(name)|PRIMARY KEY|REFERENCES People(id)}}.

- **Solution roles:** inserts `player`, `singer`, and `engineer`.
- **Double-agent insert:** then fails until that role is added on purpose.
:::

:::check id=exam-16b-q4-q3
Which of these hold?

- [x] The double-agent insert fails until that role is added on purpose
- [ ] Free text already rejects `role = 'double agent'`
- [x] `CHECK (role IN (...))` is the alternative when the constraint is on a single column

- **`Participations.role`:** references `Roles(name)`.
- **`CHECK (role IN (...))`:** is the alternative on a single column.
:::

:::problem id=exam-17a-q4 title="A glasses shop" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
An online glasses shop. The warehouse stores a model (model number, price). The shop registers a customer (name, id). A purchase records the customer id and the model, and the shop issues a receipt with a unique number and the purchase details. A customer can ask for the price of a model. The owner can list every receipt.

:::check id=exam-17a-q4-q1
The price column lives only on {{=Models|Receipts|Customers}}.

- **Price query:** is `SELECT price FROM Models WHERE model_no = ?`.
- **Catalog row:** it reads that row, so a later price change is what the customer is told.
:::

:::check id=exam-17a-q4-q2
Which statement lists every receipt?

- [ ] `SELECT price FROM Models WHERE model_no = ?`
- [x] `SELECT * FROM Receipts`
- [ ] `SELECT name FROM Customers WHERE id = model_no`

- **Every receipt:** is `SELECT * FROM Receipts`.
- **Price of a model:** is `SELECT price FROM Models WHERE model_no = ?`.
:::

:::check id=exam-17a-q4-q3
Which of these hold?

- [x] `Models.model_no` is `INTEGER PRIMARY KEY` and `price` is `INTEGER NOT NULL`
- [x] `Receipts.receipt_no` is `INTEGER PRIMARY KEY`
- [ ] `Receipts` stores the price and has no model number
- [x] `Receipts.customer_id` references `Customers(id)` and `Receipts.model_no` references `Models(model_no)`

- **Receipt and price:** a receipt stores the model number and can be joined back to the current price.
- **Price at sale:** when a receipt must remember the price charged at the sale, copy `price` onto `Receipts` at insert.
:::

:::problem id=exam-17b-q4 title="Garage jobs" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
A garage. A job has a car number, a fault description, and a job id. A worker has a name and an id. Assigning a worker to a job records the worker, the job, and that the job is unfinished. Finishing a job marks it done.

:::check id=exam-17b-q4-q1
A new assignment records unfinished work with `finished INTEGER NOT NULL DEFAULT` {{=0|1|NULL}}.

Unfinished jobs are the assignment rows with `finished = 0`.
:::

:::check id=exam-17b-q4-q2
Which statement returns a worker's unfinished jobs?

- [ ] `SELECT * FROM Jobs WHERE worker_id = ? AND finished = 0`
- [ ] `SELECT j.* FROM Assignments a JOIN Jobs j ON j.job_id = a.job_id WHERE a.worker_id = ? AND a.finished = 1`
- [x] `SELECT j.* FROM Assignments a JOIN Jobs j ON j.job_id = a.job_id WHERE a.worker_id = ? AND a.finished = 0`

The query joins `Assignments` to `Jobs` and keeps rows for that worker whose `finished` flag is 0.
:::

:::check id=exam-17b-q4-q3
Which of these hold?

- [x] `Jobs.job_id` is `INTEGER PRIMARY KEY`, and `Workers.id` is `TEXT PRIMARY KEY`
- [ ] Finishing a job deletes the assignment row
- [x] `Assignments` has primary key `(job_id, worker_id)`, with foreign keys to `Jobs(job_id)` and `Workers(id)`
- [x] Finishing a job is `UPDATE Assignments SET finished = 1 WHERE job_id = ? AND worker_id = ?`

- **`Jobs` and `Workers`:** `Jobs` stores `car_no TEXT NOT NULL` and `fault TEXT NOT NULL`; `Workers` stores `name TEXT NOT NULL`.
- **Finishing:** setting `finished` to 1 marks that assignment done.
:::

:::problem id=exam-18a-q4 title="A question bank" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
A question bank stores the text of each question, and a row for each year in which it was given, in one of the two sittings of that year. A question may return in a later year, and it must not be used twice in the same year.

:::check id=exam-18a-q4-q1
The key that rejects a second use in the same year is {{=PRIMARY KEY (question_id, year)|PRIMARY KEY (question_id)|PRIMARY KEY (year, moed)}}.

- **Primary key:** rejects a second insert of the same question in the same year, in either of the two sittings.
- **Later year:** is a new row.
:::

:::check id=exam-18a-q4-q2
Which of these hold?

- [x] `questions` has `id INTEGER PRIMARY KEY` and `text TEXT NOT NULL`
- [x] `asked.question_id` references `questions(id)`, `year` is `INTEGER NOT NULL`, and `moed` is `TEXT NOT NULL`
- [ ] `year_a` and `year_b` on `questions` store every later year
- [ ] `question_id_A` and `question_id_B` are the right grain for every question used in a year

- **`year_a` and `year_b`:** remember only two uses.
- **Year-table foreign keys:** two foreign keys in a year table remember one pair of questions for the year, which is the wrong grain.
:::

:::check id=exam-18a-q4-q3
Which statement enforces one use of a question per year?

- [ ] `questions(id, text, year_a, year_b)` with no `asked` table
- [ ] a year table whose only question links are `question_id_A` and `question_id_B`
- [x] `asked(question_id, year, moed)` with `PRIMARY KEY (question_id, year)`

The primary key includes the year and not the sitting, so a second sitting in that year collides with the first insert.
:::

:::problem id=exam-18b-q4 title="Police wiretaps" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
Police wiretaps. A recording stores the text, the caller's number, the destination number, and the date. Each phone number has an owner's name and an address.

Phone numbers are stored in this table:

```sql
CREATE TABLE phone (
  phone_num INT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL
);
```

:::check id=exam-18b-q4-q1
The names of both owners come from joining `phone` {{=twice|once|with a cross join}}.

- **`from_num` and `to_num`:** each reference `phone(phone_num)`.
- **Join aliases:** are `src` and `dst`.
:::

:::check id=exam-18b-q4-q2
Which statement returns the recordings of a given number, with both owners' names?

- [ ] `SELECT r.body, phone.name FROM recordings r JOIN phone ON phone.phone_num = r.from_num WHERE r.from_num = ?`
- [x] `SELECT r.at, r.body, src.name, dst.name FROM recordings r JOIN phone src ON src.phone_num = r.from_num JOIN phone dst ON dst.phone_num = r.to_num WHERE r.from_num = ? OR r.to_num = ?`
- [ ] `SELECT src.name, dst.name FROM phone src JOIN phone dst ON src.phone_num = dst.phone_num`

- **Filter:** keeps a recording when the given number is `from_num` or `to_num`.
- **Select list:** is `r.at`, `r.body`, `src.name`, and `dst.name`.
:::

:::check id=exam-18b-q4-q3
Which of these hold for `recordings`?

- [ ] `body` is the primary key
- [x] `id` is `INTEGER PRIMARY KEY`
- [x] `at` is `TIMESTAMP NOT NULL` and `body` is `TEXT NOT NULL`
- [x] `from_num` and `to_num` both reference `phone(phone_num)`

- **`id`:** is the primary key.
- **Number columns:** both are foreign keys to `phone(phone_num)`.
:::

:::problem id=exam-19a-q4 title="An Airbnb schema" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
Airbnb. A user has an id and may be a guest, a host, or both. A property has an id, one host, a price per night, and a description. A rental has a guest, a property (and therefore the host of that property), a check-in, and a check-out. After check-out the host writes a recommendation of the guest and the guest writes one of the host.

:::check id=exam-19a-q4-q1
The foreign key to the host is {{=properties.host_id|users.host_id|rentals.host_id}}, referencing `users(id)`.

- **`properties.host_id`:** references `users(id)`.
- **People table:** there is no second table of people.
:::

:::check id=exam-19a-q4-q2
Which of these hold?

- [x] `users` is the only people table, with `id INTEGER PRIMARY KEY` and `name TEXT NOT NULL`
- [ ] Guests and hosts are two tables, each with its own primary key
- [x] `recommendations` has primary key `(rental_id, author_id)`
- [x] `author_id` and `about_id` both reference `users(id)`, and `rental_id` references `rentals(id)`

- **Dual-role user:** appears as `host_id` on some property and as `guest_id` on some rental.
- **Recommendation row:** stores `rental_id`, `author_id`, `about_id`, and `text TEXT NOT NULL`.
:::

:::check id=exam-19a-q4-q3
Which column list matches `rentals`?

- [ ] `guest_id`, `host_id`, `check_in DATE NOT NULL`, `check_out DATE NOT NULL`
- [ ] `property_id INTEGER PRIMARY KEY` and `price INTEGER NOT NULL`
- [x] `guest_id` referencing `users(id)`, `property_id` referencing `properties(property_id)`, `check_in DATE NOT NULL`, and `check_out DATE`

- **`rentals` columns:** `guest_id`, `property_id`, `check_in DATE NOT NULL`, and `check_out DATE`.
- **`price` and `host_id`:** are columns of `properties`.
:::

:::problem id=exam-19b-q4 title="One night per property" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
A user has an id and may be a guest, a host, or both. A property has an id, one host, a price per night, and a description. A rental has a guest, a property, a check-in, and a check-out. Two guests cannot share a property on the same night.

:::check id=exam-19b-q4-q1
The `nights` primary key is {{=(property_id, night)|(rental_id)|(night)}}.

- **Booking:** writes one `nights` row for each night of the stay.
- **Occupied night:** a second guest on an occupied night hits the primary key and the insert fails.
:::

:::check id=exam-19b-q4-q2
A `CHECK` constraint:

- [x] looks at the row being written
- [ ] compares two rental rows and rejects overlapping dates by itself
- [ ] is the primary key of `rentals`

The extra `nights` table is what makes the collision visible to the DBMS.
:::

:::check id=exam-19b-q4-q3
Which of these hold?

- [x] `nights.property_id` references `properties(property_id)`
- [ ] The primary key of `nights` is `(rental_id)` alone
- [x] `nights.rental_id` references `rentals(id)`
- [x] Who is staying at property P on night D is a join from `nights` to `rentals` to `users`

- **Base tables:** users, properties, and rentals stay as in the question.
- **`nights`:** adds `property_id`, `night`, and `rental_id`.
:::

:::problem id=exam-20a-q4 title="A DVD schema" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
A DVD service. Users have an id and a name. Movies have an id, a name, a description, any number of categories from {Action, Drama, Romance, kids}, an average `score`, and `num_scorers`. A viewing records the user, the movie, and the date.

:::check id=exam-20a-q4-q1
A movie with no category row is kept by a {{=LEFT JOIN|INNER JOIN|CROSS JOIN}} from `movies` to `categories`.

- **Query shape:** joins `watches` to `movies`, then left-joins `categories` on `c.movie_id = m.id`, for `w.user_id = ?`.
- **`LEFT JOIN`:** keeps a movie that has no category row.
:::

:::check id=exam-20a-q4-q2
Which of these hold?

- [x] `categories` has primary key `(movie_id, category)` and `movie_id` references `movies(id)`
- [ ] `movies` stores every category in one `category` column
- [x] `watches` has primary key `(user_id, movie_id, on_date)`
- [x] `movies.score` is `REAL` and `movies.num_scorers` is `INTEGER NOT NULL DEFAULT 0`

- **`watches`:** `watches.user_id` references `users(id)`, `watches.movie_id` references `movies(id)`, and `on_date` is `DATE NOT NULL`.
- **`categories.category`:** is `TEXT NOT NULL`.
:::

:::check id=exam-20a-q4-q3
A movie with two categories in this query:

- [ ] appears once, with both categories in one column
- [x] appears twice, once per category
- [ ] is dropped, because the category join is a left join

A movie with two categories appears twice, once per category, which is the junction table doing its work.
:::

:::problem id=exam-20b-q4 title="An average score" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
Users have an id and a name. Movies have an id, a name, a description, any number of categories from {Action, Drama, Romance, kids}, an average `score`, and `num_scorers`. A viewing records the user, the movie, and the date. A user submits a new score `s`.

:::check id=exam-20b-q4-q1
The new average stored on the movie is this expression.

```sql
(score * num_scorers + :s) / ({{=num_scorers + 1|num_scorers|score + 1}})
```

Both columns change in one `UPDATE`: `score` becomes that value and `num_scorers` becomes `num_scorers + 1`, for `WHERE id = :movie`.
:::

:::check id=exam-20b-q4-q2
Which statement lists movies in a category sorted by score?

- [ ] `SELECT m.name, m.score FROM movies m ORDER BY m.num_scorers`
- [x] `SELECT m.name, m.score FROM movies m JOIN categories c ON c.movie_id = m.id WHERE c.category = 'Drama' ORDER BY m.score DESC`
- [ ] `SELECT m.name, m.score FROM movies m LEFT JOIN categories c ON c.movie_id = m.id WHERE m.score IS NOT NULL`

- **Join:** is an inner join, so a movie with no Drama row is absent.
- **Filter and order:** `c.category = 'Drama'` and `m.score DESC`.
:::

:::check id=exam-20b-q4-q3
Which of these hold?

- [x] One `UPDATE` changes `score` and `num_scorers` together
- [x] Two statements need a transaction if that pair is to stay atomic
- [ ] Object serialization makes those two column writes atomic by itself
- [ ] The category query keeps a movie that has no Drama row

- **Object serialization:** writes bytes and leaves the two statements independent.
- **DBMS:** supplies the transaction.
:::

The persistence layer in session 13 connects a Java or Python server to the database.

- **[Reactor](topic:reactor):** the server from this topic runs these SQL statements.
- **DAO layer:** the SQL stays in the data-access objects.
- **Repository:** the protocol calls the repository.
