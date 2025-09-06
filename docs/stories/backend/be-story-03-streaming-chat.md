# BE Story 03: Streaming Chat API with Real Pinecone RAG

## Story Title
Streaming Chat API with Pinecone Retrieval and OpenAI Integration

## User Story
As a system,
I want to provide streaming chat responses using document context from Pinecone,
So that users get real-time answers based on their uploaded documents.

## Story Context
**Existing System Integration:**
- Integrates with: Document processing from BE Story 02 (Pinecone vectors)
- Technology: Node.js, Express, OpenAI Streaming API, Pinecone query
- Follows pattern: Server-Sent Events with RAG pipeline
- Touch points: Real-time frontend updates with document context

## Acceptance Criteria

**Functional Requirements:**
1. POST /api/chat/sessions/{id}/stream endpoint with SSE response
2. Pinecone similarity search to find relevant document chunks
3. OpenAI streaming chat completion with retrieved context
4. Real-time token streaming to frontend clients
5. Source attribution with document references in responses

**Integration Requirements:**
6. Chat session management with message persistence
7. Document context filtering based on user selection
8. Streaming response handling with proper SSE formatting
9. Context window management for long conversations

**Quality Requirements:**
10. Stream error handling and graceful fallbacks
11. Rate limiting and concurrent user support
12. Proper memory management for streaming responses
13. Logging for chat interactions and retrieval performance

## Technical Notes
- **Integration Approach:** SSE streaming with async generators
- **Existing Pattern Reference:** OpenAI streaming patterns with RAG context
- **Key Constraints:** Must maintain context window limits and handle stream interruptions

## Implementation Details
```typescript
// Key components to create:
- routes/chat.ts (streaming chat routes)
- controllers/ChatController.ts (stream handling)
- services/ChatService.ts (RAG orchestration)
- services/RetrievalService.ts (Pinecone queries)
- utils/streamUtils.ts (SSE utilities)
```

## RAG Pipeline Implementation
```typescript
// Core RAG flow
async function* generateStreamingResponse(query: string, documentIds: string[]) {
  // 1. Retrieve relevant chunks from Pinecone
  const relevantChunks = await retrievalService.searchSimilar(query, documentIds);
  
  // 2. Build context prompt with retrieved content
  const contextPrompt = buildRAGPrompt(query, relevantChunks);
  
  // 3. Stream OpenAI completion
  const stream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: contextPrompt,
    stream: true,
  });
  
  // 4. Yield tokens and source information
  for await (const chunk of stream) {
    yield { type: 'token', content: chunk.choices[0]?.delta?.content };
  }
  
  yield { type: 'sources', sources: relevantChunks };
}
```

## Database Schema Addition
```sql
-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  document_ids UUID[] DEFAULT '{}'
);

-- Chat messages table  
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Streaming Response Format
```typescript
// SSE message types
{
  type: 'token',
  content: string
}

{
  type: 'source',
  documentId: string,
  filename: string,
  snippet: string,
  relevanceScore: number
}

{
  type: 'complete',
  messageId: string,
  totalTokens: number
}

{
  type: 'error',
  message: string,
  code: string
}
```

## Pinecone Query Strategy
```typescript
// Retrieval configuration
{
  topK: 5, // Number of chunks to retrieve
  threshold: 0.7, // Minimum similarity score
  includeMetadata: true,
  filter: {
    documentId: { $in: selectedDocumentIds }
  }
}

// Context building
function buildRAGPrompt(query: string, chunks: RetrievedChunk[]) {
  const context = chunks.map(chunk => 
    `Source: ${chunk.filename}\n${chunk.text}`
  ).join('\n\n');
  
  return [
    {
      role: 'system',
      content: `Answer questions based on the provided context. If information isn't in the context, say so clearly.`
    },
    {
      role: 'user', 
      content: `Context:\n${context}\n\nQuestion: ${query}`
    }
  ];
}
```

## Environment Variables
```bash
# OpenAI configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# Pinecone configuration  
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=rag-documents
PINECONE_ENVIRONMENT=us-east-1-aws

# Chat configuration
MAX_CONTEXT_TOKENS=4000
MAX_RESPONSE_TOKENS=1000
SIMILARITY_THRESHOLD=0.7
```

## Definition of Done
- [ ] Streaming chat endpoint implemented with SSE
- [ ] Pinecone similarity search integration working
- [ ] OpenAI streaming responses functional  
- [ ] Source attribution in chat responses
- [ ] Chat session and message persistence
- [ ] Stream error handling and recovery
- [ ] Rate limiting for chat endpoints
- [ ] Real-time testing with frontend integration

## Time Estimate: 8-10 hours