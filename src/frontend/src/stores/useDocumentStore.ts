import { create } from 'zustand';

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
  
  // Actions
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setDocuments: (documents: Document[]) => void;
  updateProcessingStatus: (id: string, status: 'processing' | 'ready' | 'error') => void;
  getSelectedDocuments: (ids: string[]) => Document[];
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  processingStatus: {},
  
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
}));