from fastapi import APIRouter, HTTPException, status, Depends, Query
from app.models.schemas import (
    JoinSessionRequest,
    JoinSessionResponse,
    LeaveSessionRequest,
    UpdateTypingRequest,
    UsernameAvailabilityResponse,
    ErrorResponse
)
from app.database.mock_db import MockDatabase, get_db
from app.services.user_service import UserService

router = APIRouter(prefix="/sessions", tags=["Users"])


@router.post(
    "/{session_id}/join",
    response_model=JoinSessionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Username taken or invalid"},
        404: {"model": ErrorResponse, "description": "Session not found"}
    },
    summary="Join a session",
    description="Adds a user to the session with a unique username"
)
async def join_session(
    session_id: str,
    request: JoinSessionRequest,
    db: MockDatabase = Depends(get_db)
) -> JoinSessionResponse:
    """Join a session with a username."""
    service = UserService(db)
    user, session, error = await service.join_session(session_id, request.username)
    
    if error:
        if error == "Session not found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
    
    return JoinSessionResponse(user=user, session=session)


@router.post(
    "/{session_id}/leave",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse, "description": "Session or user not found"}
    },
    summary="Leave a session",
    description="Removes a user from the session"
)
async def leave_session(
    session_id: str,
    request: LeaveSessionRequest,
    db: MockDatabase = Depends(get_db)
):
    """Leave a session."""
    service = UserService(db)
    session = await service.leave_session(session_id, request.userId)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return None


@router.put(
    "/{session_id}/typing",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"model": ErrorResponse, "description": "Session or user not found"}
    },
    summary="Update typing status",
    description="Updates whether a user is currently typing"
)
async def update_typing_status(
    session_id: str,
    request: UpdateTypingRequest,
    db: MockDatabase = Depends(get_db)
):
    """Update user typing status."""
    service = UserService(db)
    session = await service.set_typing_status(
        session_id,
        request.userId,
        request.isTyping
    )
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session or user not found"
        )
    
    return None


@router.get(
    "/{session_id}/username/check",
    response_model=UsernameAvailabilityResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Session not found"}
    },
    summary="Check username availability",
    description="Checks if a username is available in the session"
)
async def check_username(
    session_id: str,
    username: str = Query(..., description="Username to check"),
    db: MockDatabase = Depends(get_db)
) -> UsernameAvailabilityResponse:
    """Check if a username is available."""
    service = UserService(db)
    available = await service.check_username_available(session_id, username)
    
    # If session doesn't exist, available will be False
    # We could also raise 404, but returning False is more user-friendly
    
    return UsernameAvailabilityResponse(available=available)
