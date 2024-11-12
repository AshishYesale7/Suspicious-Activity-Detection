"""Database operations with proper security"""
import sqlite3
from pathlib import Path
import bcrypt
from typing import Optional, Dict
from .config import DB_PATH

class Database:
    def __init__(self, db_path: Path = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database with proper schema"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def create_user(self, username: str, password: str, email: str, full_name: str) -> bool:
        """Create new user with secure password hashing"""
        try:
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "INSERT INTO users (username, password_hash, email, full_name) VALUES (?, ?, ?, ?)",
                    (username, password_hash, email, full_name)
                )
                return True
        except sqlite3.IntegrityError:
            return False

    def verify_user(self, username: str, password: str) -> Optional[Dict]:
        """Verify user credentials securely"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()
            
            if user and bcrypt.checkpw(password.encode(), user[2].encode()):
                return {
                    "id": user[0],
                    "username": user[1],
                    "email": user[3],
                    "full_name": user[4]
                }
        return None