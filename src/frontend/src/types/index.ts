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