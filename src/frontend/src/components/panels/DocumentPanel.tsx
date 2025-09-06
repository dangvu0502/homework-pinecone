import React from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useLayoutStore } from '../../stores/useLayoutStore';
import type { DocumentItem } from '../../stores/useDocumentStore';
import DocumentUpload from '../upload/DocumentUpload';

interface DocumentPanelProps {
  documents: DocumentItem[];
  selectedIds: string[];
  processingStatus: Record<string, 'processing' | 'ready' | 'error'>;
}

const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  processingStatus,
}) => {
  const { selectedDocument, selectDocument } = useLayoutStore();
  const [showUpload, setShowUpload] = React.useState(!documents.length);
  
  const getStatusIcon = (doc: DocumentItem) => {
    const status = processingStatus[doc.id] || doc.status;
    
    switch (status) {
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            DOCUMENTS ({documents.length})
          </h2>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Toggle upload"
          >
            <Upload className="w-5 h-5" />
          </button>
        </div>
        
        {selectedDocument && (
          <div className="text-sm text-blue-600 dark:text-blue-400">
            1 document selected
          </div>
        )}
      </div>
      
      {showUpload && (
        <div className="p-4 pt-0">
          <DocumentUpload />
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <File className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No documents uploaded yet</p>
            <p className="text-xs mt-1">Click the upload button to add files</p>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                  selectedDocument === doc.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
                onClick={() => selectDocument(selectedDocument === doc.id ? null : doc.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center mt-1">
                    <input
                      type="radio"
                      checked={selectedDocument === doc.id}
                      onChange={(e) => {
                        e.stopPropagation();
                        selectDocument(selectedDocument === doc.id ? null : doc.id);
                      }}
                      className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 
                               dark:border-gray-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc)}
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {doc.filename}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>{doc.contentType}</span>
                      {doc.processingProgress !== undefined && doc.status === 'processing' && (
                        <>
                          <span>•</span>
                          <span>{doc.processingProgress}%</span>
                        </>
                      )}
                    </div>
                    {doc.errorMessage && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {doc.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedDocument && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            Document selected for chat context
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentPanel;