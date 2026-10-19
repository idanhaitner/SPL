#
# SPL practice — PS13, the persistence layer
# Slides: Exrecises/SPL_PS13_PRES.pptx
#
# Completed answers for PS13_Persistence.py. Try that file on your own first, then compare.
#
# From this folder:
#   python3 PS13_Persistence.py

import inspect
import sqlite3

class NotImplementedExercise(Exception):
    """Kept so a finished file and a practice file share one runner."""


class Score:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.todo = 0

    def pass_(self, name):
        print(f"  [pass] {name}")
        self.passed += 1

    def fail(self, name, why):
        print(f"  [fail] {name}")
        print(f"         {why}")
        self.failed += 1

    def skip(self, name):
        print(f"  [todo] {name}")
        self.todo += 1

    def finish(self):
        print()
        print(f"{self.passed} passed, {self.failed} failed, {self.todo} still to do.")
        if self.failed == 0 and self.todo == 0:
            print("All exercises complete. Nice work.")
        elif self.failed == 0 and self.passed == 0:
            print("Every exercise is still open. Fill one in and run again.")
        elif self.failed == 0:
            print("The finished ones are correct. Fill in each [todo].")
        return 0 if self.failed == 0 else 1


def expect_eq(label, got, want):
    if got != want:
        raise RuntimeError(f"{label}\n         expected: {want!r}\n         got:      {got!r}")


def expect_true(label, cond):
    if not cond:
        raise RuntimeError(label)


def check(score, name, fn):
    try:
        fn()
        score.pass_(name)
    except NotImplementedError:
        score.skip(name)
    except Exception as ex:
        score.fail(name, str(ex) or ex.__class__.__name__)


def read(line):
    print(f"  [read] {line}")


# A DTO is the Python object both sides agree on. Its fields have the
# same names as the columns. __init__ runs when you call Student(1, "Alice").


class Student:
    def __init__(self, id, name):
        self.id = id
        self.name = name


class Assignment:
    def __init__(self, num, expected_output):
        self.num = num
        self.expected_output = expected_output


class Grade:
    def __init__(self, student_id, assignment_num, grade):
        self.student_id = student_id
        self.assignment_num = assignment_num
        self.grade = grade


# The join below returns a different shape from any one table, so it gets
# its own small DTO. This one is finished; use it as the pattern.
class StudentGrade:
    def __init__(self, name, assignment_num, grade):
        self.name = name
        self.assignment_num = assignment_num
        self.grade = grade


# A DAO is the object that speaks SQL for one table.
class StudentsDao:
    def __init__(self, conn):
        self._conn = conn

    def insert(self, student):
        self._conn.execute(
            "INSERT INTO students (id, name) VALUES (?, ?)",
            (student.id, student.name),
        )

    def find(self, student_id):
        # A one-element tuple needs the comma: (student_id,)
        row = self._conn.execute(
            "SELECT id, name FROM students WHERE id = ?",
            (student_id,),
        ).fetchone()
        if row is None:
            return None
        return Student(row[0], row[1])


class GradesDao:
    def __init__(self, conn):
        self._conn = conn

    def insert(self, grade):
        self._conn.execute(
            """
            INSERT INTO grades (student_id, assignment_num, grade)
            VALUES (?, ?, ?)
            """,
            (grade.student_id, grade.assignment_num, grade.grade),
        )

    def update(self, grade):
        self._conn.execute(
            """
            UPDATE grades
            SET grade = ?
            WHERE student_id = ? AND assignment_num = ?
            """,
            (grade.grade, grade.student_id, grade.assignment_num),
        )


# Exercise.
# CREATE the three tables. grades.student_id points at students.id.
# grades.assignment_num points at assignments.num.
# The pair (student_id, assignment_num) is the primary key of grades.
def create_tables(conn):
    conn.executescript(
        """
        CREATE TABLE students (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        );
        CREATE TABLE assignments (
            num INTEGER PRIMARY KEY,
            expected_output TEXT NOT NULL
        );
        CREATE TABLE grades (
            student_id INTEGER NOT NULL,
            assignment_num INTEGER NOT NULL,
            grade INTEGER NOT NULL,
            PRIMARY KEY (student_id, assignment_num),
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (assignment_num) REFERENCES assignments(num)
        );
        """
    )


# The grader's whole decision: the strings match, or they do not.
# "main" is not "Main". "Main " is not "Main".
def score_submission(actual, expected):
    if actual == expected:
        return 100
    return 0


# One query instead of a query per student. The JOIN matches a grade
# row to the student's name.
def grades_with_names(conn):
    rows = conn.execute(
        """
        SELECT s.name, g.assignment_num, g.grade
        FROM grades AS g
        JOIN students AS s ON g.student_id = s.id
        ORDER BY s.name
        """
    ).fetchall()
    return [StudentGrade(name, number, grade) for name, number, grade in rows]


# Generic mapping. The cursor's columns may arrive in a different order
# from the constructor's parameters. Match them by name.
# inspect.signature is the current form of the getargspec call in the slides.
def orm(cursor, dto_type):
    params = [
        name for name in inspect.signature(dto_type.__init__).parameters
        if name != "self"
    ]
    columns = [row[0] for row in cursor.description]
    mapping = [columns.index(name) for name in params]
    return [dto_type(*(row[index] for index in mapping)) for row in cursor.fetchall()]


def empty():
    return sqlite3.connect(":memory:")


def canonical(conn):
    conn.executescript(
        """
        CREATE TABLE students (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
        );
        CREATE TABLE assignments (
            num INTEGER PRIMARY KEY,
            expected_output TEXT NOT NULL
        );
        CREATE TABLE grades (
            student_id INTEGER NOT NULL,
            assignment_num INTEGER NOT NULL,
            grade INTEGER NOT NULL,
            PRIMARY KEY (student_id, assignment_num)
        );
        """
    )


def columns(conn, table):
    return [row[1] for row in conn.execute(f"PRAGMA table_info({table})")]


def main():
    print("""
============================================================
PS13 — Persistence layer
Slides: Exrecises/SPL_PS13_PRES.pptx
============================================================

The persistence layer sits between the program and the database.
The program talks about students and grades. The layer talks SQL.

    DTO          one object, one row. Student stands for a students row.
    DAO          the SQL for one table: insert, find, update.
    Repository   several DAOs, plus CREATE TABLE and any JOIN.

A DAO is usually one per table. A JOIN does not belong to one table,
so it lives on the repository. UPDATE of a single table stays on that
table's DAO.

ORM is the repetitive part pulled into one function. It reads the
constructor parameter names, reads the column names of the current
result, and builds a DTO even when the SELECT lists the columns in
another order.

The slides delete grades.db when the program exits so every run starts
clean. This file uses an in-memory database for the same reason.

""")
    read('score_submission("Main", "Main") is the Alice case from the slides')

    print("\nExercises")
    score = Score()

    def check_student():
        student = Student(1111, "Alice")
        expect_eq("id", student.id, 1111)
        expect_eq("name", student.name, "Alice")

    def check_assignment():
        assignment = Assignment(1, "Main")
        expect_eq("num", assignment.num, 1)
        expect_eq("output", assignment.expected_output, "Main")

    def check_grade():
        grade = Grade(1111, 1, 100)
        expect_eq("student", grade.student_id, 1111)
        expect_eq("assignment", grade.assignment_num, 1)
        expect_eq("grade", grade.grade, 100)

    def check_create():
        conn = empty()
        create_tables(conn)
        expect_eq("students", set(columns(conn, "students")), {"id", "name"})
        expect_eq("assignments", set(columns(conn, "assignments")), {"num", "expected_output"})
        expect_eq("grades", set(columns(conn, "grades")), {"student_id", "assignment_num", "grade"})

    def check_students_dao():
        conn = empty()
        canonical(conn)
        dao = StudentsDao(conn)
        dao.insert(Student(2222, "Bob"))
        found = dao.find(2222)
        expect_eq("name", found.name, "Bob")
        expect_eq("missing", dao.find(9), None)

    def check_grades_dao():
        conn = empty()
        canonical(conn)
        dao = GradesDao(conn)
        dao.insert(Grade(2222, 1, 0))
        dao.update(Grade(2222, 1, 99))
        row = conn.execute(
            "SELECT grade FROM grades WHERE student_id = 2222 AND assignment_num = 1"
        ).fetchone()
        expect_eq("after the appeal", row[0], 99)

    def check_score():
        expect_eq("Alice", score_submission("Main", "Main"), 100)
        expect_eq("Bob", score_submission("main", "Main"), 0)
        expect_eq("Charlie", score_submission("Main ", "Main"), 0)

    def check_join():
        conn = empty()
        canonical(conn)
        conn.executemany("INSERT INTO students (id, name) VALUES (?, ?)", [(1111, "Alice"), (2222, "Bob")])
        conn.execute("INSERT INTO grades (student_id, assignment_num, grade) VALUES (2222, 1, 0)")
        conn.execute("INSERT INTO grades (student_id, assignment_num, grade) VALUES (1111, 1, 100)")
        found = grades_with_names(conn)
        expect_eq("names", [item.name for item in found], ["Alice", "Bob"])
        expect_eq("grades", [item.grade for item in found], [100, 0])

    def check_orm():
        conn = empty()
        conn.execute("CREATE TABLE students (id INTEGER, name TEXT)")
        conn.execute("INSERT INTO students (id, name) VALUES (1111, 'Alice')")
        # name comes back before id, on purpose.
        cursor = conn.execute("SELECT name, id FROM students")
        found = orm(cursor, Student)
        expect_eq("count", len(found), 1)
        expect_eq("id", found[0].id, 1111)
        expect_eq("name", found[0].name, "Alice")

    check(score, "1. Student — a DTO for one students row", check_student)
    check(score, "2. Assignment — num and expected_output", check_assignment)
    check(score, "3. Grade — student, assignment, and the score", check_grade)
    check(score, "4. create_tables — students, assignments, grades", check_create)
    check(score, "5. StudentsDao — insert and find with ?", check_students_dao)
    check(score, "6. GradesDao — insert, then UPDATE for an appeal", check_grades_dao)
    check(score, "7. score_submission — Main, main, and Main-with-a-space", check_score)
    check(score, "8. grades_with_names — one JOIN instead of a query per row", check_join)
    check(score, "9. orm — build the DTO by column name, not by position", check_orm)
    return score.finish()


if __name__ == "__main__":
    raise SystemExit(main())
