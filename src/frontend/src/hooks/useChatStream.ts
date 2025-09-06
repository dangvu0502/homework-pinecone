import { useState, useCallback, useRef } from 'react';
import type { Message, StreamEvent, DocumentSource } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useChatStream = (sessionId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentMessageIdRef = useRef<string | null>(null);
  const sourcesRef = useRef<DocumentSource[]>([]);

  const sendMessage = useCallback(async (content: string, documentIds?: string[]) => {
    if (isStreaming) return;

    setIsStreaming(true);
    setError(null);
    setStreamingMessage('');
    sourcesRef.current = [];

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    const assistantMessageId = `msg-${Date.now() + 1}`;
    currentMessageIdRef.current = assistantMessageId;

    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const params = new URLSearchParams();
      params.append('content', content);
      if (documentIds && documentIds.length > 0) {
        params.append('documentIds', documentIds.join(','));
      }

      const url = `${API_BASE_URL}/api/chat/sessions/${sessionId}/stream`;
      eventSourceRef.current = new EventSource(`${url}?${params.toString()}`);

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data: StreamEvent = JSON.parse(event.data);

          switch (data.type) {
            case 'token':
              if (data.content) {
                setStreamingMessage(prev => prev + data.content);
                setMessages(prev => {
                  const currentContent = prev.find(m => m.id === assistantMessageId)?.content || '';
                  return prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: currentContent + data.content }
                      : msg
                  );
                });
              }
              break;

            case 'source':
              if (data.documentId && data.snippet) {
                const source: DocumentSource = {
                  documentId: data.documentId,
                  documentName: data.documentId,
                  snippet: data.snippet,
                };
                sourcesRef.current.push(source);
              }
              break;

            case 'complete':
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { 
                        ...msg, 
                        isStreaming: false,
                        sources: sourcesRef.current.length > 0 ? sourcesRef.current : undefined
                      }
                    : msg
                )
              );
              setIsStreaming(false);
              setStreamingMessage('');
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              break;

            case 'error':
              setError(data.error || 'An error occurred');
              setIsStreaming(false);
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
              }
              break;
          }
        } catch (err) {
          console.error('Error parsing SSE data:', err);
        }
      };

      eventSourceRef.current.onerror = (err) => {
        console.error('SSE connection error:', err);
        setError('Connection lost. Please try again.');
        setIsStreaming(false);
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
      };
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setIsStreaming(false);
    }
  }, [sessionId, isStreaming]);

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsStreaming(false);
    if (currentMessageIdRef.current) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === currentMessageIdRef.current
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage('');
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    streamingMessage,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
};