import { useState, useCallback } from 'react';
import { useUploadDocument, useDocuments } from './useApi';
import type { UploadedDocument } from '../types';


export const useFileUpload = () => {
  const [localDocuments, setLocalDocuments] = useState<UploadedDocument[]>([]);
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);
  const uploadMutation = useUploadDocument();
  const { data: serverDocuments } = useDocuments();
  
  // Combine local and server documents
  const documents = [
    ...localDocuments,
    ...(serverDocuments?.map(doc => ({
      id: doc.id.toString(),
      filename: doc.filename,
      contentType: 'application/octet-stream',
      size: doc.size,
      status: doc.status as UploadedDocument['status'],
      uploadedAt: doc.uploaded_at,
    })) || []),
  ];
  
  const isUploading = uploadMutation.isPending;

  const validateFile = useCallback((file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/svg+xml',
      'text/csv',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, PNG, JPEG, SVG, CSV, or TXT files.';
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB.';
    }

    return null;
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<void> => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Add file to local documents with uploading status
    const newDocument: UploadedDocument = {
      id: tempId,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      status: 'uploading',
      uploadedAt: new Date().toISOString(),
      progress: 0,
    };

    setLocalDocuments(prev => [...prev, newDocument]);

    try {
      await uploadMutation.mutateAsync(file);
      
      // Remove from local documents after successful upload
      setLocalDocuments(prev => prev.filter(doc => doc.id !== tempId));
    } catch (error) {
      // Update local document with error status
      setLocalDocuments(prev =>
        prev.map(doc =>
          doc.id === tempId
            ? {
                ...doc,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error occurred',
              }
            : doc
        )
      );
    }
  }, [uploadMutation]);

  const uploadFiles = useCallback(async (files: File[]): Promise<void> => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Clear previous global errors
    setGlobalErrors([]);

    // Validate all files first
    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      // Show validation errors in the UI
      setGlobalErrors(errors);
    }

    // Upload valid files
    if (validFiles.length > 0) {
      await Promise.all(validFiles.map(uploadFile));
    }
  }, [validateFile, uploadFile]);

  const removeDocument = useCallback((id: string) => {
    // Remove from local documents if it's a temp document
    if (id.startsWith('temp-')) {
      setLocalDocuments(prev => prev.filter(doc => doc.id !== id));
    }
    // Server documents are handled by the store
  }, []);

  const clearErrors = useCallback(() => {
    setGlobalErrors([]);
  }, []);

  return {
    documents,
    isUploading,
    globalErrors,
    uploadFiles,
    removeDocument,
    validateFile,
    clearErrors,
  };
};