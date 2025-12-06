import aiosqlite
import json
import asyncio
import time
from typing import Optional, Dict, Set, Callable, Any, List
from app.models.schemas import Session, User

DB_PATH = "codecollab.db"

class SQLiteDatabase:
    """
    SQLite implementation of the database.
    """
    
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self.listeners: Dict[str, Set[Callable[[Session], None]]] = {}
        self._db: Optional[aiosqlite.Connection] = None
        
    async def connect(self):
        """Connect to the database and initialize tables."""
        # Note: We rely on the lifespan manager or file persistence to handle connections.
        # logic removed: if self._db: return
            
        self._db = await aiosqlite.connect(self.db_path, check_same_thread=False)
        self._db.row_factory = aiosqlite.Row
        await self._init_tables()
        
    async def disconnect(self):
        """Close the database connection."""
        if self._db:
            await self._db.close()
            self._db = None

    async def _init_tables(self):
        """Initialize database tables."""
        if not self._db:
            raise RuntimeError("Database not connected")
            
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                code TEXT,
                language TEXT,
                created_at INTEGER,
                last_modified_by TEXT
            )
        """)

        # Migration: Add column if it doesn't exist
        try:
             await self._db.execute("ALTER TABLE sessions ADD COLUMN last_modified_by TEXT")
        except Exception:
             pass # Column likely exists
        
        await self._db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                username TEXT,
                color TEXT,
                is_typing BOOLEAN,
                last_activity INTEGER,
                FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )
        """)
        await self._db.commit()

    async def create_session(self, session: Session) -> Session:
        """Create a new session."""
        if not self._db:
            await self.connect()
            
        async with self._db.execute(
            "INSERT INTO sessions (id, code, language, created_at, last_modified_by) VALUES (?, ?, ?, ?, ?)",
            (session.id, session.code, session.language, session.createdAt, session.lastModifiedBy)
        ):
            await self._db.commit()
            
        # Users should be empty on creation generally, but handle if not
        for user in session.users:
            await self.add_user(session.id, user)
            
        return session
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID."""
        if not self._db:
            await self.connect()
            
        async with self._db.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            
            # print(f"DEBUG: Found session {session_id}: {dict(row)}")
            session_data = dict(row)
            
        # Get users
        async with self._db.execute("SELECT * FROM users WHERE session_id = ?", (session_id,)) as cursor:
            user_rows = await cursor.fetchall()
            users = []
            for u_row in user_rows:
                users.append(User(
                    id=u_row['id'],
                    username=u_row['username'],
                    color=u_row['color'],
                    isTyping=bool(u_row['is_typing']),
                    lastActivity=u_row['last_activity']
                ))
                
        return Session(
            id=session_data['id'],
            code=session_data['code'],
            language=session_data['language'],
            createdAt=session_data['created_at'],
            lastModifiedBy=session_data.get('last_modified_by'),
            users=users
        )
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[Session]:
        """Update a session with the given updates."""
        if not self._db:
            await self.connect()

        # Build query
        fields = []
        values = []
        for key, value in updates.items():
            if key == 'createdAt':
                fields.append("created_at = ?")
                values.append(value)
            elif key == 'lastModifiedBy':
                fields.append("last_modified_by = ?")
                values.append(value)
            elif key in ['code', 'language']:
                fields.append(f"{key} = ?")
                values.append(value)
        
        if fields:
            values.append(session_id)
            query = f"UPDATE sessions SET {', '.join(fields)} WHERE id = ?"
            await self._db.execute(query, values)
            await self._db.commit()
            
        # Check if we need to update users (not typical via update_session but possible)
        # For simplicity, we assume update_session mainly updates session-level fields
        
        session = await self.get_session(session_id)
        if session:
            await self._notify_listeners(session_id)
        return session
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        if not self._db:
            await self.connect()
            
        async with self._db.execute("DELETE FROM sessions WHERE id = ?", (session_id,)) as cursor:
            if cursor.rowcount > 0:
                await self._db.commit()
                if session_id in self.listeners:
                    del self.listeners[session_id]
                return True
        return False
    
    async def add_user(self, session_id: str, user: User) -> Optional[Session]:
        """Add a user to a session."""
        if not self._db:
            await self.connect()
            
        # Verify session exists
        session = await self.get_session(session_id)
        if not session:
            return None
            
        await self._db.execute(
            "INSERT INTO users (id, session_id, username, color, is_typing, last_activity) VALUES (?, ?, ?, ?, ?, ?)",
            (user.id, session_id, user.username, user.color, user.isTyping, user.lastActivity)
        )
        await self._db.commit()
        
        return await self._notify_and_return(session_id)
    
    async def remove_user(self, session_id: str, user_id: str) -> Optional[Session]:
        """Remove a user from a session."""
        if not self._db:
            await self.connect()
            
        await self._db.execute("DELETE FROM users WHERE id = ? AND session_id = ?", (user_id, session_id))
        await self._db.commit()
        
        return await self._notify_and_return(session_id)
    
    async def update_user(self, session_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Session]:
        """Update a user in a session."""
        if not self._db:
            await self.connect()
            
        fields = []
        values = []
        for key, value in updates.items():
            if key == 'isTyping':
                fields.append("is_typing = ?")
                values.append(value)
            elif key == 'lastActivity':
                fields.append("last_activity = ?")
                values.append(value)
            elif key in ['username', 'color']:
                fields.append(f"{key} = ?")
                values.append(value)
                
        if fields:
            values.append(user_id)
            values.append(session_id)
            query = f"UPDATE users SET {', '.join(fields)} WHERE id = ? AND session_id = ?"
            await self._db.execute(query, values)
            await self._db.commit()
            
        return await self._notify_and_return(session_id)
    
    async def _notify_and_return(self, session_id: str) -> Optional[Session]:
        """Helper to get fresh session and notify listeners."""
        session = await self.get_session(session_id)
        if session:
            await self._notify_listeners(session_id)
        return session
    
    def subscribe(self, session_id: str, callback: Callable[[Session], None]) -> Callable[[], None]:
        """Subscribe to session updates."""
        if session_id not in self.listeners:
            self.listeners[session_id] = set()
        
        self.listeners[session_id].add(callback)
        
        def unsubscribe():
            if session_id in self.listeners:
                self.listeners[session_id].discard(callback)
        
        return unsubscribe
    
    async def _notify_listeners(self, session_id: str):
        """Notify all listeners of a session update."""
        if session_id in self.listeners:
            session = await self.get_session(session_id)
            if not session:
                return
                
            for listener in self.listeners[session_id]:
                try:
                    result = listener(session)
                    if asyncio.iscoroutine(result):
                        await result
                except Exception as e:
                    print(f"Error in listener: {e}")

# SQLiteDatabase class definition only

