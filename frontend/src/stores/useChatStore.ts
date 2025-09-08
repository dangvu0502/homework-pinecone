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

export interface ChatStore {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: Message[];
  messagesPerSession: Record<string, Message[]>; // Store messages per session
  isStreaming: boolean;
  streamingMessage: string;
  streamingSessionId: string | null; // Track which session is currently streaming
  isLoading: boolean;
  error: string | null;
  
  // Actions
  createSession: (title: string, documentIds: string[]) => Promise<ChatSession>;
  setCurrentSession: (sessionId: string | null) => void;
  getOrCreateSessionForDocument: (documentId: string) => Promise<ChatSession>;
  switchToDocumentSession: (documentId: string) => Promise<void>;
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
  messagesPerSession: {},
  isStreaming: false,
  streamingMessage: '',
  streamingSessionId: null,
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
      
      // Save current messages before switching
      if (state.currentSession && state.messages.length > 0) {
        state.messagesPerSession[state.currentSession.id] = state.messages;
      }
      
      // Load messages for the new session
      const messages = session && state.messagesPerSession[session.id] 
        ? state.messagesPerSession[session.id] 
        : [];
      
      return {
        currentSession: session,
        messages,
        messagesPerSession: state.messagesPerSession,
      };
    }),
    
  getOrCreateSessionForDocument: async (documentId) => {
    const state = get();
    
    // Check if session already exists for this document
    const existingSession = state.sessions.find(s => 
      s.documentIds.includes(documentId)
    );
    
    if (existingSession) {
      return existingSession;
    }
    
    // Create new session for this document
    return await state.createSession(`Chat - Document ${documentId}`, [documentId]);
  },
  
  switchToDocumentSession: async (documentId) => {
    const state = get();
    
    // Save current messages before switching
    if (state.currentSession && state.messages.length > 0) {
      state.messagesPerSession[state.currentSession.id] = state.messages;
    }
    
    // Find existing session for this document
    const existingSession = state.sessions.find(s => 
      s.documentIds.includes(documentId) && s.documentIds.length === 1
    );
    
    if (existingSession) {
      // Load existing session and its messages
      const messages = state.messagesPerSession[existingSession.id] || [];
      set({
        currentSession: existingSession,
        messages,
        messagesPerSession: state.messagesPerSession,
        streamingMessage: '', // Clear any leftover streaming message
      });
    } else {
      // Create new session for this document
      try {
        const numericId = parseInt(documentId);
        const response = await chatApi.createSession([numericId]);
        
        const newSession: ChatSession = {
          id: response.id.toString(),
          title: `Chat - Document ${documentId}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          documentIds: [documentId],
        };
        
        set((state) => ({
          sessions: [...state.sessions, newSession],
          currentSession: newSession,
          messages: [],
          messagesPerSession: state.messagesPerSession,
          streamingMessage: '', // Clear any leftover streaming message
        }));
      } catch (error) {
        console.error('Failed to create session for document:', error);
      }
    }
  },
    
  addMessage: (message) =>
    set((state) => {
      const newMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      };
      
      const updatedMessages = [...state.messages, newMessage];
      
      // Also save to messagesPerSession if there's a current session
      if (state.currentSession) {
        state.messagesPerSession[state.currentSession.id] = updatedMessages;
      }
      
      return {
        messages: updatedMessages,
        messagesPerSession: state.messagesPerSession,
      };
    }),
    
  updateStreamingMessage: (content) =>
    set({ streamingMessage: content }),
    
  completeStreamingMessage: (sources) =>
    set((state) => {
      if (!state.streamingMessage) return state;
      
      const newMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant' as const,
        content: state.streamingMessage,
        sources,
        timestamp: new Date(),
      };
      
      const updatedMessages = [...state.messages, newMessage];
      
      // Also save to messagesPerSession if there's a current session
      if (state.currentSession) {
        state.messagesPerSession[state.currentSession.id] = updatedMessages;
      }
      
      return {
        messages: updatedMessages,
        messagesPerSession: state.messagesPerSession,
        streamingMessage: '',
        isStreaming: false,
      };
    }),
    
  setStreaming: (isStreaming) =>
    set({ isStreaming }),
    
  clearMessages: () =>
    set((state) => {
      // Clear messages for current session only
      if (state.currentSession) {
        state.messagesPerSession[state.currentSession.id] = [];
      }
      
      return {
        messages: [],
        streamingMessage: '',
        messagesPerSession: state.messagesPerSession,
      };
    }),
    
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
    
    // Remember which session we're sending to
    const targetSessionId = state.currentSession.id;
    
    // Add user message to the correct session
    set((state) => {
      const userMessage = {
        id: `msg-${Date.now()}`,
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
      };
      
      // Add to current messages if we're still on the same session
      const updatedMessages = state.currentSession?.id === targetSessionId 
        ? [...state.messages, userMessage]
        : state.messages;
      
      // Always add to the target session's message history
      const updatedMessagesPerSession = {
        ...state.messagesPerSession,
        [targetSessionId]: [
          ...(state.messagesPerSession[targetSessionId] || []),
          userMessage
        ]
      };
      
      return {
        messages: updatedMessages,
        messagesPerSession: updatedMessagesPerSession,
        isStreaming: true,
        streamingMessage: '',
        streamingSessionId: targetSessionId, // Track which session is streaming
      };
    });
    
    try {
      let fullContent = '';
      await chatApi.sendMessage(
        parseInt(targetSessionId),
        message,
        (chunk) => {
          fullContent += chunk;
          // Only update streaming message if we're still viewing the same session
          const currentState = get();
          if (currentState.currentSession?.id === targetSessionId) {
            set({ streamingMessage: fullContent });
          }
        }
      );
      
      // Complete the streaming message for the correct session
      set((state) => {
        const assistantMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: fullContent,
          timestamp: new Date(),
        };
        
        // Update the target session's messages
        const targetSessionMessages = [
          ...(state.messagesPerSession[targetSessionId] || []),
          assistantMessage
        ];
        
        // Update current messages only if we're still on the same session
        const updatedMessages = state.currentSession?.id === targetSessionId
          ? [...state.messages, assistantMessage]
          : state.messages;
        
        return {
          messages: updatedMessages,
          messagesPerSession: {
            ...state.messagesPerSession,
            [targetSessionId]: targetSessionMessages
          },
          streamingMessage: '',
          isStreaming: false,
          streamingSessionId: null,
        };
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to send message',
        isStreaming: false,
        streamingMessage: '',
        streamingSessionId: null,
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