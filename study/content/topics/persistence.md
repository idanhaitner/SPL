---
id: persistence
title: Persistence and SQL
sources:
  - "Classes/Chapter 13 - Persistance.pptx"
  - "Exrecises/SPL_PS12.pptx"
  - "Exrecises/SPL_PS13_PRES.pptx"
  - "Exams/15-a.pdf"
  - "Exams/15-a-solution.pdf"
  - "Exams/15-b.pdf"
  - "Exams/15-b-solution.pdf"
  - "Exams/16-a.pdf"
  - "Exams/16-a-solution.pdf"
  - "Exams/16-b.pdf"
  - "Exams/16-b-solution.pdf"
  - "Exams/17-a.pdf"
  - "Exams/17-a-solution.pdf"
  - "Exams/17-b.pdf"
  - "Exams/17-b-solution.pdf"
  - "Exams/18-a.pdf"
  - "Exams/18-a-solution.pdf"
  - "Exams/18-b.pdf"
  - "Exams/18-b-solution.pdf"
  - "Exams/19-a.pdf"
  - "Exams/19-a-solution.pdf"
  - "Exams/19-b.pdf"
  - "Exams/19-b-solution.pdf"
  - "Exams/20-a.pdf"
  - "Exams/20-a-solution.pdf"
  - "Exams/20-b.pdf"
  - "Exams/20-b-solution.pdf"
---

RAM forgets. It needs power, it is wiped on reboot, it dies with the process, and it is the expensive, smaller store. A disk keeps bytes until somebody deletes them, and it is large. Serialization can put an object on that disk. Chapter 13 lists why that is not yet a database: a lookup deserializes whole objects, there is no index, an update rewrites the file, concurrency is a lock you invent, and there are no transactions.

A database management system is the runtime for that data. The lecture names MS SQL Server, MySQL, Oracle, and SQLite. Underneath, the layers are disk access, file access, operations on rows, and queries.

## The relational model

:::definition id=def-relational title="Relational database" source="Classes/Chapter 13 - Persistance.pptx"
A relational database (בסיס נתונים רלציוני) stores rows in tables. A column has a name and a type. A primary key (מפתח ראשי) identifies one row. A foreign key (מפתח זר) is a reference to a key in another table, and it should be unique at the target, usually that table's primary key. A column may be `NOT NULL` or `UNIQUE`.

The design rule on the slides: a class becomes a table, a reference becomes a foreign key, and a list becomes another table. The pair `(student id, course id)` in that extra table is the primary key of the link, and each column is a foreign key.
:::

The lecture's university:

| students | | | |
| --- | --- | --- | --- |
| id | name | login | dept |
| 3984 | Alice | alice12 | 1 |

| departments | | |
| --- | --- | --- |
| id | name | building |
| 1 | science | 37 |

| courses | | |
| --- | --- | --- |
| id | name | teacher |
| 1 | prog | Gil |

A student's list of courses is not a column of arrays. It is `StudentsCourses(StudId, CourseId, Year, Grade)` with primary key `(StudId, CourseId, Year)`.

NoSQL, on one slide, is the other family: a key-value store, closer to a hash table, with MongoDB and Redis as the examples. The rest of the chapter, and every exam, is relational SQL.

### DDL

SQL's data definition language creates and destroys the shape.

```sql
CREATE TABLE Students (
  Id INTEGER PRIMARY KEY,
  Name VARCHAR(20) NOT NULL,
  Login VARCHAR(10) UNIQUE,
  DeptId INTEGER REFERENCES Departments(Id)
);
CREATE TABLE Departments (
  Id INTEGER PRIMARY KEY,
  Name VARCHAR(20) UNIQUE NOT NULL,
  Building INTEGER
);
CREATE INDEX idx_departments_name ON Departments(name);
CREATE TABLE StudentsCourses (
  StudId INTEGER,
  CourseId INTEGER,
  Year INTEGER,
  Grade INTEGER,
  PRIMARY KEY (StudId, CourseId, Year),
  FOREIGN KEY (StudId) REFERENCES Students(Id),
  FOREIGN KEY (CourseId) REFERENCES Courses(Id)
);
```

A schema (סכימה) is a namespace of tables. `CREATE SCHEMA University;` and `DROP SCHEMA`. `DROP TABLE Students;`, `DROP INDEX ...`, and `ALTER TABLE Students ADD COLUMN Email VARCHAR(50);` are the other DDL commands on the slides.

### DML

Data manipulation language changes and reads rows.

```sql
INSERT INTO Departments (Id, Name, Building) VALUES (1, 'science', 37);
INSERT INTO Students (Id, DeptId) VALUES (2485, 2);          -- fails: Name is NOT NULL
INSERT INTO Students (Id, Name, DeptId) VALUES (2485, 'Bob', 2);  -- Login may be omitted
```

Omitting the column list, `INSERT INTO Courses VALUES (1, 'prog', 'Gil')`, works only while the table's column order matches. The lecture advises against it.

```sql
UPDATE Students SET Login = 'bob12' WHERE Id = 2485;   -- one row, Id is unique
UPDATE Students SET Login = 'x';                        -- every row
DELETE FROM Students WHERE Id = 2485;
DELETE FROM Students WHERE Id < 3000;
DELETE FROM Students;                                   -- every row, the table remains
```

`SELECT` is the read.

```sql
SELECT * FROM Students;
SELECT Id, Name FROM Students;
SELECT * FROM Students WHERE Id = 3984;
```

`SELECT Students.Name, Courses.Name FROM Students, Courses` with no join condition is the Cartesian product: every student paired with every course. Alice appears once per course. The repair is an inner join.

```sql
SELECT S.name, C.name
FROM Students S
INNER JOIN StudentsCourses SC ON S.id = SC.student_id
INNER JOIN Courses C ON SC.course_id = C.id;
```

![Students, the enrollment table, and courses. Alice links to prog. Bob and systems have no link row](../assets/figures/sql-join.svg)

`INNER JOIN` keeps only rows that match. `LEFT JOIN` keeps every student, with null course columns when the student has no enrollment. `RIGHT JOIN` keeps every course, with null student columns when nobody took it. `FULL JOIN` keeps both. Session 12's teaching-assistant tables are the same pattern: `PRACTICAL_SESSIONS.TA_ID` references `TEACHING_ASSISTANTS.ID`, and a left join shows Matan and Yair with null session columns because they have no group.

Session 13 puts a Python program in front of these tables. A DTO is one row as an object (`Student` for table `students`). A DAO is the object that `insert`s and `find`s that DTO, usually one table, often a singleton. A repository holds several DAOs and the methods that join tables, including `create_tables`. An ORM is the generic version: `row_map` builds a DTO from a row by column order, and one DAO class serves every table. The assignment-grader example stores `students`, `assignments`, and `grades`, runs a submitted file, and writes a grade row. Bob fails because his function returns `"main"` and the expected output is `"Main"`.

:::problem id=worked-inner-join source="Classes/Chapter 13 - Persistance.pptx" kind=worked solution_origin=source
Alice is enrolled in `prog`. Bob is enrolled in nothing. `prog` and `systems` both exist. What does the inner join of students to courses through `StudentsCourses` return, and what does a left join add?

:::solution
The inner join returns one row, Alice with `prog`. Bob has no link row, so he disappears. A course nobody takes disappears too.

The left join from students still returns Alice with `prog`, and it returns Bob with a null course name. Bob is kept because the left table is kept. `systems` still does not appear, because the join started from students. A right join from students to courses would show `systems` with a null student and would drop Bob.
:::
:::

:::check id=chk-fk
A `Students.DeptId` value of 9, when `Departments` has ids 1 and 2, violates which constraint?

- [ ] `PRIMARY KEY` on `Students.Id`
- [x] The foreign key from `DeptId` to `Departments.Id`
- [ ] `NOT NULL` on `Students.Name`

A foreign key says every `DeptId` is some department's id. Uniqueness of `Students.Id` is a different constraint.
:::

:::trap
`SELECT * FROM A, B` looks like a join and is a product. On a table of a thousand rows against another thousand, you get a million rows. The lecture's Alice-times-every-course listing is that bug at small scale.
:::

:::trap
A list stored as one comma-separated column cannot be a foreign key, and it cannot be indexed as membership. The lecture's rule is another table.
:::

## Practice

:::problem id=ps12-foreign-key source="Exrecises/SPL_PS12.pptx" kind=exercise solution_origin=source
Session 12's `PRACTICAL_SESSIONS` has columns `TA_ID`, `GroupNum`, `Location`, `Time`. `TEACHING_ASSISTANTS` has `ID`, `Name`, `OfficeHours`. Write the two `CREATE TABLE` statements. `GroupNum` is the primary key of a session. `ID` is the primary key of an assistant. A session's `TA_ID` refers to an assistant.

:::hint
The foreign key is the column whose meaning is "the id of a row over there."
:::
:::hint
`OfficeHours` and `Time` can be text. `ID` and `GroupNum` are integers.
:::
:::hint
Declare the referenced table's primary key before you rely on it, or declare the foreign key after both tables exist.
:::
:::solution
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

Inserting a session with `TA_ID = 8` fails if no assistant has `ID` 8. That is the constraint the session's insert example is about to bump into.
:::
:::

:::problem id=ps12-join source="Exrecises/SPL_PS12.pptx" kind=exercise solution_origin=source
Using the tables above, write a query that returns `Time`, `Location`, `GroupNum`, and the assistant's `Name` for every session that has an assistant. Then say what a left join from assistants adds that this query hides. The session's sample has Shaked on two groups and Matan on none.

:::hint
Match `PRACTICAL_SESSIONS.TA_ID` to `TEACHING_ASSISTANTS.ID`.
:::
:::hint
An inner join drops the assistant with no session.
:::
:::hint
Qualify the columns both tables share, or alias the tables.
:::
:::solution
```sql
SELECT ps.Time, ps.Location, ps.GroupNum, ta.Name
FROM PRACTICAL_SESSIONS ps
INNER JOIN TEACHING_ASSISTANTS ta ON ps.TA_ID = ta.ID;
```

Shaked appears twice, once for each group. Matan does not appear. A `LEFT JOIN` from `TEACHING_ASSISTANTS` to sessions keeps Matan and Yair, with null `Time`, `Location`, and `GroupNum`, which is the second result table on the session's slide.
:::
:::

:::problem id=ps13-dto-dao source="Exrecises/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
Session 13's grader has tables `students(id, name)`, `assignments(num, expected_output)`, and `grades(student_id, assignment_num, grade)`. Name the DTO, the DAO, and the repository method that returns a grade together with the student's name. Say why that last method is not on the grades DAO.

:::hint
A DTO is one row. Its name is the table's row, singular.
:::
:::hint
A DAO's methods mention one table.
:::
:::hint
A join crosses tables, so it lives on the repository.
:::
:::solution
`Student`, `Assignment`, and `Grade` are the DTOs. `_Students`, `_Assignments`, and `_Grades` are the DAOs, each holding the connection and implementing `insert` and `find` for one table. `repo.get_grades_with_names()` joins `grades` to `students` and returns rows that have both `assignment_num` and `name`. That method is on the repository because it is not about one table. `create_tables` is also on the repository, for the same reason: it creates all three.

Bob's submission returns `"main"` and the assignment's `expected_output` is `"Main"`, so his grade row records the mismatch. The comparison is case-sensitive because the session prints that he failed for exactly that reason.
:::
:::

:::problem id=ps13-orm-find source="Exrecises/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
The session replaces a hand-written `find` with `row_map(row, col_mapping, dto_type)`, which builds constructor arguments by column index and calls the DTO constructor. `Assignment.find` used to be `return Assignment(*c.fetchone())`. What must `col_mapping` contain so the generic `find` still constructs `Assignment(num, expected_output)`?

:::hint
The constructor argument order is the DTO's order, not whatever order `SELECT *` happens to use, unless you made those orders match.
:::
:::hint
`row_map` indexes the row with each entry of `col_mapping`.
:::
:::hint
`Assignment` takes `num` then `expected_output`.
:::
:::solution
`col_mapping` is the list of indexes in constructor order. If the row is `(num, expected_output)`, the mapping is `[0, 1]`. If a query selected `expected_output` before `num`, the mapping is `[1, 0]`, so the constructor still receives `num` first. `dto_type(*ctor_args)` is `Assignment(num, expected_output)`. A mapping that follows `SELECT *` blindly breaks as soon as the table's column order changes, which is the same warning the SQL lecture gave about `INSERT` without a column list.
:::
:::


:::examnote
The question describes a small business in sentences and asks for tables, keys, and one `SELECT`. The trap is a list crammed into one column, or a join that multiplies rows because the link table was left out.
:::

:::problem id=exam-15a-q4 source="Exams/15-a.pdf" kind=exam solution_origin=derived
BigApple stores a customer (name, phone, join date, and links to other customers who are family) and each action on the account (a date and a kind: sent message, outgoing call, missed call, received message, with the other phone number).

a. Define the tables.
b. SQL for the messages received by members of Ringo Starr's family.

:::hint
Family is a relation between two customers, so it is a table, not a column of names.
:::
:::hint
An action's kind is either a column or a small table. The other phone number is a column of the action.
:::
:::hint
"Family of Ringo" is a join from Ringo through the family table, then to received-message actions.
:::
:::solution
```sql
CREATE TABLE Customers (
  phone TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  joined DATE NOT NULL
);
CREATE TABLE Family (
  phone TEXT REFERENCES Customers(phone),
  relative TEXT REFERENCES Customers(phone),
  PRIMARY KEY (phone, relative)
);
CREATE TABLE Actions (
  id INTEGER PRIMARY KEY,
  phone TEXT REFERENCES Customers(phone),
  kind TEXT NOT NULL,
  other_phone TEXT,
  at TIMESTAMP NOT NULL
);
SELECT a.*
FROM Customers c
JOIN Family f ON f.phone = c.phone
JOIN Actions a ON a.phone = f.relative AND a.kind = 'received'
WHERE c.name = 'Ringo Starr';
```

Store both directions in `Family`, or insert the pair in both orders, if "family" is symmetric. A single `relatives` text column on `Customers` cannot be joined.
:::
:::

:::problem id=exam-15b-q4 source="Exams/15-b.pdf" kind=exam solution_origin=derived
Extend BigApple with the kind of family relation (parent, sibling, child), a table of competing carriers, and a history of number portability: the date the customer left, and the carrier they left to.

a. (5) The extra tables.
b. (5) Every carrier Ringo Starr has moved to, with the date.

:::hint
Do not add a column to `Actions` for this. Portability is not a call.
:::
:::hint
A customer can leave more than once, so the history is a table, not two columns on `Customers`.
:::
:::hint
The family kind is a column on the existing family table.
:::
:::solution
Add `kind TEXT` to `Family`. Add `Carriers(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL)`. Add `Portings(phone TEXT REFERENCES Customers(phone), left_on DATE, carrier_id INTEGER REFERENCES Carriers(id), PRIMARY KEY (phone, left_on))`.

```sql
SELECT car.name, p.left_on
FROM Customers c
JOIN Portings p ON p.phone = c.phone
JOIN Carriers car ON car.id = p.carrier_id
WHERE c.name = 'Ringo Starr'
ORDER BY p.left_on;
```
:::
:::

:::problem id=exam-16a-q4 source="Exams/16-a.pdf" kind=exam solution_origin=derived
Abbey Road stores recording sessions. A session has a date, a song, a band, and many takes. A take has people in roles: players (a person may play several instruments on one take), singers, and engineers.

a. (5) Tables.
b. (5) The take numbers and song names where Billy Preston played keyboards during the Beatles' Get Back sessions, from January 1969, ordered by date ascending.

:::hint
A take belongs to a session. A participation belongs to a take and a person and a role, and the instrument is a column of that participation.
:::
:::hint
"Several instruments" means several participation rows, not one instruments column.
:::
:::hint
Filter band, date, person, and instrument, then project take number and song.
:::
:::solution
```sql
CREATE TABLE Sessions (
  id INTEGER PRIMARY KEY,
  on_date DATE NOT NULL,
  song TEXT NOT NULL,
  band TEXT NOT NULL
);
CREATE TABLE Takes (
  session_id INTEGER REFERENCES Sessions(id),
  take_no INTEGER,
  PRIMARY KEY (session_id, take_no)
);
CREATE TABLE People (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE Participations (
  session_id INTEGER,
  take_no INTEGER,
  person_id INTEGER REFERENCES People(id),
  role TEXT NOT NULL,
  instrument TEXT,
  PRIMARY KEY (session_id, take_no, person_id, role, instrument),
  FOREIGN KEY (session_id, take_no) REFERENCES Takes(session_id, take_no)
);
SELECT t.take_no, s.song
FROM Sessions s
JOIN Takes t ON t.session_id = s.id
JOIN Participations p ON p.session_id = s.id AND p.take_no = t.take_no
JOIN People pe ON pe.id = p.person_id
WHERE s.band = 'Beatles' AND s.song = 'Get Back'
  AND s.on_date >= '1969-01-01' AND s.on_date < '1969-02-01'
  AND pe.name = 'Billy Preston' AND p.instrument = 'keyboards'
ORDER BY s.on_date;
```
:::
:::

:::problem id=exam-16b-q4 source="Exams/16-b.pdf" kind=exam solution_origin=derived
The Abbey Road schema is given.

a. Show how Kim Philby can appear as a participant in the role of double agent.
b. Restrict roles to a fixed set: player, singer, engineer.

:::hint
If `role` is free text, the row is just another participation. The restriction is a table of legal roles or a check.
:::
:::hint
A foreign key to a `Roles` table rejects a role that was not inserted.
:::
:::hint
Do not add a boolean column per role. A new role would be a schema change.
:::
:::solution
a. Insert Kim into `People` and a `Participations` row with `role = 'double agent'`. The schema allows any role text, so this is data, not a new table.

b. `CREATE TABLE Roles (name TEXT PRIMARY KEY);` insert `player`, `singer`, `engineer`. Change `Participations.role` to `REFERENCES Roles(name)`. The double-agent insert then fails until that role is added on purpose. A `CHECK (role IN (...))` is the alternative when the exam wants the constraint in one column.
:::
:::

:::problem id=exam-17a-q4 source="Exams/17-a.pdf" kind=exam solution_origin=derived
An online glasses shop. Stock a model (model number, price). Register a customer (name, id). A purchase records the customer id and the model, and the shop issues a receipt with a unique number and the purchase details. A customer can ask the price of a model. The owner can list every receipt.

Give the tables and the two queries: price of a model, and all receipts.

:::hint
A receipt is a row, not a printout. Its primary key is the receipt number.
:::
:::hint
The model number on a purchase is a foreign key. Typing it twice invites a mismatch with the price.
:::
:::hint
The price query does not touch receipts.
:::
:::solution
```sql
CREATE TABLE Models (
  model_no INTEGER PRIMARY KEY,
  price INTEGER NOT NULL
);
CREATE TABLE Customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE Receipts (
  receipt_no INTEGER PRIMARY KEY,
  customer_id TEXT REFERENCES Customers(id),
  model_no INTEGER REFERENCES Models(model_no)
);
SELECT price FROM Models WHERE model_no = ?;
SELECT * FROM Receipts;
```

The price lives only on `Models`, so a later price change does not require editing old receipts if the question wanted the price at sale time. If it did, copy `price` onto `Receipts` at insert. The question's "price of a model" reads the catalog.
:::
:::

:::problem id=exam-17b-q4 source="Exams/17-b.pdf" kind=exam solution_origin=derived
A garage. A job has a car number, a fault description, and a job id. A worker has a name and an id. Assigning a worker to a job records the worker, the job, and that it is not finished. Finishing a job marks it done.

Tables, plus the query for a worker's unfinished jobs.

:::hint
"Not finished" is a column on the assignment, or a null `finished_at`.
:::
:::hint
One job can exist before it has a worker, so the job table and the assignment table are not the same.
:::
:::hint
The query filters the worker and the unfinished flag.
:::
:::solution
```sql
CREATE TABLE Jobs (
  job_id INTEGER PRIMARY KEY,
  car_no TEXT NOT NULL,
  fault TEXT NOT NULL
);
CREATE TABLE Workers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE Assignments (
  job_id INTEGER REFERENCES Jobs(job_id),
  worker_id TEXT REFERENCES Workers(id),
  finished INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (job_id, worker_id)
);
SELECT j.*
FROM Assignments a
JOIN Jobs j ON j.job_id = a.job_id
WHERE a.worker_id = ? AND a.finished = 0;
```

Finishing is `UPDATE Assignments SET finished = 1 WHERE job_id = ? AND worker_id = ?`.
:::
:::

:::problem id=exam-18a-q4 source="Exams/18-a.pdf" kind=exam solution_origin=derived
A question bank stores each question's text, and a record of every year it was set, in either sitting of that year. A question may repeat in a later year and must not be used twice in the same year. Choose the schema that enforces that, and say which key does the work.

:::hint
One row per question, and one row per (question, year, moed), is the shape that can repeat across years.
:::
:::hint
"Not twice in one year" is a primary key that includes the year.
:::
:::hint
A pair of columns `year_a` and `year_b` on the question cannot store a third year.
:::
:::solution
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL
);
CREATE TABLE asked (
  question_id INTEGER REFERENCES questions(id),
  year INTEGER NOT NULL,
  moed TEXT NOT NULL,
  PRIMARY KEY (question_id, year)
);
```

The primary key `(question_id, year)` rejects a second insert of the same question in the same year, whichever moed. A later year is a new row. Columns `year_a` and `year_b` on `questions` only remember two uses and cannot express the constraint for a third sitting. If the paper's option uses `question_id_A` and `question_id_B` as two foreign keys in a year table, that remembers one pair of questions per year and is the wrong grain.
:::
:::

:::problem id=exam-18b-q4 source="Exams/18-b.pdf" kind=exam solution_origin=derived
Police wiretaps. A recording stores the text, the caller's number, the callee's number, and the date. Each phone number has an owner name and address.

The paper starts:

```sql
CREATE TABLE phone (
  phone_num INT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL
);
```

Finish the schema and write a query for the recordings of a given number, with both owners' names.

:::hint
A call has two foreign keys into `phone`, so you join `phone` twice.
:::
:::hint
Alias the two joins. Otherwise `name` is ambiguous.
:::
:::hint
The recording's primary key can be a surrogate id.
:::
:::solution
```sql
CREATE TABLE recordings (
  id INTEGER PRIMARY KEY,
  from_num INT REFERENCES phone(phone_num),
  to_num INT REFERENCES phone(phone_num),
  at TIMESTAMP NOT NULL,
  body TEXT NOT NULL
);
SELECT r.at, r.body, src.name, dst.name
FROM recordings r
JOIN phone src ON src.phone_num = r.from_num
JOIN phone dst ON dst.phone_num = r.to_num
WHERE r.from_num = ? OR r.to_num = ?;
```
:::
:::

:::problem id=exam-19a-q4 source="Exams/19-a.pdf" kind=exam solution_origin=derived
Airbnb. A user has an id and may be a guest, a host, or both. A property has an id, one host, a nightly price, and a description. A rental has a guest, a property (and therefore that property's host), a check-in, and a check-out. After checkout, the host writes a recommendation of the guest and the guest writes one of the host.

Three parts on the paper ask you to complete the schema and one query. Give the tables.

:::hint
"Guest or host or both" is not two subclasses with two primary keys. One `users` table, and a property points at a host id.
:::
:::hint
A recommendation is a row written at the end of a rental, with an author and a subject.
:::
:::hint
One host, many properties: the foreign key lives on the property.
:::
:::solution
```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE properties (
  property_id INTEGER PRIMARY KEY,
  host_id INTEGER REFERENCES users(id),
  price INTEGER NOT NULL,
  description TEXT NOT NULL
);
CREATE TABLE rentals (
  id INTEGER PRIMARY KEY,
  guest_id INTEGER REFERENCES users(id),
  property_id INTEGER REFERENCES properties(property_id),
  check_in DATE NOT NULL,
  check_out DATE
);
CREATE TABLE recommendations (
  rental_id INTEGER REFERENCES rentals(id),
  author_id INTEGER REFERENCES users(id),
  about_id INTEGER REFERENCES users(id),
  text TEXT NOT NULL,
  PRIMARY KEY (rental_id, author_id)
);
```

A user who both hosts and travels is just a user who appears as `host_id` on some property and as `guest_id` on some rental. No second table.
:::
:::

:::problem id=exam-19b-q4 source="Exams/19-b.pdf" kind=exam solution_origin=derived
The same Airbnb facts, plus: two guests cannot share a property on the same night. Enforce that in the schema, not in a comment.

:::hint
The forbidden case is two rental rows with the same property and overlapping dates. A primary key does not express overlap.
:::
:::hint
If the exam accepts a simpler reading, one row per (property, night) does express it.
:::
:::hint
A link table `stay(property_id, night, rental_id)` with primary key `(property_id, night)` makes the conflict an insert failure.
:::
:::solution
Keep the 2019 A tables. Add

```sql
CREATE TABLE nights (
  property_id INTEGER REFERENCES properties(property_id),
  night DATE,
  rental_id INTEGER REFERENCES rentals(id),
  PRIMARY KEY (property_id, night)
);
```

Booking writes one `nights` row per night of the stay. A second guest on an occupied night hits the primary key and the insert fails. A `CHECK` constraint cannot see other rows in the SQL the lecture taught; the extra table can. The query for "who stays at property P on night D" is a join from `nights` to `rentals` to `users`.
:::
:::

:::problem id=exam-20a-q4 source="Exams/20-a.pdf" kind=exam solution_origin=derived
A DVD service. Users have an id and a name. Movies have an id, a name, a description, any number of categories from {Action, Drama, Romance, kids}, an average `score`, and `num_scorers`. A watch records the user, the movie, and the date.

Tables, and a query for the movies a user watched, with their categories.

:::hint
"Any number of categories" is a link table. A single category column is wrong.
:::
:::hint
`score` and `num_scorers` are columns of the movie only if you accept a stored aggregate. The lecture would rather compute them.
:::
:::hint
The watch table is the many-to-many between users and movies, plus a date.
:::
:::solution
```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  score REAL,
  num_scorers INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE categories (
  movie_id INTEGER REFERENCES movies(id),
  category TEXT NOT NULL,
  PRIMARY KEY (movie_id, category)
);
CREATE TABLE watches (
  user_id INTEGER REFERENCES users(id),
  movie_id INTEGER REFERENCES movies(id),
  on_date DATE NOT NULL,
  PRIMARY KEY (user_id, movie_id, on_date)
);
SELECT m.name, c.category
FROM watches w
JOIN movies m ON m.id = w.movie_id
LEFT JOIN categories c ON c.movie_id = m.id
WHERE w.user_id = ?;
```

A movie with two categories appears twice, once per category, which is the link table doing its job. `LEFT JOIN` keeps a movie that has no category row.
:::
:::

:::problem id=exam-20b-q4 source="Exams/20-b.pdf" kind=exam solution_origin=derived
The same DVD service. Write the query that updates a movie's average when a user submits a new score `s`, using the stored `score` and `num_scorers`, and the query that lists movies in a category ordered by score.

:::hint
The new average is `(score * num_scorers + s) / (num_scorers + 1)`.
:::
:::hint
Both columns change in one `UPDATE`.
:::
:::hint
The category filter joins `categories`.
:::
:::solution
```sql
UPDATE movies
SET score = (score * num_scorers + :s) / (num_scorers + 1),
    num_scorers = num_scorers + 1
WHERE id = :movie;

SELECT m.name, m.score
FROM movies m
JOIN categories c ON c.movie_id = m.id
WHERE c.category = 'Drama'
ORDER BY m.score DESC;
```

The update is one statement so a reader does not see a new count with the old average. Two statements would need the transaction the lecture said serialization does not give you. The join is inner, so a movie with no Drama row is absent, which is what the filter means.
:::
:::

The persistence layer in session 13 is how a Java or Python server from [The reactor](topic:reactor) calls these statements without scattering SQL through the protocol.
