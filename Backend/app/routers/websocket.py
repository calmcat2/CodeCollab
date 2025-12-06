from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Set
import json
from app.models.schemas import Session
# from app.managers.connection_manager import ConnectionManager (Removed)

router = APIRouter(prefix="/ws", tags=["WebSocket"])

# Store active WebSocket connections per session
active_connections: dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    """Manage WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        
        if session_id not in self.active_connections:
            self.active_connections[session_id] = set()
        
        self.active_connections[session_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        """Remove a WebSocket connection."""
        if session_id in self.active_connections:
            self.active_connections[session_id].discard(websocket)
            
            # Clean up empty sets
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
    
    async def broadcast(self, session_id: str, message: dict):
        """Broadcast a message to all connections in a session."""
        if session_id not in self.active_connections:
            return
        
        # Create a copy of the set to avoid modification during iteration
        connections = self.active_connections[session_id].copy()
        
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Remove dead connections
                self.disconnect(connection, session_id)


# Global connection manager
manager = ConnectionManager()


from app.database.instance import get_db

@router.websocket("/sessions/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    db=Depends(get_db)
):
    """
    WebSocket endpoint for real-time session updates.
    
    Events sent to client:
    - session_update: Full session state when any change occurs
    """
    # Verify session exists
    session = await db.get_session(session_id)
    if not session:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    # Accept connection
    await manager.connect(websocket, session_id)
    
    # Subscribe to database updates
    def on_session_update(updated_session: Session):
        """Callback for session updates."""
        # Schedule broadcast in the event loop
        import asyncio
        asyncio.create_task(manager.broadcast(
            session_id,
            {
                "event": "session_update",
                "data": updated_session.model_dump()
            }
        ))
    
    unsubscribe = db.subscribe(session_id, on_session_update)
    
    try:
        # Send initial session state
        await websocket.send_json({
            "event": "session_update",
            "data": session.model_dump()
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            
            # Handle client messages (e.g., ping/pong for keep-alive)
            try:
                message = json.loads(data)
                
                if message.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            
            except json.JSONDecodeError:
                pass
    
    except WebSocketDisconnect:
        pass
    
    finally:
        # Clean up
        manager.disconnect(websocket, session_id)
        unsubscribe()
