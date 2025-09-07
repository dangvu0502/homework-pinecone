import React, { useState, useRef, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { DocumentSelector } from './DocumentSelector';
import { useChatStream } from '../../hooks/useChatStream';
import type { UploadedDocument } from '../../types';

interface ChatInterfaceProps {
  documents: UploadedDocument[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ documents }) => {
  const [input, setInput] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    isStreaming,
    streamingMessage,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useChatStream(sessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  useEffect(() => {
    const readyDocs = documents.filter(doc => doc.status === 'ready');
    if (readyDocs.length > 0 && selectedDocuments.length === 0) {
      setSelectedDocuments(readyDocs.map(doc => doc.id));
    }
  }, [documents, selectedDocuments.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isStreaming) return;
    
    const message = input.trim();
    setInput('');
    
    await sendMessage(message, selectedDocuments);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearMessages();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex-none p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Chat Assistant
          </h2>
          <button
            onClick={handleClearChat}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Clear Chat
          </button>
        </div>
        
        <DocumentSelector
          documents={documents}
          selectedDocuments={selectedDocuments}
          onSelectionChange={setSelectedDocuments}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Welcome to the RAG Chat Assistant</p>
            <p className="text-sm">
              {documents.filter(d => d.status === 'ready').length > 0
                ? 'Select documents above and start asking questions!'
                : 'Upload some documents to get started!'}
            </p>
          </div>
        )}
        
        {messages.map((message) => (
          message.isStreaming ? (
            <StreamingMessage
              key={message.id}
              content={message.content}
              isStreaming={true}
            />
          ) : (
            <MessageBubble key={message.id} message={message} />
          )
        ))}
        
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex-none p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedDocuments.length === 0
                ? 'Select documents first...'
                : 'Type your message... (Shift+Enter for new line)'
            }
            disabled={isStreaming || selectedDocuments.length === 0}
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-gray-100 resize-none"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || selectedDocuments.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
};