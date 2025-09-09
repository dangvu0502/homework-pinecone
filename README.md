# RAG Challenge

Full-stack document management system with AI-powered search and chat using RAG (Retrieval-Augmented Generation).

## Features
- 📄 Upload and process documents (PDF/TXT)
- 🔍 Semantic search across documents
- 💬 AI chat with document context
- 📊 Document chunking and embeddings
- 🔄 Real-time processing status

## Tech Stack

**Backend**
- Node.js, TypeScript, Express
- SQLite + Knex (database)
- Pinecone (vector search)
- OpenAI (embeddings & chat)

**Frontend**
- React 19, TypeScript, Vite
- TanStack Query, Zustand
- Tailwind CSS, Radix UI

## Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key
- Pinecone API key

### Setup

1. **Backend**
```bash
cd backend
npm install
cp .env.example .env  # Add your API keys
npm run migrate:latest
npm run dev  # Runs on port 3001
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
PORT=3001
DATABASE_URL=./database.sqlite3
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=your_index_name
```

## API Endpoints

- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document
- `GET /api/documents/:id/chunks` - Get chunks
- `POST /api/chat` - Chat with documents
- `POST /api/search` - Search documents

## Project Structure
```
rag-challenge/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # OpenAI, Pinecone
│   │   ├── models/        # Database models
│   │   └── routes/        # API routes
│   └── database.sqlite3
├── frontend/
│   └── src/
│       ├── components/    # UI components
│       ├── services/      # API client
│       └── stores/        # State management
```

## Development

```bash
# Backend
cd backend && npm run dev

# Frontend (new terminal)
cd frontend && npm run dev
```

Visit http://localhost:5173