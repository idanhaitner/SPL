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


test("students without courses", lambda: eq(students_without_courses(make_db()), ["Finn"], "students_without_courses(conn)"))


def nobody_left_out():
    conn = make_db()
    conn.execute("INSERT INTO enrollments VALUES (6, 5, NULL)")
    eq(students_without_courses(conn), [], "students_without_courses(conn) once Finn takes Poetry")


test("enrolling removes a student from the list", nobody_left_out)
test("every course is listed", lambda: eq(
    [row[0] for row in course_sizes(make_db())], ["Algorithms", "Calculus", "Databases", "Mechanics", "Poetry"], "the course titles"))
test("a course nobody takes", lambda: eq(
    dict(course_sizes(make_db()))["Poetry"], 0, "the number of students in Poetry"))
test("counts the students of a course", lambda: eq(
    dict(course_sizes(make_db()))["Databases"], 3, "the number of students in Databases"))
