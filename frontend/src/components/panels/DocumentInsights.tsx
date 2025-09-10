import React from "react";
import {
  useDocuments,
  useDocumentSummary,
  useDocumentChunks,
} from "../../hooks/useApi";
import DocumentSummaryCard from "../cards/DocumentSummaryCard";
import DocumentChunksBrowser from "../cards/DocumentChunksBrowser";

interface DocumentInsightsProps {
  selectedDocument?: string | null;
  documentId?: number | null;
  selectedDocumentName?: string;
}

const DocumentInsights: React.FC<DocumentInsightsProps> = ({
  selectedDocument,
  documentId,
  selectedDocumentName,
}) => {
  // Convert selectedDocument string to numeric documentId for API calls
  const numericDocumentId =
    documentId || (selectedDocument ? parseInt(selectedDocument) : null);

  // Get document list data, summary, and chunks
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const { data: summaryData, isLoading: summaryLoading } =
    useDocumentSummary(numericDocumentId);
  const { data: chunksData, isLoading: chunksLoading } =
    useDocumentChunks(numericDocumentId);

  // Find current document data
  const currentDocument = documents?.find(
    (doc) => doc.id === numericDocumentId
  );

  // Extract chunks from the response
  const chunks = chunksData?.chunks || [];
  const isProcessing = chunksData?.isProcessing || false;
  const chunksMessage = chunksData?.message;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-7">
        <h2 className="text-lg font-semibold dark:text-gray-100">Document Insights</h2>
      </div>

      {!selectedDocument || !numericDocumentId ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <div className="mb-4 flex justify-center">
              <svg
                className="w-16 h-16 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 3v5a2 2 0 002 2h5"
                />
              </svg>
            </div>
            <div className="font-medium text-base mb-2 dark:text-gray-300">
              No Document Selected
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              Select a document from the left panel to view its summary and
              browse chunks
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 px-6 pb-6 overflow-y-auto">
          {/* Document Summary Card */}
          <DocumentSummaryCard
            filename={selectedDocumentName || currentDocument?.filename || `Document ${numericDocumentId}`}
            summary={summaryData?.summary || undefined}
            isLoading={summaryLoading}
          />

          {/* Document Chunks Browser */}
          <DocumentChunksBrowser 
            chunks={chunks} 
            isLoading={chunksLoading} 
            isProcessing={isProcessing}
            message={chunksMessage}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentInsights;
