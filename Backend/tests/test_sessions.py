import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_session(client: AsyncClient):
    """Test creating a new session."""
    response = await client.post("/api/v1/sessions")
    
    assert response.status_code == 201
    data = response.json()
    
    # Verify session structure
    assert "id" in data
    assert "code" in data
    assert "language" in data
    assert "users" in data
    assert "createdAt" in data
    
    # Verify defaults
    assert len(data["id"]) == 8
    assert data["language"] == "javascript"
    assert data["users"] == []
    assert "console.log" in data["code"]


@pytest.mark.asyncio
async def test_get_session(client: AsyncClient, sample_session):
    """Test getting an existing session."""
    session_id = sample_session["id"]
    
    response = await client.get(f"/api/v1/sessions/{session_id}")
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["id"] == session_id
    assert data["code"] == sample_session["code"]
    assert data["language"] == sample_session["language"]


@pytest.mark.asyncio
async def test_get_nonexistent_session(client: AsyncClient):
    """Test getting a session that doesn't exist."""
    response = await client.get("/api/v1/sessions/nonexistent")
    
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data


@pytest.mark.asyncio
async def test_session_id_uniqueness(client: AsyncClient):
    """Test that session IDs are unique."""
    response1 = await client.post("/api/v1/sessions")
    response2 = await client.post("/api/v1/sessions")
    
    assert response1.status_code == 201
    assert response2.status_code == 201
    
    session1 = response1.json()
    session2 = response2.json()
    
    assert session1["id"] != session2["id"]
