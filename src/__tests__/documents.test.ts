import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import documentRoutes from '../routes/documents';
import { upload } from '../middleware/upload';

const app = express();
app.use(express.json());
app.use('/api/documents', documentRoutes);

jest.mock('../models/Document', () => ({
  default: {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    delete: jest.fn(),
  }
}));

jest.mock('../services/FileStorageService', () => ({
  default: {
    saveFile: jest.fn(),
    deleteFile: jest.fn(),
  }
}));

describe('Document Upload API', () => {
  const DocumentModel = require('../models/Document').default;
  const FileStorageService = require('../services/FileStorageService').default;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/documents', () => {
    it('should upload a document successfully', async () => {
      const mockDocument = {
        id: 'test-uuid',
        filename: 'test.pdf',
        content_type: 'application/pdf',
        size: 1024,
        file_path: '/uploads/test-uuid.pdf',
        status: 'uploaded',
        uploaded_at: new Date(),
      };

      FileStorageService.saveFile.mockResolvedValue({
        filePath: '/uploads/test-uuid.pdf',
        fileKey: 'test-uuid.pdf',
      });

      DocumentModel.create.mockResolvedValue(mockDocument);

      const response = await request(app)
        .post('/api/documents')
        .attach('file', Buffer.from('test content'), 'test.pdf')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.filename).toBe('test.pdf');
      expect(response.body.status).toBe('uploaded');
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app)
        .post('/api/documents')
        .expect(400);

      expect(response.body.error.code).toBe('NO_FILE');
      expect(response.body.error.message).toBe('No file provided');
    });

    it('should reject invalid file types', async () => {
      const response = await request(app)
        .post('/api/documents')
        .attach('file', Buffer.from('test'), 'test.exe')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/documents', () => {
    it('should return list of documents', async () => {
      const mockDocuments = [
        {
          id: '1',
          filename: 'doc1.pdf',
          content_type: 'application/pdf',
          size: 1024,
          status: 'uploaded',
          uploaded_at: new Date(),
          file_path: '/uploads/doc1.pdf',
        },
        {
          id: '2',
          filename: 'doc2.txt',
          content_type: 'text/plain',
          size: 512,
          status: 'uploaded',
          uploaded_at: new Date(),
          file_path: '/uploads/doc2.txt',
        },
      ];

      DocumentModel.findAll.mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should return a document by ID', async () => {
      const mockDocument = {
        id: 'test-uuid',
        filename: 'test.pdf',
        content_type: 'application/pdf',
        size: 1024,
        file_path: '/uploads/test-uuid.pdf',
        status: 'uploaded',
        uploaded_at: new Date(),
      };

      DocumentModel.findById.mockResolvedValue(mockDocument);

      const response = await request(app)
        .get('/api/documents/test-uuid')
        .expect(200);

      expect(response.body.id).toBe('test-uuid');
      expect(response.body.filename).toBe('test.pdf');
    });

    it('should return 404 for non-existent document', async () => {
      DocumentModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/documents/non-existent')
        .expect(404);

      expect(response.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should delete a document successfully', async () => {
      const mockDocument = {
        id: 'test-uuid',
        filename: 'test.pdf',
        content_type: 'application/pdf',
        size: 1024,
        file_path: '/uploads/test-uuid.pdf',
        status: 'uploaded',
        uploaded_at: new Date(),
      };

      DocumentModel.findById.mockResolvedValue(mockDocument);
      DocumentModel.delete.mockResolvedValue(true);
      FileStorageService.deleteFile.mockResolvedValue(undefined);

      await request(app)
        .delete('/api/documents/test-uuid')
        .expect(204);

      expect(DocumentModel.delete).toHaveBeenCalledWith('test-uuid');
      expect(FileStorageService.deleteFile).toHaveBeenCalledWith('test-uuid.pdf');
    });

    it('should return 404 when deleting non-existent document', async () => {
      DocumentModel.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/documents/non-existent')
        .expect(404);

      expect(response.body.error.code).toBe('DOCUMENT_NOT_FOUND');
    });
  });
});