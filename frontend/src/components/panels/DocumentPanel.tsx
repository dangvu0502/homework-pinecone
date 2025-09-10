import { AlertCircle, CheckCircle, File, Loader2, Trash2 } from "lucide-react";
import React, { useState } from "react";
import type { Document } from "../../stores/useDocumentStore";
import { useDocumentStore } from "../../stores/useDocumentStore";
import { useLayoutStore } from "../../stores/useLayoutStore";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DocumentUpload from "../upload/DocumentUpload";

interface DocumentPanelProps {
  documents: Document[];
  selectedIds: number[];
  processingStatus: Record<number, "processing" | "ready" | "error">;
}

const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  processingStatus,
}) => {
  const { selectedDocumentId, selectDocument } = useLayoutStore();
  const { deleteDocument } = useDocumentStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusIcon = (doc: Document) => {
    const status = processingStatus[doc.id] || doc.status;

    const iconMap: Record<
      string,
      { icon: React.ReactNode; label: string; bgClass: string }
    > = {
      processing: {
        icon: <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />,
        label: "Processing document...",
        bgClass: "bg-blue-50 border-blue-200",
      },
      ready: {
        icon: <CheckCircle className="w-3 h-3 text-green-600" />,
        label: "Ready for chat",
        bgClass: "bg-green-50 border-green-200",
      },
      error: {
        icon: <AlertCircle className="w-3 h-3 text-red-600" />,
        label: "Processing failed",
        bgClass: "bg-red-50 border-red-200",
      },
      uploaded: {
        icon: <File className="w-3 h-3 text-amber-600" />,
        label: "Awaiting processing",
        bgClass: "bg-amber-50 border-amber-200",
      },
    };

    const { icon, label, bgClass } = iconMap[status] || {
      icon: <File className="w-3 h-3 text-gray-400" />,
      label: "Unknown status",
      bgClass: "bg-gray-50 border-gray-200",
    };

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <div
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full border cursor-help ${bgClass}`}
          >
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs font-medium">{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return "just now";
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    // Less than a week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleDeleteClick = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteDocument(documentToDelete.id);
      
      // If the deleted document was selected, clear the selection
      if (selectedDocumentId === documentToDelete.id) {
        selectDocument(null);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-full flex flex-col">
        <div className="p-6 pb-3">
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
            <div className="space-y-2 p-4">
              <RadioGroup
                value={selectedDocumentId?.toString() || ""}
                onValueChange={(value) => {
                  const numericId = parseInt(value);
                  const doc = documents.find(d => d.id === numericId);
                  const status = processingStatus[numericId] || doc?.status;
                  const isProcessing = status === 'processing' || status === 'uploaded';
                  
                  if (!isProcessing) {
                    selectDocument(numericId === selectedDocumentId ? null : numericId);
                  }
                }}
              >
                {documents.map((doc) => {
                  const status = processingStatus[doc.id] || doc.status;
                  const isProcessing = status === 'processing' || status === 'uploaded';
                  
                  return (
                  <Card
                    key={doc.id}
                    className={`transition-all overflow-hidden ${
                      isProcessing 
                        ? "opacity-60 cursor-not-allowed" 
                        : selectedDocumentId === doc.id
                        ? "ring-2 ring-primary bg-primary/10 border-transparent cursor-pointer"
                        : "hover:bg-accent hover:shadow-sm cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isProcessing) {
                        selectDocument(
                          selectedDocumentId === doc.id ? null : doc.id
                        );
                      }
                    }}
                    style={{ maxWidth: "100%" }}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <RadioGroupItem
                          value={doc.id.toString()}
                          id={doc.id.toString()}
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          disabled={isProcessing}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 max-w-full">
                            <div className="flex-shrink-0">
                              {getStatusIcon(doc)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-sm font-medium cursor-default leading-tight">
                                    <span
                                      className="block truncate"
                                      title={doc.filename}
                                    >
                                      {doc.filename}
                                    </span>
                                  </p>
                                </TooltipTrigger>
                                {doc.filename.length > 30 && (
                                  <TooltipContent
                                    side="top"
                                    className="max-w-sm break-words z-50 p-2"
                                  >
                                    <p className="text-xs leading-relaxed">
                                      {doc.filename}
                                    </p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => handleDeleteClick(e, doc)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatFileSize(doc.size)} •{" "}
                            {doc.contentType.split("/").pop()} •{" "}
                            {formatDate(doc.uploadedAt)}
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
                  );
                })}
              </RadioGroup>
            </div>
          )}
        </div>
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.filename}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};

export default DocumentPanel;
