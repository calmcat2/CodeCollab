import asyncpg
import asyncio
from typing import Optional, Dict, Set, Callable, Any, List
from app.models.schemas import Session, User

class PostgresDatabase:
    """
    PostgreSQL implementation of the database using asyncpg.
    """
    
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.listeners: Dict[str, Set[Callable[[Session], None]]] = {}
        self._pool: Optional[asyncpg.Pool] = None
        
    async def connect(self):
        """Connect to the database and initialize tables."""
        # Wait for DB to be ready? Usually handled by retry logic or docker depends_on healthy
        self._pool = await asyncpg.create_pool(self.db_url)
        await self._init_tables()
        
    async def disconnect(self):
        """Close the database connection."""
        if self._pool:
            await self._pool.close()
            self._pool = None

    async def _init_tables(self):
        """Initialize database tables."""
        if not self._pool:
            raise RuntimeError("Database not connected")
            
        async with self._pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    code TEXT,
                    language TEXT,
                    created_at BIGINT,
                    last_modified_by TEXT
                )
            """)
            
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
                    username TEXT,
                    color TEXT,
                    is_typing BOOLEAN,
                    last_activity BIGINT
                )
            """)

    async def create_session(self, session: Session) -> Session:
        """Create a new session."""
        if not self._pool:
            await self.connect()
            
        async with self._pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO sessions (id, code, language, created_at, last_modified_by) VALUES ($1, $2, $3, $4, $5)",
                session.id, session.code, session.language, session.createdAt, session.lastModifiedBy
            )
            
            # Add users if any
            for user in session.users:
                await self.add_user(session.id, user)
            
        return session
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID."""
        if not self._pool:
            await self.connect()
            
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM sessions WHERE id = $1", session_id)
            if not row:
                return None
            
            # Get users
            user_rows = await conn.fetch("SELECT * FROM users WHERE session_id = $1", session_id)
            users = []
            for u_row in user_rows:
                users.append(User(
                    id=u_row['id'],
                    username=u_row['username'],
                    color=u_row['color'],
                    isTyping=u_row['is_typing'],
                    lastActivity=u_row['last_activity']
                ))
                
            return Session(
                id=row['id'],
                code=row['code'],
                language=row['language'],
                createdAt=row['created_at'],
                lastModifiedBy=row['last_modified_by'],
                users=users
            )
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[Session]:
        """Update a session."""
        if not self._pool:
            await self.connect()

        fields = []
        values = []
        idx = 1
        for key, value in updates.items():
            if key == 'createdAt':
                fields.append(f"created_at = ${idx}")
                values.append(value)
                idx += 1
            elif key == 'lastModifiedBy':
                fields.append(f"last_modified_by = ${idx}")
                values.append(value)
                idx += 1
            elif key in ['code', 'language']:
                fields.append(f"{key} = ${idx}")
                values.append(value)
                idx += 1
        
        if fields:
            values.append(session_id)
            query = f"UPDATE sessions SET {', '.join(fields)} WHERE id = ${idx}"
            async with self._pool.acquire() as conn:
                await conn.execute(query, *values)
            
        session = await self.get_session(session_id)
        if session:
            await self._notify_listeners(session_id)
        return session
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        if not self._pool:
            await self.connect()
            
        async with self._pool.acquire() as conn:
            result = await conn.execute("DELETE FROM sessions WHERE id = $1", session_id)
            # result string is mostly "DELETE <count>"
            if result != "DELETE 0":
                if session_id in self.listeners:
                    del self.listeners[session_id]
                return True
        return False
    
    async def add_user(self, session_id: str, user: User) -> Optional[Session]:
        """Add a user."""
        if not self._pool:
            await self.connect()
            
        async with self._pool.acquire() as conn:
            # Check session exists
            exists = await conn.fetchval("SELECT 1 FROM sessions WHERE id = $1", session_id)
            if not exists:
                return None
                
            await conn.execute(
                "INSERT INTO users (id, session_id, username, color, is_typing, last_activity) VALUES ($1, $2, $3, $4, $5, $6)",
                user.id, session_id, user.username, user.color, user.isTyping, user.lastActivity
            )
        
        return await self._notify_and_return(session_id)
    
    async def remove_user(self, session_id: str, user_id: str) -> Optional[Session]:
        """Remove a user."""
        if not self._pool:
            await self.connect()
            
        async with self._pool.acquire() as conn:
            await conn.execute("DELETE FROM users WHERE id = $1 AND session_id = $2", user_id, session_id)
            
        return await self._notify_and_return(session_id)
    
    async def update_user(self, session_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Session]:
        """Update a user."""
        if not self._pool:
            await self.connect()
            
        fields = []
        values = []
        idx = 1
        for key, value in updates.items():
            if key == 'isTyping':
                fields.append(f"is_typing = ${idx}")
                values.append(value)
                idx += 1
            elif key == 'lastActivity':
                fields.append(f"last_activity = ${idx}")
                values.append(value)
                idx += 1
            elif key in ['username', 'color']:
                fields.append(f"{key} = ${idx}")
                values.append(value)
                idx += 1
                
        if fields:
            values.append(user_id)
            values.append(session_id)
            query = f"UPDATE users SET {', '.join(fields)} WHERE id = ${idx} AND session_id = ${idx+1}"
            async with self._pool.acquire() as conn:
                await conn.execute(query, *values)
            
        return await self._notify_and_return(session_id)
    
    async def _notify_and_return(self, session_id: str) -> Optional[Session]:
        session = await self.get_session(session_id)
        if session:
            await self._notify_listeners(session_id)
        return session
    
    def subscribe(self, session_id: str, callback: Callable[[Session], None]) -> Callable[[], None]:
        if session_id not in self.listeners:
            self.listeners[session_id] = set()
        
        self.listeners[session_id].add(callback)
        
        def unsubscribe():
            if session_id in self.listeners:
                self.listeners[session_id].discard(callback)
        
        return unsubscribe
    
    async def _notify_listeners(self, session_id: str):
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
