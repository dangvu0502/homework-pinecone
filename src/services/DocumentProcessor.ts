import path from 'path';
import { db } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { TextExtractor } from './TextExtractor.js';
import { EmbeddingService } from './EmbeddingService.js';
import { VectorStore, type PineconeVector } from './VectorStore.js';
import type { DBDocument } from '../types/index.js';

export class DocumentProcessor {
  private textExtractor: TextExtractor;
  private embeddingService: EmbeddingService;
  private vectorStore: VectorStore;

  constructor() {
    this.textExtractor = new TextExtractor();
    this.embeddingService = new EmbeddingService();
    this.vectorStore = new VectorStore();
  }

  async processDocument(documentId: string): Promise<void> {
    try {
      logger.info('Starting document processing', { documentId });

      // Get document from database
      const document = await this.getDocument(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Update status to processing
      await this.updateDocumentStatus(documentId, 'processing');

      // Extract text from the uploaded file
      const filePath = path.join('./uploads', document.file_path);
      const extractedText = await this.textExtractor.extractText(filePath, document.content_type);

      if (!extractedText.trim()) {
        throw new Error('No text extracted from document');
      }

      // Update database with extracted text
      await this.updateDocumentText(documentId, extractedText);

      // Chunk the text for processing
      const chunks = this.textExtractor.chunkText(extractedText, 800); // Smaller chunks for MVP
      logger.info('Document chunked', { documentId, chunkCount: chunks.length });

      // Generate embeddings for each chunk
      const embeddings = await this.embeddingService.generateEmbeddings(chunks);

      if (embeddings.length !== chunks.length) {
        throw new Error('Mismatch between chunks and embeddings count');
      }

      // Create Pinecone vectors
      const vectors: PineconeVector[] = chunks.map((chunk, index) => {
        const embedding = embeddings[index];
        if (!embedding || embedding.length === 0) {
          throw new Error(`Invalid embedding for chunk ${index}`);
        }

        return {
          id: `${documentId}-chunk-${index}`,
          values: embedding,
          metadata: {
            documentId,
            filename: document.filename,
            chunkIndex: index,
            totalChunks: chunks.length,
            text: chunk,
            contentType: document.content_type
          }
        };
      });

      // Store vectors in Pinecone
      await this.vectorStore.upsertVectors(vectors);

      // Update document status to processed
      await this.updateDocumentStatus(documentId, 'processed');
      await this.markDocumentProcessed(documentId);

      logger.info('Document processing completed successfully', {
        documentId,
        chunkCount: chunks.length,
        textLength: extractedText.length
      });

    } catch (error: any) {
      logger.error('Document processing failed', {
        documentId,
        error: error.message,
        stack: error.stack
      });

      // Update document status to error
      await this.updateDocumentStatus(documentId, 'error');
      throw error;
    }
  }

  private async getDocument(documentId: string): Promise<DBDocument | null> {
    return await db('documents')
      .select(['id', 'filename', 'content_type', 'size', 'file_path', 'status', 'uploaded_at'])
      .where({ id: documentId })
      .first() || null;
  }

  private async updateDocumentStatus(documentId: string, status: string): Promise<void> {
    await db('documents')
      .where({ id: documentId })
      .update({ status });
    
    logger.info('Document status updated', { documentId, status });
  }

  private async updateDocumentText(documentId: string, extractedText: string): Promise<void> {
    await db('documents')
      .where({ id: documentId })
      .update({ extracted_text: extractedText });
  }

  private async markDocumentProcessed(documentId: string): Promise<void> {
    await db('documents')
      .where({ id: documentId })
      .update({ processed_at: new Date() });
  }

  // Simplified processing trigger for MVP (direct call instead of queue)
  static async triggerProcessing(documentId: string): Promise<void> {
    const processor = new DocumentProcessor();
    
    // Run in background (fire and forget for MVP)
    setImmediate(async () => {
      try {
        await processor.processDocument(documentId);
      } catch (error) {
        logger.error('Background processing failed', { documentId, error });
      }
    });
  }
}