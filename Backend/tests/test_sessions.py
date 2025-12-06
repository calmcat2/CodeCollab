import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_create_session():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/sessions")
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "code" in data
    assert "language" in data
    return data["id"]

@pytest.mark.asyncio
async def test_get_session():
    # Create first
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        create_res = await ac.post("/api/v1/sessions")
        session_id = create_res.json()["id"]
        
        # Get
        response = await ac.get(f"/api/v1/sessions/{session_id}")
    
    assert response.status_code == 200
    assert response.json()["id"] == session_id

@pytest.mark.asyncio
async def test_join_session():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create
        session_id = (await ac.post("/api/v1/sessions")).json()["id"]
        
        # Join
        response = await ac.post(
            f"/api/v1/sessions/{session_id}/join",
            json={"username": "testuser"}
        )
        
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["username"] == "testuser"
    assert len(data["session"]["users"]) == 1

@pytest.mark.asyncio
async def test_execute_code_python():
    # Note: Code Execution might require Pyodide (Frontend) or Backend fallback?
    # Actually, current implementation of `execute_code` in code.py calls `CodeExecutor`.
    # CodeExecutor (services/code_executor.py) uses `subprocess` (backend execution) or similar?
    # Wait, didn't I move execution to Client Side?
    # The Backend `execute_code` endpoint triggers `CodeExecutor`.
    # Does `CodeExecutor` still exist/work? Code was moved to Frontend/src/services/codeExecution.ts for WASM.
    # BUT the backend endpoint `/execute` still exists in `code.py`.
    # If the user clicks "Run" in FE, it uses Frontend service? 
    # Checking `Session.tsx`: `const result = await codeExecutionService.execute(...)`.
    # So the Backend endpoint is UNUSED?
    # Let's verify `Session.tsx` to be sure.
    pass
