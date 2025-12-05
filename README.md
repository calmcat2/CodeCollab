# CodeCollab

Real-time collaborative code editor for technical interviews.

## Features

- 🚀 **Real-time Collaboration** - Multiple users can code together simultaneously
- 💬 **Live Updates** - See changes instantly via WebSocket
- 👥 **User Presence** - Know who's in the session and when they're typing
- ▶️ **Code Execution** - Run Python code directly in the browser
- 🎨 **Syntax Highlighting** - Support for JavaScript, TypeScript, Python, and more
- 🔗 **Easy Sharing** - Share a link to invite others to your session

## Quick Start

### Prerequisites

- **Frontend**: Node.js 18+ and npm
- **Backend**: Python 3.13+ and `uv`

### Installation

```bash
# Install root dependencies (concurrently)
npm install

# Install frontend dependencies
cd Frontend && npm install && cd ..

# Install backend dependencies
cd Backend && uv sync && cd ..
```

### Running the Application

**Option 1: Run both services together (recommended)**

```bash
npm run dev
```

This starts:
- Backend API on http://localhost:8000
- Frontend on http://localhost:5173

**Option 2: Run services separately**

```bash
# Terminal 1 - Backend
npm run backend
# or: cd Backend && uv run uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend  
npm run frontend
# or: cd Frontend && npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000/health

## Project Structure

```
CodeCollab/
├── Frontend/          # React + TypeScript frontend
│   ├── src/
│   │   ├── pages/     # Main pages (Index, Session)
│   │   ├── components/# Reusable components
│   │   ├── services/  # API client
│   │   └── types/     # TypeScript types
│   └── package.json
├── Backend/           # FastAPI backend
│   ├── app/
│   │   ├── main.py    # FastAPI app
│   │   ├── routers/   # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── database/  # Mock database
│   │   └── models/    # Pydantic schemas
│   ├── tests/         # Pytest tests
│   └── pyproject.toml
├── package.json       # Root package for concurrently
└── openapi-spec.yaml  # API specification
```

## Development

### Running Tests

```bash
# Run all tests
npm run test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend
```

### API Documentation

The backend provides interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Environment Variables

Frontend environment variables (`.env.development`):
```
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

## Usage

1. **Create a Session**
   - Open http://localhost:5173
   - Click "Create Session"
   - Share the session URL with others

2. **Join a Session**
   - Enter the session ID or use the shared link
   - Choose a username
   - Start collaborating!

3. **Code Together**
   - Type code in the editor
   - See others' changes in real-time
   - Watch typing indicators
   - Execute code and see results

## Technology Stack

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components

### Backend
- **FastAPI** - Web framework
- **Python 3.13** - Programming language
- **Pydantic** - Data validation
- **WebSockets** - Real-time communication
- **pytest** - Testing

## Architecture

### Real-time Communication

The application uses WebSockets for real-time updates:
- Code changes
- User join/leave events
- Typing indicators
- Language selection

### API Endpoints

- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions/{id}` - Get session
- `POST /api/v1/sessions/{id}/join` - Join session
- `PUT /api/v1/sessions/{id}/code` - Update code
- `POST /api/v1/sessions/{id}/execute` - Execute code
- `WS /api/v1/ws/sessions/{id}` - WebSocket connection

See [openapi-spec.yaml](openapi-spec.yaml) for full API documentation.

## Testing

### Backend Tests
```bash
cd Backend
uv run pytest tests/ -v
```

24 tests covering:
- Session management
- User operations
- Code execution
- WebSocket functionality

### Frontend Tests
```bash
cd Frontend
npm run test
```

## Production Deployment

### Backend

1. Set production environment variables
2. Replace mock database with PostgreSQL/MongoDB
3. Use production ASGI server (Gunicorn + Uvicorn)
4. Enable HTTPS
5. Configure CORS for production domain

### Frontend

1. Build production bundle: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Update `.env.production` with production API URL

## Security Notes

> [!WARNING]
> The current code execution is NOT fully secure. For production:
> - Use Docker containers with resource limits
> - Implement proper sandboxing
> - Use services like Judge0 or Piston API
> - Add rate limiting
> - Implement authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
