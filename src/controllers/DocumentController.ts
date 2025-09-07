import type { Request, Response, NextFunction } from 'express';
import DocumentModel from '../models/Document.ts';
import fileStorageService from '../services/FileStorageService.ts';

export class DocumentController {
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

      const { filePath, fileKey } = await fileStorageService.saveFile(req.file);

      const document = await DocumentModel.create({
        filename: req.file.originalname,
        content_type: req.file.mimetype,
        size: req.file.size,
        file_path: filePath
      });

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

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documents = await DocumentModel.findAll();
      
      res.json(documents.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        contentType: doc.content_type,
        size: doc.size,
        status: doc.status,
        uploadedAt: doc.uploaded_at,
        filePath: doc.file_path
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
        filePath: document.file_path
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

      const fileKey = document.file_path.split('/').pop();
      if (fileKey) {
        await fileStorageService.deleteFile(fileKey);
      }

      await DocumentModel.delete(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new DocumentController();