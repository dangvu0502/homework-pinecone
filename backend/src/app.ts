import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.ts';
import { logger } from './utils/logger.ts';
import documentRoutes from './routes/documents.ts';
import chatRoutes from './routes/chat.ts';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests from localhost on any port during development
    if (!origin || origin.includes('localhost')) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' })); // Higher limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'code-challenge-backend'
  });
});

// API routes
app.get('/api', (_req, res) => {
  res.json({ message: 'Code Challenge API v1.0', status: 'ready' });
});

// Register route handlers
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);

// Error handling
app.use(errorHandler);

export { app };