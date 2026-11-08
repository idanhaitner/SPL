class Course:
    def __init__(self, id, title, credits):
        pass


class CoursesDao:
    def __init__(self, conn):
        self._conn = conn

    def insert(self, course):
        pass

    def find(self, course_id):
        return None

    def find_all(self):
        return []
