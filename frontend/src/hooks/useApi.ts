import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentApi, chatApi } from '../services/api';
import { useDocumentStore } from '../stores/useDocumentStore';
import { useChatStore } from '../stores/useChatStore';
import { useDocumentMetadataStore } from '../stores/useDocumentMetadataStore';

// Document Hooks
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const addDocument = useDocumentStore((state) => state.addDocument);
  
  return useMutation({
    mutationFn: documentApi.upload,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      addDocument({
        id: data.id.toString(),
        filename: data.filename,
        contentType: 'application/octet-stream',
        size: 0,
        status: 'processing',
        uploadedAt: new Date().toISOString(),
      });
    },
  });
};

export const useDocuments = () => {
  const { setMetadata } = useDocumentMetadataStore();
  
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const documents = await documentApi.list();
      
      // Store metadata for each document
      documents.forEach(doc => {
        setMetadata(doc.id.toString(), {
          id: doc.id.toString(),
          filename: doc.filename,
          totalChunks: doc.metadata?.totalChunks || 0,
          summary: doc.metadata?.hasSummary ? undefined : null, // Don't overwrite existing summary
          status: doc.status as 'pending' | 'processing' | 'processed' | 'failed',
          uploadedAt: doc.uploadedAt,
          size: doc.size,
          contentType: doc.contentType,
        });
      });
      
      return documents;
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const removeDocument = useDocumentStore((state) => state.removeDocument);
  
  return useMutation({
    mutationFn: documentApi.delete,
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      removeDocument(documentId.toString());
    },
  });
};

export const useDocumentStatus = (documentId: number | null) => {
  return useQuery({
    queryKey: ['document-status', documentId],
    queryFn: () => documentId ? documentApi.getStatus(documentId) : null,
    enabled: !!documentId,
    refetchInterval: (query) => {
      if (query.state.data?.status === 'processing') {
        return 2000; // Poll every 2 seconds while processing
      }
      return false; // Stop polling when done
    },
  });
};

export const useSearchDocument = () => {
  return useMutation({
    mutationFn: ({ documentId, query }: { documentId: number; query: string }) =>
      documentApi.searchDocument(documentId, query),
  });
};

export const useDocumentSummary = (documentId: number | null) => {
  const { getMetadata, updateMetadata } = useDocumentMetadataStore();
  
  return useQuery({
    queryKey: ['document-summary', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      
      // Check cache first
      const cached = getMetadata(documentId.toString());
      if (cached?.summary) {
        console.log('Using cached summary for document', documentId);
        return { summary: cached.summary, cached: true };
      }
      
      // Fetch from API
      const result = await documentApi.getSummary(documentId);
      
      // Update cache
      if (result.summary) {
        updateMetadata(documentId.toString(), {
          summary: result.summary,
        });
      }
      
      return result;
    },
    enabled: !!documentId,
    retry: 1,
  });
};

export const useDocumentChunks = (documentId: number | null) => {
  return useQuery({
    queryKey: ['document-chunks', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      
      // Check document status first
      const status = await documentApi.getStatus(documentId);
      
      // If document is still processing, return empty result with processing status
      if (status.status === 'processing') {
        return {
          chunks: [],
          chunkCount: 0,
          message: 'Document is still processing...',
          isProcessing: true
        };
      }
      
      // If document is ready, get chunks
      return documentApi.getChunks(documentId);
    },
    enabled: !!documentId,
    staleTime: 0, // Always refetch to avoid stale data
    retry: 2, // Retry failed requests
    refetchInterval: (data) => {
      // If document is still processing, poll every 3 seconds
      if (data?.state?.data?.isProcessing) {
        return 3000;
      }
      return false; // Stop polling when done
    },
  });
};


// Chat Hooks
export const useCreateChatSession = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chatApi.createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
};

export const useSendMessage = () => {
  const currentSession = useChatStore((state) => state.currentSession);
  const addMessage = useChatStore((state) => state.addMessage);
  const setStreaming = useChatStore((state) => state.setStreaming);
  const updateStreamingMessage = useChatStore((state) => state.updateStreamingMessage);
  const completeStreamingMessage = useChatStore((state) => state.completeStreamingMessage);
  
  return useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      if (!currentSession) {
        throw new Error('No active chat session');
      }
      
      // Add user message
      addMessage({
        role: 'user',
        content: message,
      });
      
      setStreaming(true);
      let fullContent = '';
      
      await chatApi.sendMessage(
        parseInt(currentSession.id),
        message,
        (chunk) => {
          fullContent += chunk;
          updateStreamingMessage(fullContent);
        }
      );
      
      return fullContent;
    },
    onSuccess: () => {
      completeStreamingMessage();
    },
    onError: () => {
      setStreaming(false);
      updateStreamingMessage('');
    },
  });
};

export const useChatHistory = (sessionId: number | null) => {
  return useQuery({
    queryKey: ['chat-history', sessionId],
    queryFn: () => sessionId ? chatApi.getSessionHistory(sessionId) : null,
    enabled: !!sessionId,
  });
};