import { useState, useCallback } from 'react';
import type { UploadedDocument, FileUploadResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useFileUpload = () => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);

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
    
    // Add file to documents with uploading status
    const newDocument: UploadedDocument = {
      id: tempId,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      status: 'uploading',
      uploadedAt: new Date().toISOString(),
      progress: 0,
    };

    setDocuments(prev => [...prev, newDocument]);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.onprogress = (event: ProgressEvent<XMLHttpRequestEventTarget>) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setDocuments(prev =>
            prev.map(doc =>
              doc.id === tempId
                ? { ...doc, progress }
                : doc
            )
          );
        }
      };

      // Handle response
      xhr.onload = () => {
        if (xhr.status === 200) {
          const response: FileUploadResponse = JSON.parse(xhr.responseText);
          setDocuments(prev =>
            prev.map(doc =>
              doc.id === tempId
                ? {
                    ...doc,
                    id: response.id,
                    status: response.status,
                    progress: 100,
                  }
                : doc
            )
          );
        } else {
          const errorMessage = xhr.responseText || 'Upload failed';
          setDocuments(prev =>
            prev.map(doc =>
              doc.id === tempId
                ? {
                    ...doc,
                    status: 'error',
                    error: errorMessage,
                  }
                : doc
            )
          );
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setDocuments(prev =>
          prev.map(doc =>
            doc.id === tempId
              ? {
                  ...doc,
                  status: 'error',
                  error: 'Network error occurred during upload',
                }
              : doc
          )
        );
        setIsUploading(false);
      };

      xhr.open('POST', `${API_URL}/api/documents`);
      xhr.send(formData);
    } catch (error) {
      setDocuments(prev =>
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
      setIsUploading(false);
    }
  }, []);

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
    setDocuments(prev => prev.filter(doc => doc.id !== id));
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