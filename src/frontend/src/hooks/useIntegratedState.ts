import { useEffect } from 'react';
import { useLayoutStore } from '../stores/useLayoutStore';
import { useDocumentStore } from '../stores/useDocumentStore';
import { useChatStore } from '../stores/useChatStore';

export const useIntegratedState = () => {
  const layout = useLayoutStore();
  const documents = useDocumentStore();
  const chat = useChatStore();
  
  // Sync selected document with chat context
  useEffect(() => {
    if (layout.selectedDocument) {
      chat.updateContext([layout.selectedDocument]);
    } else {
      chat.updateContext([]);
    }
  }, [layout.selectedDocument, chat]);
  
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
  }, [documents.documents, documents]);
  
  // Clean up selected document when document is removed
  useEffect(() => {
    if (layout.selectedDocument) {
      const validDocIds = documents.documents.map(d => d.id);
      if (!validDocIds.includes(layout.selectedDocument)) {
        layout.selectDocument(null);
      }
    }
  }, [documents.documents, layout.selectedDocument, layout]);
  
  return {
    layout,
    documents,
    chat,
  };
};