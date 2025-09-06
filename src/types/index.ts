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