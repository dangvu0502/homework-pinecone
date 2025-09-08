import { Pinecone, type RecordMetadata } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger.ts';

// Types and Interfaces
export interface DocumentMetadata {
  documentId: string;
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  text: string;
  contentType: string;
  wordCount?: number;
  [key: string]: string | number | undefined; // Allow additional properties with specific types
}

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: DocumentMetadata;
}

export interface SearchResult {
  documentId: string;
  filename: string;
  text: string;
  relevanceScore: number;
  chunkIndex: number;
}


// Singleton Pinecone client
let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is required');
    }
    
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    logger.info('Pinecone client initialized');
  }
  
  return pineconeClient;
}

// Main PineconeDB class
export class PineconeDB {
  private client: Pinecone;
  private indexName: string;
  private embeddingModel: string;
  private embeddingDimension: number;
  
  constructor() {
    this.client = getPineconeClient();
    this.indexName = process.env.PINECONE_INDEX_NAME || 'rag-challenge-ai';
    this.embeddingModel = process.env.PINECONE_EMBEDDING_MODEL || 'multilingual-e5-large';
    this.embeddingDimension = parseInt(process.env.PINECONE_EMBEDDING_DIMENSION || '1024');
    
    logger.info('PineconeDB initialized', { 
      indexName: this.indexName,
      embeddingModel: this.embeddingModel,
      embeddingDimension: this.embeddingDimension
    });
  }
  
  /**
   * Upload document chunks with metadata - for integrated inference indexes, use direct record format
   */
  async upsertDocumentChunks(chunks: DocumentChunk[], documentId: string, namespace?: string): Promise<void> {
    try {
      logger.info('Processing document chunks for integrated inference index', {
        documentId,
        chunkCount: chunks.length,
        namespace
      });
      
      // For integrated inference indexes, create records with _id field
      const records = chunks.map(chunk => {
        // Create clean metadata without text field
        const { text: _text, ...cleanMetadata } = chunk.metadata;
        
        // Ensure all metadata values are strings or numbers
        const sanitizedMetadata: Record<string, string | number> = {};
        Object.entries(cleanMetadata).forEach(([key, value]) => {
          if (value !== undefined) {
            sanitizedMetadata[key] = typeof value === 'string' || typeof value === 'number' ? value : String(value);
          }
        });
        
        return {
          id: chunk.id, // Use id for upsertRecords method
          text: chunk.text, // This field will be auto-embedded by Pinecone
          ...sanitizedMetadata
        };
      });
      
      logger.info('Upserting document chunks', {
        documentId,
        chunkCount: chunks.length,
        namespace,
        sampleRecord: records[0] ? { id: records[0].id, textLength: records[0].text.length } : null
      });
      
      // Use upsertRecords for integrated inference indexes
      const index = this.client.index(this.indexName);
      const namespaceObj = index.namespace(namespace || 'default');
      await namespaceObj.upsertRecords(records);
      
      logger.info('Document chunks upserted successfully', { documentId, recordCount: records.length });
    } catch (error) {
      logger.error('Failed to upsert document chunks', { documentId, error });
      throw error;
    }
  }
  
  /**
   * Generate embedding using Pinecone's inference
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingResponse = await this.client.inference.embed(
        this.embeddingModel,
        [text],
        { inputType: 'query' }
      );
      
      const embedding = embeddingResponse.data?.[0];
      if (!embedding || !('values' in embedding)) {
        throw new Error('Failed to generate embedding');
      }
      
      return embedding.values;
    } catch (error) {
      logger.error('Embedding generation failed', { error });
      throw error;
    }
  }
  
  /**
   * Search using text query for integrated inference index
   */
  async searchSimilarWithText(
    queryText: string,
    topK: number = 5,
    filter?: Record<string, unknown>,
    namespace?: string
  ): Promise<SearchResult[]> {
    try {
      logger.info('Performing integrated inference text search', { 
        queryText: queryText.substring(0, 100), 
        topK, 
        filter, 
        namespace 
      });

      // First, generate embedding using Pinecone's inference
      const embedding = await this.generateEmbedding(queryText);
      
      // Then search using the embedding
      return await this.searchSimilar(embedding, topK, filter, namespace);
    } catch (error) {
      logger.error('Integrated text search failed', { error, queryText });
      throw error;
    }
  }
  
  /**
   * Search using pre-computed embedding
   */
  async searchSimilar(
    queryEmbedding: number[],
    topK: number = 5,
    filter?: Record<string, unknown>,
    namespace?: string
  ): Promise<SearchResult[]> {
    try {
      const index = this.client.index(this.indexName);
      
      const searchResponse = await index.namespace(namespace || 'default').query({
        vector: queryEmbedding,
        topK,
        filter,
        includeMetadata: true
      });
      
      return this.formatSearchResults(searchResponse.matches || []);
    } catch (error) {
      logger.error('Embedding search failed', { error });
      throw error;
    }
  }
  
  /**
   * Delete all chunks for a document
   */
  async deleteDocumentChunks(documentId: string, namespace?: string): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      
      logger.info('Deleting document chunks', { documentId, namespace });
      
      // Delete by filter to remove all chunks with the given documentId
      await index.namespace(namespace || '').deleteMany({
        documentId: { $eq: documentId }
      });
      
      logger.info('Document chunks deleted successfully', { documentId });
    } catch (error) {
      logger.error('Failed to delete document chunks', { documentId, error });
      throw error;
    }
  }

  private formatSearchResults(matches: Array<{ metadata?: Record<string, unknown>; score?: number }>): SearchResult[] {
    return matches.map(match => {
      const metadata = match.metadata;
      // Text is now stored directly in metadata
      const textValue = metadata?.text || '';
      return {
        documentId: String(metadata?.documentId || ''),
        filename: String(metadata?.filename || ''),
        text: typeof textValue === 'string' ? textValue : String(textValue),
        relevanceScore: match.score || 0,
        chunkIndex: Number(metadata?.chunkIndex || 0)
      };
    });
  }

}

// Export singleton instance
export const pineconeDB = new PineconeDB();