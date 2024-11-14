import sqlite3
import logging
from contextlib import contextmanager
from config import DB_PATH

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.db_path = DB_PATH
        self._init_db()

    def _init_db(self):
        """Initialize database with required tables"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        fullname TEXT NOT NULL,
                        username TEXT UNIQUE NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()
        except Exception as e:
            logger.error(f"Database initialization failed: {str(e)}")
            raise

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            yield conn
        finally:
            if conn:
                conn.close()

    def create_user(self, fullname, username, email, password):
        """Create new user with hashed password"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO users (fullname, username, email, password) VALUES (?, ?, ?, ?)",
                    (fullname, username, email, password)
                )
                conn.commit()
                logger.info(f"Created new user: {username}")
                return cursor.lastrowid
        except sqlite3.IntegrityError:
            logger.warning(f"Username or email already exists: {username}")
            raise ValueError("Username or email already exists")
        except Exception as e:
            logger.error(f"Failed to create user: {str(e)}")
            raise

    def verify_user(self, username, password):
        """Verify user credentials"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM users WHERE username = ? AND password = ?",
                    (username, password)
                )
                return cursor.fetchone() is not None
        except Exception as e:
            logger.error(f"User verification failed: {str(e)}")
            raise