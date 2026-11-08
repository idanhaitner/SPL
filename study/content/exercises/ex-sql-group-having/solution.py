def students_per_dept(conn):
    return conn.execute(
        "SELECT dept, COUNT(*) FROM students GROUP BY dept ORDER BY dept"
    ).fetchall()


def big_departments(conn):
    rows = conn.execute(
        "SELECT dept FROM students GROUP BY dept HAVING COUNT(*) >= 2 ORDER BY dept"
    ).fetchall()
    return [row[0] for row in rows]
