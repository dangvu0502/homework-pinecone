# RAG Challenge Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for the RAG Challenge, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines frontend and backend architecture concerns, streamlining the development process for this modern fullstack RAG application.

### Starter Template or Existing Project
N/A - Greenfield project with specific technology requirements (Node.js + React + Vite)

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-06 | 1.0 | Initial architecture draft | Winston (Architect) |

## High Level Architecture

### Technical Summary
This RAG document processing system follows a modern fullstack architecture with React/Vite frontend and Node.js/Express backend, deployed as a monorepo structure. The frontend provides an intuitive three-panel interface for document upload, management, and conversational interaction, while the backend handles document processing, embedding generation via OpenAI, and vector storage in Pinecone. Key integration points include RESTful APIs for document operations, real-time WebSocket connections for processing updates, and shared TypeScript interfaces for type safety. The system deploys on Vercel (frontend) and Railway/Render (backend) for rapid development cycles while maintaining scalability for production use.

### Platform and Infrastructure Choice
**Platform:** Hybrid Cloud (Vercel + Railway)
**Key Services:** Vercel (Frontend), Railway (Backend), Pinecone (Vector DB), OpenAI (Embeddings/Chat), AWS S3 (File Storage)
**Deployment Host and Regions:** Global edge deployment via Vercel CDN, US-East-1 for backend services

**Rationale:** This hybrid approach leverages Vercel's excellent React/Vite deployment experience while using Railway for cost-effective Node.js hosting with built-in database support if needed later.

### Repository Structure
**Structure:** Monorepo
**Monorepo Tool:** npm workspaces (lightweight, built-in)
**Package Organization:** Apps (web/api) + Shared packages (types/ui/config)

### High Level Architecture Diagram
```mermaid
graph TB
    Users[Users] --> CDN[Vercel CDN/Edge]
    CDN --> Web[React Web App]
    Web --> API[Node.js API Server]
    API --> S3[AWS S3<br/>File Storage]
    API --> Pinecone[Pinecone<br/>Vector Database]
    API --> OpenAI[OpenAI API<br/>Embeddings & Chat]
    API --> WS[WebSocket<br/>Real-time Updates]
    WS --> Web
    
    subgraph "Vercel Edge"
        Web
        CDN
    end
    
    subgraph "Railway"
        API
        WS
    end
    
    subgraph "External Services"
        S3
        Pinecone
        OpenAI
    end
```

### Architectural Patterns
- **Jamstack Architecture:** React SPA with serverless-style API deployment - _Rationale:_ Optimal performance and scalability for document-heavy applications with global CDN distribution
- **Component-Based UI:** Reusable React components with TypeScript - _Rationale:_ Maintainability and type safety across large UI surface area
- **Repository Pattern:** Abstract data access logic for documents and embeddings - _Rationale:_ Enables testing and future storage provider flexibility
- **API Gateway Pattern:** Centralized Express router with middleware - _Rationale:_ Unified auth, error handling, and request/response transformation
- **Event-Driven Processing:** Async document processing with WebSocket updates - _Rationale:_ Non-blocking UI experience during long-running embedding operations

## Tech Stack

### Technology Stack Table
| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | ^5.3.0 | Type-safe frontend development | Prevents runtime errors, excellent IDE support, shared types with backend |
| Frontend Framework | React | ^18.2.0 | Component-based UI library | Mature ecosystem, excellent Vite integration, team familiarity |
| UI Component Library | Tailwind CSS + Shadcn/ui | Latest | Rapid UI development with consistent design | Utility-first CSS with high-quality components, matches wireframe aesthetic |
| State Management | Zustand | ^4.4.0 | Lightweight state management | Simple API, TypeScript support, sufficient for document selection and chat state |
| Backend Language | Node.js | ^20.0.0 | JavaScript runtime for backend | Unified language across stack, excellent async I/O for file processing |
| Backend Framework | Express.js | ^4.18.0 | Web application framework | Battle-tested, middleware ecosystem, simple REST API creation |
| API Style | REST | - | HTTP-based API communication | Simple, cacheable, works well with document upload/download patterns |
| Database | PostgreSQL | ^15.0 | Relational database for metadata | ACID compliance for document tracking, native JSON support for metadata |
| Cache | Redis | ^7.0 | Session and API response caching | Fast document processing status, user session management |
| File Storage | AWS S3 | - | Scalable document storage | Unlimited storage, presigned URLs for secure upload/download |
| Authentication | JWT + Express Session | - | Stateless auth with session fallback | JWT for API calls, sessions for WebSocket connections |
| Frontend Testing | Vitest + React Testing Library | Latest | Component and integration testing | Fast test runner, excellent React component testing support |
| Backend Testing | Jest + Supertest | Latest | API and unit testing | Comprehensive testing framework, HTTP endpoint testing |
| E2E Testing | Playwright | Latest | End-to-end user flow testing | Cross-browser testing, excellent for document upload workflows |
| Build Tool | Vite | ^5.0.0 | Frontend build and dev server | Fast HMR, excellent TypeScript support, optimized production builds |
| Bundler | Vite (Rollup) | - | Module bundling and optimization | Tree-shaking, code splitting, modern JS output |
| IaC Tool | None (Platform deployments) | - | Infrastructure as code | Vercel/Railway handle infrastructure, focus on application code |
| CI/CD | GitHub Actions | - | Automated testing and deployment | Free for public repos, excellent integration with deployment platforms |
| Monitoring | Vercel Analytics + Railway Metrics | - | Application monitoring | Built-into deployment platforms, sufficient for MVP monitoring |
| Logging | Winston (Backend) + Console (Frontend) | ^3.10.0 | Structured logging | JSON logging for backend, browser console for frontend debugging |
| CSS Framework | Tailwind CSS | ^3.3.0 | Utility-first styling | Rapid development, small bundle size, excellent component library ecosystem |

## Data Models

### Document
**Purpose:** Represents uploaded documents with metadata, processing status, and extracted content for RAG operations

**Key Attributes:**
- id: string (UUID) - Unique document identifier
- filename: string - Original filename for user reference
- contentType: string - MIME type for processing logic
- size: number - File size in bytes for validation
- uploadedAt: Date - Upload timestamp for sorting/filtering
- status: ProcessingStatus - Current processing state for UI feedback
- extractedText: string - OCR/extracted content for embedding
- embeddingId: string - Reference to Pinecone vector storage
- s3Key: string - AWS S3 object key for file retrieval
- userId: string - User ownership for multi-tenant support

#### TypeScript Interface
```typescript
interface Document {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
  status: ProcessingStatus;
  extractedText?: string;
  embeddingId?: string;
  s3Key: string;
  userId: string;
  metadata?: DocumentMetadata;
}

enum ProcessingStatus {
  UPLOADED = 'uploaded',
  EXTRACTING = 'extracting',
  EMBEDDING = 'embedding',
  READY = 'ready',
  ERROR = 'error'
}

interface DocumentMetadata {
  pages?: number;
  language?: string;
  extractionMethod: 'ocr' | 'pdf-text' | 'direct';
  processingTime?: number;
}
```

#### Relationships
- Belongs to User (many-to-one)
- Has many ChatMessages that reference it as context
- Associated with Pinecone vectors via embeddingId

### ChatSession
**Purpose:** Manages conversational context and message history for document Q&A interactions

**Key Attributes:**
- id: string (UUID) - Unique session identifier
- userId: string - Session ownership
- documentIds: string[] - Active document context
- createdAt: Date - Session creation timestamp
- lastMessageAt: Date - Last activity for cleanup
- title: string - Auto-generated session name

#### TypeScript Interface
```typescript
interface ChatSession {
  id: string;
  userId: string;
  documentIds: string[];
  createdAt: Date;
  lastMessageAt: Date;
  title?: string;
}
```

#### Relationships
- Belongs to User (many-to-one)
- References multiple Documents for context
- Has many ChatMessages in conversation

### ChatMessage
**Purpose:** Individual messages in conversations with source attribution and context tracking

**Key Attributes:**
- id: string (UUID) - Unique message identifier
- sessionId: string - Parent conversation reference
- role: MessageRole - User or assistant message type
- content: string - Message text content
- sources: DocumentSource[] - Referenced documents and locations
- timestamp: Date - Message creation time
- tokenCount: number - Usage tracking for API costs

#### TypeScript Interface
```typescript
interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  sources?: DocumentSource[];
  timestamp: Date;
  tokenCount?: number;
}

enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant'
}

interface DocumentSource {
  documentId: string;
  filename: string;
  relevanceScore: number;
  textSnippet: string;
  pageNumber?: number;
}
```

#### Relationships
- Belongs to ChatSession (many-to-one)
- References Documents via sources array

## API Specification

### REST API Specification
```yaml
openapi: 3.0.0
info:
  title: RAG Document Processing API
  version: 1.0.0
  description: RESTful API for document upload, processing, and conversational interaction
servers:
  - url: https://rag-challenge-api.railway.app
    description: Production API server

paths:
  /api/documents:
    get:
      summary: List user documents
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [uploaded, extracting, embedding, ready, error]
      responses:
        200:
          description: List of documents
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Document'
    post:
      summary: Upload new document
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
      responses:
        201:
          description: Document uploaded successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Document'

  /api/documents/{id}:
    get:
      summary: Get document by ID
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Document details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Document'
    delete:
      summary: Delete document
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        204:
          description: Document deleted

  /api/chat/sessions:
    get:
      summary: List chat sessions
      responses:
        200:
          description: List of sessions
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ChatSession'
    post:
      summary: Create new chat session
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                documentIds:
                  type: array
                  items:
                    type: string
      responses:
        201:
          description: Session created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatSession'

  /api/chat/sessions/{id}/messages:
    get:
      summary: Get session messages
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Message history
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ChatMessage'
    post:
      summary: Send message
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                content:
                  type: string
      responses:
        201:
          description: Message sent and response generated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ChatMessage'

components:
  schemas:
    Document:
      type: object
      properties:
        id:
          type: string
        filename:
          type: string
        contentType:
          type: string
        size:
          type: number
        uploadedAt:
          type: string
          format: date-time
        status:
          type: string
          enum: [uploaded, extracting, embedding, ready, error]
        extractedText:
          type: string
        s3Key:
          type: string
        userId:
          type: string
    
    ChatSession:
      type: object
      properties:
        id:
          type: string
        userId:
          type: string
        documentIds:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        lastMessageAt:
          type: string
          format: date-time
        title:
          type: string
    
    ChatMessage:
      type: object
      properties:
        id:
          type: string
        sessionId:
          type: string
        role:
          type: string
          enum: [user, assistant]
        content:
          type: string
        sources:
          type: array
          items:
            $ref: '#/components/schemas/DocumentSource'
        timestamp:
          type: string
          format: date-time
    
    DocumentSource:
      type: object
      properties:
        documentId:
          type: string
        filename:
          type: string
        relevanceScore:
          type: number
        textSnippet:
          type: string
        pageNumber:
          type: number

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

## Components

### Frontend Document Manager
**Responsibility:** Handles document upload, display, selection, and status tracking in the left panel of the three-panel interface

**Key Interfaces:**
- DocumentUpload: Drag-drop and file browser integration
- DocumentList: Grid/list view with filtering and selection
- ProcessingStatus: Real-time status updates via WebSocket

**Dependencies:** DocumentService (API calls), WebSocketService (status updates), FileValidation utility

**Technology Stack:** React components with Zustand state management, react-dropzone for uploads, WebSocket client for real-time updates

### Frontend Chat Interface  
**Responsibility:** Manages conversational UI including message display, input handling, and source attribution in the center panel

**Key Interfaces:**
- MessageList: Chat bubble display with source links
- MessageInput: Text input with submit handling
- SourceAttribution: Clickable document references

**Dependencies:** ChatService (API calls), DocumentService (source document access), MessageFormatter utility

**Technology Stack:** React components with scroll management, markdown rendering for formatted responses, auto-resize text areas

### Frontend Tools Panel
**Responsibility:** Provides document analytics, export options, and session management in the right panel

**Key Interfaces:**
- DocumentAnalytics: Usage statistics and insights
- ExportOptions: PDF/summary generation
- SessionHistory: Previous conversation access

**Dependencies:** AnalyticsService, ExportService, SessionService

**Technology Stack:** React components with chart libraries for analytics, download utilities for exports

### Backend Document Processor
**Responsibility:** Handles file storage, text extraction, embedding generation, and Pinecone integration

**Key Interfaces:**
- FileUpload: S3 storage with presigned URLs
- TextExtraction: OCR and PDF text parsing
- EmbeddingGeneration: OpenAI API integration
- VectorStorage: Pinecone index management

**Dependencies:** AWS SDK, pdf-parse, Tesseract.js, OpenAI SDK, Pinecone client

**Technology Stack:** Node.js services with Express middleware, async job queues for processing, WebSocket for status updates

### Backend Chat Engine
**Responsibility:** Manages conversation context, retrieval-augmented generation, and response streaming

**Key Interfaces:**
- ContextRetrieval: Pinecone similarity search
- ResponseGeneration: OpenAI chat completion with context
- SourceAttribution: Document reference tracking

**Dependencies:** Pinecone client, OpenAI SDK, ChatSession storage, Document repository

**Technology Stack:** Node.js services with streaming responses, context window management, token counting utilities

### Backend Authentication Service
**Responsibility:** User authentication, session management, and API route protection

**Key Interfaces:**
- UserAuth: JWT token generation and validation
- SessionManagement: Express session handling
- RouteProtection: Middleware for authenticated routes

**Dependencies:** JWT library, Express session, bcrypt for passwords, user database

**Technology Stack:** Express middleware, JWT tokens for stateless auth, Redis for session storage

## External APIs

### OpenAI API
- **Purpose:** Text embedding generation and chat completion for RAG responses
- **Documentation:** https://platform.openai.com/docs/api-reference
- **Base URL(s):** https://api.openai.com/v1
- **Authentication:** Bearer token with API key
- **Rate Limits:** 3,500 RPM for gpt-3.5-turbo, 500 RPM for embeddings

**Key Endpoints Used:**
- `POST /embeddings` - Generate document embeddings for vector storage
- `POST /chat/completions` - Generate contextual responses using retrieved document chunks

**Integration Notes:** Implement retry logic for rate limits, chunk large documents for embedding, stream responses for better UX

### Pinecone API
- **Purpose:** Vector database for semantic document search and retrieval
- **Documentation:** https://docs.pinecone.io/reference
- **Base URL(s):** https://[index]-[project].svc.[environment].pinecone.io
- **Authentication:** API key in headers
- **Rate Limits:** 100 requests/second for query operations

**Key Endpoints Used:**
- `POST /vectors/upsert` - Store document embeddings with metadata
- `POST /query` - Similarity search for relevant document chunks
- `DELETE /vectors/delete` - Remove document vectors when deleted

**Integration Notes:** Use namespaces for multi-tenant isolation, include document metadata for filtering, batch upsert operations for efficiency

### AWS S3 API
- **Purpose:** Scalable file storage for uploaded documents
- **Documentation:** https://docs.aws.amazon.com/s3/
- **Base URL(s):** https://[bucket].s3.[region].amazonaws.com
- **Authentication:** AWS SDK with IAM credentials
- **Rate Limits:** 3,500 PUT/COPY/POST/DELETE, 5,500 GET/HEAD per prefix per second

**Key Endpoints Used:**
- `PUT /[object-key]` - Upload documents via presigned URLs
- `GET /[object-key]` - Download documents for processing
- `DELETE /[object-key]` - Remove files when documents deleted

**Integration Notes:** Use presigned URLs for secure client-side uploads, implement lifecycle policies for cost management, enable versioning for document history

## Core Workflows

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant A as API Server
    participant S3 as AWS S3
    participant O as OpenAI
    participant P as Pinecone
    participant WS as WebSocket

    Note over U,WS: Document Upload & Processing Flow
    
    U->>W: Upload document(s)
    W->>A: POST /api/documents
    A->>S3: Store file with presigned URL
    A->>WS: Broadcast status: uploaded
    WS->>W: Update UI: processing started
    
    A->>A: Extract text (PDF/OCR)
    A->>WS: Broadcast status: extracting
    
    A->>O: Generate embeddings
    A->>WS: Broadcast status: embedding
    
    A->>P: Store vectors with metadata
    A->>WS: Broadcast status: ready
    WS->>W: Update UI: ready for chat
    
    Note over U,WS: Chat Interaction Flow
    
    U->>W: Ask question about documents
    W->>A: POST /api/chat/sessions/{id}/messages
    A->>P: Query similar vectors
    P->>A: Return relevant chunks
    A->>O: Generate response with context
    O->>A: Stream completion
    A->>W: Stream response with sources
    W->>U: Display answer with attribution
```

## Database Schema

```sql
-- Users table for authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table for file metadata and processing status
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'uploaded',
  extracted_text TEXT,
  embedding_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  
  INDEX idx_documents_user_id (user_id),
  INDEX idx_documents_status (status),
  INDEX idx_documents_uploaded_at (uploaded_at)
);

-- Chat sessions for conversation management
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_ids UUID[] DEFAULT '{}',
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_chat_sessions_user_id (user_id),
  INDEX idx_chat_sessions_last_message (last_message_at)
);

-- Chat messages for conversation history
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  token_count INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_chat_messages_session_id (session_id),
  INDEX idx_chat_messages_timestamp (timestamp)
);

-- Update triggers for timestamp management
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Frontend Architecture

### Component Architecture

#### Component Organization
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Shadcn/ui base components
│   ├── documents/       # Document-specific components
│   │   ├── DocumentCard.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── DocumentList.tsx
│   │   └── ProcessingStatus.tsx
│   ├── chat/           # Chat interface components
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── SourceAttribution.tsx
│   │   └── ChatSession.tsx
│   └── layout/         # Layout and navigation
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── ThreePanel.tsx
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── services/           # API client services
├── stores/             # Zustand stores
├── types/              # TypeScript definitions
└── utils/              # Utility functions
```

#### Component Template
```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export const Component = ({ className, children, ...props }: ComponentProps) => {
  return (
    <div className={cn("default-classes", className)} {...props}>
      {children}
    </div>
  );
};

Component.displayName = "Component";
```

### State Management Architecture

#### State Structure
```typescript
// Document store
interface DocumentStore {
  documents: Document[];
  selectedDocuments: string[];
  uploadProgress: Record<string, number>;
  processingStatus: Record<string, ProcessingStatus>;
  
  // Actions
  setDocuments: (documents: Document[]) => void;
  toggleSelection: (id: string) => void;
  updateProcessingStatus: (id: string, status: ProcessingStatus) => void;
}

// Chat store
interface ChatStore {
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  sessions: ChatSession[];
  isLoading: boolean;
  
  // Actions
  setCurrentSession: (session: ChatSession) => void;
  addMessage: (message: ChatMessage) => void;
  sendMessage: (content: string) => Promise<void>;
}

// Auth store
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

#### State Management Patterns
- Separate stores for different domains (documents, chat, auth)
- Async actions handle API calls and optimistic updates
- WebSocket integration updates stores in real-time
- Persist auth state to localStorage
- Clear sensitive data on logout

### Routing Architecture

#### Route Organization
```
/                       # Landing/dashboard
/upload                 # Document upload flow
/documents              # Document management
/chat                   # Chat interface
/chat/:sessionId        # Specific conversation
/settings               # User preferences
/login                  # Authentication
/register               # User registration
```

#### Protected Route Pattern
```typescript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};
```

### Frontend Services Layer

#### API Client Setup
```typescript
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/authStore';

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL,
      timeout: 30000,
    });
    
    // Request interceptor for auth
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }
    );
  }
  
  public get client() {
    return this.client;
  }
}

export const apiClient = new ApiClient().client;
```

#### Service Example
```typescript
import { apiClient } from './apiClient';
import type { Document, DocumentUpload } from '@/types/document';

class DocumentService {
  async getDocuments(): Promise<Document[]> {
    const response = await apiClient.get<Document[]>('/api/documents');
    return response.data;
  }
  
  async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<Document>('/api/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / (progressEvent.total || 1)
        );
        // Update progress in store
        useDocumentStore.getState().updateUploadProgress(file.name, progress);
      },
    });
    
    return response.data;
  }
  
  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete(`/api/documents/${id}`);
  }
}

export const documentService = new DocumentService();
```

## Backend Architecture

### Service Architecture

#### Traditional Server Architecture
Given the choice of Express.js for the backend framework, we'll use a traditional server approach with clear separation of concerns.

##### Controller/Route Organization
```
src/
├── routes/             # Express route handlers
│   ├── auth.ts        # Authentication routes
│   ├── documents.ts   # Document CRUD operations
│   ├── chat.ts        # Chat session and message routes
│   └── index.ts       # Route aggregation
├── controllers/       # Request/response logic
│   ├── AuthController.ts
│   ├── DocumentController.ts
│   └── ChatController.ts
├── services/          # Business logic
│   ├── DocumentService.ts
│   ├── ChatService.ts
│   ├── EmbeddingService.ts
│   └── VectorService.ts
├── repositories/      # Data access layer
│   ├── DocumentRepository.ts
│   ├── UserRepository.ts
│   └── ChatRepository.ts
├── middleware/        # Express middleware
│   ├── auth.ts
│   ├── validation.ts
│   ├── errorHandler.ts
│   └── cors.ts
└── utils/            # Utility functions
    ├── fileProcessing.ts
    ├── textExtraction.ts
    └── validation.ts
```

##### Controller Template
```typescript
import { Request, Response } from 'express';
import { DocumentService } from '../services/DocumentService';
import { asyncHandler } from '../utils/asyncHandler';

export class DocumentController {
  private documentService: DocumentService;
  
  constructor() {
    this.documentService = new DocumentService();
  }
  
  getDocuments = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const documents = await this.documentService.getUserDocuments(userId);
    
    res.json(documents);
  });
  
  uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const document = await this.documentService.processUpload(userId, file);
    
    res.status(201).json(document);
  });
  
  deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    await this.documentService.deleteDocument(id, userId);
    
    res.status(204).send();
  });
}
```

### Database Architecture

#### Schema Design
The PostgreSQL schema is defined above in the Database Schema section, providing ACID compliance for document metadata and chat history.

#### Data Access Layer
```typescript
import { Pool } from 'pg';
import type { Document } from '../types/Document';

export class DocumentRepository {
  constructor(private db: Pool) {}
  
  async findByUserId(userId: string): Promise<Document[]> {
    const query = `
      SELECT * FROM documents 
      WHERE user_id = $1 
      ORDER BY uploaded_at DESC
    `;
    
    const result = await this.db.query(query, [userId]);
    return result.rows;
  }
  
  async create(document: Omit<Document, 'id' | 'uploadedAt'>): Promise<Document> {
    const query = `
      INSERT INTO documents (user_id, filename, content_type, size, s3_key, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      document.userId,
      document.filename,
      document.contentType,
      document.size,
      document.s3Key,
      document.status
    ];
    
    const result = await this.db.query(query, values);
    return result.rows[0];
  }
  
  async updateStatus(id: string, status: string, extractedText?: string): Promise<void> {
    const query = `
      UPDATE documents 
      SET status = $2, extracted_text = $3, processed_at = NOW()
      WHERE id = $1
    `;
    
    await this.db.query(query, [id, status, extractedText]);
  }
  
  async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM documents 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await this.db.query(query, [id, userId]);
    return result.rowCount > 0;
  }
}
```

### Authentication and Authorization

#### Auth Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant DB as Database
    participant R as Redis
    
    C->>A: POST /auth/login
    A->>DB: Verify credentials
    DB->>A: User data
    A->>A: Generate JWT
    A->>R: Store session
    A->>C: JWT + session cookie
    
    C->>A: API request with JWT
    A->>A: Verify JWT
    A->>R: Check session validity
    A->>C: Authorized response
```

#### Middleware/Guards
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userRepo = new UserRepository();
    const user = await userRepo.findById(payload.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = {
      id: user.id,
      email: user.email
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

export const requireAuth = [authenticateToken];
```

## Unified Project Structure

```plaintext
rag-challenge/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── apps/                       # Application packages
│   ├── web/                    # Frontend application
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Page components/routes
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API client services
│   │   │   ├── stores/         # Zustand state management
│   │   │   ├── styles/         # Global styles/themes
│   │   │   └── utils/          # Frontend utilities
│   │   ├── public/             # Static assets
│   │   ├── tests/              # Frontend tests
│   │   ├── vite.config.ts      # Vite configuration
│   │   └── package.json
│   └── api/                    # Backend application
│       ├── src/
│       │   ├── routes/         # Express routes
│       │   ├── controllers/    # Request handlers
│       │   ├── services/       # Business logic
│       │   ├── repositories/   # Data access layer
│       │   ├── middleware/     # Express middleware
│       │   ├── utils/          # Backend utilities
│       │   └── server.ts       # Express server entry
│       ├── tests/              # Backend tests
│       ├── Dockerfile          # Container configuration
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   ├── constants/      # Shared constants
│   │   │   └── utils/          # Shared utilities
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       └── jest/
├── infrastructure/             # Deployment configurations
│   ├── railway.json           # Railway deployment config
│   └── vercel.json            # Vercel deployment config
├── scripts/                    # Build/deploy scripts
│   ├── build.sh
│   └── deploy.sh
├── docs/                       # Documentation
│   ├── prd.md
│   ├── ux-wireframes.md
│   └── architecture.md
├── .env.example                # Environment template
├── package.json                # Root package.json
├── package-lock.json           # npm workspaces lockfile
└── README.md
```

## Development Workflow

### Local Development Setup

#### Prerequisites
```bash
# Install Node.js 20+
node --version  # Should be v20+
npm --version   # Should be 9+

# Install Docker for local services
docker --version

# Install PostgreSQL locally or use Docker
psql --version
```

#### Initial Setup
```bash
# Clone repository
git clone <repository-url>
cd rag-challenge

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys and database credentials

# Setup database
npm run db:setup
npm run db:migrate

# Start local services (Redis, PostgreSQL via Docker)
docker-compose up -d
```

#### Development Commands
```bash
# Start all services in development mode
npm run dev

# Start frontend only (React/Vite)
npm run dev:web

# Start backend only (Node.js/Express)
npm run dev:api

# Run tests
npm test                    # All tests
npm run test:web           # Frontend tests only
npm run test:api           # Backend tests only
npm run test:e2e           # End-to-end tests
```

### Environment Configuration

#### Required Environment Variables
```bash
# Frontend (.env.local)
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=RAG Challenge
VITE_ENVIRONMENT=development

# Backend (.env)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://username:password@localhost:5432/rag_challenge
REDIS_URL=redis://localhost:6379

# API Keys
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=rag-documents
PINECONE_ENVIRONMENT=us-east-1-aws

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET_NAME=rag-challenge-documents
AWS_REGION=us-east-1

# Authentication
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Shared
DATABASE_URL=postgresql://username:password@localhost:5432/rag_challenge
```

## Deployment Architecture

### Deployment Strategy
**Frontend Deployment:**
- **Platform:** Vercel
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/dist`
- **CDN/Edge:** Vercel Edge Network with global distribution

**Backend Deployment:**
- **Platform:** Railway
- **Build Command:** `npm run build:api`
- **Deployment Method:** Git-based continuous deployment with Docker

### CI/CD Pipeline
```yaml
name: Deploy RAG Challenge

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test

  deploy-backend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: railway/deploy@v3
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          service: rag-challenge-api

  deploy-frontend:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: vercel/action@v32
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Environments
| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:5173 | http://localhost:3001 | Local development |
| Staging | https://rag-challenge-staging.vercel.app | https://rag-challenge-api-staging.railway.app | Pre-production testing |
| Production | https://rag-challenge.vercel.app | https://rag-challenge-api.railway.app | Live environment |

## Security and Performance

### Security Requirements
**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;`
- XSS Prevention: React's built-in escaping + DOMPurify for user content
- Secure Storage: JWT in memory only, refresh tokens in httpOnly cookies

**Backend Security:**
- Input Validation: Joi schema validation for all endpoints
- Rate Limiting: 100 requests/minute per IP, 1000 requests/hour per user
- CORS Policy: Whitelist frontend domains only

**Authentication Security:**
- Token Storage: JWT access tokens (15min expiry), refresh tokens (7 days)
- Session Management: Redis-backed sessions with secure flags
- Password Policy: Minimum 8 characters, complexity requirements

### Performance Optimization
**Frontend Performance:**
- Bundle Size Target: <500KB initial bundle, <100KB per route
- Loading Strategy: Route-based code splitting, component lazy loading
- Caching Strategy: SWR for API calls, React Query for complex state

**Backend Performance:**
- Response Time Target: <200ms for API endpoints, <2s for embeddings
- Database Optimization: Indexed queries, connection pooling, read replicas
- Caching Strategy: Redis for sessions, document metadata, query results

## Testing Strategy

### Testing Pyramid
```
      E2E Tests
    /          \
  Integration Tests  
 /                  \
Frontend Unit    Backend Unit
```

### Test Organization

#### Frontend Tests
```
apps/web/tests/
├── unit/                    # Component unit tests
│   ├── components/
│   ├── hooks/
│   └── utils/
├── integration/             # Feature integration tests
│   ├── document-upload.test.ts
│   ├── chat-interaction.test.ts
│   └── user-auth.test.ts
└── __mocks__/              # Test mocks and fixtures
    ├── api-responses.ts
    └── test-data.ts
```

#### Backend Tests
```
apps/api/tests/
├── unit/                    # Service/utility unit tests
│   ├── services/
│   ├── repositories/
│   └── utils/
├── integration/             # API endpoint tests
│   ├── auth.test.ts
│   ├── documents.test.ts
│   └── chat.test.ts
└── fixtures/               # Test data and mocks
    ├── database.ts
    └── external-apis.ts
```

#### E2E Tests
```
tests/e2e/
├── auth/                   # Authentication flows
├── document-workflows/     # Upload, process, delete
├── chat-workflows/         # Conversation flows
└── page-objects/          # Playwright page objects
```

### Test Examples

#### Frontend Component Test
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { mockDocument } from '../__mocks__/test-data';

describe('DocumentCard', () => {
  it('displays document information correctly', () => {
    render(
      <DocumentCard
        document={mockDocument}
        isSelected={false}
        onToggleSelection={jest.fn()}
      />
    );
    
    expect(screen.getByText(mockDocument.filename)).toBeInTheDocument();
    expect(screen.getByText('PDF Document')).toBeInTheDocument();
    expect(screen.getByText('2 pages')).toBeInTheDocument();
  });
  
  it('calls onToggleSelection when clicked', () => {
    const onToggleSelection = jest.fn();
    
    render(
      <DocumentCard
        document={mockDocument}
        isSelected={false}
        onToggleSelection={onToggleSelection}
      />
    );
    
    fireEvent.click(screen.getByRole('checkbox'));
    
    expect(onToggleSelection).toHaveBeenCalledWith(mockDocument.id);
  });
});
```

#### Backend API Test
```typescript
import request from 'supertest';
import { app } from '../src/app';
import { createTestUser, getAuthToken } from './fixtures/auth';

describe('POST /api/documents', () => {
  let authToken: string;
  
  beforeEach(async () => {
    const user = await createTestUser();
    authToken = getAuthToken(user.id);
  });
  
  it('uploads document successfully', async () => {
    const response = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', 'tests/fixtures/sample.pdf')
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.filename).toBe('sample.pdf');
    expect(response.body.status).toBe('uploaded');
  });
  
  it('rejects invalid file types', async () => {
    await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', 'tests/fixtures/malware.exe')
      .expect(400);
  });
});
```

#### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('complete document processing workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Upload document
  await page.goto('/');
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/sample.pdf');
  
  // Wait for processing
  await expect(page.locator('[data-testid="processing-status"]')).toHaveText('Processing...');
  await expect(page.locator('[data-testid="processing-status"]')).toHaveText('Ready', { timeout: 30000 });
  
  // Start chat
  await page.click('[data-testid="document-checkbox"]');
  await page.fill('[data-testid="chat-input"]', 'What is this document about?');
  await page.click('[data-testid="send-button"]');
  
  // Verify response
  await expect(page.locator('[data-testid="chat-message"]:last-child')).toContainText('Based on your document');
  await expect(page.locator('[data-testid="source-attribution"]')).toContainText('sample.pdf');
});
```

## Coding Standards

### Critical Fullstack Rules
- **Type Sharing:** Always define shared types in `packages/shared/types` and import consistently across frontend and backend
- **API Calls:** Never make direct HTTP calls from components - use the service layer with proper error handling
- **Environment Variables:** Access only through config objects, never `process.env` directly in application code
- **Error Handling:** All API routes must use the standard error handler middleware for consistent error responses
- **State Updates:** Never mutate Zustand state directly - use proper action methods for all state changes
- **File Uploads:** Always validate file types and sizes on both frontend and backend
- **Database Queries:** Use parameterized queries exclusively to prevent SQL injection
- **Authentication:** Verify JWT tokens on every protected route, never trust client-side auth state

### Naming Conventions
| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `DocumentCard.tsx` |
| Hooks | camelCase with 'use' | - | `useDocuments.ts` |
| API Routes | - | kebab-case | `/api/chat-sessions` |
| Database Tables | - | snake_case | `chat_messages` |
| Store Actions | camelCase | - | `setDocuments` |
| Service Methods | camelCase | camelCase | `processDocument` |

## Error Handling Strategy

### Error Flow
```mermaid
sequenceDiagram
    participant C as Client
    participant A as API Server
    participant S as Service
    participant E as Error Handler
    
    C->>A: API Request
    A->>S: Process Request
    S->>S: Error Occurs
    S->>E: Throw Structured Error
    E->>E: Format Error Response
    E->>A: Standardized Error
    A->>C: HTTP Error Response
    C->>C: Display User-Friendly Message
```

### Error Response Format
```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling
```typescript
// Error boundary component
export class ErrorBoundary extends Component<PropsWithChildren, ErrorState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): ErrorState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}

// API error handling in services
const handleApiError = (error: AxiosError): never => {
  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    throw new ApiError(apiError.message, apiError.code, apiError.details);
  }
  
  throw new Error('An unexpected error occurred');
};
```

### Backend Error Handling
```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
      timestamp: new Date().toISOString(),
      requestId
    }
  });
};

// Usage in services
export class DocumentService {
  async processDocument(file: Express.Multer.File): Promise<Document> {
    if (!this.isValidFileType(file.mimetype)) {
      throw new AppError(
        'Invalid file type',
        400,
        'INVALID_FILE_TYPE',
        { allowedTypes: ['application/pdf', 'image/png', 'text/csv'] }
      );
    }
    
    try {
      return await this.extractAndStore(file);
    } catch (error) {
      throw new AppError(
        'Failed to process document',
        500,
        'PROCESSING_ERROR',
        { originalError: error.message }
      );
    }
  }
}
```

## Monitoring and Observability

### Monitoring Stack
- **Frontend Monitoring:** Vercel Analytics + Sentry for error tracking
- **Backend Monitoring:** Railway built-in metrics + Winston logging
- **Error Tracking:** Sentry for both frontend and backend error aggregation
- **Performance Monitoring:** Web Vitals (frontend) + response time tracking (backend)

### Key Metrics
**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and unhandled promises
- API response times from client perspective
- User interactions and conversion funnel

**Backend Metrics:**
- Request rate and response times per endpoint
- Error rate and error types
- Database query performance and connection pool usage
- External API response times (OpenAI, Pinecone, S3)
- Memory and CPU usage patterns

---

*This architecture document provides the complete technical foundation for building the RAG Challenge system. All development should follow these specifications to ensure consistency, maintainability, and scalability.*