import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import DocumentModel from '../models/Document.ts';
import fileStorageService from '../services/FileStorageService.ts';
import { pineconeDB } from '../services/PineconeService.ts';
import { OpenAIService } from '../services/OpenAI.ts';
import { logger } from '../utils/logger.ts';
import { notificationService } from '../services/NotificationService.ts';

export class DocumentController {
  constructor() {
    // Bind all methods to this instance
    this.upload = this.upload.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.getStatus = this.getStatus.bind(this);
    this.delete = this.delete.bind(this);
    this.searchDocument = this.searchDocument.bind(this);
    this.processDocument = this.processDocument.bind(this);
    this.getSummary = this.getSummary.bind(this);
    this.getChunks = this.getChunks.bind(this);
  }

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: {
            code: 'NO_FILE',
            message: 'No file provided'
          }
        });
        return;
      }

      const { filePath } = await fileStorageService.saveFile(req.file);

      const document = await DocumentModel.create({
        filename: req.file.originalname,
        content_type: req.file.mimetype,
        size: req.file.size,
        file_path: filePath
      });

      // Process document with new architecture (don't await to make it async)
      this.processDocument(document.id.toString(), filePath, req.file).catch(error => {
        logger.error('Failed to process document', { documentId: document.id, error });
      });
      
      // Update status to processing
      await DocumentModel.update(document.id, { status: 'processing' });
      document.status = 'processing';

      res.status(201).json({
        id: document.id,
        filename: document.filename,
        contentType: document.content_type,
        size: document.size,
        status: document.status,
        uploadedAt: document.uploaded_at,
        filePath: document.file_path
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documents = await DocumentModel.findAll();
      
      res.json(documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        contentType: doc.content_type,
        size: doc.size,
        status: doc.status,
        uploadedAt: doc.uploaded_at,
        filePath: doc.file_path,
        metadata: {
          totalChunks: doc.chunk_count || 0,
          hasSummary: !!doc.summary,
          summaryGeneratedAt: doc.summary_generated_at,
          processedAt: doc.processed_at
        }
      })));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await DocumentModel.findById(id);

      if (!document) {
        res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found'
          }
        });
        return;
      }

      res.json({
        id: document.id,
        filename: document.filename,
        contentType: document.content_type,
        size: document.size,
        status: document.status,
        uploadedAt: document.uploaded_at,
        filePath: document.file_path,
        metadata: {
          totalChunks: document.chunk_count || 0,
          hasSummary: !!document.summary,
          summary: document.summary,
          summaryGeneratedAt: document.summary_generated_at,
          processedAt: document.processed_at
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await DocumentModel.findById(id);

      if (!document) {
        res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found'
          }
        });
        return;
      }

      res.json({
        id: document.id,
        status: document.status,
        filename: document.filename
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const document = await DocumentModel.findById(id);

      if (!document) {
        res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found'
          }
        });
        return;
      }

      // Delete from Pinecone vector database
      try {
        await pineconeDB.deleteDocumentChunks(id.toString());
        logger.info('Document chunks deleted from Pinecone', { documentId: id });
      } catch (error) {
        logger.error('Failed to delete from Pinecone, continuing with file deletion', { documentId: id, error });
      }

      // Delete physical file
      const fileKey = document.file_path.split('/').pop();
      if (fileKey) {
        try {
          await fileStorageService.deleteFile(fileKey);
          logger.info('Physical file deleted', { documentId: id, fileKey });
        } catch (error) {
          logger.error('Failed to delete physical file, continuing with database deletion', { documentId: id, error });
        }
      }

      // Delete from database
      await DocumentModel.delete(id);
      logger.info('Document deleted from database', { documentId: id });

      res.status(204).send();
    } catch (error) {
      logger.error('Document deletion failed', { documentId: req.params.id, error });
      next(error);
    }
  }


  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const document = await DocumentModel.findById(id);
      
      if (!document) {
        res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found'
          }
        });
        return;
      }
      
      // Check if summary already exists in database
      if (document.summary) {
        logger.info('Returning cached summary', { documentId: id });
        res.json({ 
          summary: document.summary,
          cached: true,
          generatedAt: document.summary_generated_at 
        });
        return;
      }
      
      // Check if document has extracted text
      if (!document.extracted_text) {
        res.json({
          summary: null,
          message: 'Document is still being processed or has no content.'
        });
        return;
      }
      
      try {
        // Generate new summary
        logger.info('Generating new summary', { documentId: id });
        const openAI = new OpenAIService();
        
        // Split text into chunks for summary (use first portion of text for efficiency)
        const textForSummary = document.extracted_text.substring(0, 15000); // Use first ~15k chars
        const chunks = [textForSummary];
        
        const summary = await openAI.generateSummary(chunks);
        
        // Save summary to database
        await DocumentModel.update(id, {
          summary,
          summary_generated_at: new Date()
        });
        
        logger.info('Summary generated and saved', { documentId: id });
        
        res.json({ 
          summary,
          cached: false,
          generatedAt: new Date() 
        });
      } catch (error) {
        logger.error('Failed to generate summary', { documentId: id, error });
        res.json({
          summary: null,
          message: 'Unable to generate summary at this time.'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async getChunks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      // Check if document exists and is processed
      const document = await DocumentModel.findById(id);
      if (!document) {
        res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found'
          }
        });
        return;
      }

      // If document has no chunks, return empty results
      if (document.status === 'failed' || !document.chunk_count || document.chunk_count === 0) {
        res.json({
          chunks: [],
          chunkCount: 0,
          message: document.status === 'failed' ? 'Document processing failed.' : 'No chunks available.'
        });
        return;
      }

      try {
        // Use a simple query to get all chunks for the document
        const searchResults = await pineconeDB.searchSimilarWithText(
          'document', // Simple query to match all chunks
          100, // Get up to 100 chunks
          { documentId: { $eq: id } } // Filter by document ID
        );

        // Sort chunks by chunkIndex to maintain proper order
        const sortedChunks = searchResults.sort((a, b) => a.chunkIndex - b.chunkIndex);

        res.json({
          chunks: sortedChunks,
          chunkCount: sortedChunks.length
        });
      } catch (error) {
        logger.error('Failed to retrieve chunks', { documentId: id, error });
        res.json({
          chunks: [],
          chunkCount: 0,
          message: 'Unable to retrieve chunks at this time.'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async searchDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { query } = req.body;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          error: {
            code: 'INVALID_QUERY',
            message: 'Query is required and must be a string'
          }
        });
        return;
      }

      // Check if document exists and is processed
      const document = await DocumentModel.findById(id);
      if (!document) {
        res.status(404).json({
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found'
          }
        });
        return;
      }

      // If document failed to process or has no chunks, return empty results
      if (document.status === 'failed' || !document.chunk_count || document.chunk_count === 0) {
        res.json({
          query,
          results: [],
          resultCount: 0,
          message: 'Document is not available for search. Please try re-uploading the document.'
        });
        return;
      }

      try {
        // Use direct text search for integrated inference index
        const searchResults = await pineconeDB.searchSimilarWithText(
          query,
          5,
          { documentId: { $eq: id } }
        );

        res.json({
          query,
          results: searchResults,
          resultCount: searchResults.length
        });
      } catch (searchError) {
        // If search fails, return empty results instead of crashing
        logger.error('Search failed for document', { documentId: id, query, error: searchError });
        res.json({
          query,
          results: [],
          resultCount: 0,
          message: 'Search temporarily unavailable for this document.'
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // Private method to process documents with new architecture
  private async processDocument(documentId: string, filePath: string, file: Express.Multer.File): Promise<void> {
    try {
      logger.info('Processing document with new architecture', { documentId, filename: file.originalname });
      
      const openAI = new OpenAIService();
      
      // Convert the database path to actual file system path
      const actualFilePath = filePath.startsWith('/src/uploads/') 
        ? path.join(process.cwd(), filePath.substring(1)) // Remove leading slash
        : filePath;
      
      // 1. Extract text using OpenAI GPT-4 Vision
      const extractedText = await openAI.extractTextFromFile(actualFilePath, file.mimetype);
      
      // 2. Intelligent chunking
      const chunkingResult = await openAI.chunk(extractedText, file.originalname);
      
      // 3. Prepare chunks for Pinecone
      const chunks = chunkingResult.chunks.map((chunk, index) => ({
        id: `${documentId}-chunk-${index}`,
        text: chunk,
        metadata: {
          documentId,
          filename: file.originalname,
          chunkIndex: index,
          totalChunks: chunkingResult.chunks.length,
          text: chunk,
          contentType: file.mimetype,
          wordCount: chunk.split(' ').length
        }
      }));
      
      // 4. Upload to Pinecone
      await pineconeDB.upsertDocumentChunks(chunks, documentId);
      
      // 5. Update document status
      await DocumentModel.update(documentId, {
        status: 'processed',
        extracted_text: extractedText,
        chunk_count: chunks.length
      });
      
      // 6. Notify clients about successful processing
      notificationService.notifyDocumentUpdate({
        documentId,
        status: 'processed',
        filename: file.originalname,
        chunkCount: chunks.length
      });
      
      logger.info('Document processed successfully', { 
        documentId, 
        chunkCount: chunks.length 
      });
    } catch (error) {
      logger.error('Document processing failed', { documentId, error });
      
      await DocumentModel.update(documentId, {
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Processing failed'
      });
      
      // Notify clients about failed processing
      notificationService.notifyDocumentUpdate({
        documentId,
        status: 'failed',
        filename: file.originalname,
        error: error instanceof Error ? error.message : 'Processing failed'
      });
    }
  }

}

export default new DocumentController();