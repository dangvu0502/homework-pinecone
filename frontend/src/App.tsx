import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import ThreePanelLayout from './components/layout/ThreePanelLayout';
import { useDocumentStore } from './stores/useDocumentStore';
import { useTheme } from './hooks/useTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  useTheme(); // Initialize theme
  
  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  return <ThreePanelLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;