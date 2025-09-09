# RAG Challenge - Frontend

Modern document management interface with AI-powered search and chat.

## Tech Stack
- **React 19** + **TypeScript** + **Vite**
- **TanStack Query** (data fetching)
- **Zustand** (state management)
- **Tailwind CSS** + **Radix UI** (styling)
- **React Dropzone** (file uploads)

## Setup
```bash
npm install
```

## Development
```bash
npm run dev       # Start dev server (port 5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run typecheck # Type checking
npm run lint      # Linting
```

## Features

### Document Management
- Drag & drop file upload (PDF/TXT)
- Real-time processing status
- Document list with metadata
- Delete documents

### Document Viewer
- View document summary
- Browse document chunks
- Copy chunk content
- View embeddings info

### AI Chat Interface
- Chat with uploaded documents
- Context-aware responses (RAG)
- Chat history
- Real-time streaming responses

### Search
- Semantic search across documents
- View relevant chunks
- Filter by document

## Project Structure
```
src/
├── components/
│   ├── cards/         # Document cards, summary, chunks
│   ├── chat/          # Chat interface components
│   ├── layout/        # Layout components
│   ├── panels/        # Main panels (upload, insights)
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── services/          # API client
├── stores/            # Zustand stores
└── types/             # TypeScript types
```

## Environment
API endpoint configured in `services/api.ts` (default: `http://localhost:3001`)

## UI Components
- **ThreePanelLayout**: Main application layout
- **DocumentUploadPanel**: File upload with dropzone
- **DocumentInsights**: Document viewer and chunks browser
- **ChatInterface**: AI chat with documents
- **DocumentList**: Browse uploaded documents