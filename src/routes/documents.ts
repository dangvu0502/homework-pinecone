import express from 'express';
import fs from 'fs/promises';
import multer from 'multer';
import path from 'path';
import { db } from '../config/database';
import { DocumentProcessor } from '../services/DocumentProcessor';
import { logger } from '../utils/logger';

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Configure multer for file uploads (local storage for MVP)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for MVP
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'image/png',
      'image/jpeg',
      'image/svg+xml',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported. Supported types: PDF, TXT, CSV, PNG, JPEG, SVG, DOC, DOCX`));
    }
  }
});

// POST /api/documents - Upload document
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No file provided'
        }
      });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;

    // Insert document record into database
    const [document] = await db('documents')
      .insert({
        filename: originalname,
        content_type: mimetype,
        size,
        file_path: filename, // Using local filename as "file_path" for MVP
        status: 'uploaded'
      })
      .returning(['id', 'filename', 'content_type', 'size', 'file_path', 'status', 'uploaded_at']);

    logger.info('Document uploaded successfully', {
      documentId: document.id,
      filename: originalname,
      size,
      contentType: mimetype
    });

    // Trigger processing in background (MVP approach)
    DocumentProcessor.triggerProcessing(document.id);

    // Return formatted response
    return res.status(201).json({
      id: document.id,
      filename: document.filename,
      contentType: document.content_type,
      size: document.size,
      status: document.status,
      uploadedAt: document.uploaded_at,
      localPath: filename, // For MVP - indicates local storage
      processing: true // Indicates processing has been triggered
    });

  } catch (error: any) {
    logger.error('Document upload failed', {
      error: error.message,
      stack: error.stack
    });

    // Clean up file if database operation failed
    if (req.file?.path) {
      fs.unlink(req.file.path).catch(err => 
        logger.error('Failed to cleanup file after upload error', { error: err.message })
      );
    }

    if (error.code === '23505') { // PostgreSQL unique violation
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_FILE',
          message: 'File already exists'
        }
      });
    }

    return res.status(500).json({
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload document',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

// GET /api/documents - List uploaded documents
router.get('/', async (req, res) => {
  try {
    const documents = await db('documents')
      .select(['id', 'filename', 'content_type', 'size', 'status', 'uploaded_at'])
      .orderBy('uploaded_at', 'desc')
      .limit(100);

    return res.json({
      documents: documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        contentType: doc.content_type,
        size: doc.size,
        status: doc.status,
        uploadedAt: doc.uploaded_at
      })),
      count: documents.length
    });

  } catch (error: any) {
    logger.error('Failed to list documents', { error: error.message });
    
    return res.status(500).json({
      error: {
        code: 'LIST_FAILED',
        message: 'Failed to retrieve documents'
      }
    });
  }
});

// GET /api/documents/:id - Get document details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await db('documents')
      .select(['id', 'filename', 'content_type', 'size', 'file_path', 'status', 'uploaded_at', 'processed_at', 'extracted_text'])
      .where({ id })
      .first();

    if (!document) {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found'
        }
      });
    }

    return res.json({
      id: document.id,
      filename: document.filename,
      contentType: document.content_type,
      size: document.size,
      status: document.status,
      uploadedAt: document.uploaded_at,
      processedAt: document.processed_at,
      hasExtractedText: !!document.extracted_text,
      localPath: document.file_path // For MVP
    });

  } catch (error: any) {
    logger.error('Failed to get document', { 
      documentId: req.params.id,
      error: error.message 
    });
    
    return res.status(500).json({
      error: {
        code: 'GET_FAILED',
        message: 'Failed to retrieve document'
      }
    });
  }
});

// POST /api/documents/:id/process - Manual processing trigger
router.post('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify document exists
    const document = await db('documents')
      .select(['id', 'status'])
      .where({ id })
      .first();

    if (!document) {
      return res.status(404).json({
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found'
        }
      });
    }

    if (document.status === 'processed') {
      return res.status(200).json({
        message: 'Document already processed',
        status: document.status
      });
    }

    // Trigger processing
    DocumentProcessor.triggerProcessing(id);

    return res.json({
      message: 'Document processing triggered',
      documentId: id,
      processing: true
    });

  } catch (error: any) {
    logger.error('Failed to trigger processing', {
      documentId: req.params.id,
      error: error.message
    });

    return res.status(500).json({
      error: {
        code: 'PROCESSING_FAILED',
        message: 'Failed to trigger document processing'
      }
    });
  }
});

export default router;