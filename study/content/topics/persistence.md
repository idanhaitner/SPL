---
id: persistence
title: Databases
blurb: "Why a database, the relational model, SQL queries and joins, and a Python persistence layer."
sources:
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/lectures/Chapter 13 - Persistance.pptx"
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

This chapter shows how a program keeps its data after the process ends: in a database, managed by a dedicated run-time environment, and reached in SQL.

- **Why a database:** what a database management system gives you that process memory and plain files do not.
- **The relational model and SQL:** designing tables from classes, and writing the definitions, updates, and queries against them.
- **An application over a database:** a grading program in Python, refined step by step into a persistence layer of DTOs, DAOs, and a repository.

## Why a database

**The motivation:** keeping the data of students and courses at a university.

- the students' data,
- the courses' data,
- the departments' data,
- constraints: prerequisite courses, the year of study, ...
- ...

A program implemented as usual in memory would have classes such as `Student`, `Course`, and `Department`, which include fields and methods that hold the data and implement the constraints between the different parts.

```text
Student: getYear(), getCourses(), ...
Course: getPreRequirements(), getStudents()

```

**The drawbacks:**

- **When the process ends** (logically, or because of a failure such as a power cut), all the data is erased, since it is kept in memory, in a volatile technology.
- **You cannot always keep all the data in memory.** Many applications deal with data much larger than the RAM.

So keep the data on disk.

- **It is kept there for a long time,** even after the process ends.
- **The disk's storage capacity is much larger** than that of the RAM.

**An implementation:** define the relevant classes as implementing an interface of serialization and deserialization to disk. Something like:

```java
toFile(OutputStream)
fromFile(InputStream)

```

(You could use the `ObjectEncoderDecoder` class you wrote for this, from [The command-invocation server](topic:serialization), or implement it in a popular format, such as the common JSON format.)

**The drawbacks:**

- **Retrieving data:** retrieving a group of students with some property (computer-science students in their second year) is not trivial when they are kept in different places on disk, such as in files.
- **Updating data:** adding a grade to a group of students with some property is not simple, and mainly not efficient (students of Systems Programming, moed A).
- **Support for concurrent operations** of several processes on the data shared on disk: locking mechanisms, synchronization, concurrent runs, ...
- **Support for compound operations:** for example, a transaction, which performs a series of different operations, where the failure of one of them returns the state to what it was before (cancelling a current registration to a course for a registration to an elective course; withdrawing money from an ATM; buying a number of shares at a given rate).
- **Abstraction:** no dependence on the programming language, the file system, the operating system, or the storage technology.
- **Convenient interfaces.**
- **Optimizations.**
- ...

So you need a **dedicated run-time environment** that supports storing data and performing different operations on it, with support for concurrency, modularity, optimizations, and so on.

An environment like this is called a **DataBase Management System (DBMS)**. Examples of such systems are MySQL, Microsoft SQL Server, Oracle, and Sybase.

As with the other run-time environments in the course (the operating system, the JVM), this course does not deal with how the environment is implemented (that belongs in the database course), but with how it is used: how to define the data model, and how to perform operations through that environment. At this stage, here is only the broad architecture of such systems:

- **security management,**
- **transaction management,**
- **retrieving data:** running queries, optimizations,
- **operations on data:** adding, updating, deleting,
- **access to files,**
- **access to disk.**

## The data model

A data model is an abstract description of information, based on the definition of the data and the operations on it, with no dependence on the storage and on the implementation of those operations.

There are different kinds of data models, meaning different ways of organizing information. For example:

- **A relational data model:** the information is organized, as you will see, in tables with fields, relations between them, and options for keys.
- **A key-value data model:** the information is organized as one big table, which maps a key to an object (like a `HashMap` on disk). There are different systems like this: Berkeley DB, Redis, Amazon's S3 service.
- **An object-oriented data model:** the database includes a collection of objects that you can retrieve by their properties (all the students whose `year` field is 2): object4j, Amazon's DynamoDB service.

This course focuses on the relational model, the classic one.

### The relational model

In a relational data model, information is organized in **tables** (relations), and each table is defined by a set of **fields** (attributes), with **integrity constraints** against other tables, and **indexes**.

- **A field** is defined by: a name, a type (`integer`), a domain of definition (the numbers 14 to 60), and more conditions or requirements. For example, you can require that its values be **unique** (`UNIQUE`) in the table: the field "id number" in the "students" table must be unique, which means there are no two students with the same id number. In addition, you can require that the field must always receive a value (`NOT NULL`) (assume the student's name).
- **A table** is a set of fields that it defines (like the "students" table, which includes fields such as an id number, a name, and so on).
- **Constraints between tables** are defined by a **foreign key**, which creates a dependency between the existence of a set of fields with some value in one table and a field that identifies another table. For example, the field "department" in the "students" table must contain the name of a department defined in the "departments" table.
  - Notice that you can define two kinds of constraints: local constraints on content (the field's type, its domain, its uniqueness) and constraints outside tables (foreign keys).
- **Defining a field as an index** makes access to it efficient. In particular, defining a field as an index requires the environment to arrange it accordingly, and in particular, to define a data structure that supports fast access to the field (like the "index" that sometimes appears in the last pages of books). In general, you do not want to define all the fields as an index, but only the fields by which you usually search the data (like "student name").

:::definition id=def-relational title="Principles of the relational model" source="materials/lectures/Chapter 13 - Persistance.pptx"

- **Table:** a table represents either a kind of entity or a relationship between entities. Each row is one record, and each column is one attribute.
- **Primary key (מפתח ראשי):** a column, or a set of columns, whose value is different in every row, so it identifies each row uniquely.
- **Foreign key (מפתח זר):** a column whose values must match a key in another table. It is the relational version of a pointer.
- **Referential integrity:** the database rejects any foreign-key value that does not match a row in the other table.
:::

The relational model has different kinds of **operations**.

- **Adding a record (a row) to a table:** adding a new "row" to a given table, with values for each of the fields defined in it (adding a record to the "students" table with a student's details, as defined in its fields: id number, name, department, and so on).
- **Updating a record in a table:** setting a new value for one or more fields in a given row of the table.
- **Deleting a record from a table.**
- **Retrieving data from tables:**
  - **selection:** choosing a number of records from a table by some criterion (computer-science students). Part of the rows,
  - **projection:** choosing a number of fields from a table's records (only the students' names and the name of their department). Part of the columns,
  - **operations on groups:** union of groups of records, intersection, difference, Cartesian product,
  - **the join operation** is the central operation in retrieving data. In this operation, records and fields are retrieved from different tables under the constraint of matching certain fields. In other words, selection + projection + cross product.

### Defining a relational model for data that needs storing

Given data that must be kept for a long time in a relational database, you must define a data model for it.

For example, define a relational data model for the data of the students, courses, and departments at the university. In particular, describe the data as a set of tables with fields, and the connections between them through keys.

For simplicity, rely on an approach that matches the design approaches already familiar from the programming world, object-oriented design.

1. **A class in Java is defined as a table in the data model.** The fields of the class are the fields of the table, with matching types. Where a field requires uniqueness, and/or the assignment of a value, define it as `UNIQUE` and/or `NOT NULL`.
2. **If a field in the class is of an "object" type,** define it as a separate table, and include in the current table a "pointer" to it, which means a foreign key. (Otherwise, its different fields would be stored again in every record of the original table.)
3. **If the field represents an "array" of data, and the relation is many-to-many,** define an intermediate table that maps a field (or a set of fields) that is unique in one table to a field or set of fields in a second table.
4. **Add the index property to fields that are central in retrieving data,** meaning fields whose value is a criterion for retrieving the record.
5. **Every table must have a field (or a set of fields) that is unique and also an index.** In other words, the requirement is that there is at least one way to retrieve the data of a record uniquely and efficiently. Such a field (or set of fields) is called a **primary key**. (There may be other fields that are both unique and an index, but only one of them is the "primary key". There is no importance to that at the moment.)

The foreign key is also defined as an index, built in, since many queries are based on it.

```text
Students [Definition]    Departments [Definition]    Courses [Definition]
             \                ^                          ^
              \              /                          /
           StudentsCourses [Definition]  ---------------

Students [Data]   Departments [Data]   Courses [Data]   StudentsCourses [Data]

```

The lecture slides show the same rules on a smaller schema, with an `Enrollment` junction table.

For example, students and courses are two classes, so each gets its own table.

```sql
CREATE TABLE Students (
  Id INTEGER PRIMARY KEY,
  Name TEXT NOT NULL
);

CREATE TABLE Courses (
  Id INTEGER PRIMARY KEY,
  Title TEXT NOT NULL
);
```

A student takes many courses, and a course has many students, so the relationship is N:M. It gets a junction table with a foreign key to each side.

```sql
CREATE TABLE Enrollment (
  StudentId INTEGER REFERENCES Students(Id),
  CourseId INTEGER REFERENCES Courses(Id),
  PRIMARY KEY (StudentId, CourseId)
);

```

The database enforces these keys on every insert.

:::check id=chk-fk
The value 9 in `Students.DeptId`, when `Departments` contains the ids 1 and 2, breaks which constraint?

- [ ] `PRIMARY KEY` on `Students.Id`
- [x] the foreign key from `DeptId` to `Departments.Id`
- [ ] `NOT NULL` on `Students.Name`

- **The foreign key** requires every `DeptId` to match the key of some row in `Departments`. No department has id 9, so the value is rejected.
- **The primary key** only requires `Students.Id` to be unique, and `NOT NULL` only requires `Name` to have a value, so neither is affected.
:::

## SQL

SQL (Structured Query Language) is the interface between applications and a system for managing databases. It is a generic language: every system for managing databases must support it, so applications do not depend on the kind of system they work with at run time. (Over the years, different variants of the language were developed for different systems. This course deals with classic SQL.)

SQL supports two central categories of operations.

### Defining the data model (Data Definition Language)

Defining tables, fields, keys, indexes, and so on. Here is how to describe or create the data model defined for the students and courses, with SQL operations (there are systems that automatically translate diagrams like the one above into SQL code).

```sql
CREATE TABLE Departments (Id INTEGER PRIMARY KEY,
                          Name VARCHAR(20) UNIQUE NOT NULL,
                          Building INTEGER);
CREATE INDEX idx_departments_name ON Departments(name);

CREATE TABLE Students (Id INTEGER PRIMARY KEY,
                       Name VARCHAR(20) NOT NULL,
                       Login VARCHAR(10) UNIQUE,
                       DeptId INTEGER,
                       FOREIGN KEY (DeptId) REFERENCES Departments(Id));
CREATE INDEX idx_users_name ON Students(name);

CREATE TABLE Courses (Id INTEGER PRIMARY KEY,
                      Name VARCHAR(20) UNIQUE NOT NULL,
                      NAKAZ INTEGER);
CREATE INDEX idx_courses_name ON Courses(name);

CREATE TABLE StudentsCourses (StudId INTEGER,
                              CourseId INTEGER,
                              Year INTEGER,
                              Grade INTEGER,
                              PRIMARY KEY (StudId, CourseId, Year),
                              FOREIGN KEY (StudId) REFERENCES Students(Id),
                              FOREIGN KEY (CourseId) REFERENCES Courses(Id));
CREATE INDEX idx_studentscourses_year ON StudentsCourses(year);

```

### Operations on data (Data Manipulation Language)

**Adding records to a table:**

```sql
INSERT INTO Students(Id, Name, Login, DeptId) VALUES(17, 'Dina', 'din', 201)

```

This operation fails, because there is no department whose `Id` field is 201. So you must first define the departments:

```sql
INSERT INTO Departments(Id, Name, Building) VALUES(201, 'math', 58)
INSERT INTO Departments(Id, Name, Building) VALUES(202, 'cs', 37)
INSERT INTO Students(Id, Name, Login, DeptId) VALUES(17, 'Dina', 'din', 201)
INSERT INTO Students(Id, Name, Login, DeptId) VALUES(89, 'Danny', 'dan', 202)
INSERT INTO Students(Id, DeptId) VALUES(5, 202)

```

The last operation fails, because the field `Name` in the `Students` table was defined as `NOT NULL`, which means it is required that there be no student without a name.

```sql
INSERT INTO Students(Id, Name, DeptId) VALUES(5, 'Ringo', 202)

```

Notice that the field `Login` received no value (its value right now is `NULL`). That is fine, since it was not required to be `NOT NULL`.

```sql
INSERT INTO Courses(Id, Name, Level) VALUES(7, 'infi', 4)
INSERT INTO Courses(Id, Name, Level) VALUES(8, 'spl', 4)
INSERT INTO Courses(Id, Name, Level) VALUES(9, 'ppl', 4)
INSERT INTO StudentsCourses(StudId, CourseId, Year, Grade) VALUES(17, 7, 18, 70)
INSERT INTO StudentsCourses(StudId, CourseId, Year, Grade) VALUES(17, 8, 19, 90)
INSERT INTO StudentsCourses(StudId, CourseId, Year, Grade) VALUES(89, 7, 18, 80)
INSERT INTO StudentsCourses(StudId, CourseId, Year, Grade) VALUES(89, 8, 19, 85)

```

**Updating existing records:**

```sql
UPDATE Students SET Login = 'ring'

```

This operation changes the `Login` field of **all** the students. Besides not being logical, it also fails, because the field `Login` was defined as `UNIQUE`. So add a more exact criterion with `WHERE`:

```sql
UPDATE Students SET Login = 'ring' WHERE Name = 'Ringo'

```

**Deleting records:**

```sql
DELETE FROM StudentsCourses WHERE year < 1900

```

### Retrieving data with a query (the important topic)

As you saw, the information in the relational model is organized as records with different fields in different tables. Notice that the information is kept **compactly**: there is no repetition of information except as a "pointer", meaning fields that are foreign keys. In such an organization, retrieving information usually involves **joining** information from different tables, going back over the information to other tables again and again. (Unlike other models, retrieving data is somewhat heavy, in exchange for saving storage space.)

To make the retrieval operation efficient (a simple lookup), at the price of a slightly more complex data organization, retrieving data is based mainly on the `JOIN` operation, which performs a cross product between tables, with filtering by different criteria (selection) on the records or rows, and on the fields or columns (projection).

To write a query, follow these steps.

**An example:** retrieve from the database the students' names, the names of the courses, and the grade for them.

1. Write `SELECT`.
2. List the fields (including their tables) you want to retrieve.
3. Write `FROM`.
4. List the names of the tables that appear in the `SELECT` line.

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM Students, Courses, StudentsCourses

```

What happens when a query like this runs? It turns out that the query engine builds, for each field in the `SELECT` line, a vector with all the values in the table for that field, and performs a Cartesian product on them. In our case:

```text
Dinna       infi    70
Danny   X   spl  X  80
Ringo       ppl     85
                    90

=>

Dinna infi 70
Dinna infi 80
Dinna infi 85
Dinna infi 90
Dinna spl 70
...
Dinna ppl 90
Danny infi 70
...
Danny ppl 90
Ringo infi 70
...
Ringo ppl 90

```

The results are of course wrong: you get many rows of data that do not match the tables. So you must include in the query **a criterion for matching between the tables**, that is, a constraint on the operation of the join. Notice that the right join criterion is in fact defined by the foreign keys.

1. Write `SELECT`.
2. List the fields (including their tables) you want to retrieve.
3. Write `FROM`.
4. List the names of the tables that appear in the `SELECT` line, **including a description of the connection between them through the foreign keys, with the keyword `JOIN`** (if there is another table in the join that does not appear in the `SELECT` line, add it).

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id

```

```text
Dinna  infi  70
Danny  spl   80   (X_join: these combinations are filtered out)

=>

Dinna infi 70
Dinna spl 90
Danny infi 80
Danny spl 85

```

5. **If you want to get only some of the records** (selection), add a `WHERE` part to the query. For example, get the grades of the students in the mathematics department only.

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id
WHERE Students.DeptId = 201

```

```text
Dinna infi 70
Dinna spl 90

```

Another example, including the department's name in the results:

```sql
SELECT Students.Name, Departments.name, Courses.Name, StudentsCourses.Grade
FROM ((Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
      INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id)
     INNER JOIN Departments ON Students.DeptId = Departments.Id

```

6. **If you want the results sorted by different criteria,** add an `ORDER BY` part to the query (the default is sorting by the primary key). For example, sort the results in ascending order by the students' names, and in descending order by their grades.

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id
WHERE Courses.NAKAZ = 4
ORDER BY Students.Name ASC, StudentsCourses.Grade DESC

```

```text
Danny spl 85
Danny infi 80
Dinna spl 90
Dinna infi 70

```

A join combines rows from two or more tables.

- **An inner join** keeps only the pairs of rows that satisfy the join condition.
- **A left join** keeps every row of the left table. When a row has no match on the right, the right side's columns are filled with null.
- **A join with no condition** is the Cartesian product: every row of the left table paired with every row of the right table.
- **In relational-algebra terms,** a join is that product followed by a selection of the rows that meet the condition.
- **`SELECT`** then picks (projects) only the columns you ask for.

![INNER JOIN of Alice to prog. Bob and systems are marked because they have no junction row, so they are absent from the result](../../web/public/figures/sql-join.svg)

:::problem id=worked-inner-join title="What an inner join returns" source="materials/lectures/Chapter 13 - Persistance.pptx" kind=worked solution_origin=source
Alice is enrolled in `prog`. Bob is enrolled in nothing. Both `prog` and `systems` exist. What does this query return, and what does a left join add?

```sql
SELECT S.name, C.name
FROM Students S
INNER JOIN StudentsCourses SC ON S.id = SC.student_id
INNER JOIN Courses C ON SC.course_id = C.id;
```

:::solution

- **The inner join returns one row:** Alice with `prog`.
- **Bob is missing,** because he has no row in the junction table, so there is nothing to match.
- **`systems` is missing too,** because no student takes it.
- **With left joins starting from `Students`:** the result still has Alice with `prog`, and now also Bob, with null as his course name, because every row of the left table is kept.
- **`systems` is still missing** with a left join, because the join keeps every student, not every course.
- **To keep every course instead,** you would join in the other direction (a right join toward `Courses`). That would show `systems` with a null student, and leave Bob out.
:::
:::

### OUTER JOIN

Suppose you want **all the course names**, and if there are students studying them, their names and grades. In the current query you get only the courses that some student takes (the course `ppl`, which no student takes, does not appear), because you required a match in the `JOIN` between the `Courses` table and the `StudentsCourses` table.

Suppose you want **all the student names**, and if they take courses, the course names and their grades. In the current query you get only the students who take some course (`Ringo`, who is busy with his career as a drummer, takes no course right now, so he does not appear), because you required a match in the `JOIN` between the `Students` table and the `StudentsCourses` table.

So define another kind of `JOIN`, which does not require a **two-sided** match like `INNER JOIN`, but a **one-sided** match. In other words, **all the values from one table** appear, and if there is a match with the values in the second table, they appear accordingly (otherwise, technically, `NULL` appears for a value that does not exist in the second table).

**All the courses, plus the students who take courses:**

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     RIGHT OUTER JOIN Courses ON StudentsCourses.CourseId = Courses.Id

```

```text
Dinna infi 70
Dinna spl 90
Danny infi 80
Danny spl 85
NULL ppl NULL

```

**All the students, plus the courses students take:**

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM (Students LEFT OUTER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id

```

```text
Dinna infi 70
Dinna spl 90
Danny infi 80
Danny spl 85
Ringo NULL NULL

```

**All the students, plus all the courses:** perform a `UNION` of the two queries.

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     RIGHT OUTER JOIN Courses ON StudentsCourses.CourseId = Courses.Id
UNION
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM Students LEFT OUTER JOIN
     (StudentsCourses INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id)
     ON Students.Id = StudentsCourses.StudId

```

```text
Dinna infi 70
Dinna spl 90
Danny infi 80
Danny spl 85
NULL ppl NULL
Dinna infi 70
Dinna spl 90
Danny infi 80
Danny spl 85
Ringo NULL NULL

```

To avoid repetitions, restrict the second query so that it returns only the additions, with `WHERE`:

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     RIGHT OUTER JOIN Courses ON StudentsCourses.CourseId = Courses.Id
UNION
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM Students LEFT OUTER JOIN
     (StudentsCourses INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id)
     ON Students.Id = StudentsCourses.StudId
WHERE Courses.Name is NULL

```

```text
Dinna infi 70
Dinna spl 90
Danny infi 80
Danny spl 85
NULL ppl NULL
Ringo NULL NULL

```

### GROUP BY

You can unite a number of records by the value of a shared field, to perform different operations on the value of another field, such as counting, summing, averaging, and so on. For example, for the original query:

```sql
SELECT Students.Name, Courses.Name, StudentsCourses.Grade
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id

```

```text
Danny spl 85
Danny infi 80
Dinna spl 90
Dinna infi 70

```

| Query | Aggregate | Result |
| --- | --- | --- |
| The average grade of each student | `AVG(StudentsCourses.Grade)` | Danny 82.5, Dinna 80 |
| The lowest grade of each student | `MIN(StudentsCourses.Grade)` | Danny 80, Dinna 70 |
| The highest grade of each student | `MAX(StudentsCourses.Grade)` | Danny 85, Dinna 90 |
| The number of courses each student took | `COUNT(StudentsCourses.Grade)` | Danny 2, Dinna 2 |
| The total credit points each student earned in courses | `SUM(Courses.NAKAZ)` | Danny 8, Dinna 8 |

For example, the average:

```sql
SELECT Students.Name, AVG(StudentsCourses.Grade)
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id
GROUP BY Students.Id

```

and the credit points, counting only passed courses:

```sql
SELECT Students.Name, SUM(Courses.NAKAZ)
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id
WHERE StudentsCourses.grade > 55
GROUP BY Students.Id

```

- **The order of the parts:** `WHERE` filters the rows before they are grouped, so it comes before `GROUP BY`.

### DISTINCT

**A note:** `DISTINCT` keeps only one appearance of identical records in the query's result (not for specific fields, as in `GROUP BY`).

```sql
SELECT Students.Id, Students.Name
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id

```

```text
17 Dinna
17 Dinna
89 Danny
89 Danny

```

```sql
SELECT DISTINCT Students.Id, Students.Name
FROM (Students INNER JOIN StudentsCourses ON Students.Id = StudentsCourses.StudId)
     INNER JOIN Courses ON StudentsCourses.CourseId = Courses.Id

```

```text
17 Dinna
89 Danny

```

## An application that manages data in a database

This section designs a general pattern for managing data in a database, and an application that uses it for a defined purpose. The application is written in Python, and the operations on the database in SQL (using a Python library that provides an interface to the database).

### A short introduction to Python

- **Properties:**
  - **a script language:**
    - run line by line by an interpreter (no compiled file is run),
    - less efficient: parsing happens at run time, and run-time errors that could have been prevented in advance,
  - **no need to declare types:**
    - a variable has a type at any given moment, according to the value it currently holds, but its type may change according to the current assignment: `x = 3`, then `x = 'abc'`,
    - type errors are discovered only at run time,
  - **you can implement OOP,** with classes and so on:
    - objects on the heap,
    - `self`, constructors, automatic cleanup,
    - fields, methods,
    - inheritance, polymorphism,
  - **there are many libraries that support many and varied things** (apart from convenient packaging), including working with databases (`sqlite`),
  - **convenient for writing and development, less for reading,** less efficient at run time (you can compile in advance for efficiency).
- **Example code** is on the course site.
  - When a procedure is defined, the interpreter keeps it in memory.
  - Preventing the run of the `main` function when performing `import`, with the system variable `__name__`.
  - (More details in the practical session.)

### Designing the application

Implement an application for automatically checking programming assignments, where the details of the students, the assignments, and the grades are managed in a database.

**Given:** a database with the details of the students and the assignments, and a folder in the file system with the code of the assignment (in Python) that each student submitted.

The application reads every assignment that was submitted, runs it (the function submitted is `run_assignment`), and compares it with the required result (which is given as part of the assignment's definition in the database). It computes the grade accordingly, and stores it in the database.

**A first attempt:**

```python
import os
import sqlite3
import imp
import atexit

# connect to the database
_conn = sqlite3.connect('grades.db')

# register a function to be called immediately when the interpreter terminates
def _close_db():
    _conn.commit()
    _conn.close()

atexit.register(_close_db)

# our application API:

def create_tables():
    _conn.executescript("""
        CREATE TABLE students (
            id      INT     PRIMARY KEY,
            name    TEXT    NOT NULL
        );

        CREATE TABLE assignments (
            num                 INT     PRIMARY KEY,
            expected_output     TEXT    NOT NULL
        );

        CREATE TABLE grades (
            student_id      INT     NOT NULL,
            assignment_num  INT     NOT NULL,
            grade           INT     NOT NULL,

            FOREIGN KEY(student_id)     REFERENCES students(id),
            FOREIGN KEY(assignment_num) REFERENCES assignments(num),

            PRIMARY KEY (student_id, assignment_num)
        );
    """)

def insert_student(id, name):
    _conn.execute("INSERT INTO students (id, name) VALUES (?, ?)", [id, name])

def insert_assignment(num, expected_output):
    _conn.execute("INSERT INTO assignments (num, expected_output) VALUES (?, ?)",
                  [num, expected_output])

def insert_grade(student_id, assignment_num, grade):
    _conn.execute("INSERT INTO grades (student_id, assignment_num, grade) VALUES (?, ?, ?)",
                  [student_id, assignment_num, grade])

def grade(assignments_dir, assignment_num):
    query_data = _conn.cursor()
    query_data.execute("SELECT expected_output FROM assignments WHERE num = ?", [assignment_num])

    # the expected value is the first element in the fetched row
    expected_output = query_data.fetchone()[0]

    # loop over the files in the assignment_dir
    for assignment in os.listdir(assignments_dir):

        # the os.path.splitext split a file name that looks like: 'file.ext' into ['file', 'ext']
        (student_id, ext) = os.path.splitext(assignment)

        # imp.load_source loads python source code (module) into a variable
        # the first argument will be the __name__ that the module will see when it loads
        # and the second is the path to the module
        code = imp.load_source('test', assignments_dir + '/' + assignment)

        # calculating the grade
        grade = 100 if code.run_assignment() == expected_output else 0

        insert_grade(student_id, assignment_num, grade)

def print_grades():
    cur = _conn.cursor()

    cur.execute("SELECT name as student_name, assignment_num, grade FROM students INNER JOIN grades ON students.id = grades.student_id")

    print 'grades:'
    for row in cur.fetchall():
        print 'grade of student {} on assignment {} is {}'.format(*row)

```

**An example run.** Assume these files were submitted for the last assignment:

```python
#1111.py
def run_assignment():
    return 'spl'

#2222.py
def run_assignment():
    return 'spl!'

#3333.py
def run_assignment():
    return 'spl'

```

Running the code:

```text
> python

>>> from vicious import *
>>> create_tables()
>>> insert_student(1111, 'Alice')
>>> insert_student(2222, 'Bob')
>>> insert_student(3333, 'Christ')
>>> insert_assignment(1, 'spl')

>>> grade('assignments', 1)
>>> print_grades()
grades:
grade of student Alice on assignment 1 is 100
grade of student Bob on assignment 1 is 0
grade of student Christ on assignment 1 is 100

```

**The central drawback:** the code for accessing the database is mixed with the code of the "logic", the way the grade is computed and the reports are prepared.

- **A change in the logic** (the method of computing the grade) means changing the code that accesses the database.
- **A change in the code that accesses the database** (assume adding a caching layer, or using a better library than `sqlite3`) means changing the logic too.
- **Using the code that accesses the database in another application** drags in loading the logic.
- **Using the logic code** (automatic grade computation) **in another application** drags in loading the code that accesses the database.

So separate the two parts:

- **an independent layer for accessing the database,**
- **the logic of giving the grade and preparing the reports.**

**A second attempt:**

```python
# file: persistence.py

import sqlite3
import atexit

# we want to make the persistence layer singleton so we are marking the
# following class as private by prepending an underscore to its name.
class _PersistenceLayer(object):
    def __init__(self):
        self._conn = sqlite3.connect('grades.db')

    def _close(self):
        self._conn.commit()
        self._conn.close()

    def create_tables(self):
        # see code in previous version...

    def insert_student(self, id, name):
        # see code in previous version...

    def insert_assignment(self, num, expected_output):
        # see code in previous version...

    def insert_grade(self, student_id, assignment_num, grade):
        # see code in previous version...

    def get_assignment_expected_output(self, assignment_num):
        c = self._conn.cursor()
        c.execute("SELECT expected_output FROM assignments WHERE num = ?", [assignment_num])
        return str(c.fetchone()[0])

    def get_all_grades(self):
        c = self._conn.cursor()
        return c.execute("SELECT name as student_name, assignment_num, grade FROM students INNER JOIN grades ON students.id = grades.student_id").fetchall()

# persistence layer is a singleton
psl = _PersistenceLayer()

atexit.register(psl._close)

```

```python
# file: grading.py

from persistence import psl
import os
import imp

def grade(assignments_dir, assignment_num):
    expected_output = psl.get_assignment_expected_output(assignment_num)

    for assignment in os.listdir(assignments_dir):
        (student_id, ext) = os.path.splitext(assignment)

        code = imp.load_source('test', assignments_dir + '/' + assignment)

        grade = 100 if code.run_assignment() == expected_output else 0

        psl.insert_grade(student_id, assignment_num, grade)

def print_grades():
    print 'grades:'
    for grade in psl.get_all_grades():
        print 'grade of student {} on assignment {} is {}'.format(*grade)

```

**The drawback:** the data the persistence layer provides is not generic. It includes only the data the logic part needs right now, and does not support wider data that the logic part may need later.

- **`expected_output`:** if you want to improve the grading method in the future, based on other fields, you will have to change the layer that accesses the database.
- **`get_all_grades`:** if you want to produce a report with richer content about a student than just the grade, you will have to change the layer that accesses the database.

So define a general interface for storing and retrieving data from a table in the database.

**A third attempt.**

- **DTO (Data Transfer Object):** an object in the programming language (in this case Python) that represents the content of a record from a table in the database. The logic part works only with objects of this type. When it needs data from the database, the data is returned to it as an object of this type (and not as a record, the way it is represented in the database).
- **DAO (Data Access Object):** an interface that supports the operation of **storing** (`insert`) an object that represents a record (a DTO), or **retrieving** a record (`find`) as such an object (a DTO).
  - **The store operation** receives a DTO to keep in the table, and builds an `INSERT` query that adds a record with the values of its fields.
  - **The retrieve operation** performs a `SELECT` query on a record from the table, and returns it as a DTO (the values of the fields in the record are the values of the fields of the DTO object).

In our case there are three DTO classes, `Student`, `Grade`, and `Assignment`, and three DAO classes, `Students`, `Grades`, and `Assignments`.

```python
# file: persistence.py

import sqlite3
import atexit

# Data Transfer Objects:

class Student(object):
    def __init__(self, id, name):
        self.id = id
        self.name = name

class Assignment(object):
    def __init__(self, num, expected_output):
        self.num = num
        self.expected_output = expected_output

class Grade(object):
    def __init__(self, student_id, assignment_num, grade):
        self.student_id = student_id
        self.assignment_num = assignment_num
        self.grade = grade

# Data Access Objects:
# All of these are meant to be singletons

class _Students:
    def __init__(self, conn):
        self._conn = conn

    def insert(self, student):
        self._conn.execute("INSERT INTO students (id, name) VALUES (?, ?)",
                           [student.id, student.name])

    def find(self, student_id):
        c = self._conn.cursor()
        c.execute("SELECT id, name FROM students WHERE id = ?", [student_id])
        return Student(*c.fetchone())

class _Assignments:
    def __init__(self, conn):
        self._conn = conn

    def insert(self, assignment):
        self._conn.execute("INSERT INTO assignments (num, expected_output) VALUES (?, ?)",
                           [assignment.num, assignment.expected_output])

    def find(self, num):
        c = self._conn.cursor()
        c.execute("SELECT num, expected_output FROM assignments WHERE num = ?", [num])
        return Assignment(*c.fetchone())

class _Grades:
    def __init__(self, conn):
        self._conn = conn

    def insert(self, grade):
        self._conn.execute("""
            INSERT INTO grades (student_id, assignment_num, grade) VALUES (?, ?, ?)
        """, [grade.student_id, grade.assignment_num, grade.grade])

    def find_all(self):
        c = self._conn.cursor()
        all = c.execute("""
            SELECT student_id, assignment_num, grade FROM grades
        """).fetchall()

        return [Grade(*row) for row in all]

# The Repository
class _Repository(object):
    def __init__(self):
        self._conn = sqlite3.connect('grades.db')
        self.students = _Students(self._conn)
        self.assignments = _Assignments(self._conn)
        self.grades = _Grades(self._conn)

    def _close(self):
        self._conn.commit()
        self._conn.close()

    def create_tables(self):
        # see code in previous version...

# the repository singleton
repo = _Repository()
atexit.register(repo._close)

```

```python
# file: grading.py

from persistence import repo
import os
import imp

def grade(assignments_dir, assignment_num):
    expected_output = repo.assignments.find(assignment_num).expected_output

    for assignment in os.listdir(assignments_dir):
        (student_id, ext) = os.path.splitext(assignment)

        code = imp.load_source('test', assignments_dir + '/' + assignment)

        student_grade = Grade(student_id, assignment_num, 0)
        if code.run_assignment() == expected_output:
            student_grade.grade = 100

        repo.grades.insert(student_grade)

def print_grades():
    print 'grades:'
    for grade in repo.grades.find_all():
        student = repo.students.find(grade.student_id)
        print 'grade of student {} on assignment {} is {}'\
            .format(student.name, grade.assignment_num, grade.grade)

```

The course organizes database code into three kinds of classes.

- **DTO (data transfer object):** a simple object that represents one row of a table.
- **DAO (data access object):** a class that performs CRUD operations (`Create`, `Read`, `Update`, `Delete`) on a single table.
- **Repository:** a higher layer that holds the business logic, and the queries that span several tables or several DAOs.

**The drawback:** the code of the different DAOs, `Students`, `Grades`, and `Assignments`, is almost identical, up to the names of the tables and the fields. So define a general DAO pattern.

**A fourth attempt.** The class that implements the general DAO pattern receives, in its constructor, the DTO class it must move to or from the database, and formulates the matching queries accordingly.

**The assumptions:**

- **the names of the tables in the database are the names of the classes of the transferred objects** (the DTOs), with an `s` added (`Student` → `Students`, `Grade` → `Grades`, `Assignment` → `Assignments`),
- **the names of the fields in the database are the names of the fields of the transferred object classes** (the DTOs),
- **the constructor of the DTO object receives all the fields** (not necessarily in their order in the table in the database, which requires the `orm` procedure).

To implement the general pattern on the basis of these assumptions, you need information about the fields of the DTO class (this can be done with Python's `inspect` package), and about the fields in the record returned from the database (included in the `cursor` object of `sqlite`).

```python
# file: dbtools.py

import inspect

# we can use our method above in order to start writing a generic Dao
# note that this class is not complete and we will add methods to it next
class Dao(object):
    def __init__(self, dto_type, conn):
        self._conn = conn
        self._dto_type = dto_type

        # dto_type is a class, its __name__ field contains a string representing the name of the class.
        self._table_name = dto_type.__name__.lower() + 's'

    def insert(self, dto_instance):
        ins_dict = vars(dto_instance)              # { 'id': 3, 'name': 'danny' }

        column_names = ','.join(ins_dict.keys())   # ['id', 'name'] => 'id,name'
        params = ins_dict.values()                 # [3, 'danny']
        qmarks = ','.join(['?'] * len(ins_dict))   # '?,?'

        stmt = 'INSERT INTO {} ({}) VALUES ({})'\
            .format(self._table_name, column_names, qmarks)

        self._conn.execute(stmt, params)

    def find_all(self):
        c = self._conn.cursor()
        c.execute('SELECT * FROM {}'.format(self._table_name))
        return orm(c, self._dto_type)

    def find(self, **keyvals):
        # keyvals = { 'id': 17, 'name': 'danny' }
        column_names = keyvals.keys()   # ['id', 'name']
        params = keyvals.values()       # [17, 'danny']

        stmt = 'SELECT * FROM {} WHERE {}' \
            .format(self._table_name, ' AND '.join([col + '=?' for col in column_names]))
        # SELECT * FROM students WHERE id=? AND name=?

        c = self._conn.cursor()
        c.execute(stmt, params)
        return orm(c, self._dto_type)

def orm(cursor, dto_type):

    # the following line retrieve the argument names of the constructor
    args = inspect.getargspec(dto_type.__init__).args   # ['self', 'id', 'name']

    # the first argument of the constructor will be 'self', it does not correspond
    # to any database field, so we can ignore it.
    args = args[1:]   # ['id', 'name']

    # gets the names of the columns returned in the cursor
    # cursor.description = [ ['name', ...], ['id', ...] ]
    # col_names = ['name', 'id']
    col_names = [column[0] for column in cursor.description]

    # map them into the position of the corresponding constructor argument
    col_mapping = [col_names.index(arg) for arg in args]   # [1, 0]
    # cursor.fetchall() = [ ['danny', 17], ['dinna', 45] ]
    return [row_map(row, col_mapping, dto_type) for row in cursor.fetchall()]

def row_map(row, col_mapping, dto_type):
    # row = ['danny', 17]
    # col_mapping [1, 0]
    # dto_type = Student
    ctor_args = [row[idx] for idx in col_mapping]   # [17, 'danny']
    return dto_type(*ctor_args)   # Student(17, 'danny')

# Repository
class Repository(object):
    def __init__(self):
        self._conn = sqlite3.connect('grades.db')
        self._conn.text_factory = bytes
        self.students = Dao(Student, self._conn)
        self.assignments = Dao(Assignment, self._conn)
        self.grades = Dao(Grade, self._conn)

    def _close(self):
        # see code in previous version...

    def create_tables(self):
        # see code in previous version...

# singleton
repo = Repository()
atexit.register(repo._close)

```

**The drawback:** every time a new field is defined in a table, or a new table in the database, you must update the matching DTO class in Python.

- **So create the DTO classes automatically,** given the database:
  - for every table, a DTO is defined with the name of the table (without the `s`),
  - the names of the fields of the DTO class are the fields of the table.
- **For that, you need information from the database** about our data model: the tables and the fields. You can get it in SQL:

```sql
SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS

```

The implementation is left as an exercise at home.

## Practice

:::problem id=ps12-foreign-key title="A teaching assistant's foreign key" source="materials/sessions/SPL_PS12.pptx" kind=exercise solution_origin=source
Session 12 uses two tables.

- **`PRACTICAL_SESSIONS`** has the columns `TA_ID`, `GroupNum`, `Location`, and `Time`, and its primary key is `GroupNum`.
- **`TEACHING_ASSISTANTS`** has the columns `ID`, `Name`, and `OfficeHours`, and its primary key is `ID`.
- **The link:** each session's `TA_ID` refers to the teaching assistant who runs it.

:::check id=ps12-foreign-key-q1
`TA_ID` is an integer column declared {{=REFERENCES TEACHING_ASSISTANTS(ID)|PRIMARY KEY|REFERENCES PRACTICAL_SESSIONS(GroupNum)}}.

- **`TA_ID` is a foreign key:** its value must be the `ID` of an existing teaching assistant, so it is declared `REFERENCES TEACHING_ASSISTANTS(ID)`.
- **It is not a primary key:** `GroupNum` already plays that role for practical sessions.
:::

:::check id=ps12-foreign-key-q2
Which of these hold?

- [x] `GroupNum` is `INTEGER PRIMARY KEY` on `PRACTICAL_SESSIONS`
- [ ] `TA_ID` is the primary key of `PRACTICAL_SESSIONS`
- [x] `ID` is `INTEGER PRIMARY KEY` on `TEACHING_ASSISTANTS`
- [x] `Name` is `TEXT NOT NULL`, and `OfficeHours`, `Location`, and `Time` are text

- **The primary keys** are `GroupNum` for sessions and `ID` for teaching assistants. `TA_ID` is a foreign key, not a primary key.
- **`Name`** is `TEXT NOT NULL`, because every teaching assistant must have a name.
- **`OfficeHours`, `Location`, and `Time`** are ordinary text columns.
:::

:::check id=ps12-foreign-key-q3
Inserting a practical session with `TA_ID = 8` fails when:

- [ ] `OfficeHours` is null
- [ ] `GroupNum` is already 8
- [x] no teaching assistant has `ID` 8

The foreign key on `TA_ID` rejects the row if no teaching assistant has `ID` 8. This is exactly the error the insert example in session 12 runs into.
:::

:::

:::problem id=ps12-join title="Joining a session and a teaching assistant" source="materials/sessions/SPL_PS12.pptx" kind=exercise solution_origin=source
Here are the two tables. In the example data, Shaked teaches two groups, and Matan and Yair teach none.

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

The inner join pairs each session with its teaching assistant by matching `ps.TA_ID` to `ta.ID`, then selects the four columns. A cross join would pair every session with every assistant, and the first option joins on unrelated columns.
:::

:::check id=ps12-join-q2
Matan and Yair stay in the result, with `Time`, `Location`, and `GroupNum` all null, under a {{=LEFT JOIN|INNER JOIN|CROSS JOIN}} from `TEACHING_ASSISTANTS` to the practical sessions.

A `LEFT JOIN` starting from `TEACHING_ASSISTANTS` keeps every assistant, including those with no session. Matan and Yair therefore appear once each, with the three session columns set to null.
:::

:::check id=ps12-join-q3
Which of these hold for the inner join in the example?

- [ ] Matan appears once
- [x] Shaked appears twice, once for each group
- [x] Matan is absent

- **Shaked appears twice,** because the inner join produces one row for each matching session, and Shaked teaches two groups.
- **Matan does not appear at all,** because he teaches no group, and an inner join drops rows with no match.
:::

:::

:::problem id=ps13-dto-dao title="DTO versus DAO" source="materials/sessions/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
The tester in session 13 has tables `students(id, name)`, `assignments(num, expected_output)`, and `grades(student_id, assignment_num, grade)`.

:::check id=ps13-dto-dao-q1
Which of these are DTOs?

- [x] `Student`
- [ ] `_Students`
- [x] `Assignment`
- [x] `Grade`

A DTO represents one row, so `Student`, `Assignment`, and `Grade` are the DTOs. The classes that run queries on a table, `_Students`, `_Assignments`, and `_Grades`, are the DAOs.
:::

:::check id=ps13-dto-dao-q2
`repo.get_grades_with_names()` belongs on the repository because:

- [ ] it implements `insert` and `find` for the `grades` table only
- [ ] it holds the connection for one table
- [x] it joins `grades` to `students` and returns rows with both `assignment_num` and `name`

- **A repository method** may span several tables, and this one joins `grades` with `students`.
- **A DAO** works on exactly one table: it implements `insert` and `find` for that table only. So a join does not belong in any single DAO.
:::

:::check id=ps13-dto-dao-q3
Bob's submission `"main"` against `expected_output` `"Main"` is recorded as a mismatch because the comparison is {{=case-sensitive|case-insensitive|skipped}}.

- **The comparison is case-sensitive,** so `"main"` and `"Main"` are different strings. The grade row therefore records a failure.
:::

:::check id=ps13-dto-dao-q4
`create_tables` is a method of the repository because:

- [ ] it maps one `students` row onto `Student`
- [x] it creates all three tables
- [ ] it is `_Grades.find`

`create_tables` creates all three tables, so, like the join, it concerns more than one table and belongs on the repository.
:::

:::

:::problem id=ps13-orm-find title="Mapping columns onto a DTO" source="materials/sessions/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
Session 13 replaces a hand-written `find` with a generic function that maps a row onto a DTO.

- **`row_map(row, col_mapping, dto_type)`** picks values out of the row by index, in the order the constructor expects, and calls the DTO's constructor with them.
- **This is a small ORM** (object-relational mapping), and `row_map` is its row mapper.
- **Before,** `Assignment.find` was written by hand as `return Assignment(*c.fetchone())`.
- **After,** the generic `find` still builds `Assignment(num, expected_output)`, but it no longer depends on the column order.

:::check id=ps13-orm-find-q1
When the row is `(num, expected_output)`, `col_mapping` is {{=[0, 1]|[1, 0]|[0]}}.

- **What `col_mapping` means:** it lists, in the order of the constructor's parameters, the index of the column that holds each value.
- **Here** the row is already in constructor order, so the mapping is `[0, 1]`, and `dto_type(*ctor_args)` becomes `Assignment(num, expected_output)`.
:::

:::check id=ps13-orm-find-q2
When the query selected `expected_output` before `num`, `col_mapping` is:

- [ ] `[0, 1]`, because the mapping always follows the row from left to right
- [x] `[1, 0]`, so the constructor still receives `num` first
- [ ] `[0]`, because only `num` is passed

Now `num` is at index 1 and `expected_output` is at index 0. The constructor wants `num` first, so the mapping is `[1, 0]`, and the call is still `Assignment(num, expected_output)`.
:::

:::check id=ps13-orm-find-q3
Which of these hold?

- [x] `col_mapping` lists indexes in constructor order
- [ ] `row_map` ignores `col_mapping` and always calls `Assignment(*row)`
- [x] A mapping that follows `SELECT *` blindly breaks when the table's column order changes

- **`col_mapping` is in constructor order,** and `row_map` really uses it, unlike the second option.
- **Relying on `SELECT *`** breaks as soon as someone changes the table's column order.
- **An `INSERT` without a column list** has the same weakness, because it also depends on a column order that can change.
:::

:::examnote
- **What the question looks like:** it describes a small business in a few sentences and asks you to design the tables and keys, then write one `SELECT`.
- **The usual traps:** squeezing a list into one column, or leaving out the junction table so that a join produces wrong or duplicated rows.
:::

:::

:::problem id=exam-15a-q4 title="The BigApple schema" source="materials/exams/15-a.pdf" kind=exam solution_origin=derived
The phone company BigApple stores two kinds of data.

- **Customers:** each has a name, a phone number, a join date, and links to other customers who are family members.
- **Account actions:** each action has a date, the other phone number involved, and a kind, which is one of: message sent, outgoing call, missed call, or message received.

:::check id=exam-15a-q4-q1
Which of these hold?

- [x] `Customers.phone` is `TEXT PRIMARY KEY`, with `name TEXT NOT NULL` and `joined DATE NOT NULL`
- [ ] A text column `relatives` on `Customers` is what the family query joins
- [x] `Family` has primary key `(phone, relative)`, and both columns reference `Customers(phone)`
- [x] `Actions.kind` is `TEXT NOT NULL`, `other_phone` is text, `at` is `TIMESTAMP NOT NULL`, and `phone` references `Customers(phone)`

- **Customers:** the phone number identifies a customer, so it is the primary key.
- **Family:** family links are many-to-many between customers, so they need a junction table, `Family`, whose two columns both reference `Customers`.
- **Why not a `relatives` text column:** a list stored in one text column cannot be joined or queried properly.
- **Actions:** each action gets its own `id INTEGER PRIMARY KEY`, and its `phone` references the customer it belongs to.
:::

:::check id=exam-15a-q4-q2
Messages received by a family member are actions whose `kind` is {{='received'|'sent'|'missed call'}}.

A message received is an action whose `kind` is `'received'`. The query starts from Ringo's customer row, joins `Family` on `f.phone = c.phone` to find his relatives, then joins `Actions` on `a.phone = f.relative AND a.kind = 'received'`.
:::

:::check id=exam-15a-q4-q3
Which statement returns the messages received by the family members of Ringo Starr?

- [ ] `SELECT relatives FROM Customers WHERE name = 'Ringo Starr'`
- [ ] `SELECT a.* FROM Customers c JOIN Actions a ON a.phone = c.phone AND a.kind = 'received' WHERE c.name = 'Ringo Starr'`
- [x] `SELECT a.* FROM Customers c JOIN Family f ON f.phone = c.phone JOIN Actions a ON a.phone = f.relative AND a.kind = 'received' WHERE c.name = 'Ringo Starr'`

- **The path:** from Ringo's row in `Customers`, through `Family` to each relative's phone, and then to that relative's received messages in `Actions`.
- **Why the second option is wrong:** it skips `Family`, so it returns Ringo's own messages, not his relatives'.
:::

:::check id=exam-15a-q4-q4
When family is symmetric, the rows in `Family` are stored as:

- [x] both directions, or the pair inserted in both orders
- [ ] one text column `relatives` on `Customers`
- [ ] a single `Actions` row whose `kind` is the relative's name

If A is family of B, then B is also family of A. So each pair is stored in both directions, for example (A, B) and (B, A), and the query works no matter which side you start from.
:::

:::

:::problem id=exam-15b-q4 title="Number porting" source="materials/exams/15-b.pdf" kind=exam solution_origin=derived
Extend the BigApple schema with three things.

- **The kind of each family relationship,** such as parent, sibling, or child.
- **A table of competing carriers.**
- **A history of number porting:** for each time a customer left, the date and the carrier they moved to.

:::check id=exam-15b-q4-q1
The relationship kind is a {{=kind|left_on|carrier_id}} column added to `Family`.

- **The relationship kind** describes a pair of people, so it belongs on the `Family` row as a new column, `kind TEXT`.
- **Carriers and porting history** are new kinds of data, so each gets its own table.
:::

:::check id=exam-15b-q4-q2
Which of these hold?

- [x] `Carriers` has `id INTEGER PRIMARY KEY` and `name TEXT UNIQUE NOT NULL`
- [ ] A porting history is two columns on `Customers`
- [x] `Portings` has primary key `(phone, left_on)`, `phone` referencing `Customers(phone)`, and `carrier_id` referencing `Carriers(id)`

- **`Portings`** stores `phone`, `left_on`, and `carrier_id`, so each row is one departure.
- **The primary key `(phone, left_on)`** lets the same phone appear several times, once per departure date.
- **Why not two columns on `Customers`:** that could record only one departure, not a full history.
:::

:::check id=exam-15b-q4-q3
Which statement lists every carrier Ringo Starr moved to, with the date?

- [ ] `SELECT kind, left_on FROM Family WHERE phone = 'Ringo Starr'`
- [x] `SELECT car.name, p.left_on FROM Customers c JOIN Portings p ON p.phone = c.phone JOIN Carriers car ON car.id = p.carrier_id WHERE c.name = 'Ringo Starr' ORDER BY p.left_on`
- [ ] `SELECT car.name FROM Actions a JOIN Carriers car ON a.kind = car.name WHERE a.phone = 'Ringo Starr'`

The query finds Ringo in `Customers`, joins `Portings` to get his departures, joins `Carriers` to get each carrier's name, and sorts the result by date with `ORDER BY p.left_on`.
:::

:::

:::problem id=exam-16a-q4 title="Abbey Road sessions" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
The Abbey Road studio stores its recording sessions.

- **A session** has a date, a song, a band, and many takes.
- **A take** involves people in roles: players, singers, and technicians. One person may play several instruments on the same take.
- **The query:** find the takes on which Billy Preston played keyboards during the Beatles' "Get Back" sessions in January 1969.

:::check id=exam-16a-q4-q1
Which of these hold?

- [x] `Takes` has primary key `(session_id, take_no)`, and `session_id` references `Sessions(id)`
- [x] `Participations.person_id` references `People(id)`, and `(session_id, take_no)` references `Takes`
- [ ] `Takes.take_no` alone is the primary key of a take
- [x] The primary key of `Participations` is `(session_id, take_no, person_id, role, instrument)`

- **`Sessions`** stores `id`, `on_date DATE NOT NULL`, `song TEXT NOT NULL`, and `band TEXT NOT NULL`.
- **`Takes`** are numbered within each session, so a take is identified by the pair `(session_id, take_no)`. `take_no` alone is not unique.
- **`Participations`** links a person to a take, with a `role` and an `instrument`.
- **Why `instrument` is in the primary key:** one person may play several instruments on the same take, and each instrument needs its own row.
:::

:::check id=exam-16a-q4-q2
January 1969 is `s.on_date >= '1969-01-01' AND s.on_date` {{=< '1969-02-01'|= '1969-01-01'|> '1969-12-31'}}.

"Before February 1st" covers every day in January, including the last one. The query also filters on `s.band = 'Beatles'`, `s.song = 'Get Back'`, `pe.name = 'Billy Preston'`, and `p.instrument = 'keyboards'`, and it orders the result by `s.on_date`.
:::

:::check id=exam-16a-q4-q3
Which join path returns `t.take_no` and `s.song`?

- [ ] `Sessions` joined to `People` on `s.band = pe.name`
- [x] `Sessions` to `Takes` on `t.session_id = s.id`, then `Participations` on `session_id` and `take_no`, then `People` on `pe.id = p.person_id`
- [ ] `Takes` joined to `Participations` on `t.take_no = p.person_id`

- **The join path follows the foreign keys:** `Sessions` to `Takes`, `Takes` to `Participations`, and `Participations` to `People`.
- **Then** the query selects `t.take_no, s.song`, and the band, song, date, person, and instrument are all `WHERE` filters on that joined result.
- **The wrong options** join on columns that are not related, such as a band name to a person's name.
:::

:::

:::problem id=exam-16b-q4 title="A fixed set of roles" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
This question uses the same Abbey Road schema: a recording session has a date, a song, a band, and many takes, and each take has people in roles (player, singer, technician). The role is stored as free text.

:::check id=exam-16b-q4-q1
While `role` is free text, Kim Philby appears as a double agent by:

- [ ] adding a boolean column for each role on `People`
- [ ] refusing every participation insert until a `Roles` table exists
- [x] inserting Kim into `People` and a `Participations` row with `role = 'double agent'`

Because the role is free text, the schema accepts any value at all. Kim Philby is simply inserted as a person, with a participation whose role is `'double agent'`. Nothing stops it.
:::

:::check id=exam-16b-q4-q2
After `CREATE TABLE Roles (name TEXT PRIMARY KEY)`, `Participations.role` {{=REFERENCES Roles(name)|PRIMARY KEY|REFERENCES People(id)}}.

- **The fix:** a `Roles` table lists the allowed roles, and `Participations.role` becomes a foreign key to it. The official solution fills it with `player`, `singer`, and `engineer`.
- **The effect:** inserting a participation with `role = 'double agent'` now fails, unless someone first adds that role to `Roles` on purpose.
:::

:::check id=exam-16b-q4-q3
Which of these hold?

- [x] The double-agent insert fails until that role is added on purpose
- [ ] Free text already rejects `role = 'double agent'`
- [x] `CHECK (role IN (...))` is the alternative when the constraint is on a single column

- **With the foreign key** to `Roles(name)`, the double-agent insert fails until that role is added deliberately.
- **Free text** rejects nothing, which was the original problem.
- **An alternative** is `CHECK (role IN ('player', 'singer', 'engineer'))` on the column itself. It also restricts the values, but changing the list then means changing the table definition.
:::

:::

:::problem id=exam-17a-q4 title="A glasses shop" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
An online glasses shop needs a database.

- **Models:** the warehouse stores each model's number and price.
- **Customers:** the shop registers each customer's name and id.
- **Purchases:** a purchase records the customer id and the model, and the shop issues a receipt with a unique number and the purchase details.
- **Queries:** a customer can ask for the price of a model, and the owner can list every receipt.

:::check id=exam-17a-q4-q1
The price column lives only on {{=Models|Receipts|Customers}}.

- **The price belongs to the model,** so it is stored once, in `Models`.
- **The price query** is `SELECT price FROM Models WHERE model_no = ?`, so a customer always gets the current price.
:::

:::check id=exam-17a-q4-q2
Which statement lists every receipt?

- [ ] `SELECT price FROM Models WHERE model_no = ?`
- [x] `SELECT * FROM Receipts`
- [ ] `SELECT name FROM Customers WHERE id = model_no`

- **Listing every receipt** is simply `SELECT * FROM Receipts`.
- **The first option** is the price query, and the third compares unrelated columns.
:::

:::check id=exam-17a-q4-q3
Which of these hold?

- [x] `Models.model_no` is `INTEGER PRIMARY KEY` and `price` is `INTEGER NOT NULL`
- [x] `Receipts.receipt_no` is `INTEGER PRIMARY KEY`
- [ ] `Receipts` stores the price and has no model number
- [x] `Receipts.customer_id` references `Customers(id)` and `Receipts.model_no` references `Models(model_no)`

- **A receipt stores the model number,** and joins back to `Models` for the price. A receipt without a model number would lose what was bought.
- **One refinement:** if a receipt must remember the price actually charged, even after the price changes, also copy `price` into `Receipts` when the receipt is created.
:::

:::

:::problem id=exam-17b-q4 title="Garage jobs" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
A garage needs a database.

- **Jobs:** each job has an id, a car number, and a description of the fault.
- **Workers:** each worker has an id and a name.
- **Assignments:** assigning a worker to a job records the worker, the job, and that the job is not yet finished. Finishing the job marks it done.

:::check id=exam-17b-q4-q1
A new assignment records unfinished work with `finished INTEGER NOT NULL DEFAULT` {{=0|1|NULL}}.

`DEFAULT 0` means every new assignment starts as unfinished without anyone setting the flag. Unfinished jobs are then the assignment rows where `finished = 0`.
:::

:::check id=exam-17b-q4-q2
Which statement returns a worker's unfinished jobs?

- [ ] `SELECT * FROM Jobs WHERE worker_id = ? AND finished = 0`
- [ ] `SELECT j.* FROM Assignments a JOIN Jobs j ON j.job_id = a.job_id WHERE a.worker_id = ? AND a.finished = 1`
- [x] `SELECT j.* FROM Assignments a JOIN Jobs j ON j.job_id = a.job_id WHERE a.worker_id = ? AND a.finished = 0`

The worker and the flag are stored in `Assignments`, not in `Jobs`, so the query joins `Assignments` to `Jobs`, and keeps the rows for that worker where `finished` is 0. The second option asks for finished jobs instead.
:::

:::check id=exam-17b-q4-q3
Which of these hold?

- [x] `Jobs.job_id` is `INTEGER PRIMARY KEY`, and `Workers.id` is `TEXT PRIMARY KEY`
- [ ] Finishing a job deletes the assignment row
- [x] `Assignments` has primary key `(job_id, worker_id)`, with foreign keys to `Jobs(job_id)` and `Workers(id)`
- [x] Finishing a job is `UPDATE Assignments SET finished = 1 WHERE job_id = ? AND worker_id = ?`

- **The tables:** `Jobs` also stores `car_no TEXT NOT NULL` and `fault TEXT NOT NULL`, and `Workers` stores `name TEXT NOT NULL`.
- **`Assignments`** links a job to a worker, so its primary key is the pair `(job_id, worker_id)`, and each column is a foreign key.
- **Finishing a job** updates the flag to 1. Deleting the row would lose the record that the work was done.
:::

:::

:::problem id=exam-18a-q4 title="A question bank" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
A question bank stores exam questions.

- **Each question** has its text.
- **Each use of a question** records the year and which of that year's two sittings (`moed`) it appeared in.
- **The rule:** a question may appear again in a later year, but it must never be used twice in the same year.

:::check id=exam-18a-q4-q1
The key that rejects a second use in the same year is {{=PRIMARY KEY (question_id, year)|PRIMARY KEY (question_id)|PRIMARY KEY (year, moed)}}.

- **`PRIMARY KEY (question_id, year)`** allows only one row for each question in each year, so a second use in that year is rejected, whichever sitting it is in.
- **A later year** has a different `year` value, so it is a new row and is allowed.
:::

:::check id=exam-18a-q4-q2
Which of these hold?

- [x] `questions` has `id INTEGER PRIMARY KEY` and `text TEXT NOT NULL`
- [x] `asked.question_id` references `questions(id)`, `year` is `INTEGER NOT NULL`, and `moed` is `TEXT NOT NULL`
- [ ] `year_a` and `year_b` on `questions` store every later year
- [ ] `question_id_A` and `question_id_B` are the right grain for every question used in a year

- **The correct design:** one `questions` table, and an `asked` table with one row for each use of a question.
- **Why not `year_a` and `year_b`:** two columns can remember only two uses, but a question may be used in many years.
- **Why not `question_id_A` and `question_id_B` in a year table:** that records only two questions per year, which is the wrong level of detail.
:::

:::check id=exam-18a-q4-q3
Which statement enforces one use of a question per year?

- [ ] `questions(id, text, year_a, year_b)` with no `asked` table
- [ ] a year table whose only question links are `question_id_A` and `question_id_B`
- [x] `asked(question_id, year, moed)` with `PRIMARY KEY (question_id, year)`

Only the `asked` table with `PRIMARY KEY (question_id, year)` lets the database itself enforce the rule. The key includes the year but not the sitting, so a second use in the same year collides with the first, even in a different sitting.
:::

:::

:::problem id=exam-18b-q4 title="Police wiretaps" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
The police keep a database of wiretaps.

- **A recording** stores the text of the call, the caller's number, the number called, and the date.
- **Each phone number** has an owner's name and an address.

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

- **Each recording has two numbers,** `from_num` and `to_num`, and each one references `phone(phone_num)`.
- **So you join `phone` twice,** under two different aliases, `src` and `dst`: one to find the caller's owner and one to find the receiver's owner.
:::

:::check id=exam-18b-q4-q2
Which statement returns the recordings of a given number, with both owners' names?

- [ ] `SELECT r.body, phone.name FROM recordings r JOIN phone ON phone.phone_num = r.from_num WHERE r.from_num = ?`
- [x] `SELECT r.at, r.body, src.name, dst.name FROM recordings r JOIN phone src ON src.phone_num = r.from_num JOIN phone dst ON dst.phone_num = r.to_num WHERE r.from_num = ? OR r.to_num = ?`
- [ ] `SELECT src.name, dst.name FROM phone src JOIN phone dst ON src.phone_num = dst.phone_num`

- **The filter** keeps a recording when the given number is either the caller or the receiver.
- **The select list** is `r.at`, `r.body`, `src.name`, and `dst.name`, so both owners' names appear.
- **The first option** joins `phone` only once, so it shows just one name, and the third never looks at recordings.
:::

:::check id=exam-18b-q4-q3
Which of these hold for `recordings`?

- [ ] `body` is the primary key
- [x] `id` is `INTEGER PRIMARY KEY`
- [x] `at` is `TIMESTAMP NOT NULL` and `body` is `TEXT NOT NULL`
- [x] `from_num` and `to_num` both reference `phone(phone_num)`

- **`id`** is the primary key. The text `body` is not unique, so it cannot be one.
- **Both number columns** are foreign keys to `phone(phone_num)`.
:::

:::

:::problem id=exam-19a-q4 title="An Airbnb schema" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
Design a database for Airbnb.

- **Users:** each user has an id, and may be a guest, a host, or both.
- **Properties:** each property has an id, one host, a price per night, and a description.
- **Rentals:** each rental has a guest, a property (which also determines the host), a check-in date, and a check-out date.
- **Recommendations:** after check-out, the host writes a recommendation about the guest, and the guest writes one about the host.

:::check id=exam-19a-q4-q1
The foreign key to the host is {{=properties.host_id|users.host_id|rentals.host_id}}, referencing `users(id)`.

- **Each property has one host,** so `properties.host_id` references `users(id)`.
- **There is only one table of people,** because the same user can be both a guest and a host.
:::

:::check id=exam-19a-q4-q2
Which of these hold?

- [x] `users` is the only people table, with `id INTEGER PRIMARY KEY` and `name TEXT NOT NULL`
- [ ] Guests and hosts are two tables, each with its own primary key
- [x] `recommendations` has primary key `(rental_id, author_id)`
- [x] `author_id` and `about_id` both reference `users(id)`, and `rental_id` references `rentals(id)`

- **A user with both roles** simply appears as `host_id` on some property and as `guest_id` on some rental. Two separate tables would store the same person twice.
- **A recommendation row** stores `rental_id`, `author_id`, `about_id`, and `text TEXT NOT NULL`.
- **Its key `(rental_id, author_id)`** allows exactly one recommendation per author per rental: one by the guest and one by the host.
:::

:::check id=exam-19a-q4-q3
Which column list matches `rentals`?

- [ ] `guest_id`, `host_id`, `check_in DATE NOT NULL`, `check_out DATE NOT NULL`
- [ ] `property_id INTEGER PRIMARY KEY` and `price INTEGER NOT NULL`
- [x] `guest_id` referencing `users(id)`, `property_id` referencing `properties(property_id)`, `check_in DATE NOT NULL`, and `check_out DATE`

- **`rentals` stores** `guest_id`, `property_id`, `check_in DATE NOT NULL`, and `check_out DATE`.
- **No `host_id` in `rentals`:** the host is already known from the property, and storing it again could contradict `properties`.
- **`price` and `host_id`** are columns of `properties`.
:::

:::

:::problem id=exam-19b-q4 title="One night per property" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
This question uses the same Airbnb schema, with users, properties, and rentals. It adds one rule: two guests must never rent the same property on the same night.

:::check id=exam-19b-q4-q1
The `nights` primary key is {{=(property_id, night)|(rental_id)|(night)}}.

- **The idea:** each booking writes one `nights` row for every night of the stay.
- **The key `(property_id, night)`** allows only one row per property per night, so a second booking for an occupied night breaks the primary key and the insert fails.
:::

:::check id=exam-19b-q4-q2
A `CHECK` constraint:

- [x] looks at the row being written
- [ ] compares two rental rows and rejects overlapping dates by itself
- [ ] is the primary key of `rentals`

A `CHECK` constraint can only look at the single row being written. It cannot compare that row with other rentals, so it cannot detect overlapping dates. That is why the extra `nights` table is needed: it turns an overlap into a duplicate key, which the database can detect.
:::

:::check id=exam-19b-q4-q3
Which of these hold?

- [x] `nights.property_id` references `properties(property_id)`
- [ ] The primary key of `nights` is `(rental_id)` alone
- [x] `nights.rental_id` references `rentals(id)`
- [x] Who is staying at property P on night D is a join from `nights` to `rentals` to `users`

- **The base tables** `users`, `properties`, and `rentals` stay as before.
- **`nights`** adds `property_id`, `night`, and `rental_id`, with foreign keys to `properties` and `rentals`.
- **To find who stays at property P on night D,** look up `nights`, follow `rental_id` to `rentals`, and then `guest_id` to `users`.
- **The key cannot be `(rental_id)` alone,** because one rental covers many nights.
:::

:::

:::problem id=exam-20a-q4 title="A DVD schema" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
A DVD service needs a database.

- **Users** have an id and a name.
- **Movies** have an id, a name, a description, an average `score`, and `num_scorers`, the number of users who scored it. Each movie may belong to any number of categories from {Action, Drama, Romance, kids}.
- **Viewings** record which user watched which movie, and on which date.

:::check id=exam-20a-q4-q1
A movie with no category row is kept by a {{=LEFT JOIN|INNER JOIN|CROSS JOIN}} from `movies` to `categories`.

- **The query** joins `watches` to `movies` for `w.user_id = ?`, then left-joins `categories` on `c.movie_id = m.id`.
- **Why a `LEFT JOIN`:** an inner join would drop a movie that has no category row, but a left join keeps it, with a null category.
:::

:::check id=exam-20a-q4-q2
Which of these hold?

- [x] `categories` has primary key `(movie_id, category)` and `movie_id` references `movies(id)`
- [ ] `movies` stores every category in one `category` column
- [x] `watches` has primary key `(user_id, movie_id, on_date)`
- [x] `movies.score` is `REAL` and `movies.num_scorers` is `INTEGER NOT NULL DEFAULT 0`

- **Categories need a separate table,** because a movie can have many. Its key `(movie_id, category)` stops the same category being listed twice for one movie.
- **`watches`** references both `users(id)` and `movies(id)`, and `on_date` is `DATE NOT NULL`. Including the date in the key lets a user watch the same movie again on another day.
- **`categories.category`** is `TEXT NOT NULL`.
:::

:::check id=exam-20a-q4-q3
A movie with two categories in this query:

- [ ] appears once, with both categories in one column
- [x] appears twice, once per category
- [ ] is dropped, because the category join is a left join

The join produces one row for each matching category row, so a movie with two categories appears twice, once with each category. That is how a one-to-many table always behaves in a join.
:::

:::

:::problem id=exam-20b-q4 title="An average score" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
This question uses the same DVD schema. A movie stores its average `score` and its `num_scorers`. Now a user submits a new score `s` for a movie, and the stored average must be updated.

:::check id=exam-20b-q4-q1
The new average stored on the movie is this expression.

```sql
(score * num_scorers + :s) / ({{=num_scorers + 1|num_scorers|score + 1}})
```

- **Why the formula works:** `score * num_scorers` is the total of all the old scores. Adding `s` gives the new total, and dividing by `num_scorers + 1` gives the new average.
- **How to store it:** one `UPDATE ... WHERE id = :movie` sets `score` to that value and `num_scorers` to `num_scorers + 1` together. In SQL, every expression on the right reads the old values, so the order does not matter.
:::

:::check id=exam-20b-q4-q2
Which statement lists movies in a category sorted by score?

- [ ] `SELECT m.name, m.score FROM movies m ORDER BY m.num_scorers`
- [x] `SELECT m.name, m.score FROM movies m JOIN categories c ON c.movie_id = m.id WHERE c.category = 'Drama' ORDER BY m.score DESC`
- [ ] `SELECT m.name, m.score FROM movies m LEFT JOIN categories c ON c.movie_id = m.id WHERE m.score IS NOT NULL`

- **The join** is an inner join to `categories`, filtered by `c.category = 'Drama'`, so only Drama movies remain.
- **The order** is `ORDER BY m.score DESC`, which puts the highest score first.
- **The other options** sort by the wrong column, or never filter by category.
:::

:::check id=exam-20b-q4-q3
Which of these hold?

- [x] One `UPDATE` changes `score` and `num_scorers` together
- [x] Two statements need a transaction if that pair is to stay atomic
- [ ] Object serialization makes those two column writes atomic by itself
- [ ] The category query keeps a movie that has no Drama row

- **One `UPDATE` is atomic,** so changing both columns in a single statement is safe.
- **Two separate statements** need a transaction, or another user's update could run between them.
- **Object serialization** only writes bytes; it provides no atomicity. Only the database provides transactions.
- **The Drama query** uses an inner join, so a movie with no Drama row is not in its result.
:::

:::

To sum up, a database management system is a run-time environment for data that outlives the process. You design its tables from your classes, reach them in SQL, and keep the SQL inside a persistence layer of DTOs, DAOs, and a repository, so the logic never depends on how the data is stored.

- **Next:** [Course review](topic:course-review) goes over the main topics, the design patterns, and the structure of the exam.
