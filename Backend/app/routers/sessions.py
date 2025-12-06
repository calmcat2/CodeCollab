from fastapi import APIRouter, HTTPException, status, Depends
from app.models.schemas import Session, ErrorResponse
from app.database.instance import db
from app.services.session_service import SessionService

router = APIRouter(prefix="/sessions", tags=["Sessions"])

async def get_db_instance():
    return db

@router.post(
    "",
    response_model=Session,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new coding session",
    description="Creates a new collaborative coding session with default settings"
)
async def create_session() -> Session:
    """Create a new session."""
    service = SessionService(db) # Use global db directly or dependency
    return await service.create_session()


@router.get(
    "/{session_id}",
    response_model=Session,
    responses={
        404: {"model": ErrorResponse, "description": "Session not found"}
    },
    summary="Get session details",
    description="Retrieves the current state of a coding session"
)
async def get_session(
    session_id: str
) -> Session:
    """Get a session by ID."""
    service = SessionService(db)
    session = await service.get_session(session_id)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    return session
