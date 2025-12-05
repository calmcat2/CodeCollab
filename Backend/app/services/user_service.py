import uuid
import time
from typing import Optional, Tuple
from app.models.schemas import User, Session
from app.database.mock_db import MockDatabase


class UserService:
    """Business logic for user management."""
    
    # Predefined color palette for users
    USER_COLORS = [
        "hsl(37, 92%, 50%)",   # Primary orange
        "hsl(200, 70%, 50%)",  # Blue
        "hsl(150, 60%, 45%)",  # Green
        "hsl(280, 60%, 55%)",  # Purple
        "hsl(350, 70%, 55%)",  # Red
        "hsl(180, 60%, 45%)",  # Teal
    ]
    
    def __init__(self, db: MockDatabase):
        self.db = db
    
    @staticmethod
    def generate_user_id() -> str:
        """Generate a unique user ID (UUID)."""
        return str(uuid.uuid4())
    
    def get_random_color(self, existing_colors: list[str]) -> str:
        """Get a random color that's not already in use."""
        available_colors = [c for c in self.USER_COLORS if c not in existing_colors]
        
        if not available_colors:
            # Generate a random HSL color if all predefined colors are taken
            import random
            hue = random.randint(0, 360)
            return f"hsl({hue}, 60%, 50%)"
        
        import random
        return random.choice(available_colors)
    
    async def join_session(
        self, 
        session_id: str, 
        username: str
    ) -> Tuple[Optional[User], Optional[Session], Optional[str]]:
        """
        Add a user to a session.
        Returns: (user, session, error_message)
        """
        session = await self.db.get_session(session_id)
        
        if not session:
            return None, None, "Session not found"
        
        # Check if username is already taken
        if any(u.username.lower() == username.lower() for u in session.users):
            return None, None, "Username is already taken"
        
        # Get existing colors
        existing_colors = [u.color for u in session.users]
        
        # Create new user
        user = User(
            id=self.generate_user_id(),
            username=username,
            color=self.get_random_color(existing_colors),
            isTyping=False,
            lastActivity=int(time.time() * 1000)
        )
        
        # Add user to session
        updated_session = await self.db.add_user(session_id, user)
        
        return user, updated_session, None
    
    async def leave_session(self, session_id: str, user_id: str) -> Optional[Session]:
        """Remove a user from a session."""
        return await self.db.remove_user(session_id, user_id)
    
    async def set_typing_status(
        self, 
        session_id: str, 
        user_id: str, 
        is_typing: bool
    ) -> Optional[Session]:
        """Update a user's typing status."""
        return await self.db.update_user(session_id, user_id, {"isTyping": is_typing})
    
    async def check_username_available(self, session_id: str, username: str) -> bool:
        """Check if a username is available in a session."""
        session = await self.db.get_session(session_id)
        
        if not session:
            return False
        
        return not any(u.username.lower() == username.lower() for u in session.users)
