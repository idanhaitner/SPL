import sqlite3


def make_db():
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript("""
        CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT NOT NULL, dept TEXT NOT NULL);
        CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT NOT NULL, credits INTEGER NOT NULL);
        CREATE TABLE enrollments (
            student_id INTEGER NOT NULL REFERENCES students(id),
            course_id INTEGER NOT NULL REFERENCES courses(id),
            grade INTEGER,
            PRIMARY KEY (student_id, course_id)
        );
        INSERT INTO students VALUES (1,'Ana','CS'),(2,'Ben','CS'),(3,'Cleo','Math'),
                                    (4,'Dan','Math'),(5,'Eve','Physics'),(6,'Finn','CS');
        INSERT INTO courses VALUES (1,'Databases',4),(2,'Algorithms',5),(3,'Calculus',3),(4,'Mechanics',3),(5,'Poetry',2);
        INSERT INTO enrollments VALUES (1,1,90),(1,2,80),(2,1,70),(2,2,60),(3,3,85),(3,1,95),(4,3,75),(5,4,88);
    """)
    return conn


test("counts per department", lambda: eq(
    students_per_dept(make_db()), [("CS", 3), ("Math", 2), ("Physics", 1)], "students_per_dept(conn)"))


def empty_table():
    conn = make_db()
    conn.execute("DELETE FROM enrollments")
    conn.execute("DELETE FROM students")
    eq(students_per_dept(conn), [], "students_per_dept on an empty table")


test("an empty table has no groups", empty_table)
test("only big departments", lambda: eq(big_departments(make_db()), ["CS", "Math"], "big_departments(conn)"))


def after_a_new_student():
    conn = make_db()
    conn.execute("INSERT INTO students VALUES (7, 'Gil', 'Physics')")
    eq(big_departments(conn), ["CS", "Math", "Physics"], "big_departments(conn) once Physics has two students")


test("the result follows the data", after_a_new_student)
