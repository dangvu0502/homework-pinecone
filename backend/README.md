# RAG Challenge - Backend

Document processing and retrieval API with vector search capabilities.

## Tech Stack
- **Node.js** + **TypeScript** + **Express** (node 23.6 +)
- **SQLite** + **Knex** (database & migrations)
- **Pinecone** (vector database)
- **OpenAI** (embeddings & chat)
- **Multer** (file uploads)

## Setup
```bash
npm install
cp .env.example .env  # Add your API keys
npm run migrate:latest
```

## Development
```bash
npm run dev       # Start dev server (port 3001)
npm run typecheck # Type checking
npm run lint      # Linting
```

## Database
```bash
npm run migrate:latest   # Run migrations
npm run migrate:rollback # Rollback
npm run migrate:make <name> # Create migration
```

## API Endpoints

### Documents
- `POST /api/documents/upload` - Upload document (PDF/TXT)
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/summary` - Get document summary
- `GET /api/documents/:id/chunks` - Get document chunks
- `DELETE /api/documents/:id` - Delete document

### SSE
- `GET /api/sse/status` - Real-time document processing status

## Environment Variables
```env
PORT=3000
OPENAI_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=your_index
```