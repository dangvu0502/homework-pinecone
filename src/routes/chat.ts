import { Router } from 'express';

const router = Router();

// Chat endpoint (stub for now)
router.post('/', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  res.json({
    response: `Echo: ${message}`,
    timestamp: new Date().toISOString()
  });
});

// Streaming chat endpoint (stub)
router.post('/stream', (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send a simple streaming response
  res.write(`data: {"chunk": "This is a streaming response for: ${message}"}\n\n`);
  res.write(`data: {"chunk": " - Feature coming soon!"}\n\n`);
  res.write(`data: [DONE]\n\n`);
  res.end();
});

export default router;