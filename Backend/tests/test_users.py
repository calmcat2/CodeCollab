import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_join_session(client: AsyncClient, sample_session, sample_user_data):
    """Test joining a session."""
    session_id = sample_session["id"]
    
    response = await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json=sample_user_data
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "user" in data
    assert "session" in data
    
    # Verify user
    user = data["user"]
    assert user["username"] == sample_user_data["username"]
    assert "id" in user
    assert "color" in user
    assert user["isTyping"] is False
    assert "lastActivity" in user
    
    # Verify session has the user
    session = data["session"]
    assert len(session["users"]) == 1
    assert session["users"][0]["username"] == sample_user_data["username"]


@pytest.mark.asyncio
async def test_join_session_duplicate_username(client: AsyncClient, sample_session):
    """Test joining a session with a duplicate username."""
    session_id = sample_session["id"]
    username = {"username": "duplicate_user"}
    
    # First user joins
    response1 = await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json=username
    )
    assert response1.status_code == 200
    
    # Second user tries to join with same username
    response2 = await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json=username
    )
    
    assert response2.status_code == 400
    data = response2.json()
    assert "already taken" in data["detail"].lower()


@pytest.mark.asyncio
async def test_join_nonexistent_session(client: AsyncClient, sample_user_data):
    """Test joining a session that doesn't exist."""
    response = await client.post(
        "/api/v1/sessions/nonexistent/join",
        json=sample_user_data
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_leave_session(client: AsyncClient, sample_session, sample_user_data):
    """Test leaving a session."""
    session_id = sample_session["id"]
    
    # First join the session
    join_response = await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json=sample_user_data
    )
    user_id = join_response.json()["user"]["id"]
    
    # Then leave
    response = await client.post(
        f"/api/v1/sessions/{session_id}/leave",
        json={"userId": user_id}
    )
    
    assert response.status_code == 204
    
    # Verify user is removed
    session_response = await client.get(f"/api/v1/sessions/{session_id}")
    session = session_response.json()
    assert len(session["users"]) == 0


@pytest.mark.asyncio
async def test_update_typing_status(client: AsyncClient, sample_session, sample_user_data):
    """Test updating typing status."""
    session_id = sample_session["id"]
    
    # Join session first
    join_response = await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json=sample_user_data
    )
    user_id = join_response.json()["user"]["id"]
    
    # Update typing status to true
    response = await client.put(
        f"/api/v1/sessions/{session_id}/typing",
        json={"userId": user_id, "isTyping": True}
    )
    
    assert response.status_code == 204
    
    # Verify typing status
    session_response = await client.get(f"/api/v1/sessions/{session_id}")
    session = session_response.json()
    assert session["users"][0]["isTyping"] is True


@pytest.mark.asyncio
async def test_check_username_available(client: AsyncClient, sample_session):
    """Test checking username availability."""
    session_id = sample_session["id"]
    
    # Check available username
    response = await client.get(
        f"/api/v1/sessions/{session_id}/username/check",
        params={"username": "available_user"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is True
    
    # Join with a username
    await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json={"username": "taken_user"}
    )
    
    # Check taken username
    response = await client.get(
        f"/api/v1/sessions/{session_id}/username/check",
        params={"username": "taken_user"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["available"] is False


@pytest.mark.asyncio
async def test_user_color_assignment(client: AsyncClient, sample_session):
    """Test that users get different colors."""
    session_id = sample_session["id"]
    
    # Join with two users
    response1 = await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json={"username": "user1"}
    )
    response2 = await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json={"username": "user2"}
    )
    
    user1 = response1.json()["user"]
    user2 = response2.json()["user"]
    
    # Verify they have different colors
    assert user1["color"] != user2["color"]
    
    # Verify color format (HSL)
    assert user1["color"].startswith("hsl(")
    assert user2["color"].startswith("hsl(")
