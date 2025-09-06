# RAG Challenge - 1-Day Sprint Stories

## Overview
This directory contains user stories organized for maximum parallel development during a 1-day sprint. Stories are designed to be worked on simultaneously by frontend and backend teams.

## Story Organization

### Frontend Stories (`/frontend`)
Focus on React + TypeScript + Vite implementation with real-time features.

1. **FE-01: Document Upload Interface** (4-6 hours)
   - Drag-and-drop file uploads
   - File validation and progress tracking
   - Integration with backend upload API

2. **FE-02: Real-time Streaming Chat Interface** (6-8 hours)
   - Server-Sent Events streaming chat
   - Message bubbles with source attribution
   - Document context selection

3. **FE-03: Three-Panel Layout Integration** (4-6 hours)
   - Responsive three-panel design
   - State synchronization between panels
   - Mobile-friendly interface

### Backend Stories (`/backend`)
Focus on Node.js + Express + Real Pinecone + PostgreSQL implementation.

1. **BE-01: Document Upload API with S3 Storage** (4-6 hours)
   - File upload endpoints with S3 integration
   - Database metadata storage
   - File validation and error handling

2. **BE-02: Document Processing with Real Pinecone** (6-8 hours)
   - Text extraction (PDF, OCR, CSV/TXT)
   - OpenAI embedding generation
   - **Real Pinecone vector storage**

3. **BE-03: Streaming Chat API with Real Pinecone RAG** (8-10 hours)
   - **Real Pinecone similarity search**
   - **Streaming OpenAI chat responses**
   - Source attribution and context management

4. **BE-04: Core API Foundation** (3-4 hours)
   - Express server setup with PostgreSQL
   - Authentication middleware
   - Database schema and migrations

## Parallel Development Strategy

### Phase 1: Foundation (First 2-3 hours)
**Backend Team:**
- Start with BE-04 (API Foundation) - sets up database and server
- Move to BE-01 (Upload API) - provides endpoints for frontend

**Frontend Team:**
- Start with FE-01 (Upload Interface) - core file upload functionality
- Mock backend responses initially, integrate when BE-01 is ready

### Phase 2: Core Features (Next 4-6 hours)
**Backend Team:**
- BE-02 (Pinecone Processing) - **Real vector embeddings**
- BE-03 (Streaming Chat) - **Real RAG with streaming**

**Frontend Team:**
- FE-02 (Streaming Chat) - Real-time chat interface
- FE-03 (Layout Integration) - Bring everything together

### Phase 3: Integration (Final 2-3 hours)
**Both Teams:**
- End-to-end testing with real Pinecone
- Bug fixes and polish
- Deployment preparation

## Critical Requirements Met

✅ **Real Pinecone Integration:**
- BE-02: Real Pinecone vector storage with OpenAI embeddings
- BE-03: Real Pinecone similarity search for RAG

✅ **Streaming Chat:**
- BE-03: Server-Sent Events streaming from OpenAI
- FE-02: Real-time token-by-token display

✅ **Separate Files:**
- All stories in separate markdown files
- Clear folder organization (frontend/backend)

✅ **Parallel Development:**
- Independent frontend/backend work streams
- Clear API contracts for integration
- Mock-first approach for frontend development

## Environment Setup Required

### Backend (.env)
```bash
# OpenAI
OPENAI_API_KEY=sk-your-key

# Pinecone (REAL)
PINECONE_API_KEY=your-pinecone-key
PINECONE_INDEX_NAME=rag-documents
PINECONE_ENVIRONMENT=us-east-1-aws

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=rag-documents
AWS_REGION=us-east-1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/rag_challenge
```

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:3001
```

## Success Criteria
By end of day, you should have:
1. Working document upload with S3 storage
2. **Real Pinecone vector storage** of document embeddings  
3. **Real streaming chat** with Pinecone RAG retrieval
4. Three-panel responsive UI
5. Source attribution showing which documents informed answers
6. End-to-end document → embedding → chat flow working

## Time Estimates
- **Frontend Total:** 14-20 hours (can be parallelized across 2-3 developers)
- **Backend Total:** 21-28 hours (can be parallelized across 2-3 developers)
- **Integration/Testing:** 2-4 hours

With proper parallel development, this is achievable in a focused 1-day sprint with a small team.