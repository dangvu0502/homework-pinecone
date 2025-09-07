import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentApi, chatApi } from '../services/api';
import { useDocumentStore } from '../stores/useDocumentStore';
import { useChatStore } from '../stores/useChatStore';

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
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentApi.list,
    refetchInterval: 5000, // Poll every 5 seconds for status updates
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
    refetchInterval: (data) => {
      if (data?.status === 'processing') {
        return 2000; // Poll every 2 seconds while processing
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