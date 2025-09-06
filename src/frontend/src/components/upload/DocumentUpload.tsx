import React, { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileUpload } from '../../hooks/useFileUpload';
import { FileList } from './FileList';
import { ErrorAlert } from './ErrorAlert';
import type { UploadedDocument } from '../../types';

interface DocumentUploadProps {
  onDocumentUploaded?: (document: UploadedDocument) => void;
  onDocumentRemoved?: (documentId: string) => void;
  documents?: UploadedDocument[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentUploaded, 
  onDocumentRemoved,
  documents: externalDocuments 
}) => {
  const { documents: internalDocuments, isUploading, globalErrors, uploadFiles, removeDocument, clearErrors } = useFileUpload();
  
  const documents = externalDocuments || internalDocuments;

  useEffect(() => {
    if (onDocumentUploaded) {
      internalDocuments.forEach(doc => {
        onDocumentUploaded(doc);
      });
    }
  }, [internalDocuments, onDocumentUploaded]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      uploadFiles(acceptedFiles);
    },
    [uploadFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/svg+xml': ['.svg'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Documents
          </h1>
          <p className="text-gray-600">
            Drop files here or click to browse
          </p>
        </div>

        <ErrorAlert errors={globalErrors} onClose={clearErrors} />

        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
            ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 bg-white'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            {isDragActive ? (
              <p className="text-xl font-medium text-blue-600">
                Drop files here
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xl font-medium text-gray-900">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-500">
                  PDF, images, CSV, TXT • Up to 10MB each
                </p>
              </div>
            )}
          </div>
          
          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-blue-600 font-medium">Uploading...</span>
              </div>
            </div>
          )}
        </div>

        {documents.length > 0 && (
          <div className="mt-8">
            <FileList documents={documents} onRemove={(id) => {
              removeDocument(id);
              if (onDocumentRemoved) {
                onDocumentRemoved(id);
              }
            }} />
          </div>
        )}
      </div>
    </div>
  );
};