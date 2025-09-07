import React from 'react';
import type { UploadedDocument } from '../../types';
import { UploadProgress } from './UploadProgress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, Loader2, FileText, FileImage, FileSpreadsheet, File } from 'lucide-react';

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

  const getFileTypeIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) {
      return <FileImage className="w-5 h-5" />;
    }
    if (contentType === 'application/pdf') {
      return <FileText className="w-5 h-5" />;
    }
    if (contentType === 'text/csv') {
      return <FileSpreadsheet className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const getStatusIcon = (doc: UploadedDocument) => {
    // For the main icon, show status
    if (doc.status === 'ready') {
      return (
        <div className="relative">
          {getFileTypeIcon(doc.contentType)}
          <CheckCircle className="w-3 h-3 text-green-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
        </div>
      );
    }
    if (doc.status === 'processing' || doc.status === 'uploading') {
      return (
        <div className="relative">
          {getFileTypeIcon(doc.contentType)}
          <Loader2 className="w-3 h-3 text-blue-500 absolute -bottom-1 -right-1 bg-white rounded-full animate-spin" />
        </div>
      );
    }
    if (doc.status === 'error') {
      return (
        <div className="relative">
          {getFileTypeIcon(doc.contentType)}
          <AlertCircle className="w-3 h-3 text-red-500 absolute -bottom-1 -right-1 bg-white rounded-full" />
        </div>
      );
    }
    return getFileTypeIcon(doc.contentType);
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
          <div className="flex items-start justify-between mb-3 gap-2">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
                {getStatusIcon(doc)}
              </div>
              <div className="min-w-0 flex-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h4 className="text-sm font-medium text-gray-900 truncate cursor-default">
                        {doc.filename}
                      </h4>
                    </TooltipTrigger>
                    {doc.filename.length > 25 && (
                      <TooltipContent side="top" className="max-w-sm break-all z-50">
                        <p className="text-xs">{doc.filename}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span className="flex-shrink-0">{formatFileSize(doc.size)}</span>
                  <span className="flex-shrink-0">•</span>
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
            <div className="flex items-center space-x-2 text-sm text-green-600 mt-2">
              <CheckCircle className="w-4 h-4" />
              <span>Ready for chat</span>
            </div>
          )}
          
          {doc.status === 'processing' && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing document...</span>
            </div>
          )}
          
          {doc.status === 'uploading' && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 mt-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading...</span>
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