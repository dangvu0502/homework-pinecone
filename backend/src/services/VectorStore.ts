import { Pinecone, type PineconeRecord, type RecordMetadata } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger.ts';

export interface VectorMetadata extends RecordMetadata {
  documentId: string;
  filename: string;
  chunkIndex: number;
  totalChunks: number;
  text: string;
  contentType: string;
}

export interface PineconeVector extends PineconeRecord<VectorMetadata> {
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

    } catch (error: unknown) {
      logger.error('Pinecone upsert failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        vectorCount: vectors.length
      });
      throw new Error(`Vector upsert failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchSimilar(
    queryEmbedding: number[], 
    topK: number = 5,
    filter?: Record<string, unknown>
  ): Promise<unknown[]> {
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

    } catch (error: unknown) {
      logger.error('Pinecone search failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    } catch (error: unknown) {
      logger.error('Pinecone delete failed', {
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Vector deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    } catch (error: unknown) {
      logger.error('Pinecone connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}