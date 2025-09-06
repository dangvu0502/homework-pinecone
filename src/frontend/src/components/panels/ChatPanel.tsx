import React, { useEffect, useRef } from 'react';
import { Send, RotateCw, FileText, MessageSquare } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import type { ChatSession, Message } from '../../stores/useChatStore';
import { useLayoutStore } from '../../stores/useLayoutStore';
import { MessageBubble } from '../chat/MessageBubble';
import { StreamingMessage } from '../chat/StreamingMessage';

interface ChatPanelProps {
  session: ChatSession | null;
  messages: Message[];
  contextDocuments: string[];
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  session,
  messages,
  contextDocuments,
}) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { selectedDocument } = useLayoutStore();
  const { 
    addMessage, 
    isStreaming, 
    streamingMessage, 
    clearMessages,
    createSession 
  } = useChatStore();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);
  
  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    
    const messageContent = input.trim();
    setInput('');
    
    if (!session && selectedDocument) {
      createSession('New Chat Session', [selectedDocument]);
    }
    
    addMessage({
      role: 'user',
      content: messageContent,
    });
    
    // TODO: Implement actual streaming API call
    // For now, simulate a response
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: 'This is a simulated response. The actual streaming implementation will connect to the backend API.',
        sources: selectedDocument ? [
          {
            documentId: selectedDocument,
            documentName: 'Document 1',
            snippet: 'Relevant excerpt from the document...',
          }
        ] : undefined,
      });
    }, 1000);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const hasDocuments = contextDocuments.length > 0;
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              CHAT ASSISTANT
            </h2>
            {contextDocuments.length > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <FileText className="w-3 h-3 mr-1" />
                1 document
              </span>
            )}
          </div>
          <button
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed"
            title="Clear chat"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && !streamingMessage ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Start a conversation
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {hasDocuments
                  ? 'Ask questions about your selected document'
                  : 'Select a document from the left panel to provide context for your questions'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {streamingMessage && (
              <StreamingMessage content={streamingMessage} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex space-x-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type message..."
            disabled={!hasDocuments || isStreaming}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 
                     placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 
                     focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 
                     dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || !hasDocuments || isStreaming}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                     disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed 
                     transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {!hasDocuments && (
          <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
            Select a document from the left panel to enable chat
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;