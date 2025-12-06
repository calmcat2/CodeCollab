from app.database.sqlite_db import db as sqlite_instance
from app.database.sqlite_db import SQLiteDatabase

# Alias for backward compatibility in type hints
MockDatabase = SQLiteDatabase

# Global instance
db = sqlite_instance

def get_db() -> SQLiteDatabase:
    """Dependency injection for database."""
    return db
