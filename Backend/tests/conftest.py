import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.main import app
from app.database.mock_db import MockDatabase
from app.database.instance import get_db


from unittest.mock import patch
from asgi_lifespan import LifespanManager
import os

@pytest_asyncio.fixture(scope="function")
async def global_mock_db():
    """
    Create a single mock DB instance for the entire test session.
    Using a file-based DB to avoid threading/loop issues with :memory:
    """
    db_path = "test_codecollab.db"
    # Ensure clean start
    if os.path.exists(db_path):
        os.remove(db_path)
    
    db = MockDatabase(db_path)
    yield db
    
    # Cleanup after test
    await db.disconnect()
        
    if os.path.exists(db_path):
        os.remove(db_path)


@pytest.fixture(autouse=True)
def patch_db(global_mock_db):
    """
    Patch the global database instance for ALL tests.
    """
    with patch("app.database.instance.db", global_mock_db):
        app.dependency_overrides[get_db] = lambda: global_mock_db
        yield
        app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def client():
    """
    Create an async test client with lifespan handling.
    """
    async with LifespanManager(app) as manager:
        transport = ASGITransport(app=manager.app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


@pytest_asyncio.fixture
async def sample_session(client):
    """Create a sample session for testing."""
    response = await client.post("/api/v1/sessions")
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {"username": "test_user"}
