import React from 'react';
import type { UploadedDocument } from '../../types';
import { UploadProgress } from './UploadProgress';

interface FileListProps {
  documents: UploadedDocument[];
  onRemove?: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ documents, onRemove }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    const iconProps = "w-6 h-6 text-gray-500";
    
    if (contentType.startsWith('image/')) {
      return (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (contentType === 'application/pdf') {
      return (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (contentType === 'text/csv') {
      return (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    }
    if (contentType === 'text/plain') {
      return (
        <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    );
  };

  if (documents.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>No files uploaded yet</p>
        <p className="text-sm">Upload some documents to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Uploaded Files ({documents.length})
      </h3>
      
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0">{getFileIcon(doc.contentType)}</div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {doc.filename}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatFileSize(doc.size)}</span>
                  <span>•</span>
                  <span>{(doc.contentType.split('/')[1] || 'unknown').toUpperCase()}</span>
                  {doc.uploadedAt && (
                    <>
                      <span>•</span>
                      <span>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {onRemove && (
              <button
                onClick={() => onRemove(doc.id)}
                className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                aria-label={`Remove ${doc.filename}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {(doc.status === 'uploading' || doc.progress !== undefined) && (
            <UploadProgress
              progress={doc.progress || 0}
              filename={doc.filename}
              status={doc.status}
              error={doc.error}
            />
          )}
          
          {doc.status === 'ready' && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Ready for chat</span>
            </div>
          )}
          
          {doc.status === 'processing' && (
            <div className="flex items-center space-x-2 text-sm text-yellow-600">
              <div className="animate-spin w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
              <span>Processing document...</span>
            </div>
          )}
          
          {doc.status === 'error' && doc.error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {doc.error}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};