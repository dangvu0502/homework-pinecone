import { create } from 'zustand';
import { chatApi } from '../services/api';

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
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createSession: (title: string, documentIds: string[]) => Promise<ChatSession>;
  setCurrentSession: (sessionId: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateStreamingMessage: (content: string) => void;
  completeStreamingMessage: (sources?: DocumentSource[]) => void;
  setStreaming: (isStreaming: boolean) => void;
  clearMessages: () => void;
  updateContext: (documentIds: string[]) => void;
  deleteSession: (sessionId: string) => void;
  
  // API Actions
  sendMessage: (message: string) => Promise<void>;
  loadSessionHistory: (sessionId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isStreaming: false,
  streamingMessage: '',
  isLoading: false,
  error: null,
  
  createSession: async (title, documentIds) => {
    set({ isLoading: true, error: null });
    try {
      const numericIds = documentIds.map(id => parseInt(id));
      const response = await chatApi.createSession(numericIds);
      
      const newSession: ChatSession = {
        id: response.id.toString(),
        title,
        createdAt: new Date(),
        updatedAt: new Date(),
        documentIds,
      };
      
      set((state) => ({
        sessions: [...state.sessions, newSession],
        currentSession: newSession,
        messages: [],
        isLoading: false,
      }));
      
      return newSession;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create session', isLoading: false });
      throw error;
    }
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
  
  sendMessage: async (message) => {
    const state = get();
    if (!state.currentSession) {
      set({ error: 'No active session' });
      return;
    }
    
    // Add user message
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg-${Date.now()}`,
          role: 'user' as const,
          content: message,
          timestamp: new Date(),
        },
      ],
      isStreaming: true,
      streamingMessage: '',
    }));
    
    try {
      let fullContent = '';
      await chatApi.sendMessage(
        parseInt(state.currentSession.id),
        message,
        (chunk) => {
          fullContent += chunk;
          set({ streamingMessage: fullContent });
        }
      );
      
      // Complete the streaming message
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant' as const,
            content: fullContent,
            timestamp: new Date(),
          },
        ],
        streamingMessage: '',
        isStreaming: false,
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send message',
        isStreaming: false,
        streamingMessage: '',
      });
    }
  },
  
  loadSessionHistory: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const history = await chatApi.getSessionHistory(parseInt(sessionId));
      
      const messages: Message[] = history.messages.map(msg => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        sources: msg.sources?.map(s => ({
          documentId: s.document,
          documentName: s.document,
          snippet: '',
          relevanceScore: s.relevance,
        })),
        timestamp: new Date(msg.created_at),
      }));
      
      set({ messages, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load history', isLoading: false });
    }
  },
}));