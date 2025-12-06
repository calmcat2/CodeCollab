from app.config import settings
from app.database.sqlite_db import SQLiteDatabase
from app.database.postgres_db import PostgresDatabase

def get_db():
    if settings.database_url and settings.database_url.startswith("postgres"):
        return PostgresDatabase(settings.database_url)
    return SQLiteDatabase()

db = get_db()
