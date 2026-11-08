def find_students_named(conn, name):
    return conn.execute("SELECT id, name FROM students WHERE name = ?", (name,)).fetchall()
