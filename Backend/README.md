# CodeCollab Backend API

Real-time collaborative code editor API built with FastAPI.

## Features

- ✅ **Session Management** - Create and manage coding sessions
- ✅ **Real-time Collaboration** - WebSocket support for live updates
- ✅ **User Management** - Join/leave sessions with unique usernames
- ✅ **Code Execution** - Execute Python code (other languages mocked)
- ✅ **Typing Indicators** - Real-time typing status updates
- ✅ **Comprehensive Tests** - 24 tests covering all endpoints

## Quick Start

### Prerequisites

- Python 3.13+
- `uv` package manager

### Installation

```bash
# Install dependencies
uv sync

# Run the server
uv run uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

### Running Tests

```bash
# Run all tests
uv run pytest tests/ -v

# Run with coverage
uv run pytest tests/ --cov=app --cov-report=html

# Run specific test file
uv run pytest tests/test_sessions.py -v
```

## API Endpoints

### Sessions

- `POST /api/v1/sessions` - Create a new session
- `GET /api/v1/sessions/{sessionId}` - Get session details

### Users

- `POST /api/v1/sessions/{sessionId}/join` - Join a session
- `POST /api/v1/sessions/{sessionId}/leave` - Leave a session
- `PUT /api/v1/sessions/{sessionId}/typing` - Update typing status
- `GET /api/v1/sessions/{sessionId}/username/check` - Check username availability

### Code

- `PUT /api/v1/sessions/{sessionId}/code` - Update code
- `PUT /api/v1/sessions/{sessionId}/language` - Update language
- `POST /api/v1/sessions/{sessionId}/execute` - Execute code

### WebSocket

- `WS /api/v1/ws/sessions/{sessionId}` - Real-time session updates

## Project Structure

```
Backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── models/
│   │   └── schemas.py       # Pydantic models
│   ├── database/
│   │   └── mock_db.py       # Mock in-memory database
│   ├── routers/
│   │   ├── sessions.py      # Session endpoints
│   │   ├── users.py         # User endpoints
│   │   ├── code.py          # Code endpoints
│   │   └── websocket.py     # WebSocket endpoint
│   └── services/
│       ├── session_service.py
│       ├── user_service.py
│       └── code_executor.py
├── tests/
│   ├── conftest.py          # Test fixtures
│   ├── test_sessions.py
│   ├── test_users.py
│   ├── test_code.py
│   └── test_websocket.py
├── pyproject.toml
└── pytest.ini
```

## Configuration

Configuration is managed through `app/config.py`. Key settings:

- **CORS Origins**: Configure allowed origins for frontend
- **Session Settings**: Session ID length, max users, timeout
- **Code Execution**: Timeout and code length limits

## Development

### Adding Dependencies

```bash
# Add a production dependency
uv add <package-name>

# Add a development dependency
uv add --dev <package-name>
```

### Code Quality

```bash
# Format code with ruff
uv run ruff format app/ tests/

# Lint code
uv run ruff check app/ tests/
```

## Mock Database

The current implementation uses an in-memory mock database (`app/database/mock_db.py`). This is designed for easy replacement with a real database:

1. Create a new database module (e.g., `postgres_db.py`)
2. Implement the same interface as `MockDatabase`
3. Update dependency injection in `app/main.py`

## Code Execution Security

⚠️ **Important**: The current Python code execution is **NOT fully secure**. For production:

- Use Docker containers with resource limits
- Use sandboxed execution services (Judge0, Piston API)
- Implement proper timeout and resource constraints
- Use RestrictedPython or similar libraries

## WebSocket Events

### Server → Client

- `session_update` - Full session state on any change
- Includes: code updates, user join/leave, language changes, typing status

### Client → Server

- `ping` - Keep-alive ping (server responds with `pong`)

## Example Usage

### Create a Session

```bash
curl -X POST http://localhost:8000/api/v1/sessions
```

### Join a Session

```bash
curl -X POST http://localhost:8000/api/v1/sessions/{sessionId}/join \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe"}'
```

### Execute Code

```bash
curl -X POST http://localhost:8000/api/v1/sessions/{sessionId}/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")", "language": "python"}'
```

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/sessions/{sessionId}');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Session update:', data);
};
```

## License

MIT
