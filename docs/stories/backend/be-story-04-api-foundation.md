# BE Story 04: Core API Foundation and Database Setup

## Story Title
Express Server Foundation with PostgreSQL and Authentication

## User Story
As a system,
I want a robust API foundation with database connectivity and basic auth,
So that all other backend services have a reliable foundation to build upon.

## Story Context
**Existing System Integration:**
- Integrates with: All other backend stories as foundation
- Technology: Node.js 20, Express, TypeScript, PostgreSQL, JWT
- Follows pattern: RESTful API with middleware architecture
- Touch points: Provides base for upload, processing, and chat APIs

## Acceptance Criteria

**Functional Requirements:**
1. Express server with TypeScript configuration
2. PostgreSQL database connection with connection pooling
3. Database schema migration system setup
4. Basic JWT authentication middleware
5. CORS configuration for frontend integration

**Integration Requirements:**
6. Environment configuration management
7. Structured logging with Winston
8. Error handling middleware with standardized responses
9. Health check endpoint for monitoring

**Quality Requirements:**
10. Database connection resilience with retry logic
11. Comprehensive error handling and logging
12. Input validation middleware setup
13. Security middleware (helmet, rate limiting)

## Technical Notes
- **Integration Approach:** Express middleware chain with dependency injection
- **Existing Pattern Reference:** Enterprise Node.js API patterns
- **Key Constraints:** Must support concurrent connections and be production-ready

## Implementation Details
```typescript
// Key components to create:
- src/app.ts (Express application setup)
- src/server.ts (Server entry point)
- src/config/database.ts (PostgreSQL connection)
- src/middleware/auth.ts (JWT authentication)
- src/middleware/errorHandler.ts (Global error handling)
- src/utils/logger.ts (Winston logging setup)
- migrations/ (Database migration files)
```

## Database Setup
```sql
-- Initial schema for all stories
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (basic auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Documents table (from upload/processing stories)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'uploaded',
  extracted_text TEXT,
  embedding_id VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Chat sessions table (from streaming chat story)
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  document_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages table (from streaming chat story)
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
```

## Core Server Setup
```typescript
// app.ts - Express application configuration
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (to be added by other stories)
// app.use('/api/auth', authRoutes);
// app.use('/api/documents', documentRoutes);
// app.use('/api/chat', chatRoutes);

// Error handling
app.use(errorHandler);

export { app };
```

## Environment Configuration
```bash
# Server configuration
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/rag_challenge
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

## Middleware Implementation
```typescript
// middleware/errorHandler.ts
export const errorHandler = (
  error: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR', 
      message: 'An internal error occurred'
    }
  });
};

// middleware/auth.ts
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: { code: 'NO_TOKEN', message: 'Access token required' }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    return res.status(403).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
    });
  }
};
```

## Definition of Done
- [ ] Express server with TypeScript running
- [ ] PostgreSQL database connected with connection pooling
- [ ] Database migration system operational
- [ ] JWT authentication middleware implemented
- [ ] CORS and security middleware configured
- [ ] Error handling and logging working
- [ ] Health check endpoint responding
- [ ] Environment configuration documented

## Time Estimate: 3-4 hours