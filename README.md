# Code Challenge

## Features
- 📄 Upload and process documents
- 🔍 Semantic search across documents
- 💬 AI chat with document context
- 📊 Document chunking and embeddings

## Tech Stack

**Backend**
- Node.js, TypeScript, Express
- SQLite + Knex (database)
- Pinecone (vector search)
- OpenAI (embeddings & chat)

**Frontend**
- React, TypeScript, Vite
- TanStack Query, Zustand
- Tailwind CSS, Radix UI

## Quick Start

### Prerequisites
- Node.js 23.6+ (check with `node --version`)
- OpenAI API key
- Pinecone API key
- Make (optional, for using Makefile commands)

### Setup

#### Option 1: Using Make (Recommended)
```bash
# Full setup (install dependencies and run migrations)
make setup
cp backend/.env.example backend/.env  # Add your API keys

# Start both frontend and backend
make dev
```

#### Option 2: Manual Setup

1. **Backend**
```bash
cd backend
npm install
cp .env.example .env  # Add your API keys
npm run migrate:latest
npm run dev  # Runs on port 3000
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev  # Runs on port 5173
```

## Environment Variables

Create `backend/.env`:
```env
PORT=3000
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
```

## Development

### Using Make Commands
```bash
make setup      # Setup dependencies and run migrations
make dev        # Start both frontend and backend
make frontend   # Start frontend only
make backend    # Start backend only
make lint       # Run linting for both
make typecheck  # Run type checking for both
make help       # Show all available commands
```

## Next steps

1. Load sessions from database on app initialization
2. Add session management UI (view old sessions, delete sessions)
3. Implement proper user authentication to isolate sessions per user