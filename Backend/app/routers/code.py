from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import (
    UpdateCodeRequest,
    UpdateLanguageRequest,
    ExecuteCodeRequest,
    ExecutionResult,
    ErrorResponse
)
from app.database.mock_db import MockDatabase, get_db
from app.services.session_service import SessionService
from app.services.code_executor import CodeExecutor

router = APIRouter(prefix="/sessions", tags=["Code"])

# Supported languages
SUPPORTED_LANGUAGES = [
    "javascript",
    "typescript",
    "python",
    "java",
    "cpp",
    "go",
    "rust"
]


@router.put(
    "/{session_id}/code",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse, "description": "Session not found"}
    },
    summary="Update session code",
    description="Updates the code content in the session"
)
async def update_code(
    session_id: str,
    request: UpdateCodeRequest,
    db: MockDatabase = Depends(get_db)
):
    """Update code in a session."""
    service = SessionService(db)
    session = await service.update_code(session_id, request.code, request.userId)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return None


@router.put(
    "/{session_id}/language",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid language"},
        404: {"model": ErrorResponse, "description": "Session not found"}
    },
    summary="Update programming language",
    description="Changes the programming language for the session"
)
async def update_language(
    session_id: str,
    request: UpdateLanguageRequest,
    db: MockDatabase = Depends(get_db)
):
    """Update language in a session."""
    if request.language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid language. Supported languages: {', '.join(SUPPORTED_LANGUAGES)}"
        )
    
    service = SessionService(db)
    session = await service.update_language(session_id, request.language)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return None


@router.post(
    "/{session_id}/execute",
    response_model=ExecutionResult,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        404: {"model": ErrorResponse, "description": "Session not found"}
    },
    summary="Execute code",
    description="Executes the provided code in the specified language and returns the output"
)
async def execute_code(
    session_id: str,
    request: ExecuteCodeRequest,
    db: MockDatabase = Depends(get_db)
) -> ExecutionResult:
    """Execute code and return the result."""
    # Verify session exists
    session = await db.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Execute code
    executor = CodeExecutor()
    result = await executor.execute_code(request.code, request.language)
    
    return result
