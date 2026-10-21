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

A process's memory lasts only as long as the process. When the process exits, those values are gone, and another program cannot see them. A file in the file system can outlive the process, but the application then owns the byte layout, the search, and the rules for two writers at once. A database management system (DBMS) adds durable storage, a query language, integrity constraints, and transactions, so a concurrent update is one atomic unit of work. This chapter is that service: persistence, and the SQL a program sends to the DBMS.

## The relational model

The relational model (מודל רלציוני) stores data as tables. A table is a set of rows that share the same columns, and each column holds a single value. SQL is the language that defines those tables and asks questions of them.

:::definition id=def-relational title="Principles of the relational model" source="materials/lectures/Chapter 13 - Persistance.pptx"

- **Table:** an entity or a relationship. A row is one record. A column is one attribute.
- **Primary key (מפתח ראשי):** a column, or a set of columns, that identifies each row of the table uniquely.
- **Foreign key (מפתח זר):** the relational form of a pointer. Its values must equal a key of another table. The DBMS rejects a value that matches no row there. That rule is the referential integrity constraint.
:::

Mapping classes to tables:

1. A class becomes a table.
2. A one-to-many association (1:N) is a foreign key on the N side.
3. A many-to-many association (N:M) is a **junction table** that holds foreign keys to both tables. Repeating columns such as `course1`, `course2`, and `course3` freeze the length of the list, and a query cannot treat those columns as rows.

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

An inner join keeps the rows that satisfy the condition in both tables. A left join keeps every row of the left table and fills the right side with null when nothing matches. A join with no condition is the Cartesian product: every row of the left table paired with every row of the right table. In the relational algebra, a join is that product followed by a selection. `SELECT` is the SQL statement that projects the columns you ask for.

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
The inner join returns one row: Alice with `prog`. Bob has no junction row, so he is absent. A course that nobody takes is absent as well.

A left join that starts from students still returns Alice with `prog`, and it returns Bob with a course name that is null. Bob is kept because the left table is kept. `systems` is still absent, because the join started from students. A right join from students toward courses would show `systems` with a null student and would leave Bob out.
:::
:::

:::check id=chk-fk
The value 9 in `Students.DeptId`, when `Departments` contains the ids 1 and 2, breaks which constraint?

- [ ] `PRIMARY KEY` on `Students.Id`
- [x] the foreign key from `DeptId` to `Departments.Id`
- [ ] `NOT NULL` on `Students.Name`

A foreign key requires every `DeptId` to equal the key of some row in `Departments`. The uniqueness of `Students.Id` is the primary-key constraint.
:::

## Practice

:::problem id=ps12-foreign-key title="A teaching assistant's foreign key" source="materials/sessions/SPL_PS12.pptx" kind=exercise solution_origin=source
In session 12, `PRACTICAL_SESSIONS` has the columns `TA_ID`, `GroupNum`, `Location`, and `Time`. `TEACHING_ASSISTANTS` has `ID`, `Name`, and `OfficeHours`. Write the two `CREATE TABLE` statements. `GroupNum` is the primary key of a practical session. `ID` is the primary key of a teaching assistant. A session's `TA_ID` refers to a teaching assistant.

:::hint
The foreign key is the column whose meaning is "the id of a row over there."
:::
:::hint
`OfficeHours` and `Time` can be text. `ID` and `GroupNum` are integers.
:::
:::hint
Declare the primary key of the table you point at before another table relies on it, or declare the foreign key after both tables exist.
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

Inserting a practical session with `TA_ID = 8` fails when no teaching assistant has `ID` 8. That is the constraint the insert example in session 12 is about to hit.
:::
:::

:::problem id=ps12-join title="Joining a session and a teaching assistant" source="materials/sessions/SPL_PS12.pptx" kind=exercise solution_origin=source
Here are the two tables. Write a query that returns `Time`, `Location`, `GroupNum`, and the teaching assistant's `Name`, for every practical session that has a teaching assistant. Then say what a left join from the teaching assistants adds, which this query hides. In the example, Shaked is on two groups and Matan is on none.

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

:::hint
Match `PRACTICAL_SESSIONS.TA_ID` to `TEACHING_ASSISTANTS.ID`.
:::
:::hint
An inner join omits the teaching assistant who has no practical session.
:::
:::hint
Name the columns the two tables share, or give the tables aliases.
:::
:::solution
```sql
SELECT ps.Time, ps.Location, ps.GroupNum, ta.Name
FROM PRACTICAL_SESSIONS ps
INNER JOIN TEACHING_ASSISTANTS ta ON ps.TA_ID = ta.ID;
```

Shaked appears twice, once for each group. Matan is absent. A `LEFT JOIN` from `TEACHING_ASSISTANTS` to the practical sessions keeps Matan and Yair, with `Time`, `Location`, and `GroupNum` all null. That is the second result table on the session 12 slide.
:::
:::

:::problem id=ps13-dto-dao title="DTO versus DAO" source="materials/sessions/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
The tester in session 13 has tables `students(id, name)`, `assignments(num, expected_output)`, and `grades(student_id, assignment_num, grade)`. Name a DTO, a DAO, and the repository method that returns a grade together with the student's name. Say why that last method is a method of the repository.

:::hint
A DTO is one row. Its name is the table's name, in the singular.
:::
:::hint
A DAO's methods talk about one table.
:::
:::hint
A join crosses tables, so it lives on the repository.
:::
:::solution
`Student`, `Assignment`, and `Grade` are the DTOs. `_Students`, `_Assignments`, and `_Grades` are the DAOs. Each one holds the connection and implements `insert` and `find` for a single table. `repo.get_grades_with_names()` joins `grades` to `students` and returns rows that contain both `assignment_num` and `name`. That method belongs on the repository, because it is about more than one table. `create_tables` is on the repository for the same reason: it creates all three.

Bob's submission returns `"main"` and the assignment's `expected_output` is `"Main"`, so his grade row records the mismatch. The comparison is case-sensitive. The session prints that he fails for exactly this reason.
:::
:::

:::problem id=ps13-orm-find title="Mapping columns onto a DTO" source="materials/sessions/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
The session replaces a hand-written `find` with `row_map(row, col_mapping, dto_type)`, which builds constructor arguments by field index and calls the DTO's constructor. This is the session's object-relational mapping (ORM). `row_map` is the row mapper. `Assignment.find` used to be `return Assignment(*c.fetchone())`. What must `col_mapping` contain so that the generic `find` still builds `Assignment(num, expected_output)`?

:::hint
The constructor's argument order is the DTO's order. It matches `SELECT *` only when you have made those orders the same.
:::
:::hint
`row_map` indexes the row with each entry of `col_mapping`.
:::
:::hint
`Assignment` takes `num` and then `expected_output`.
:::
:::solution
`col_mapping` is the list of indexes in constructor order. When the row is `(num, expected_output)`, the mapping is `[0, 1]`. When a query selected `expected_output` before `num`, the mapping is `[1, 0]`, so the constructor still receives `num` first. `dto_type(*ctor_args)` is `Assignment(num, expected_output)`. A mapping that follows `SELECT *` blindly breaks as soon as the table's column order changes. That is the same warning the SQL lecture gave about an `INSERT` that omits the column list.
:::
:::

:::examnote
The question describes a small business in a few sentences and asks for tables, keys, and one `SELECT`. The trap is a list crammed into one column, or a join that multiplies rows because the junction table was left out.
:::

:::problem id=exam-15a-q4 title="The BigApple schema" source="materials/exams/15-a.pdf" kind=exam solution_origin=derived
BigApple stores a customer (name, phone, join date, and links to other customers who are family) and every action on the account (date and kind: a message sent, an outgoing call, a missed call, a message received, together with the other phone number).

a. Define the tables.
b. SQL for the messages received by the family members of Ringo Starr.

:::hint
Family is a relationship between two customers, so it is a table. A column of names cannot be joined.
:::
:::hint
The kind of an action is a column, or a small table. The other phone number is a column of the action.
:::
:::hint
"Ringo's family" is a join from Ringo through the family table, and then to received-message actions.
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

Store both directions in `Family`, or insert the pair in both orders, when "family" is symmetric. A single text column `relatives` on `Customers` cannot be joined.
:::
:::

:::problem id=exam-15b-q4 title="Number porting" source="materials/exams/15-b.pdf" kind=exam solution_origin=derived
Extend BigApple with the kind of family relationship (parent, sibling, child), a table of competing carriers, and a history of number porting: the date the customer left, and the carrier they left for.

a. The additional tables.
b. Every carrier Ringo Starr moved to, with the date.

:::hint
Porting is its own history. A new column on `Actions` would mix a carrier change into the call log.
:::
:::hint
A customer can leave more than once, so the history is a table. Two columns on `Customers` would remember a single departure.
:::
:::hint
The family kind is a column on the family table that already exists.
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

:::problem id=exam-16a-q4 title="Abbey Road sessions" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
Abbey Road stores recording sessions. A session has a date, a song, a band, and many takes. A take has people in roles: players (a person may play several instruments on one take), singers, and technicians.

a. Tables.
b. The take numbers and song names on which Billy Preston played keyboards during the Beatles' Get Back sessions, from January 1969, sorted by ascending date.

:::hint
A take belongs to a session. A participation belongs to a take, a person, and a role, and the instrument is a column of that participation.
:::
:::hint
"Several instruments" means several participation rows. One instruments column would hold a list.
:::
:::hint
Filter by band, date, person, and instrument, then project the take number and the song name.
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

:::problem id=exam-16b-q4 title="A fixed set of roles" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
The Abbey Road schema: a recording session has a date, a song, a band, and many takes. A take has people in roles (player, singer, technician), and the role is stored as text.

a. Show how Kim Philby can appear as a participant in the role of double agent.
b. Restrict roles to a fixed set: player, singer, technician.

:::hint
When `role` is free text, the row is one more participation. The restriction is a table of legal roles, or a check.
:::
:::hint
A foreign key to a `Roles` table rejects a role that was never inserted.
:::
:::hint
Keep a single role column whose legal values live in a table. A boolean column for each role turns every new role into a schema change.
:::
:::solution
a. Insert Kim into `People` and a `Participations` row with `role = 'double agent'`. The schema allows any role text, so this is data in the existing table.

b. `CREATE TABLE Roles (name TEXT PRIMARY KEY);` then insert `player`, `singer`, and `engineer`. Change `Participations.role` so that it `REFERENCES Roles(name)`. The double-agent insert then fails until that role is added on purpose. `CHECK (role IN (...))` is the alternative when the question wants the constraint on a single column.
:::
:::

:::problem id=exam-17a-q4 title="A glasses shop" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
An online glasses shop. The warehouse stores a model (model number, price). The shop registers a customer (name, id). A purchase records the customer id and the model, and the shop issues a receipt with a unique number and the purchase details. A customer can ask for the price of a model. The owner can list every receipt.

Give the tables and the two queries: the price of a model, and every receipt.

:::hint
A receipt is a row. Its primary key is the receipt number.
:::
:::hint
The model number on a purchase is a foreign key. Storing that number in a second column can drift away from the price.
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

The price lives only on `Models`. The price query reads that catalog row, so a later price change is what the customer is told. A receipt stores the model number and can be joined back to the current price. When a receipt must remember the price charged at the time of the sale, copy `price` onto `Receipts` at insert.
:::
:::

:::problem id=exam-17b-q4 title="Garage jobs" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
A garage. A job has a car number, a fault description, and a job id. A worker has a name and an id. Assigning a worker to a job records the worker, the job, and that the job is unfinished. Finishing a job marks it done.

Give the tables, and also the query for a worker's unfinished jobs.

:::hint
"Unfinished" is a column on the assignment, or a `finished_at` that is null.
:::
:::hint
A job can exist before it has a worker, so the job table and the assignment table are two tables.
:::
:::hint
The query filters on the worker and on the unfinished flag.
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

Finishing a job is `UPDATE Assignments SET finished = 1 WHERE job_id = ? AND worker_id = ?`.
:::
:::

:::problem id=exam-18a-q4 title="A question used again" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
A question bank stores the text of each question, and a row for each year in which it was given, in one of the two sittings of that year. A question may return in a later year, and it must not be used twice in the same year. Choose the schema that enforces this, and say which key does the work.

:::hint
One row per question, and one row per (question, year, sitting), is the shape that can recur across years.
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

The primary key `(question_id, year)` rejects a second insert of the same question in the same year, in either of the two sittings. A later year is a new row. Columns `year_a` and `year_b` on `questions` remember only two uses, and they cannot express the constraint for a third sitting. If an option in the question uses `question_id_A` and `question_id_B` as two foreign keys in a year table, that remembers one pair of questions for the year, which is the wrong grain.
:::
:::

:::problem id=exam-18b-q4 title="Police wiretaps" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
Police wiretaps. A recording stores the text, the caller's number, the destination number, and the date. Each phone number has an owner's name and an address.

The question begins:

```sql
CREATE TABLE phone (
  phone_num INT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL
);
```

Complete the schema and write a query for the recordings of a given number, with the names of both owners.

:::hint
A call has two foreign keys to `phone`, so join `phone` twice.
:::
:::hint
Give the two joins aliases. Otherwise `name` is ambiguous.
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

:::problem id=exam-19a-q4 title="An Airbnb schema" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
Airbnb. A user has an id and may be a guest, a host, or both. A property has an id, one host, a price per night, and a description. A rental has a guest, a property (and therefore the host of that property), a check-in, and a check-out. After check-out the host writes a recommendation of the guest and the guest writes one of the host.

Three parts of the question ask you to complete the schema and one query. Give the tables.

:::hint
"Guest, or host, or both" is one `users` table. A property points at a host id. Two subclasses would split one person into two primary keys.
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

A user who both hosts and travels is a user who appears as `host_id` on some property and as `guest_id` on some rental. There is no second table of people.
:::
:::

:::problem id=exam-19b-q4 title="One night per property" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
A user has an id and may be a guest, a host, or both. A property has an id, one host, a price per night, and a description. A rental has a guest, a property, a check-in, and a check-out. In addition, two guests cannot share a property on the same night. Enforce that in the schema, in a constraint the DBMS checks.

:::hint
The forbidden case is two rental rows with the same property and overlapping dates. A primary key on the rental does not express overlap.
:::
:::hint
When the question accepts a simpler reading, one row per (property, night) does express it.
:::
:::hint
A junction table `stay(property_id, night, rental_id)` with primary key `(property_id, night)` turns the collision into an insert failure.
:::
:::solution
Keep the Airbnb tables from the question for users, properties, and rentals. Add

```sql
CREATE TABLE nights (
  property_id INTEGER REFERENCES properties(property_id),
  night DATE,
  rental_id INTEGER REFERENCES rentals(id),
  PRIMARY KEY (property_id, night)
);
```

A booking writes one `nights` row for each night of the stay. A second guest on an occupied night hits the primary key and the insert fails. A `CHECK` constraint, in the SQL this lecture taught, looks at the row being written. The extra table is what makes the collision visible to the DBMS. The query "who is staying at property P on night D" is a join from `nights` to `rentals` to `users`.
:::
:::

:::problem id=exam-20a-q4 title="A DVD schema" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
A DVD service. Users have an id and a name. Movies have an id, a name, a description, any number of categories from {Action, Drama, Romance, kids}, an average `score`, and `num_scorers`. A viewing records the user, the movie, and the date.

Give the tables, and a query for the movies a user has watched, with their categories.

:::hint
"Any number of categories" is a junction table. A single category column is the wrong shape.
:::
:::hint
`score` and `num_scorers` are columns of the movie only when a stored aggregate is acceptable. The lecture would compute them from the underlying rows.
:::
:::hint
The viewing table is the many-to-many link between users and movies, plus a date.
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

A movie with two categories appears twice, once per category, which is the junction table doing its work. The `LEFT JOIN` keeps a movie that has no category row.
:::
:::

:::problem id=exam-20b-q4 title="An average score" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
Users have an id and a name. Movies have an id, a name, a description, any number of categories from {Action, Drama, Romance, kids}, an average `score`, and `num_scorers`. A viewing records the user, the movie, and the date. Write the query that updates a movie's average when a user submits a new score `s`, using the stored `score` and `num_scorers`, and the query that lists movies in a category sorted by score.

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

The update is a single statement, so a reader sees the new average and the new `num_scorers` together. Two statements need a transaction if that pair is to stay atomic. Object serialization writes bytes and leaves the two statements independent. The DBMS supplies the transaction. The join is an inner join, so a movie with no Drama row is absent, which is what the filter asks for.
:::
:::

The persistence layer in session 13 is how a Java or Python server from [the reactor](topic:reactor) runs these statements. The SQL stays in the data-access objects, and the protocol calls the repository.
