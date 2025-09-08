import React from 'react';
import { useDocuments, useDocumentSummary, useDocumentChunks } from '../../hooks/useApi';
import DocumentSummaryCard from '../cards/DocumentSummaryCard';
import DocumentChunksBrowser from '../cards/DocumentChunksBrowser';

interface QuickSearchProps {
  selectedDocument?: string | null;
  documentId?: number | null;
}

const QuickSearch: React.FC<QuickSearchProps> = ({ selectedDocument, documentId }) => {
  // Convert selectedDocument string to numeric documentId for API calls
  const numericDocumentId = documentId || (selectedDocument ? parseInt(selectedDocument) : null);
  
  // Get document list data, summary, and chunks
  const { data: documents } = useDocuments();
  const { data: summaryData, isLoading: summaryLoading } = useDocumentSummary(numericDocumentId);
  const { data: chunksData, isLoading: chunksLoading } = useDocumentChunks(numericDocumentId);
  
  // Find current document data
  const currentDocument = documents?.find(doc => doc.id === numericDocumentId);
  
  // Extract chunks from the response
  const chunks = chunksData?.chunks || [];

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
          summary={summaryData?.summary || undefined}
          isLoading={summaryLoading}
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