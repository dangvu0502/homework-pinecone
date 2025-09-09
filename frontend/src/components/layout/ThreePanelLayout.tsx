import React, { useEffect, useState } from "react";
import { useLayoutStore } from "../../stores/useLayoutStore";
import { useDocumentStore } from "../../stores/useDocumentStore";
import { useChatStore } from "../../stores/useChatStore";
import { useIntegratedState } from "../../hooks/useIntegratedState";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FileText, BarChart } from "lucide-react";
import DocumentPanel from "../panels/DocumentPanel";
import ChatPanel from "../panels/ChatPanel";
import DocumentInsights from "../panels/DocumentInsights";
import Header from "./Header";

const ThreePanelLayout: React.FC = () => {
  // Initialize integrated state hooks
  useIntegratedState();

  const {
    selectedDocument,
    panelVisibility,
    setMobileView,
  } = useLayoutStore();

  const { documents, processingStatus } = useDocumentStore();
  const { messages } = useChatStore();
  
  const selectedDocumentObj = documents.find(doc => doc.id === selectedDocument);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  console.log({
    ...panelVisibility,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setMobileView(width < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setMobileView]);

  const isMobileOrTablet = windowWidth < 1024;
  
  if (isMobileOrTablet) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header />
        
        {/* Mobile Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">Documents ({documents.length})</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90vw] sm:w-[85vw] max-w-sm p-0">
              <SheetHeader className="p-4 pb-2 border-b">
                <SheetTitle>Documents</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <DocumentPanel
                  documents={documents}
                  selectedIds={selectedDocument ? [selectedDocument] : []}
                  processingStatus={processingStatus}
                />
              </div>
            </SheetContent>
          </Sheet>
          
          {selectedDocumentObj && (
            <div className="flex-1 text-center px-2">
              <span className="text-sm text-muted-foreground truncate block">
                {selectedDocumentObj.filename}
              </span>
            </div>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <BarChart className="h-4 w-4" />
                <span className="text-sm">Insights</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90vw] sm:w-[85vw] max-w-sm p-0">
              <SheetHeader className="p-4 pb-2 border-b">
                <SheetTitle>Quick Search</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <DocumentInsights 
                  selectedDocument={selectedDocument} 
                  selectedDocumentName={selectedDocumentObj?.filename}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Chat Panel - Full Height */}
        <div className="flex-1 overflow-hidden">
          <ChatPanel
            messages={messages}
            contextDocuments={documents.filter(doc => selectedDocument === doc.id).map(doc => doc.id)}
            selectedDocumentName={selectedDocumentObj?.filename}
          />
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {panelVisibility.documents && (
          <div className="w-80 flex-shrink-0 border-r border-border bg-card overflow-y-auto">
            <DocumentPanel
              documents={documents}
              selectedIds={selectedDocument ? [selectedDocument] : []}
              processingStatus={processingStatus}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 flex flex-col bg-background overflow-hidden">
          <ChatPanel
            messages={messages}
            contextDocuments={selectedDocument ? [selectedDocument] : []}
            selectedDocumentName={selectedDocumentObj?.filename}
          />
        </div>

        {panelVisibility.insights && (
          <div className="w-96 xl:w-[28rem] flex-shrink-0 border-l border-border bg-card overflow-y-auto">
            <DocumentInsights 
              selectedDocument={selectedDocument}
              selectedDocumentName={selectedDocumentObj?.filename}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreePanelLayout;
