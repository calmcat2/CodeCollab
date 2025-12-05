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


@pytest.mark.asyncio
async def test_execute_code_python(client: AsyncClient, sample_session):
    """Test executing Python code."""
    session_id = sample_session["id"]
    
    code = "print('Hello, World!')\nprint(1 + 2)"
    response = await client.post(
        f"/api/v1/sessions/{session_id}/execute",
        json={"code": code, "language": "python"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "output" in data
    assert "executionTime" in data
    
    # Verify output contains expected results
    assert "Hello, World!" in data["output"]
    assert "3" in data["output"]
    
    # Error should be None or not present
    assert data.get("error") is None


@pytest.mark.asyncio
async def test_execute_code_with_error(client: AsyncClient, sample_session):
    """Test executing code that produces an error."""
    session_id = sample_session["id"]
    
    code = "print(undefined_variable)"
    response = await client.post(
        f"/api/v1/sessions/{session_id}/execute",
        json={"code": code, "language": "python"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Should have an error
    assert data.get("error") is not None
    assert "NameError" in data["error"]


@pytest.mark.asyncio
async def test_execute_code_javascript_mock(client: AsyncClient, sample_session):
    """Test executing JavaScript code (mock)."""
    session_id = sample_session["id"]
    
    code = "console.log('Hello from JS!');"
    response = await client.post(
        f"/api/v1/sessions/{session_id}/execute",
        json={"code": code, "language": "javascript"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "output" in data
    assert "executionTime" in data
    
    # Mock output should mention JavaScript
    assert "JavaScript" in data["output"] or "javascript" in data["output"].lower()


@pytest.mark.asyncio
async def test_execute_code_nonexistent_session(client: AsyncClient):
    """Test executing code in a nonexistent session."""
    response = await client.post(
        "/api/v1/sessions/nonexistent/execute",
        json={"code": "print('test')", "language": "python"}
    )
    
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_execution_time_recorded(client: AsyncClient, sample_session):
    """Test that execution time is recorded."""
    session_id = sample_session["id"]
    
    code = "for i in range(100): pass"
    response = await client.post(
        f"/api/v1/sessions/{session_id}/execute",
        json={"code": code, "language": "python"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Execution time should be a positive integer
    assert isinstance(data["executionTime"], int)
    assert data["executionTime"] >= 0
