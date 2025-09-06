import React from 'react';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
            <div className="text-xs font-semibold mb-2 opacity-70">Sources:</div>
            <div className="space-y-1">
              {message.sources.map((source, index) => (
                <div
                  key={`${source.documentId}-${index}`}
                  className="text-xs opacity-80"
                >
                  <span className="font-medium">{source.documentName}</span>
                  {source.page && <span className="ml-1">(p. {source.page})</span>}
                  {source.snippet && (
                    <div className="mt-1 italic truncate">
                      "{source.snippet}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="text-xs mt-2 opacity-60">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};