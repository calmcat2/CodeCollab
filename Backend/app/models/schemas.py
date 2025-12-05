from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class User(BaseModel):
    """User model representing a participant in a coding session."""
    
    id: str = Field(..., description="Unique user identifier (UUID)")
    username: str = Field(..., min_length=1, max_length=50, description="User's display name")
    color: str = Field(..., pattern=r"^hsl\(\d+,\s*\d+%,\s*\d+%\)$", description="User's assigned color (HSL format)")
    isTyping: bool = Field(default=False, description="Whether the user is currently typing")
    lastActivity: int = Field(..., description="Unix timestamp (milliseconds) of user's last activity")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "username": "john_doe",
                "color": "hsl(37, 92%, 50%)",
                "isTyping": False,
                "lastActivity": 1701734400000
            }
        }
    )


class Session(BaseModel):
    """Session model representing a collaborative coding session."""
    
    id: str = Field(..., description="Unique session identifier (8 characters)")
    code: str = Field(..., description="Current code content in the session")
    language: str = Field(..., description="Current programming language")
    users: list[User] = Field(default_factory=list, description="List of users currently in the session")
    createdAt: int = Field(..., description="Unix timestamp (milliseconds) when session was created")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "id": "a1b2c3d4",
                "code": "console.log('Hello, World!');",
                "language": "javascript",
                "users": [],
                "createdAt": 1701734400000
            }
        }
    )


class ExecutionResult(BaseModel):
    """Result from code execution."""
    
    output: str = Field(..., description="Standard output from code execution")
    error: Optional[str] = Field(None, description="Error message if execution failed")
    executionTime: int = Field(..., description="Execution time in milliseconds")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "output": "Hello, World!",
                "executionTime": 45
            }
        }
    )


class ErrorResponse(BaseModel):
    """Error response model."""
    
    error: str = Field(..., description="Error message")
    details: Optional[str] = Field(None, description="Additional error details")


# Request Models

class JoinSessionRequest(BaseModel):
    """Request model for joining a session."""
    
    username: str = Field(..., min_length=1, max_length=50, description="Desired username for the session")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "john_doe"
            }
        }
    )


class JoinSessionResponse(BaseModel):
    """Response model for joining a session."""
    
    user: User
    session: Session


class LeaveSessionRequest(BaseModel):
    """Request model for leaving a session."""
    
    userId: str = Field(..., description="ID of the user leaving the session")


class UpdateCodeRequest(BaseModel):
    """Request model for updating code."""
    
    code: str = Field(..., description="Updated code content")
    userId: str = Field(..., description="ID of the user making the change")


class UpdateLanguageRequest(BaseModel):
    """Request model for updating language."""
    
    language: str = Field(..., description="Programming language identifier")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "language": "javascript"
            }
        }
    )


class UpdateTypingRequest(BaseModel):
    """Request model for updating typing status."""
    
    userId: str = Field(..., description="ID of the user")
    isTyping: bool = Field(..., description="Whether the user is currently typing")


class ExecuteCodeRequest(BaseModel):
    """Request model for code execution."""
    
    code: str = Field(..., description="Code to execute")
    language: str = Field(..., description="Programming language")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "code": "console.log('Hello, World!');",
                "language": "javascript"
            }
        }
    )


class UsernameAvailabilityResponse(BaseModel):
    """Response model for username availability check."""
    
    available: bool = Field(..., description="Whether the username is available")
