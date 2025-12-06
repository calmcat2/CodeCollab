import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_update_code(client: AsyncClient, sample_session, sample_user_data):
    """Test updating code in a session."""
    session_id = sample_session["id"]
    
    # Join session first
    join_response = await client.post(
        f"/api/v1/sessions/{session_id}/join",
        json=sample_user_data
    )
    user_id = join_response.json()["user"]["id"]
    
    # Update code
    new_code = "print('Hello from Python!')"
    response = await client.put(
        f"/api/v1/sessions/{session_id}/code",
        json={"code": new_code, "userId": user_id}
    )
    
    assert response.status_code == 204
    
    # Verify code was updated
    session_response = await client.get(f"/api/v1/sessions/{session_id}")
    session = session_response.json()
    assert session["code"] == new_code


@pytest.mark.asyncio
async def test_update_language(client: AsyncClient, sample_session):
    """Test updating programming language."""
    session_id = sample_session["id"]
    
    # Update language to Python
    response = await client.put(
        f"/api/v1/sessions/{session_id}/language",
        json={"language": "python"}
    )
    
    assert response.status_code == 204
    
    # Verify language was updated
    session_response = await client.get(f"/api/v1/sessions/{session_id}")
    session = session_response.json()
    assert session["language"] == "python"


@pytest.mark.asyncio
async def test_update_language_invalid(client: AsyncClient, sample_session):
    """Test updating to an invalid language."""
    session_id = sample_session["id"]
    
    response = await client.put(
        f"/api/v1/sessions/{session_id}/language",
        json={"language": "invalid_language"}
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "invalid language" in data["detail"].lower()



