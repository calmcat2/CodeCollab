from app.database.instance import db as instance_db
from app.database.sqlite_db import SQLiteDatabase

# Alias for backward compatibility in type hints
MockDatabase = SQLiteDatabase

# Global instance
db = instance_db

def get_db():
    """Dependency injection for database."""
    return db
