# AI Music Intelligence Platform

A production-ready platform that connects to Spotify, analyzes your listening habits, and will deliver AI-powered music insights.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Query, React Router |
| Backend | FastAPI, Python, SQLAlchemy, PostgreSQL, Redis |
| AI | LangChain, ChromaDB, vector embeddings, optional OpenAI chat/embeddings |
| Auth | Spotify OAuth 2.0 |
| Deployment | Docker, Docker Compose |

## Feature 1: Spotify Login (Implemented)

- Spotify OAuth 2.0 login flow
- Secure server-side token storage (encrypted refresh tokens)
- Automatic Spotify token refresh
- User profile creation on first login
- Fetch: Top Artists, Top Tracks, Recently Played, Playlists, Saved Tracks, Followed Artists

## Feature 3: AI Music Chatbot (Implemented)

- ChatGPT-style chat page at `/dashboard/chat`
- Retrieval Augmented Generation (RAG) over indexed Spotify listening data
- ChromaDB vector store persisted at `CHROMA_PERSIST_DIR`
- LangChain orchestration with Gemini or OpenAI chat models
- Local fallback embeddings and retrieved-context answers when no LLM key is configured
- Local embeddings are the default; set `USE_OPENAI_EMBEDDINGS=true` only if your OpenAI account has embedding quota

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js 20+](https://nodejs.org/) (for local frontend dev)
- [Python 3.12+](https://www.python.org/) (for local backend dev)
- [Spotify Developer App](https://developer.spotify.com/dashboard)

## Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add Redirect URI: `http://127.0.0.1:8000/api/v1/auth/callback`
   - Spotify requires loopback addresses to use explicit `127.0.0.1` — `localhost` is not allowed
4. Copy Client ID and Client Secret

## Quick Start (Docker)

```bash
# Copy and configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Generate a Fernet encryption key
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Edit backend/.env with your Spotify credentials and generated keys
# Optional: add GOOGLE_API_KEY for richer Gemini AI chat responses

# Start infrastructure + backend
docker compose up -d postgres redis backend

# Start frontend (local dev)
cd frontend && npm install && npm run dev
```

Open http://127.0.0.1:5173 and click **Log in with Spotify**.

### Gemini AI Chat Setup

1. Create a free API key in [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add it to `backend/.env`:

```bash
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-1.5-flash
USE_OPENAI_EMBEDDINGS=false
```

The vector database still uses local embeddings by default, so indexing does not consume Gemini or OpenAI quota.

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # configure credentials
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### Infrastructure only

```bash
docker compose up -d postgres redis
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/login` | Redirect to Spotify OAuth |
| GET | `/api/v1/auth/callback` | OAuth callback (handled by backend) |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/auth/status` | Auth status check |
| POST | `/api/v1/auth/refresh` | Refresh JWT session |
| GET | `/api/v1/spotify/top-artists` | Top artists |
| GET | `/api/v1/spotify/top-tracks` | Top tracks |
| GET | `/api/v1/spotify/recently-played` | Recently played |
| GET | `/api/v1/spotify/playlists` | User playlists |
| GET | `/api/v1/spotify/saved-tracks` | Saved/liked tracks |
| GET | `/api/v1/spotify/followed-artists` | Followed artists |
| POST | `/api/v1/chat/index` | Index Spotify data into the vector database |
| POST | `/api/v1/chat` | Ask the AI music chatbot a question |

## Security Architecture

- **Spotify tokens** are stored server-side only, encrypted with Fernet
- **JWT session tokens** are issued to the frontend for API authentication
- **OAuth state** is validated via Redis to prevent CSRF
- **Token refresh** happens automatically before Spotify API calls when tokens expire

## Project Structure

```
├── backend/
│   └── app/
│       ├── api/          # Route handlers
│       ├── auth/         # OAuth & token management
│       ├── services/     # Spotify, analytics, and RAG services
│       ├── models/       # SQLAlchemy models
│       ├── schemas/      # Pydantic schemas
│       ├── database/     # DB & Redis connections
│       └── utils/        # Security helpers
├── frontend/
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── services/     # API client
│       ├── hooks/        # React Query hooks
│       ├── layouts/      # App layouts
│       ├── types/        # TypeScript types
│       └── utils/        # Helpers
└── docker-compose.yml
```

## Coming Next

- Personalized recommendations
- Listening pattern visualizations with Recharts
- Streaming AI chat responses
