import React, { useEffect, useState } from "react";
import { useLayoutStore } from "../../stores/useLayoutStore";
import { useDocumentStore } from "../../stores/useDocumentStore";
import { useChatStore } from "../../stores/useChatStore";
import { useIntegratedState } from "../../hooks/useIntegratedState";
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
    activePanel,
    setMobileView,
    setActivePanel,
  } = useLayoutStore();

  const { documents, processingStatus } = useDocumentStore();
  const { currentSession, messages } = useChatStore();

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

  const renderMobileNavigation = () => (
    <div className="flex justify-around bg-white dark:bg-gray-800">
      <button
        onClick={() => setActivePanel("documents")}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          activePanel === "documents"
            ? "text-blue-600"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        }`}
      >
        Documents ({documents.length})
      </button>
      <button
        onClick={() => setActivePanel("chat")}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          activePanel === "chat"
            ? "text-blue-600"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        }`}
      >
        Chat
      </button>
      <button
        onClick={() => setActivePanel("insights")}
        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
          activePanel === "insights"
            ? "text-blue-600"
            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        }`}
      >
        Insights
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        <Header />
        {renderMobileNavigation()}
        <div className="flex-1 overflow-hidden">
          {activePanel === "documents" && (
            <DocumentPanel
              documents={documents}
              selectedIds={selectedDocument ? [selectedDocument] : []}
              processingStatus={processingStatus}
            />
          )}
          {activePanel === "chat" && (
            <ChatPanel
              session={currentSession}
              messages={messages}
              contextDocuments={selectedDocument ? [selectedDocument] : []}
            />
          )}
          {activePanel === "insights" && (
            <DocumentInsights selectedDocument={selectedDocument} />
          )}
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
        <Header />
        <div className="flex-1 flex gap-2">
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
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="flex-1 flex gap-2">
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
