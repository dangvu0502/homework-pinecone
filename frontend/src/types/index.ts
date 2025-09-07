export interface UploadedDocument {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  status: 'uploading' | 'uploaded' | 'processing' | 'ready' | 'error';
  uploadedAt: string;
  progress?: number;
  error?: string;
}

export interface UploadProgress {
  fileId: string;
  progress: number;
  loaded: number;
  total: number;
}

export interface FileUploadResponse {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  uploadedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentSource[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface DocumentSource {
  documentId: string;
  documentName: string;
  snippet: string;
  page?: number;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  selectedDocuments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamEvent {
  type: 'token' | 'source' | 'error' | 'complete';
  content?: string;
  documentId?: string;
  snippet?: string;
  messageId?: string;
  error?: string;
}

export interface ChatState {
  currentSession: string | null;
  messages: Message[];
  selectedDocuments: string[];
  isStreaming: boolean;
  streamingMessage: string;
  error: string | null;
}