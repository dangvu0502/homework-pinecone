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
    onSuccess: async (data) => {
      // Add the document to store immediately
      addDocument({
        id: data.id,
        filename: data.filename,
        contentType: 'application/octet-stream',
        size: 0,
        status: 'processing',
        uploadedAt: new Date().toISOString(),
      });
      
      // Force refetch of documents
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await queryClient.refetchQueries({ queryKey: ['documents'] });
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
        setMetadata(doc.id, {
          id: doc.id,
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
    staleTime: 0, // Consider data stale immediately
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const removeDocument = useDocumentStore((state) => state.removeDocument);
  
  return useMutation({
    mutationFn: documentApi.delete,
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      removeDocument(documentId);
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
      const cached = getMetadata(documentId);
      if (cached?.summary) {
        console.log('Using cached summary for document', documentId);
        return { summary: cached.summary, cached: true };
      }
      
      // Fetch from API
      const result = await documentApi.getSummary(documentId);
      
      // Update cache
      if (result.summary) {
        updateMetadata(documentId, {
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