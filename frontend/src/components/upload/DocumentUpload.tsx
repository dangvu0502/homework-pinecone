import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, FileUp, Plus, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDocumentStore, type Document } from '../../stores/useDocumentStore';
import { ErrorAlert } from './ErrorAlert';

interface DocumentUploadProps {
  onDocumentUploaded?: (document: Document) => void;
  onDocumentRemoved?: (documentId: string) => void;
  documents?: Document[];
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onDocumentUploaded, 
}) => {
  const { uploadDocument, isLoading: isUploading, error } = useDocumentStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const clearErrors = useCallback(() => {
    setGlobalErrors([]);
  }, []);

  // Effect to handle store errors
  useEffect(() => {
    if (error) {
      setGlobalErrors([error]);
    }
  }, [error]);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        const validFiles: File[] = [];
        const errors: string[] = [];

        // Validate all files first
        fileArray.forEach(file => {
          const error = validateFile(file);
          if (error) {
            errors.push(`${file.name}: ${error}`);
          } else {
            validFiles.push(file);
          }
        });

        if (errors.length > 0) {
          setGlobalErrors(errors);
        }

        // Upload valid files
        if (validFiles.length > 0) {
          try {
            await Promise.all(validFiles.map(file => uploadDocument(file)));
            setIsModalOpen(false);
          } catch (err) {
            setGlobalErrors([err instanceof Error ? err.message : 'Upload failed']);
          }
        }
        
        // Reset the input value to allow selecting the same file again
        event.target.value = '';
      }
    },
    [uploadDocument, validateFile]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate all files first
      acceptedFiles.forEach(file => {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        setGlobalErrors(errors);
      }

      // Upload valid files
      if (validFiles.length > 0) {
        try {
          await Promise.all(validFiles.map(file => uploadDocument(file)));
          setIsModalOpen(false);
        } catch (err) {
          setGlobalErrors([err instanceof Error ? err.message : 'Upload failed']);
        }
      }
    },
    [uploadDocument, validateFile]
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
    <div className="h-full overflow-y-auto">
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
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="h-9 px-4 gap-2 font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="inline">Upload</span>
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
              <DialogDescription>
                Drag and drop files or click to browse. Supports PDF, PNG, JPG, JPEG, SVG, CSV, and TXT files up to 10MB each.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Card
                {...getRootProps()}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed transition-all duration-200 ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
                } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
              >
                <CardContent className="py-12 px-8 text-center">
                  <input {...getInputProps()} />
                  
                  <div className="space-y-6">
                    <div className={`w-20 h-20 mx-auto rounded-full p-5 transition-all duration-300 ${
                      isDragActive ? 'bg-primary/10 scale-110' : 'bg-muted'
                    }`}>
                      {isDragActive ? (
                        <FileUp className="w-full h-full text-primary animate-bounce" />
                      ) : (
                        <Upload className="w-full h-full text-muted-foreground" />
                      )}
                    </div>
                    
                    {isUploading ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                          <span className="text-primary font-medium">Uploading files...</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Please wait while we process your documents</div>
                      </div>
                    ) : isDragActive ? (
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-primary">
                          Drop your files here!
                        </p>
                        <p className="text-sm text-primary/80">
                          Release to start uploading
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-lg font-medium">
                          Drag & drop your files here
                        </p>
                        <p className="text-sm text-muted-foreground">
                          or <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="text-primary hover:underline font-medium"
                          >browse</button> from your computer
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Max 10MB per file
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border-dashed">
                  <CardContent className="p-3 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                    <div className="text-xs font-medium">Formats</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      PDF, Images, CSV, TXT
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-dashed">
                  <CardContent className="p-3 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                    <div className="text-xs font-medium">Size Limit</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      10MB per file
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-dashed">
                  <CardContent className="p-3 text-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
                    <div className="text-xs font-medium">Multiple Files</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Upload many at once
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default DocumentUpload;