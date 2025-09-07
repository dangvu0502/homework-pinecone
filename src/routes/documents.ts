import express from 'express';
import { upload } from '../middleware/upload.ts';
import documentController from '../controllers/DocumentController.ts';

const router = express.Router();

// POST /api/documents - Upload document
router.post('/', upload.single('file'), documentController.upload);

// GET /api/documents - List all documents
router.get('/', documentController.getAll);

// GET /api/documents/:id - Get document by ID
router.get('/:id', documentController.getById);

// DELETE /api/documents/:id - Delete document
router.delete('/:id', documentController.delete);

export default router;