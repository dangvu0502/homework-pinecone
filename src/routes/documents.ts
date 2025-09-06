import { Router } from 'express';
import { upload } from '../middleware/upload.js';

const router = Router();

// Upload document endpoint (stub for now)
router.post('/upload', upload.single('document'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  res.json({
    message: 'Document uploaded successfully',
    filename: req.file.originalname,
    size: req.file.size,
    type: req.file.mimetype
  });
});

// List documents endpoint (stub)
router.get('/', (req, res) => {
  res.json({
    documents: [],
    message: 'Documents endpoint - coming soon'
  });
});

// Delete document endpoint (stub)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    message: `Document ${id} deleted successfully`
  });
});

export default router;