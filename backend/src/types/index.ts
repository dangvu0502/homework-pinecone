export interface Document {
  id: string;
  filename: string;
  content: string;
  metadata: {
    size: number;
    type: string;
    uploadedAt: string;
  };
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: string;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    pinecone: 'configured' | 'missing';
    openai: 'configured' | 'missing';
  };
}

export interface ApiError {
  message: string;
  status: number;
  timestamp: string;
}

// Database entity types
export interface User {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
}

export interface DBDocument {
  id: number;
  user_id?: number;
  filename: string;
  content_type: string;
  size: number;
  file_path: string;
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  extracted_text?: string;
  embedding_id?: string;
  uploaded_at: Date;
  processed_at?: Date;
}

export interface ChatSession {
  id: number;
  user_id?: number;
  document_ids: number[];
  created_at: Date;
}

export interface DBChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  sources: Array<{
    documentId: string;
    filename: string;
    text: string;
    relevanceScore: number;
    chunkIndex: number;
  }>;
  created_at: Date;
}