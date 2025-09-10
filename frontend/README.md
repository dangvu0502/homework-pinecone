# Code Challenge - Frontend

Modern document management interface with AI-powered search and chat.

## Tech Stack
- **React** + **TypeScript** + **Vite**
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
- Real-time streaming responses

### Document Insights
- Document summary
- List of document chunks
```

## Environment
API endpoint configured in `services/api.ts` (default: `http://localhost:3000`)

## UI Components
- **ThreePanelLayout**: Main application layout
- **DocumentUploadPanel**: File upload with dropzone
- **DocumentInsights**: Document viewer and chunks browser
- **ChatInterface**: AI chat with documents
- **DocumentList**: Browse uploaded documents