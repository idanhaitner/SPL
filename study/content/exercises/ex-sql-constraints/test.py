import sqlite3


def library():
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    create_library(conn)
    conn.execute("INSERT INTO members (id, email, age) VALUES (1, 'a@x.com', 30)")
    conn.execute("INSERT INTO loans (id, member_id) VALUES (1, 1)")
    return conn


def refuse(conn, sql, message):
    raises(sqlite3.IntegrityError, lambda: conn.execute(sql), message)


def good_rows():
    conn = library()
    eq(conn.execute("SELECT COUNT(*) FROM members").fetchone()[0], 1, "the number of members")
    eq(conn.execute("SELECT COUNT(*) FROM loans").fetchone()[0], 1, "the number of loans")


test("good rows are accepted", good_rows)
test("duplicate email", lambda: refuse(library(), "INSERT INTO members (id, email, age) VALUES (2, 'a@x.com', 20)", "a second member with the same email should be refused"))
test("missing email", lambda: refuse(library(), "INSERT INTO members (id, email, age) VALUES (3, NULL, 20)", "a member without an email should be refused"))
test("negative age", lambda: refuse(library(), "INSERT INTO members (id, email, age) VALUES (4, 'b@x.com', -1)", "a negative age should be refused"))
test("loan for a member who does not exist", lambda: refuse(library(), "INSERT INTO loans (id, member_id) VALUES (2, 99)", "a loan for member 99 should be refused"))
