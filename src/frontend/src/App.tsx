
import React, { useState } from 'react';
import { DocumentUpload } from './components/upload/DocumentUpload';
import { ChatInterface } from './components/chat/ChatInterface';
import type { UploadedDocument } from './types';

function App() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'chat'>('upload');

  const handleDocumentUploaded = (newDoc: UploadedDocument) => {
    setDocuments(prev => {
      const existing = prev.find(doc => doc.id === newDoc.id);
      if (existing) {
        return prev.map(doc => doc.id === newDoc.id ? newDoc : doc);
      }
      return [...prev, newDoc];
    });
  };

  const handleDocumentRemoved = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        <header className="flex-none bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              RAG Application
            </h1>
          </div>
          <div className="px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Upload Documents
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Chat ({documents.filter(d => d.status === 'ready').length} docs)
              </button>
            </nav>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">
          {activeTab === 'upload' ? (
            <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
              <DocumentUpload 
                onDocumentUploaded={handleDocumentUploaded}
                onDocumentRemoved={handleDocumentRemoved}
                documents={documents}
              />
            </div>
          ) : (
            <ChatInterface documents={documents} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App
