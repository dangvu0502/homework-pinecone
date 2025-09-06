import React, { useEffect, useRef } from 'react';

interface StreamingMessageProps {
  content: string;
  isStreaming: boolean;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ 
  content, 
  isStreaming 
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [content]);

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[70%] rounded-lg px-4 py-3 bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100">
        <div className="whitespace-pre-wrap break-words">
          {content}
          {isStreaming && (
            <span className="inline-block ml-1 animate-pulse">▋</span>
          )}
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
};