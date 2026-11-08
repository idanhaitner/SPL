def students_without_courses(conn):
    rows = conn.execute(
        """
        SELECT s.name
        FROM students s LEFT JOIN enrollments e ON e.student_id = s.id
        WHERE e.student_id IS NULL
        ORDER BY s.name
        """
    ).fetchall()
    return [row[0] for row in rows]


def course_sizes(conn):
    return conn.execute(
        """
        SELECT c.title, COUNT(e.student_id)
        FROM courses c LEFT JOIN enrollments e ON e.course_id = c.id
        GROUP BY c.id
        ORDER BY c.title
        """
    ).fetchall()
