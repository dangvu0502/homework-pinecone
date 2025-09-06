import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentUploaded, 
  onDocumentRemoved,
  documents: externalDocuments 
}) => {
  const { documents: internalDocuments, isUploading, globalErrors, uploadFiles, removeDocument, clearErrors } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const documents = externalDocuments || internalDocuments;

  useEffect(() => {
    if (onDocumentUploaded) {
      internalDocuments.forEach(doc => {
        onDocumentUploaded(doc);
      });
    }
  }, [internalDocuments, onDocumentUploaded]);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        uploadFiles(Array.from(files));
      }
    },
    [uploadFiles]
  );

  const handleButtonClick = () => {
    setIsModalOpen(true);
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      uploadFiles(acceptedFiles);
      setIsModalOpen(false);
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
    noClick: true,
  });

  return (
    <div className="h-full overflow-y-auto p-2">
      <div className="w-full">
        <ErrorAlert errors={globalErrors} onClose={clearErrors} />
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.svg,.csv,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={handleButtonClick}
          disabled={isUploading}
          className="w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {documents.length > 0 && (
          <div className="mt-2">
            <FileList documents={documents} onRemove={(id) => {
              removeDocument(id);
              if (onDocumentRemoved) {
                onDocumentRemoved(id);
              }
            }} />
          </div>
        )}

        {/* Upload Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Upload Documents</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Dropzone Area */}
                <div
                  {...getRootProps()}
                  className={`
                    relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
                    ${isDragActive 
                      ? 'border-blue-400 bg-blue-50 border-solid' 
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }
                    ${isUploading ? 'pointer-events-none opacity-60' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto text-blue-500">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    
                    {isUploading ? (
                      <div className="flex items-center justify-center space-x-3">
                        <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-blue-600 font-medium">Uploading files...</span>
                      </div>
                    ) : isDragActive ? (
                      <div>
                        <p className="text-lg font-medium text-blue-600 mb-1">
                          Drop files here
                        </p>
                        <p className="text-sm text-blue-500">
                          Release to upload
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium text-gray-900 mb-2">
                          Drag & drop files here
                        </p>
                        <p className="text-sm text-gray-500">
                          or click to browse
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Constraints */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900 text-sm">File Requirements</h4>
                  
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Supported formats:</strong> PDF, PNG, JPG, JPEG, SVG, CSV, TXT</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Maximum size:</strong> 10MB per file</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span><strong>Multiple files:</strong> Select as many as you need</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;