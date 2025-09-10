const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new ApiError(response.status, error.error || 'Request failed');
  }
  
  // Handle empty responses
  const text = await response.text();
  if (!text.trim()) {
    return {} as T;
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to parse JSON response:', text);
    throw new Error('Invalid JSON response from server');
  }
}

// Document APIs
export const documentApi = {
  async upload(file: File): Promise<{ id: number; filename: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      body: formData,
    });
    
    return handleResponse(response);
  },
  
  async list(): Promise<Array<{
    id: number;
    filename: string;
    status: string;
    uploadedAt: string;
    size: number;
    contentType: string;
    filePath: string;
    metadata?: {
      totalChunks: number;
      hasSummary: boolean;
      summaryGeneratedAt?: string;
      processedAt?: string;
    };
  }>> {
    const response = await fetch(`${API_BASE_URL}/documents`);
    return handleResponse(response);
  },
  
  async delete(id: number): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },
  
  async getStatus(id: number): Promise<{
    id: number;
    status: string;
    filename: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/documents/${id}/status`);
    return handleResponse(response);
  },

  async getSummary(documentId: number): Promise<{
    summary: string | null;
    message?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/summary`);
    return handleResponse(response);
  },

  async getChunks(documentId: number): Promise<{
    chunks: Array<{
      documentId: string;
      filename: string;
      text: string;
      relevanceScore: number;
      chunkIndex: number;
    }>;
    chunkCount: number;
    message?: string;
    isProcessing?: boolean;
  }> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/chunks`);
    return handleResponse(response);
  },

  async searchDocument(documentId: number, query: string): Promise<{
    query: string;
    results: Array<{
      documentId: string;
      filename: string;
      text: string;
      relevanceScore: number;
      chunkIndex: number;
    }>;
    resultCount: number;
    message?: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return handleResponse(response);
  },

};

// Chat APIs
export const chatApi = {
  async createSession(documentIds: number[]): Promise<{ id: number }> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds }),
    });
    return handleResponse(response);
  },
  
  async sendMessage(
    sessionId: number,
    message: string,
    onChunk?: (chunk: string) => void
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to send message');
    }
    
    if (!response.body) {
      throw new Error('No response body');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'token' && parsed.content && onChunk) {
              onChunk(parsed.content);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  },
  
  async getSessionHistory(sessionId: string): Promise<{
    messages: Array<{
      id: number;
      role: 'user' | 'assistant';
      content: string;
      sources?: Array<{ document: string; relevance: number }>;
      created_at: string;
    }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`);
    return handleResponse(response);
  }
};

export const notificationApi = {
  createEventSource(): EventSource {
    return new EventSource(`${API_BASE_URL}/documents/events`);
  }
};