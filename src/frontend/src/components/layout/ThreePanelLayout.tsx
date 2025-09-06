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
  const { currentSession, messages } = useChatStore();
  
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

  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isMobile = windowWidth < 768;
  
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 overflow-hidden relative">
          <ChatPanel
            session={currentSession}
            messages={messages}
            contextDocuments={documents.filter(doc => selectedDocument === doc.id).map(doc => doc.id)}
            selectedDocumentName={selectedDocumentObj?.filename}
          />
          
          {/* Mobile Navigation Sheets */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <FileText className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <SheetHeader>
                  <SheetTitle>Documents ({documents.length})</SheetTitle>
                </SheetHeader>
                <div className="mt-4 h-full overflow-hidden">
                  <DocumentPanel
                    documents={documents}
                    selectedIds={selectedDocument ? [selectedDocument] : []}
                    processingStatus={processingStatus}
                  />
                </div>
              </SheetContent>
            </Sheet>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <BarChart className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Document Insights</SheetTitle>
                </SheetHeader>
                <div className="mt-4 h-full overflow-hidden">
                  <DocumentInsights selectedDocument={selectedDocument} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <Header />
        <div className="flex-1 flex gap-4">
          {panelVisibility.documents && (
            <div className="w-64 bg-gray-50 dark:bg-gray-800">
              <DocumentPanel
                documents={documents}
                selectedIds={selectedDocument ? [selectedDocument] : []}
                processingStatus={processingStatus}
              />
            </div>
          )}
          <div className="flex-1 bg-white dark:bg-gray-900">
            <ChatPanel
              session={currentSession}
              messages={messages}
              contextDocuments={selectedDocument ? [selectedDocument] : []}
              selectedDocumentName={selectedDocumentObj?.filename}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="flex-1 flex gap-4">
        {panelVisibility.documents && (
          <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800">
            <DocumentPanel
              documents={documents}
              selectedIds={selectedDocument ? [selectedDocument] : []}
              processingStatus={processingStatus}
            />
          </div>
        )}

        <div className="flex-1 min-w-0 bg-white dark:bg-gray-900">
          <ChatPanel
            session={currentSession}
            messages={messages}
            contextDocuments={selectedDocument ? [selectedDocument] : []}
            selectedDocumentName={selectedDocumentObj?.filename}
          />
        </div>

        {panelVisibility.insights && (
          <div className="w-80 flex-shrink-0 bg-gray-50 dark:bg-gray-800">
            <DocumentInsights selectedDocument={selectedDocument} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreePanelLayout;
