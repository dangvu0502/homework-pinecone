# BE Story 02: Document Processing with Real Pinecone Integration

## Story Title
Document Text Extraction and Pinecone Vector Storage - Core RAG Functionality

## User Story
As a system,
I want to extract text from uploaded documents and store embeddings in Pinecone,
So that documents become searchable for RAG-based conversations.

## Story Context
**Existing System Integration:**
- Integrates with: Document upload API from BE Story 01
- Technology: Node.js, OpenAI API, Pinecone SDK, pdf-parse, tesseract.js
- Follows pattern: Async processing with status updates
- Touch points: Updates document status, stores vector embeddings

## Acceptance Criteria

**Functional Requirements:**
1. Text extraction from PDF files using pdf-parse library
2. OCR processing for image files (PNG, JPEG, SVG) using tesseract.js
3. Direct text reading for CSV/TXT files
4. OpenAI embedding generation for extracted text
5. Real Pinecone vector storage with document metadata

**Integration Requirements:**
6. Async processing pipeline triggered after file upload
7. Document status updates (extracting → embedding → ready)
8. Chunking strategy for large documents (max 8000 tokens per chunk)
9. Error handling with status updates to 'error' state

**Quality Requirements:**
10. Processing pipeline tested with sample documents
11. Proper error handling and retry logic for API calls
12. Rate limiting compliance for OpenAI and Pinecone APIs
13. Logging for processing status and errors

## Technical Notes
- **Integration Approach:** Queue-based processing with Bull/Agenda for job management
- **Existing Pattern Reference:** Async worker pattern with status tracking
- **Key Constraints:** Must handle OpenAI rate limits and Pinecone indexing delays

## Implementation Details
```typescript
// Key components to create:
- services/DocumentProcessor.ts (main processing logic)
- services/TextExtractor.ts (PDF/OCR/text extraction)
- services/EmbeddingService.ts (OpenAI integration)
- services/VectorStore.ts (Pinecone integration)
- jobs/processDocument.ts (async job handler)
```

## Pinecone Setup
```typescript
// Pinecone index configuration
{
  dimension: 1536, // OpenAI text-embedding-3-small
  metric: 'cosine',
  pods: 1,
  replicas: 1,
  podType: 'p1.x1'
}

// Vector metadata structure
{
  documentId: string;
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  text: string; // original text chunk
  contentType: string;
}
```

## Processing Pipeline
```typescript
// Processing flow
1. Document uploaded → status: 'uploaded'
2. Extract text → status: 'extracting'
3. Generate embeddings → status: 'embedding'
4. Store in Pinecone → status: 'ready'
5. Error handling → status: 'error'
```

## Environment Variables Required
```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=rag-documents
PINECONE_ENVIRONMENT=us-east-1-aws
```

## Error Handling Strategy
```typescript
// Retry configuration
{
  textExtraction: 3 retries,
  embeddingGeneration: 5 retries with exponential backoff,
  pineconeUpsert: 3 retries,
  maxProcessingTime: 5 minutes
}
```

## Definition of Done
- [ ] Text extraction working for all supported file types
- [ ] OpenAI embedding generation implemented
- [ ] Real Pinecone integration operational
- [ ] Document chunking strategy implemented
- [ ] Status tracking and updates functional
- [ ] Error handling and retry logic working
- [ ] Processing tests with real documents
- [ ] Rate limiting and API compliance verified

## Time Estimate: 6-8 hours