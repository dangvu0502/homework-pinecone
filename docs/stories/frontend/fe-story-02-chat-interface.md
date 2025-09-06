# FE Story 02: Real-time Streaming Chat Interface

## Story Title
Streaming Chat Interface with Document Context - Frontend Chat Experience

## User Story
As a user,
I want to have conversations about my uploaded documents with streaming responses,
So that I can quickly get insights from my documents in a natural chat format.

## Story Context
**Existing System Integration:**
- Integrates with: Document upload interface from FE Story 01
- Technology: React 18, TypeScript, Server-Sent Events or WebSocket
- Follows pattern: Real-time UI updates with streaming text
- Touch points: Chat API with streaming responses (developed in parallel)

## Acceptance Criteria

**Functional Requirements:**
1. Chat interface with message bubbles (user and assistant)
2. Text input with send button and Enter key support
3. Real-time streaming of assistant responses (token by token)
4. Document context selection (which documents to include)
5. Source attribution showing which documents informed the answer

**Integration Requirements:**
6. Connects to streaming chat API endpoint
7. Handles Server-Sent Events or WebSocket connections
8. Manages chat session state and message history
9. Document selection state synchronized with chat context

**Quality Requirements:**
10. Smooth streaming animation without UI flickering
11. Proper loading states during response generation
12. Error handling for network issues or API failures
13. Auto-scroll to latest messages with user control

## Technical Notes
- **Integration Approach:** SSE or WebSocket for real-time streaming
- **Existing Pattern Reference:** Modern chat UI patterns with streaming text
- **Key Constraints:** Must handle stream interruptions gracefully

## Implementation Details
```typescript
// Key components to create:
- ChatInterface.tsx (main chat container)
- MessageBubble.tsx (individual message display)
- StreamingMessage.tsx (real-time text streaming)
- DocumentSelector.tsx (context selection)
- useChatStream.ts (streaming hook)
```

## Streaming Implementation
```typescript
// SSE streaming example
const useChatStream = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const sendMessage = async (content: string) => {
    const eventSource = new EventSource(
      `/api/chat/sessions/${sessionId}/stream`,
      { 
        method: 'POST',
        body: JSON.stringify({ content })
      }
    );
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle streaming token updates
    };
  };
};
```

## Chat State Management
```typescript
interface ChatState {
  currentSession: string | null;
  messages: Message[];
  selectedDocuments: string[];
  isStreaming: boolean;
  streamingMessage: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentSource[];
  timestamp: Date;
}
```

## API Contract (for parallel backend development)
```typescript
POST /api/chat/sessions/{id}/stream
Content-Type: application/json

Request:
{
  content: string;
  documentIds?: string[];
}

Response: Server-Sent Events
data: {"type":"token","content":"Hello"}
data: {"type":"source","documentId":"123","snippet":"..."}
data: {"type":"complete","messageId":"456"}
```

## Definition of Done
- [ ] Chat interface with message bubbles implemented
- [ ] Real-time streaming response display working
- [ ] Document context selection functional
- [ ] Source attribution showing document references
- [ ] Message history persistence working
- [ ] Error handling for stream failures
- [ ] Auto-scroll with user override
- [ ] Mobile-responsive chat design

## Time Estimate: 6-8 hours