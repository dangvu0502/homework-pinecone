# FE Story 03: Three-Panel Layout Integration

## Story Title  
Three-Panel Layout with Document Management Integration

## User Story
As a user,
I want a unified interface that combines document management, chat, and tools,
So that I can seamlessly work with my documents and conversations in one view.

## Story Context
**Existing System Integration:**
- Integrates with: Upload interface (FE Story 01) and Chat interface (FE Story 02)
- Technology: React 18, TypeScript, Tailwind CSS, Zustand state management
- Follows pattern: Layout composition with shared state management
- Touch points: Combines document selection with chat context

## Acceptance Criteria

**Functional Requirements:**
1. Three-panel responsive layout (Documents | Chat | Tools)
2. Document list with selection checkboxes in left panel
3. Chat interface in center panel with selected document context
4. Tools panel with analytics and export options (basic implementation)
5. State synchronization between document selection and chat context

**Integration Requirements:**
6. Document selection updates chat context automatically
7. Upload interface integrated into document panel
8. Processing status updates reflected in document list
9. Responsive collapse for mobile/tablet views

**Quality Requirements:**
10. Smooth panel transitions and responsive behavior
11. Keyboard navigation between panels
12. State persistence across browser refresh
13. Performance optimization for large document lists

## Technical Notes
- **Integration Approach:** Composition pattern with shared Zustand stores
- **Existing Pattern Reference:** Dashboard layout patterns with sidebar navigation
- **Key Constraints:** Must work on mobile with collapsible panels

## Implementation Details
```typescript
// Key components to create:
- Layout/ThreePanelLayout.tsx (main layout container)
- DocumentPanel.tsx (left panel with upload + list)
- ChatPanel.tsx (center panel with conversation)
- ToolsPanel.tsx (right panel with utilities)
- stores/useLayoutStore.ts (panel state management)
```

## State Management Integration
```typescript
// Shared state between panels
interface LayoutStore {
  selectedDocuments: string[];
  currentChatSession: string | null;
  panelVisibility: {
    documents: boolean;
    chat: boolean; 
    tools: boolean;
  };
  
  // Actions
  toggleDocumentSelection: (id: string) => void;
  updateChatContext: (documentIds: string[]) => void;
  togglePanel: (panel: keyof PanelVisibility) => void;
}

// Integration with existing stores
const useIntegratedState = () => {
  const documents = useDocumentStore();
  const chat = useChatStore(); 
  const layout = useLayoutStore();
  
  // Sync selected documents with chat context
  useEffect(() => {
    chat.updateContext(layout.selectedDocuments);
  }, [layout.selectedDocuments]);
};
```

## Responsive Layout Breakpoints
```css
/* Desktop: Three panels visible */
@media (min-width: 1024px) {
  .three-panel {
    grid-template-columns: 300px 1fr 300px;
  }
}

/* Tablet: Chat + one sidebar */
@media (min-width: 768px) and (max-width: 1023px) {
  .three-panel {
    grid-template-columns: 250px 1fr;
  }
}

/* Mobile: Single panel with navigation */
@media (max-width: 767px) {
  .three-panel {
    grid-template-columns: 1fr;
  }
}
```

## Component Integration
```typescript
const ThreePanelLayout = () => {
  const { selectedDocuments, panelVisibility } = useLayoutStore();
  const { documents, processingStatus } = useDocumentStore();
  const { currentSession, messages } = useChatStore();
  
  return (
    <div className="three-panel-layout">
      {panelVisibility.documents && (
        <DocumentPanel 
          documents={documents}
          selectedIds={selectedDocuments}
          processingStatus={processingStatus}
          onToggleSelection={toggleDocumentSelection}
        />
      )}
      
      <ChatPanel 
        session={currentSession}
        messages={messages}
        contextDocuments={selectedDocuments}
      />
      
      {panelVisibility.tools && (
        <ToolsPanel 
          selectedDocuments={selectedDocuments}
          session={currentSession}
        />
      )}
    </div>
  );
};
```

## Definition of Done
- [ ] Three-panel layout responsive design implemented
- [ ] Document panel with upload and selection integrated
- [ ] Chat panel with streaming interface integrated  
- [ ] Basic tools panel with placeholder features
- [ ] State synchronization between panels working
- [ ] Mobile responsive with panel collapse
- [ ] Performance testing with multiple documents
- [ ] Cross-browser compatibility verified

## Time Estimate: 4-6 hours