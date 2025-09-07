import React, { useEffect, useRef, useCallback } from "react";
import { Send, RotateCw, FileText, MessageSquare } from "lucide-react";
import { useChatStore } from "../../stores/useChatStore";
import type { Message } from "../../stores/useChatStore";
import { useLayoutStore } from "../../stores/useLayoutStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageBubble } from "../chat/MessageBubble";
import { StreamingMessage } from "../chat/StreamingMessage";

interface ChatPanelProps {
  messages: Message[];
  contextDocuments: string[];
  selectedDocumentName?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  contextDocuments,
  selectedDocumentName,
}) => {
  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { selectedDocument } = useLayoutStore();
  const {
    isStreaming,
    streamingMessage,
    clearMessages,
    createSession,
    sendMessage,
    currentSession,
  } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // If empty, set to minimum height
    if (textarea.value.trim() === "") {
      textarea.style.height = "42px";
      return;
    }

    // First check if it's a single line (no line breaks)
    const hasLineBreaks = textarea.value.includes("\n");
    if (!hasLineBreaks) {
      // For single line without breaks, first check if it fits at minimum height
      textarea.style.height = "42px";

      // If content overflows at 42px height, it needs to expand
      if (textarea.scrollHeight > 42) {
        textarea.style.height = "auto";
        const newHeight = Math.min(textarea.scrollHeight, 120);
        textarea.style.height = `${newHeight}px`;
      }
      return;
    }

    // For multi-line content (has line breaks), calculate proper height
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Adjust height whenever input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Set initial height on mount
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px";
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input.trim();
    setInput("");

    // Create session if needed
    if (!currentSession && selectedDocument) {
      await createSession("New Chat Session", [selectedDocument]);
    }

    // Use the real sendMessage API from the store
    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasDocuments = contextDocuments.length > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold">Chat Assistant</h2>
                <div className="h-5 flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <FileText
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      !selectedDocumentName ? "opacity-60" : ""
                    }`}
                  />
                  {selectedDocumentName ? (
                    <span className="truncate" title={selectedDocumentName}>
                      {selectedDocumentName}
                    </span>
                  ) : (
                    <span className="opacity-60">
                      select a document to start
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={clearMessages}
            disabled={messages.length === 0}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 
                     disabled:cursor-not-allowed flex-shrink-0"
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
                  ? "Ask questions about your selected document"
                  : "Select a document from the left panel to provide context for your questions"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {streamingMessage && (
              <StreamingMessage
                content={streamingMessage}
                isStreaming={isStreaming}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="flex items-end gap-3 p-6 pt-4">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          disabled={!hasDocuments || isStreaming}
          className="flex-1 resize-none max-h-[120px]
             rounded-lg py-2.5 px-3 text-sm leading-5 overflow-y-auto 
             transition-[height] duration-100 ease-in-out border
            border-gray-200 shadow bg-background
            "
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || !hasDocuments || isStreaming}
          size="icon"
          className="h-[42px] w-[42px] rounded-lg flex-shrink-0"
        >
          {isStreaming ? (
            <RotateCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
