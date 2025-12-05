import secrets
import time
from typing import Optional
from app.models.schemas import Session, User
from app.database.mock_db import MockDatabase


class SessionService:
    """Business logic for session management."""
    
    def __init__(self, db: MockDatabase):
        self.db = db
    
    @staticmethod
    def generate_session_id(length: int = 8) -> str:
        """Generate a unique session ID."""
        # Use alphanumeric characters (lowercase)
        alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    async def create_session(self) -> Session:
        """Create a new coding session with default settings."""
        session_id = self.generate_session_id()
        
        # Ensure uniqueness
        while await self.db.get_session(session_id):
            session_id = self.generate_session_id()
        
        session = Session(
            id=session_id,
            code="// Start coding here\nconsole.log(\"Hello, World!\");\n",
            language="javascript",
            users=[],
            createdAt=int(time.time() * 1000)
        )
        
        return await self.db.create_session(session)
    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session by ID."""
        return await self.db.get_session(session_id)
    
    async def update_code(self, session_id: str, code: str, user_id: str) -> Optional[Session]:
        """Update the code in a session."""
        # Update user's last activity
        await self.db.update_user(session_id, user_id, {
            "lastActivity": int(time.time() * 1000)
        })
        
        # Update code
        return await self.db.update_session(session_id, {"code": code})
    
    async def update_language(self, session_id: str, language: str) -> Optional[Session]:
        """Update the programming language in a session."""
        return await self.db.update_session(session_id, {"language": language})
