import React from 'react';
import type { UploadedDocument } from '../../types';

interface DocumentSelectorProps {
  documents: UploadedDocument[];
  selectedDocuments: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  documents,
  selectedDocuments,
  onSelectionChange,
}) => {
  const readyDocuments = documents.filter(doc => doc.status === 'ready');

  const handleToggle = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      onSelectionChange(selectedDocuments.filter(id => id !== documentId));
    } else {
      onSelectionChange([...selectedDocuments, documentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === readyDocuments.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(readyDocuments.map(doc => doc.id));
    }
  };

  if (readyDocuments.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          No documents available. Please upload documents first.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Document Context ({selectedDocuments.length}/{readyDocuments.length} selected)
          </h3>
          <button
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {selectedDocuments.length === readyDocuments.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
      </div>
      
      <div className="max-h-48 overflow-y-auto p-2">
        <div className="space-y-1">
          {readyDocuments.map(doc => (
            <label
              key={doc.id}
              className="flex items-center p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedDocuments.includes(doc.id)}
                onChange={() => handleToggle(doc.id)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <div className="ml-3 flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {doc.filename}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(doc.size / 1024).toFixed(1)} KB • {doc.contentType}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};