import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger.js';

export interface VectorMetadata {
  documentId: string;
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  text: string;
  contentType: string;
  [key: string]: any; // Index signature for Pinecone compatibility
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

export class VectorStore {
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is required when initializing VectorStore');
    }

    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('PINECONE_INDEX_NAME is required when initializing VectorStore');
    }

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    this.indexName = process.env.PINECONE_INDEX_NAME;
  }

  async upsertVectors(vectors: PineconeVector[]): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      logger.info('Upserting vectors to Pinecone', {
        indexName: this.indexName,
        vectorCount: vectors.length
      });

      await index.upsert(vectors);

      logger.info('Vectors upserted successfully', {
        vectorCount: vectors.length
      });

    } catch (error: any) {
      logger.error('Pinecone upsert failed', {
        error: error.message,
        vectorCount: vectors.length
      });
      throw new Error(`Vector upsert failed: ${error.message}`);
    }
  }

  async searchSimilar(
    queryEmbedding: number[], 
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<any[]> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      logger.info('Searching similar vectors', {
        topK,
        filter,
        embeddingDimension: queryEmbedding.length
      });

      const searchResponse = await index.query({
        vector: queryEmbedding,
        topK,
        filter,
        includeMetadata: true
      });

      logger.info('Similar vectors found', {
        resultCount: searchResponse.matches?.length || 0
      });

      return searchResponse.matches || [];

    } catch (error: any) {
      logger.error('Pinecone search failed', {
        error: error.message
      });
      throw new Error(`Vector search failed: ${error.message}`);
    }
  }

  async deleteVectorsByDocument(documentId: string): Promise<void> {
    try {
      const index = this.pinecone.index(this.indexName);
      
      logger.info('Deleting vectors for document', { documentId });

      await index.deleteMany({
        filter: { documentId }
      });

      logger.info('Document vectors deleted successfully', { documentId });

    } catch (error: any) {
      logger.error('Pinecone delete failed', {
        documentId,
        error: error.message
      });
      throw new Error(`Vector deletion failed: ${error.message}`);
    }
  }

  // Test Pinecone connection
  async testConnection(): Promise<boolean> {
    try {
      const indexStats = await this.pinecone.index(this.indexName).describeIndexStats();
      
      logger.info('Pinecone connection successful', {
        indexName: this.indexName,
        totalVectorCount: indexStats.totalRecordCount
      });

      return true;

    } catch (error: any) {
      logger.error('Pinecone connection failed', {
        error: error.message
      });
      return false;
    }
  }
}