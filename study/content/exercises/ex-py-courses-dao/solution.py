class Course:
    def __init__(self, id, title, credits):
        self.id = id
        self.title = title
        self.credits = credits


class CoursesDao:
    def __init__(self, conn):
        self._conn = conn

    def insert(self, course):
        self._conn.execute(
            "INSERT INTO courses (id, title, credits) VALUES (?, ?, ?)",
            (course.id, course.title, course.credits),
        )

    def find(self, course_id):
        row = self._conn.execute(
            "SELECT id, title, credits FROM courses WHERE id = ?", (course_id,)
        ).fetchone()
        return None if row is None else Course(*row)

    def find_all(self):
        rows = self._conn.execute("SELECT id, title, credits FROM courses ORDER BY id").fetchall()
        return [Course(*row) for row in rows]
