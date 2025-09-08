import { create } from 'zustand';

export interface DocumentMetadata {
  id: string;
  filename: string;
  totalChunks: number;
  summary: string | null;
  extractedText?: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  uploadedAt: string;
  size: number;
  contentType: string;
  lastFetched?: Date;
}

interface DocumentMetadataStore {
  metadata: Record<string, DocumentMetadata>;
  
  // Actions
  setMetadata: (documentId: string, data: Partial<DocumentMetadata>) => void;
  getMetadata: (documentId: string) => DocumentMetadata | undefined;
  updateMetadata: (documentId: string, data: Partial<DocumentMetadata>) => void;
  clearMetadata: (documentId: string) => void;
  clearAllMetadata: () => void;
}

export const useDocumentMetadataStore = create<DocumentMetadataStore>((set, get) => ({
  metadata: {},
  
  setMetadata: (documentId, data) => {
    set((state) => ({
      metadata: {
        ...state.metadata,
        [documentId]: {
          id: documentId,
          ...data,
          lastFetched: new Date(),
        } as DocumentMetadata,
      },
    }));
  },
  
  getMetadata: (documentId) => {
    return get().metadata[documentId];
  },
  
  updateMetadata: (documentId, data) => {
    set((state) => {
      const existing = state.metadata[documentId];
      if (!existing) {
        // If no existing metadata, create new entry
        return {
          metadata: {
            ...state.metadata,
            [documentId]: {
              id: documentId,
              filename: data.filename || '',
              totalChunks: data.totalChunks || 0,
              summary: data.summary || null,
              status: data.status || 'pending',
              uploadedAt: data.uploadedAt || new Date().toISOString(),
              size: data.size || 0,
              contentType: data.contentType || '',
              ...data,
              lastFetched: new Date(),
            } as DocumentMetadata,
          },
        };
      }
      
      return {
        metadata: {
          ...state.metadata,
          [documentId]: {
            ...existing,
            ...data,
            lastFetched: new Date(),
          } as DocumentMetadata,
        },
      };
    });
  },
  
  clearMetadata: (documentId) => {
    set((state) => {
      const { [documentId]: _, ...rest } = state.metadata;
      return { metadata: rest };
    });
  },
  
  clearAllMetadata: () => {
    set({ metadata: {} });
  },
}));