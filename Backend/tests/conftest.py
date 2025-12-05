import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.database.mock_db import MockDatabase, get_db


@pytest.fixture
def mock_db():
    """Create a fresh mock database for each test."""
    return MockDatabase()


@pytest.fixture
def override_get_db(mock_db):
    """Override the database dependency."""
    def _override():
        return mock_db
    
    app.dependency_overrides[get_db] = _override
    yield
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def client(override_get_db):
    """Create an async test client."""
    transport = ASGITransport(app=app)
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
