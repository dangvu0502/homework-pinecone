import React from "react";
import {
  useDocuments,
  useDocumentSummary,
  useDocumentChunks,
} from "../../../hooks/useApi";
import { useDocumentMetadataStore } from "../../../stores/useDocumentMetadataStore";
import DocumentSummaryCard from "./cards/DocumentSummaryCard";
import DocumentChunksBrowser from "./cards/DocumentChunksBrowser";

interface DocumentInsightsProps {
  selectedDocumentId?: number | null;
}

const DocumentInsights: React.FC<DocumentInsightsProps> = ({
  selectedDocumentId,
}) => {

  // Get document list data, summary, and chunks
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  console.log('documents', documents);
  console.log('selectedDocumentId', selectedDocumentId);
  const { data: summaryData, isLoading: summaryLoading } =
    useDocumentSummary(selectedDocumentId || null);
  const { data: chunksData, isLoading: chunksLoading } =
    useDocumentChunks(selectedDocumentId || null);

  // Find current document data  
  const currentDocument = selectedDocumentId 
    ? documents?.find((doc) => doc.id === selectedDocumentId)
    : undefined;
  

  // Extract chunks from the response
  const chunks = chunksData?.chunks || [];
  const isProcessing = chunksData?.isProcessing || false;
  const chunksMessage = chunksData?.message;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-7">
        <h2 className="text-lg font-semibold dark:text-gray-100">Document Insights</h2>
      </div>

      {!selectedDocumentId ? (
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
            filename={documentsLoading ? 'Loading...' : currentDocument?.filename || ''}
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
