import { create } from 'zustand';
import { documentApi } from '../services/api';

export interface Document {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  uploadedAt: string;
  processingProgress?: number;
  errorMessage?: string;
}

interface DocumentStore {
  documents: Document[];
  processingStatus: Record<string, 'processing' | 'ready' | 'error'>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setDocuments: (documents: Document[]) => void;
  updateProcessingStatus: (id: string, status: 'processing' | 'ready' | 'error') => void;
  getSelectedDocuments: (ids: string[]) => Document[];
  
  // API Actions
  uploadDocument: (file: File) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  pollDocumentStatus: (id: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  processingStatus: {},
  isLoading: false,
  error: null,
  
  addDocument: (document) =>
    set((state) => ({
      documents: [...state.documents, document],
      processingStatus: {
        ...state.processingStatus,
        [document.id]: document.status === 'uploaded' ? 'processing' : 'ready',
      },
    })),
    
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, ...updates } : doc
      ),
    })),
    
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== id),
      processingStatus: Object.fromEntries(
        Object.entries(state.processingStatus).filter(([key]) => key !== id)
      ),
    })),
    
  setDocuments: (documents) =>
    set({
      documents,
      processingStatus: documents.reduce(
        (acc, doc) => ({
          ...acc,
          [doc.id]: doc.status === 'ready' ? 'ready' : 'processing',
        }),
        {}
      ),
    }),
    
  updateProcessingStatus: (id, status) =>
    set((state) => ({
      processingStatus: {
        ...state.processingStatus,
        [id]: status,
      },
      documents: state.documents.map((doc) =>
        doc.id === id ? { ...doc, status: status === 'processing' ? 'processing' : status } : doc
      ),
    })),
    
  getSelectedDocuments: (ids) => {
    const state = get();
    return state.documents.filter((doc) => ids.includes(doc.id));
  },
  
  uploadDocument: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const result = await documentApi.upload(file);
      const newDoc: Document = {
        id: result.id.toString(),
        filename: result.filename,
        contentType: file.type,
        size: file.size,
        status: 'processing',
        uploadedAt: new Date().toISOString(),
      };
      
      set((state) => ({
        documents: [...state.documents, newDoc],
        processingStatus: {
          ...state.processingStatus,
          [newDoc.id]: 'processing',
        },
        isLoading: false,
      }));
      
      // Start polling for status
      get().pollDocumentStatus(newDoc.id);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Upload failed', isLoading: false });
    }
  },
  
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const docs = await documentApi.list();
      const documents: Document[] = docs.map(doc => ({
        id: doc.id.toString(),
        filename: doc.filename,
        contentType: doc.contentType,
        size: doc.size,
        status: doc.status as Document['status'],
        uploadedAt: doc.uploadedAt,
      }));
      set({ documents, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch documents', isLoading: false });
    }
  },
  
  deleteDocument: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await documentApi.delete(parseInt(id));
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== id),
        processingStatus: Object.fromEntries(
          Object.entries(state.processingStatus).filter(([key]) => key !== id)
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Delete failed', isLoading: false });
    }
  },
  
  pollDocumentStatus: async (id) => {
    const maxAttempts = 30;
    let attempts = 0;
    
    const poll = async () => {
      try {
        const status = await documentApi.getStatus(parseInt(id));
        
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id ? { ...doc, status: status.status as Document['status'] } : doc
          ),
          processingStatus: {
            ...state.processingStatus,
            [id]: status.status === 'ready' ? 'ready' : status.status === 'error' ? 'error' : 'processing',
          },
        }));
        
        if (status.status === 'processing' && attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Failed to poll document status:', error);
        set((state) => ({
          processingStatus: {
            ...state.processingStatus,
            [id]: 'error',
          },
        }));
      }
    };
    
    await poll();
  },
}));