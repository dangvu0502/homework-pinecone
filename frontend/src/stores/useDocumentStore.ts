import { create } from 'zustand';
import { documentApi, notificationApi } from '../services/api';

export interface Document {
  id: number;
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
  processingStatus: Record<number, 'processing' | 'ready' | 'error'>;
  isLoading: boolean;
  error: string | null;
  eventSource: EventSource | null;
  
  // Actions
  addDocument: (document: Document) => void;
  updateDocument: (id: number, updates: Partial<Document>) => void;
  removeDocument: (id: number) => void;
  setDocuments: (documents: Document[]) => void;
  updateProcessingStatus: (id: number, status: 'processing' | 'ready' | 'error') => void;
  getSelectedDocuments: (ids: number[]) => Document[];
  
  // API Actions
  uploadDocument: (file: File) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
  pollDocumentStatus: (id: number) => Promise<void>;
  
  // SSE Actions
  initializeSSE: () => void;
  closeSSE: () => void;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  processingStatus: {},
  isLoading: false,
  error: null,
  eventSource: null,
  
  addDocument: (document) =>
    set((state) => ({
      documents: [document, ...state.documents],
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
        Object.entries(state.processingStatus).filter(([key]) => Number(key) !== id)
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
        id: result.id,
        filename: result.filename,
        contentType: file.type,
        size: file.size,
        status: 'processing',
        uploadedAt: new Date().toISOString(),
      };
      
      set((state) => ({
        documents: [newDoc, ...state.documents],
        processingStatus: {
          ...state.processingStatus,
          [newDoc.id]: 'processing',
        },
        isLoading: false,
      }));
      
      // Initialize SSE if not already connected
      if (!get().eventSource) {
        get().initializeSSE();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Upload failed', isLoading: false });
    }
  },
  
  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const docs = await documentApi.list();
      const documents: Document[] = docs.map(doc => ({
        id: doc.id,
        filename: doc.filename,
        contentType: doc.contentType,
        size: doc.size,
        status: doc.status as Document['status'],
        uploadedAt: doc.uploadedAt,
      }))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
      set({ documents, isLoading: false });
      
      // Initialize SSE if not already connected
      if (!get().eventSource) {
        get().initializeSSE();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch documents', isLoading: false });
    }
  },
  
  deleteDocument: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await documentApi.delete(id);
      set((state) => ({
        documents: state.documents.filter(doc => doc.id !== id),
        processingStatus: Object.fromEntries(
          Object.entries(state.processingStatus).filter(([key]) => Number(key) !== id)
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
        const status = await documentApi.getStatus(id);
        
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
  
  initializeSSE: () => {
    const state = get();
    if (state.eventSource) {
      state.eventSource.close();
    }
    
    const eventSource = notificationApi.createEventSource();
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'document_status') {
          const { documentId, status, chunkCount } = data.data;
          
          // Update document status
          set((state) => ({
            documents: state.documents.map(doc =>
              doc.id === documentId 
                ? { 
                    ...doc, 
                    status: status === 'processed' ? 'ready' : status,
                    ...(chunkCount && { chunkCount })
                  } 
                : doc
            ),
            processingStatus: {
              ...state.processingStatus,
              [documentId]: status === 'processed' ? 'ready' : status,
            },
          }));
          
          console.log(`Document ${documentId} status updated to: ${status}`);
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Automatically reconnect after a delay
      setTimeout(() => {
        get().initializeSSE();
      }, 5000);
    };
    
    set({ eventSource });
  },
  
  closeSSE: () => {
    const state = get();
    if (state.eventSource) {
      state.eventSource.close();
      set({ eventSource: null });
    }
  },
}));