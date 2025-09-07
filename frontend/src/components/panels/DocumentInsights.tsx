import React, { useState, useEffect } from 'react';
import { useSearchDocument, useDocumentInsights, useDocuments } from '../../hooks/useApi';
import DocumentSummaryCard from '../cards/DocumentSummaryCard';
import DocumentChunksBrowser from '../cards/DocumentChunksBrowser';

interface QuickSearchProps {
  selectedDocument?: string | null;
  documentId?: number | null;
}

interface ChunkItem {
  documentId: string;
  filename: string;
  text: string;
  relevanceScore: number;
  chunkIndex: number;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ selectedDocument, documentId }) => {
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const searchDocument = useSearchDocument();
  
  // Convert selectedDocument string to numeric documentId for API calls
  const numericDocumentId = documentId || (selectedDocument ? parseInt(selectedDocument) : null);
  
  // Get document insights and document list data
  const { data: insights, isLoading: insightsLoading } = useDocumentInsights(numericDocumentId);
  const { data: documents } = useDocuments();
  
  // Find current document data
  const currentDocument = documents?.find(doc => doc.id === numericDocumentId);


  // Load all chunks using wildcard search
  const loadAllChunks = async () => {
    if (!numericDocumentId) {
      setChunks([]);
      return;
    }
    
    setChunksLoading(true);
    try {
      // Use a broad search query to get all chunks
      const result = await searchDocument.mutateAsync({ 
        documentId: numericDocumentId, 
        query: '*' // This should return all chunks
      });
      
      if (result.results) {
        setChunks(result.results);
      }
    } catch (error) {
      console.error('Failed to load chunks:', error);
      // Fallback: try with empty query
      try {
        const result = await searchDocument.mutateAsync({ 
          documentId: numericDocumentId, 
          query: '' 
        });
        if (result.results) {
          setChunks(result.results);
        }
      } catch (fallbackError) {
        console.error('Failed to load chunks (fallback):', fallbackError);
        setChunks([]);
      }
    } finally {
      setChunksLoading(false);
    }
  };


  // Load chunks when selected document changes
  useEffect(() => {
    if (numericDocumentId) {
      loadAllChunks();
    } else {
      setChunks([]);
    }
  }, [selectedDocument, numericDocumentId]);

  // Show placeholder when no document is selected
  if (!selectedDocument || !numericDocumentId) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-lg mb-2">📄</div>
          <div className="font-medium mb-1">No Document Selected</div>
          <div className="text-sm">Select a document from the left panel to view its details and browse chunks</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            Document Insights
          </h2>
        </div>

        {/* Document Summary Card */}
        <DocumentSummaryCard
          filename={currentDocument?.filename || 'Unknown Document'}
          summary={insights?.summary || (insights?.overview ? `Document type: ${insights.overview.type}. Status: ${insights.overview.status}.` : undefined)}
          keyTopics={insights?.keyTopics}
          isLoading={insightsLoading}
        />

        {/* Document Chunks Browser */}
        <DocumentChunksBrowser
          chunks={chunks}
          isLoading={chunksLoading}
        />
      </div>
    </div>
  );
};

export default QuickSearch;