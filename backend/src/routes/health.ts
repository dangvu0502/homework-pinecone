import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      pinecone: process.env.PINECONE_API_KEY ? 'configured' : 'missing',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
    }
  });
});

export default router;