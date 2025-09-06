import { create } from 'zustand';

export interface DocumentSource {
  documentId: string;
  documentName: string;
  snippet: string;
  relevanceScore?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: DocumentSource[];
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  documentIds: string[];
}

interface ChatStore {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: Message[];
  isStreaming: boolean;
  streamingMessage: string;
  
  // Actions
  createSession: (title: string, documentIds: string[]) => ChatSession;
  setCurrentSession: (sessionId: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateStreamingMessage: (content: string) => void;
  completeStreamingMessage: (sources?: DocumentSource[]) => void;
  setStreaming: (isStreaming: boolean) => void;
  clearMessages: () => void;
  updateContext: (documentIds: string[]) => void;
  deleteSession: (sessionId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isStreaming: false,
  streamingMessage: '',
  
  createSession: (title, documentIds) => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
      documentIds,
    };
    
    set((state) => ({
      sessions: [...state.sessions, newSession],
      currentSession: newSession,
      messages: [],
    }));
    
    return newSession;
  },
  
  setCurrentSession: (sessionId) =>
    set((state) => {
      const session = sessionId
        ? state.sessions.find((s) => s.id === sessionId) || null
        : null;
      return {
        currentSession: session,
        messages: [],
      };
    }),
    
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random()}`,
          timestamp: new Date(),
        },
      ],
    })),
    
  updateStreamingMessage: (content) =>
    set({ streamingMessage: content }),
    
  completeStreamingMessage: (sources) =>
    set((state) => {
      if (!state.streamingMessage) return state;
      
      return {
        messages: [
          ...state.messages,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant' as const,
            content: state.streamingMessage,
            sources,
            timestamp: new Date(),
          },
        ],
        streamingMessage: '',
        isStreaming: false,
      };
    }),
    
  setStreaming: (isStreaming) =>
    set({ isStreaming }),
    
  clearMessages: () =>
    set({ messages: [], streamingMessage: '' }),
    
  updateContext: (documentIds) =>
    set((state) => {
      if (!state.currentSession) return state;
      
      const updatedSession = {
        ...state.currentSession,
        documentIds,
        updatedAt: new Date(),
      };
      
      return {
        currentSession: updatedSession,
        sessions: state.sessions.map((s) =>
          s.id === updatedSession.id ? updatedSession : s
        ),
      };
    }),
    
  deleteSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      currentSession:
        state.currentSession?.id === sessionId ? null : state.currentSession,
      messages:
        state.currentSession?.id === sessionId ? [] : state.messages,
    })),
}));