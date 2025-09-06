import { useEffect } from 'react';
import ThreePanelLayout from './components/layout/ThreePanelLayout';
import { useDocumentStore } from './stores/useDocumentStore';
import { useTheme } from './hooks/useTheme';

function App() {
  const { addDocument } = useDocumentStore();
  useTheme(); // Initialize theme
  
  // Simulate some existing documents for testing
  useEffect(() => {
    // Add sample documents for testing
    const sampleDocs = [
      {
        id: 'doc-1',
        filename: 'sample-document.pdf',
        contentType: 'application/pdf',
        size: 1024 * 500,
        status: 'ready' as const,
        uploadedAt: new Date().toISOString(),
      },
      {
        id: 'doc-2',
        filename: 'research-paper.pdf',
        contentType: 'application/pdf',
        size: 1024 * 750,
        status: 'processing' as const,
        uploadedAt: new Date().toISOString(),
        processingProgress: 65,
      },
      {
        id: 'doc-3',
        filename: 'data-analysis.csv',
        contentType: 'text/csv',
        size: 1024 * 250,
        status: 'ready' as const,
        uploadedAt: new Date().toISOString(),
      },
    ];
    
    // Only add sample docs if store is empty
    if (useDocumentStore.getState().documents.length === 0) {
      sampleDocs.forEach(doc => addDocument(doc));
    }
  }, [addDocument]);
  
  return <ThreePanelLayout />;
}

export default App;