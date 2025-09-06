import { AlertCircle, CheckCircle, File, Loader2 } from 'lucide-react';
import React from 'react';
import type { Document } from '../../stores/useDocumentStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import DocumentUpload from '../upload/DocumentUpload';

interface DocumentPanelProps {
  documents: Document[];
  selectedIds: string[];
  processingStatus: Record<string, 'processing' | 'ready' | 'error'>;
}

const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  processingStatus,
}) => {
  const { selectedDocument, selectDocument } = useLayoutStore();
  
  const getStatusIcon = (doc: Document) => {
    const status = processingStatus[doc.id] || doc.status;
    
    const iconMap: Record<string, { icon: React.ReactNode; label: string }> = {
      processing: { icon: <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />, label: 'Processing' },
      ready: { icon: <CheckCircle className="w-4 h-4 text-green-500" />, label: 'Ready' },
      error: { icon: <AlertCircle className="w-4 h-4 text-red-500" />, label: 'Error' },
      uploaded: { icon: <File className="w-4 h-4 text-gray-400" />, label: 'Uploaded' },
    };
    
    const { icon, label } = iconMap[status] || { icon: <File className="w-4 h-4 text-gray-400" />, label: 'Unknown' };
    
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center cursor-help">
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Documents ({documents.length})
          </h2>
          <DocumentUpload />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {documents.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <File className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No documents uploaded yet</p>
            <p className="text-xs mt-1">Click the + button to add files</p>
          </div>
        ) : (
          <div className="space-y-3 p-3">
            <RadioGroup 
              value={selectedDocument || ''} 
              onValueChange={(value) => selectDocument(value === selectedDocument ? null : value)}
            >
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className={`cursor-pointer transition-all ${
                    selectedDocument === doc.id 
                      ? 'ring-2 ring-primary bg-primary/10 border-transparent' 
                      : 'hover:bg-accent hover:shadow-sm'
                  }`}
                  onClick={() => selectDocument(selectedDocument === doc.id ? null : doc.id)}
                >
                  <CardContent className="py-2 px-3">
                    <div className="flex items-start gap-3">
                      <RadioGroupItem 
                        value={doc.id} 
                        id={doc.id}
                        className="w-4 h-4 mt-0.5"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(doc)}
                          <p className="text-sm font-medium truncate flex-1" title={doc.filename}>
                            {doc.filename}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(doc.size)} • {doc.contentType}
                        </div>
                        
                        {doc.errorMessage && (
                          <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                            {doc.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>
      
      </div>
    </TooltipProvider>
  );
};

export default DocumentPanel;