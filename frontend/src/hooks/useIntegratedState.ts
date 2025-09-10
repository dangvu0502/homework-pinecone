import { useEffect } from 'react';
import { useLayoutStore } from '../stores/useLayoutStore';
import { useDocumentStore } from '../stores/useDocumentStore';
import { useChatStore } from '../stores/useChatStore';

export const useIntegratedState = () => {
  const layout = useLayoutStore();
  const documents = useDocumentStore();
  const chat = useChatStore();
  
  // Initialize documents when the hook mounts
  useEffect(() => {
    documents.fetchDocuments();
  }, [documents.fetchDocuments]);
  
  // Sync selected document with chat context
  useEffect(() => {
    if (layout.selectedDocumentId) {
      chat.updateContext([layout.selectedDocumentId]);
    } else {
      chat.updateContext([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.selectedDocumentId, chat.updateContext]);
  
  // Update processing status when document status changes
  useEffect(() => {
    documents.documents.forEach(doc => {
      if (doc.status === 'processing' && !documents.processingStatus[doc.id]) {
        documents.updateProcessingStatus(doc.id, 'processing');
      } else if (doc.status === 'ready' && documents.processingStatus[doc.id] !== 'ready') {
        documents.updateProcessingStatus(doc.id, 'ready');
      } else if (doc.status === 'error' && documents.processingStatus[doc.id] !== 'error') {
        documents.updateProcessingStatus(doc.id, 'error');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.documents, documents.processingStatus, documents.updateProcessingStatus]);
  
  // Clean up selected document when document is removed
  useEffect(() => {
    if (layout.selectedDocumentId) {
      const validDocIds = documents.documents.map(d => d.id);
      if (!validDocIds.includes(layout.selectedDocumentId)) {
        layout.selectDocument(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents.documents, layout.selectedDocumentId, layout.selectDocument]);
  
  return {
    layout,
    documents,
    chat,
  };
};