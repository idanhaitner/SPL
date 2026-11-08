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


test("finds a student", lambda: eq(find_students_named(make_db(), "Ana"), [(1, "Ana")], "find_students_named(conn, 'Ana')"))
test("nobody with that name", lambda: eq(find_students_named(make_db(), "Zed"), [], "find_students_named(conn, 'Zed')"))
test("injection finds nobody", lambda: eq(find_students_named(make_db(), "x' OR '1'='1"), [], "find_students_named(conn, \"x' OR '1'='1\")"))


def apostrophe():
    conn = make_db()
    conn.execute("INSERT INTO students VALUES (7, \"O'Neil\", 'CS')")
    eq(find_students_named(conn, "O'Neil"), [(7, "O'Neil")], "find_students_named(conn, \"O'Neil\")")


test("an apostrophe is only data", apostrophe)
