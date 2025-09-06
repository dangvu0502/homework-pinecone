import OpenAI from 'openai';
import { EmbeddingService } from './EmbeddingService.js';
import { VectorStore } from './VectorStore.js';
import { logger } from '../utils/logger.js';

export interface RetrievedChunk {
  documentId: string;
  filename: string;
  text: string;
  relevanceScore: number;
  chunkIndex: number;
}

export interface StreamMessage {
  type: 'token' | 'source' | 'complete' | 'error';
  content?: string;
  sources?: RetrievedChunk[];
  documentId?: string;
  filename?: string;
  snippet?: string;
  relevanceScore?: number;
  messageId?: string;
  totalTokens?: number;
  message?: string;
  code?: string;
}

export class ChatService {
  private openai?: OpenAI;
  private embeddingService?: EmbeddingService;
  private vectorStore?: VectorStore;
  private enableOpenAI: boolean;
  private enablePinecone: boolean;

  constructor() {
    this.enableOpenAI = process.env.ENABLE_OPENAI === 'true';
    this.enablePinecone = process.env.ENABLE_PINECONE === 'true';

    if (this.enableOpenAI) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is required when ENABLE_OPENAI is true');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.embeddingService = new EmbeddingService();
    }

    if (this.enablePinecone) {
      this.vectorStore = new VectorStore();
    }
  }

  async* generateStreamingResponse(
    query: string, 
    documentIds: string[] = []
  ): AsyncGenerator<StreamMessage, void, unknown> {
    try {
      logger.info('Starting streaming chat response', { 
        query: query.substring(0, 100) + '...', 
        documentCount: documentIds.length,
        enableOpenAI: this.enableOpenAI,
        enablePinecone: this.enablePinecone
      });

      // If both OpenAI and Pinecone are disabled, return mock response
      if (!this.enableOpenAI && !this.enablePinecone) {
        yield* this.generateMockResponse(query);
        return;
      }

      // If OpenAI disabled, use simple fallback
      if (!this.enableOpenAI) {
        yield* this.generateSimpleResponse(query);
        return;
      }

      let relevantChunks: RetrievedChunk[] = [];

      // 1. RAG retrieval (if enabled)
      if (this.enablePinecone && this.embeddingService && this.vectorStore) {
        // Generate embedding for the user query
        const queryEmbedding = await this.embeddingService.generateEmbedding(query);

        // Retrieve relevant chunks from Pinecone
        const filter = documentIds.length > 0 ? { documentId: { $in: documentIds } } : undefined;
        const searchResults = await this.vectorStore.searchSimilar(queryEmbedding, 5, filter);

        relevantChunks = searchResults
          .filter(result => result.score && result.score > 0.7) // Filter by relevance threshold
          .map(result => ({
            documentId: result.metadata?.documentId || '',
            filename: result.metadata?.filename || '',
            text: result.metadata?.text || '',
            relevanceScore: result.score || 0,
            chunkIndex: result.metadata?.chunkIndex || 0
          }));

        logger.info('Retrieved relevant chunks', { 
          chunkCount: relevantChunks.length,
          avgRelevance: relevantChunks.length > 0 ? 
            relevantChunks.reduce((sum, chunk) => sum + chunk.relevanceScore, 0) / relevantChunks.length : 0
        });
      }

      // 2. Send source information first
      if (relevantChunks.length > 0) {
        yield {
          type: 'source',
          sources: relevantChunks
        };
      }

      // 3. Build context prompt with retrieved content
      const contextPrompt = this.buildRAGPrompt(query, relevantChunks);

      // 4. Stream OpenAI completion
      const stream = await this.openai!.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: contextPrompt,
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      });

      let totalTokens = 0;
      let fullResponse = '';

      // 6. Stream tokens to client
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          fullResponse += delta.content;
          totalTokens++;
          
          yield {
            type: 'token',
            content: delta.content
          };
        }
      }

      // 7. Send completion message
      yield {
        type: 'complete',
        totalTokens,
        messageId: `msg-${Date.now()}`
      };

      logger.info('Streaming chat completed', {
        totalTokens,
        responseLength: fullResponse.length,
        sourceCount: relevantChunks.length
      });

    } catch (error: any) {
      logger.error('Streaming chat error', {
        error: error.message,
        query: query.substring(0, 100)
      });

      yield {
        type: 'error',
        message: error.message || 'An error occurred during chat processing',
        code: 'CHAT_ERROR'
      };
    }
  }

  private buildRAGPrompt(query: string, chunks: RetrievedChunk[]): any[] {
    if (chunks.length === 0) {
      // No context available - general response
      return [
        {
          role: 'system',
          content: `You are a helpful assistant. The user has asked a question but no relevant document context was found. Let them know that you don't have specific information from their documents to answer this question, but offer general help if appropriate.`
        },
        {
          role: 'user',
          content: query
        }
      ];
    }

    // Build context from retrieved chunks
    const context = chunks
      .map((chunk, index) => 
        `[Source ${index + 1}: ${chunk.filename}]\n${chunk.text.trim()}`
      )
      .join('\n\n');

    return [
      {
        role: 'system',
        content: `You are a helpful assistant that answers questions based on provided document context. 

Instructions:
- Answer the user's question using ONLY the information provided in the context below
- If the answer isn't in the provided context, clearly state that you don't have that information in the documents
- When referencing information, mention which source document it came from
- Be concise but comprehensive
- If multiple sources contain relevant information, synthesize them in your response`
      },
      {
        role: 'user',
        content: `Context from documents:\n${context}\n\nQuestion: ${query}`
      }
    ];
  }

  // Simple chat without RAG (fallback)
  async* generateSimpleResponse(query: string): AsyncGenerator<StreamMessage, void, unknown> {
    try {
      if (!this.enableOpenAI || !this.openai) {
        yield* this.generateMockResponse(query);
        return;
      }

      const stream = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: query }
        ],
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          yield {
            type: 'token',
            content: delta.content
          };
        }
      }

      yield {
        type: 'complete',
        messageId: `msg-${Date.now()}`
      };

    } catch (error: any) {
      yield {
        type: 'error',
        message: error.message,
        code: 'SIMPLE_CHAT_ERROR'
      };
    }
  }

  // Mock response for MVP testing
  async* generateMockResponse(query: string): AsyncGenerator<StreamMessage, void, unknown> {
    try {
      const mockResponse = `This is a mock response for your query: "${query}". The system is currently running in mock mode with USE_MOCK_DATA=true. OpenAI and Pinecone services are disabled for this MVP demonstration.`;
      
      // Simulate streaming by yielding chunks
      const words = mockResponse.split(' ');
      for (const word of words) {
        yield {
          type: 'token',
          content: word + ' '
        };
        // Small delay to simulate real streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      yield {
        type: 'complete',
        messageId: `mock-msg-${Date.now()}`
      };

    } catch (error: any) {
      yield {
        type: 'error',
        message: error.message,
        code: 'MOCK_CHAT_ERROR'
      };
    }
  }
}