import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PanelVisibility {
  documents: boolean;
  chat: boolean;
  insights: boolean;
}

interface LayoutStore {
  selectedDocumentId: number | null;
  currentChatSession: string | null;
  panelVisibility: PanelVisibility;
  isMobileView: boolean;
  activePanel: 'documents' | 'chat' | 'insights';
  
  // Actions
  selectDocument: (id: number | null) => void;
  clearDocumentSelection: () => void;
  updateChatContext: (documentId: number | null) => void;
  togglePanel: (panel: keyof PanelVisibility) => void;
  setActivePanel: (panel: 'documents' | 'chat' | 'insights') => void;
  setMobileView: (isMobile: boolean) => void;
  setChatSession: (sessionId: string | null) => void;
}

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      selectedDocumentId: null,
      currentChatSession: null,
      panelVisibility: {
        documents: true,
        chat: true,
        insights: true,
      },
      isMobileView: false,
      activePanel: 'chat',
      
      selectDocument: (id) =>
        set({ selectedDocumentId: id }),
        
      clearDocumentSelection: () =>
        set({ selectedDocumentId: null }),
        
      updateChatContext: (documentId) =>
        set({ selectedDocumentId: documentId }),
        
      togglePanel: (panel) =>
        set((state) => ({
          panelVisibility: {
            ...state.panelVisibility,
            [panel]: !state.panelVisibility[panel],
          },
        })),
        
      setActivePanel: (panel) =>
        set({ activePanel: panel }),
        
      setMobileView: (isMobile) =>
        set({ isMobileView: isMobile }),
        
      setChatSession: (sessionId) =>
        set({ currentChatSession: sessionId }),
    }),
    {
      name: 'layout-storage',
      partialize: (state) => ({
        selectedDocumentId: state.selectedDocumentId,
        panelVisibility: state.panelVisibility,
      }),
    }
  )
);