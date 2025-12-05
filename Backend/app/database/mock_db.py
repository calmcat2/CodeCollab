import asyncio
from typing import Optional, Dict, Set, Callable, Any
from app.models.schemas import Session, User


class MockDatabase:
    """
    In-memory mock database for sessions.
    Designed to be easily replaceable with a real database implementation.
    """
    
    def __init__(self):
        self.sessions: Dict[str, Session] = {}
        self.listeners: Dict[str, Set[Callable[[Session], None]]] = {}
        self._lock = asyncio.Lock()
    
    async def create_session(self, session: Session) -> Session:
        """Create a new session."""
        async with self._lock:
            self.sessions[session.id] = session
            return session
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID."""
        return self.sessions.get(session_id)
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> Optional[Session]:
        """Update a session with the given updates."""
        async with self._lock:
            session = self.sessions.get(session_id)
            if not session:
                return None
            
            # Update session fields
            for key, value in updates.items():
                if hasattr(session, key):
                    setattr(session, key, value)
            
            # Notify listeners
            await self._notify_listeners(session_id)
            
            return session
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session."""
        async with self._lock:
            if session_id in self.sessions:
                del self.sessions[session_id]
                if session_id in self.listeners:
                    del self.listeners[session_id]
                return True
            return False
    
    async def add_user(self, session_id: str, user: User) -> Optional[Session]:
        """Add a user to a session."""
        async with self._lock:
            session = self.sessions.get(session_id)
            if not session:
                return None
            
            session.users.append(user)
            await self._notify_listeners(session_id)
            
            return session
    
    async def remove_user(self, session_id: str, user_id: str) -> Optional[Session]:
        """Remove a user from a session."""
        async with self._lock:
            session = self.sessions.get(session_id)
            if not session:
                return None
            
            session.users = [u for u in session.users if u.id != user_id]
            await self._notify_listeners(session_id)
            
            return session
    
    async def update_user(self, session_id: str, user_id: str, updates: Dict[str, Any]) -> Optional[Session]:
        """Update a user in a session."""
        async with self._lock:
            session = self.sessions.get(session_id)
            if not session:
                return None
            
            for user in session.users:
                if user.id == user_id:
                    for key, value in updates.items():
                        if hasattr(user, key):
                            setattr(user, key, value)
                    break
            
            await self._notify_listeners(session_id)
            
            return session
    
    def subscribe(self, session_id: str, callback: Callable[[Session], None]) -> Callable[[], None]:
        """Subscribe to session updates."""
        if session_id not in self.listeners:
            self.listeners[session_id] = set()
        
        self.listeners[session_id].add(callback)
        
        # Return unsubscribe function
        def unsubscribe():
            if session_id in self.listeners:
                self.listeners[session_id].discard(callback)
        
        return unsubscribe
    
    async def _notify_listeners(self, session_id: str):
        """Notify all listeners of a session update."""
        session = self.sessions.get(session_id)
        if session and session_id in self.listeners:
            for listener in self.listeners[session_id]:
                # Call listener (can be sync or async)
                try:
                    result = listener(session)
                    if asyncio.iscoroutine(result):
                        await result
                except Exception as e:
                    # Log error but don't stop other listeners
                    print(f"Error in listener: {e}")


# Global database instance
db = MockDatabase()


def get_db() -> MockDatabase:
    """Dependency injection for database."""
    return db
