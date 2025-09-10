import express from 'express';
import { upload } from '../middleware/upload.ts';
import documentController from '../controllers/DocumentController.ts';
import { notificationService } from '../services/NotificationService.ts';

const router = express.Router();

router.post('/', upload.single('file'), documentController.upload);

router.get('/', documentController.getAll);

router.get('/events', (_req, res) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  notificationService.addClient(clientId, res);
});

router.get('/:id', documentController.getById);

router.get('/:id/status', documentController.getStatus);

router.get('/:id/summary', documentController.getSummary);

router.get('/:id/chunks', documentController.getChunks);

router.post('/:id/search', documentController.searchDocument);

router.delete('/:id', documentController.delete);

export default router;