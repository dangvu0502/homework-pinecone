import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, FileUp, Plus, Upload } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useFileUpload } from '../../hooks/useFileUpload';
import type { UploadedDocument } from '../../types';
import { ErrorAlert } from './ErrorAlert';
import { FileList } from './FileList';

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
              className="h-8 px-3 gap-1"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
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
                          or <button className="text-primary hover:underline font-medium">browse</button> from your computer
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
      </div>
    </div>
  );
};

export default DocumentUpload;