# BE Story 01: Document Upload API with S3 Storage

## Story Title
Document Upload API with AWS S3 Integration - Backend Foundation

## User Story
As a system,
I want to receive file uploads and store them securely in S3,
So that documents are safely stored and available for processing.

## Story Context
**Existing System Integration:**
- Integrates with: New greenfield Node.js + Express project
- Technology: Node.js 20, Express, TypeScript, AWS SDK, multer
- Follows pattern: RESTful API with middleware patterns
- Touch points: Will serve frontend upload requests (developed in parallel)

## Acceptance Criteria

**Functional Requirements:**
1. POST /api/documents endpoint accepts multipart/form-data uploads
2. File validation (type: PDF, PNG, JPEG, SVG, CSV, TXT; size: max 10MB)
3. Store files in AWS S3 with unique keys (UUID-based)
4. Save document metadata to PostgreSQL database
5. Return document object with ID and upload status

**Integration Requirements:**
6. Proper CORS configuration for frontend requests
7. Express middleware for file handling (multer)
8. Error handling with standardized error responses
9. Database connection with proper connection pooling

**Quality Requirements:**
10. API endpoints tested with Jest/Supertest
11. Input validation and sanitization implemented
12. Proper error logging and monitoring setup
13. Environment configuration for AWS credentials

## Technical Notes
- **Integration Approach:** Express routes with middleware for file handling
- **Existing Pattern Reference:** RESTful API patterns with proper HTTP status codes
- **Key Constraints:** Must handle concurrent uploads and large files efficiently

## Implementation Details
```typescript
// Key components to create:
- routes/documents.ts (API routes)
- controllers/DocumentController.ts (request handling)
- services/S3Service.ts (AWS S3 operations)
- middleware/upload.ts (multer configuration)
- models/Document.ts (database schema)
```

## Database Schema
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'uploaded',
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables Required
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=rag-challenge-documents
AWS_REGION=us-east-1
DATABASE_URL=postgresql://...
```

## API Response Format
```typescript
// Success Response
{
  id: string;
  filename: string;
  contentType: string;
  size: number;
  status: 'uploaded';
  uploadedAt: string;
  s3Key: string;
}

// Error Response
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

## Definition of Done
- [ ] POST /api/documents endpoint implemented
- [ ] File validation and error handling working
- [ ] S3 upload functionality operational
- [ ] Database integration with proper schema
- [ ] API tests written and passing
- [ ] Error responses standardized
- [ ] CORS properly configured
- [ ] Environment configuration documented

## Time Estimate: 4-6 hours