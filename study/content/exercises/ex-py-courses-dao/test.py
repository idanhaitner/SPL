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


def insert_and_find():
    dao = CoursesDao(make_db())
    dao.insert(Course(9, "Logic", 2))
    course = dao.find(9)
    eq(course.title, "Logic", "the title of the course found")
    eq(course.credits, 2, "the credits of the course found")
    eq(course.id, 9, "the id of the course found")


test("insert and find", insert_and_find)
test("find an id that is missing", lambda: eq(CoursesDao(make_db()).find(1234), None, "find(1234)"))


def all_sorted():
    dao = CoursesDao(make_db())
    dao.insert(Course(0, "Zero", 1))
    eq([c.id for c in dao.find_all()], [0, 1, 2, 3, 4, 5], "the ids from find_all()")


test("find_all is sorted by id", all_sorted)


def a_quote_in_the_title():
    dao = CoursesDao(make_db())
    dao.insert(Course(10, "Kant's Logic", 2))
    eq(dao.find(10).title, "Kant's Logic", "a title with an apostrophe")


test("a quote in a title", a_quote_in_the_title)
