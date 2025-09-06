import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/error.js';
import { logger } from './utils/logger.js';
import documentRoutes from './routes/documents.js';
import chatRoutes from './routes/chat.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting (relaxed for MVP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // High limit for development
  message: { error: 'Too many requests' }
}));

// Body parsing
app.use(express.json({ limit: '50mb' })); // Higher limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'rag-challenge-backend'
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({ message: 'RAG Challenge API v1.0', status: 'ready' });
});

// Register route handlers
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Error handling
app.use(errorHandler);

export { app };