#
# SPL practice — PS12, SQL and a little Python
# Slides: materials/sessions/SPL_PS12.pptx
#
# Completed answers for PS12_SqlAndPython.py. Try that file on your own first, then compare.
#
# From this folder:
#   python3 PS12_SqlAndPython.py

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


# Exercise 1.
# A Python function starts with def. The type of a and b is decided when
# the function actually runs. Return their sum.
def add(a, b):
    return a + b


# Exercise 2.
# A list comprehension builds a list. squares(3) is [1, 4, 9].
# squares(0) is [].
def squares(n):
    return [i * i for i in range(1, n + 1)]


# The tables this session uses. A later exercise creates the first one.
# The checker creates both itself when it is testing a query, so you can
# solve the SELECT exercises before the CREATE exercise.
TA = "teaching_assistants"
SESSIONS = "practical_sessions"


# Exercise 3.
# Data definition language builds the table. id is the primary key:
# one row per value. name is required. office_hours may be missing.
# Return one CREATE TABLE statement for teaching_assistants.
def create_teaching_assistants():
    return """
        CREATE TABLE teaching_assistants (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            office_hours TEXT
        )
    """


# Exercise 4.
# INSERT adds a row. Put Shaked in with id 1 and office hours Thu 08:00-10:00.
def insert_shaked():
    return """
        INSERT INTO teaching_assistants (id, name, office_hours)
        VALUES (1, 'Shaked', 'Thu 08:00-10:00')
    """


# Exercise 5.
# UPDATE changes rows that match WHERE. Group 22 moves to Tue 14-16.
# Leave every other column alone.
def move_group_22():
    return """
        UPDATE practical_sessions
        SET time = 'Tue 14-16'
        WHERE group_num = 22
    """


# Exercise 6.
# DELETE removes rows. Remove practical session 22 and nothing else.
def delete_group_22():
    return """
        DELETE FROM practical_sessions
        WHERE group_num = 22
    """


# Exercise 7.
# SELECT reads. LIKE 'Wed%' means the text starts with Wed.
# Return the name column only, ordered by name.
def wednesday_names():
    return """
        SELECT name
        FROM teaching_assistants
        WHERE office_hours LIKE 'Wed%'
        ORDER BY name
    """


# Exercise 8.
# An inner join keeps rows that match in both tables. A TA with no
# session does not appear. Return the name column, ordered by name.
# Connect teaching_assistants.id to practical_sessions.ta_id.
def tas_with_sessions():
    return """
        SELECT ta.name
        FROM teaching_assistants AS ta
        JOIN practical_sessions AS ps ON ta.id = ps.ta_id
        ORDER BY ta.name
    """


# Exercise 9.
# A left join keeps every row of the left table. A TA with no session
# still appears. Return the name column, ordered by name.
def every_ta_name():
    return """
        SELECT ta.name
        FROM teaching_assistants AS ta
        LEFT JOIN practical_sessions AS ps ON ta.id = ps.ta_id
        ORDER BY ta.name
    """


def empty():
    return sqlite3.connect(":memory:")


def column_names(conn, table):
    return [row[1] for row in conn.execute(f"PRAGMA table_info({table})")]


def seed(conn):
    conn.executescript(
        """
        CREATE TABLE teaching_assistants (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            office_hours TEXT
        );
        CREATE TABLE practical_sessions (
            group_num INTEGER PRIMARY KEY,
            ta_id INTEGER,
            location TEXT,
            time TEXT,
            FOREIGN KEY (ta_id) REFERENCES teaching_assistants(id)
        );
        INSERT INTO teaching_assistants (id, name, office_hours) VALUES
            (1, 'Shaked', 'Thu 08:00-10:00'),
            (2, 'Matan', 'Wed 16:00-18:00'),
            (3, 'Linoy', 'Tue 13:00-14:45'),
            (5, 'Dolav', 'Wed 10:00-12:00');
        INSERT INTO practical_sessions (group_num, ta_id, location, time) VALUES
            (11, 1, '90/145', 'Sun 14-16'),
            (22, 3, '34/005', 'Mon 18-20');
        """
    )


def names(conn, sql):
    return [row[0] for row in conn.execute(sql)]


def main():
    print("""
============================================================
PS12 — SQL and a little Python
Slides: materials/sessions/SPL_PS12.pptx
============================================================

Python reads a program one line at a time and runs it. A file ending
in .py is a module. Types are checked when the line runs, and an
operation has to be one the value supports: "1" + 2 is a TypeError.

SQL is the language of a relational database. A table holds one kind
of row. A primary key identifies a row inside its table. A foreign
key is a column that points at a primary key in another table, which
is how a practical session knows which TA teaches it.

Two families of statements:
    DDL   CREATE, DROP          build and remove tables
    DML   INSERT, UPDATE, DELETE, SELECT
                                 change rows and read them

SELECT * reads every column. SELECT name reads one. WHERE keeps the
rows that match. LIKE 'Wed%' matches text that starts with Wed.
JOIN matches rows across tables. An inner join drops a TA who has no
session. A left join keeps that TA and fills the session columns with
NULL.

""")
    try:
        "1" + 2  # type: ignore[operator]
        read("str + int ran, which is a surprise")
    except TypeError:
        read("str + int raises TypeError when the line runs")

    print("\nExercises")
    score = Score()

    def check_create():
        conn = empty()
        conn.execute(create_teaching_assistants())
        expect_eq("columns", set(column_names(conn, TA)), {"id", "name", "office_hours"})

    def check_insert():
        conn = empty()
        conn.execute(
            """
            CREATE TABLE teaching_assistants (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                office_hours TEXT
            )
            """
        )
        conn.execute(insert_shaked())
        expect_eq("row", conn.execute(f"SELECT id, name, office_hours FROM {TA}").fetchall(),
                  [(1, "Shaked", "Thu 08:00-10:00")])

    def check_update():
        conn = empty()
        seed(conn)
        conn.execute(move_group_22())
        expect_eq("time", conn.execute(
            "SELECT time FROM practical_sessions WHERE group_num = 22").fetchone()[0], "Tue 14-16")
        expect_eq("other group stays", conn.execute(
            "SELECT time FROM practical_sessions WHERE group_num = 11").fetchone()[0], "Sun 14-16")

    def check_delete():
        conn = empty()
        seed(conn)
        conn.execute(delete_group_22())
        expect_eq("groups left", conn.execute(
            "SELECT group_num FROM practical_sessions ORDER BY group_num").fetchall(), [(11,)])

    def check_where():
        conn = empty()
        seed(conn)
        expect_eq("wednesday", names(conn, wednesday_names()), ["Dolav", "Matan"])

    def check_inner():
        conn = empty()
        seed(conn)
        expect_eq("inner", names(conn, tas_with_sessions()), ["Linoy", "Shaked"])

    def check_left():
        conn = empty()
        seed(conn)
        expect_eq("left", names(conn, every_ta_name()), ["Dolav", "Linoy", "Matan", "Shaked"])

    check(score, "1. add — a Python function", lambda: expect_eq("sum", add(2, 3), 5))
    check(score, "2. squares — a list comprehension", lambda: (
        expect_eq("three", squares(3), [1, 4, 9]),
        expect_eq("none", squares(0), []),
    ))
    check(score, "3. CREATE TABLE teaching_assistants", check_create)
    check(score, "4. INSERT Shaked", check_insert)
    check(score, "5. UPDATE group 22", check_update)
    check(score, "6. DELETE group 22", check_delete)
    check(score, "7. SELECT names whose office hours start with Wed", check_where)
    check(score, "8. inner join — TAs who have a session", check_inner)
    check(score, "9. left join — every TA, session or not", check_left)
    return score.finish()


if __name__ == "__main__":
    raise SystemExit(main())
