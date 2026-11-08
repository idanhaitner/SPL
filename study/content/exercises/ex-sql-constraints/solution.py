def create_library(conn):
    conn.execute(
        """
        CREATE TABLE members (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            age INTEGER CHECK (age >= 0)
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE loans (
            id INTEGER PRIMARY KEY,
            member_id INTEGER NOT NULL REFERENCES members(id)
        )
        """
    )
