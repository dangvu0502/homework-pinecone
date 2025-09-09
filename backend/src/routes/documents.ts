import express from 'express';
import { upload } from '../middleware/upload.ts';
import documentController from '../controllers/DocumentController.ts';
import { notificationService } from '../services/NotificationService.ts';

const router = express.Router();

// POST /api/documents - Upload document
router.post('/', upload.single('file'), documentController.upload);

// GET /api/documents - List all documents
router.get('/', documentController.getAll);

// GET /api/documents/events - SSE endpoint for real-time notifications (MUST come before /:id)
router.get('/events', (_req, res) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  notificationService.addClient(clientId, res);
});

// GET /api/documents/:id - Get document by ID
router.get('/:id', documentController.getById);

// GET /api/documents/:id/status - Get document status
router.get('/:id/status', documentController.getStatus);

// GET /api/documents/:id/summary - Get document summary
router.get('/:id/summary', documentController.getSummary);

// GET /api/documents/:id/chunks - Get all document chunks
router.get('/:id/chunks', documentController.getChunks);

// POST /api/documents/:id/search - Search within document
router.post('/:id/search', documentController.searchDocument);

// DELETE /api/documents/:id - Delete document
router.delete('/:id', documentController.delete);

export default router;