import React from 'react';
import { 
  Download, 
  BarChart3, 
  Settings, 
  FileJson, 
  FileText, 
  Copy,
  Trash2,
  RefreshCw
} from 'lucide-react';
import type { ChatSession } from '../../stores/useChatStore';
import { useDocumentStore } from '../../stores/useDocumentStore';

interface ToolsPanelProps {
  selectedDocuments: string[];
  session: ChatSession | null;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  selectedDocuments,
  session,
}) => {
  const { documents } = useDocumentStore();
  const selectedDocs = documents.filter(d => selectedDocuments.includes(d.id));
  
  const totalSize = selectedDocs.reduce((sum, doc) => sum + doc.size, 0);
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const handleExportChat = () => {
    // TODO: Implement chat export
    console.log('Export chat to JSON');
  };
  
  const handleExportTranscript = () => {
    // TODO: Implement transcript export
    console.log('Export chat transcript');
  };
  
  const handleCopyContext = () => {
    // TODO: Implement copy context
    const contextText = selectedDocs.map(d => d.filename).join('\n');
    navigator.clipboard.writeText(contextText);
  };
  
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Tools & Analytics
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Document Statistics */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Document Statistics
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Selected Documents</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedDocuments.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Size</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatFileSize(totalSize)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Ready for Processing</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedDocs.filter(d => d.status === 'ready').length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Export Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Options
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleExportChat}
                disabled={!session}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 
                         dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 
                         dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="flex items-center">
                  <FileJson className="w-4 h-4 mr-2" />
                  Export Chat (JSON)
                </span>
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleExportTranscript}
                disabled={!session}
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 
                         dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 
                         dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Transcript
                </span>
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={handleCopyContext}
                disabled={selectedDocuments.length === 0}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 
                         dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 
                         dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Document Names
              </button>
              
              <button
                disabled
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 
                         dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 
                         dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reprocess Documents
              </button>
              
              <button
                disabled
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 
                         dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 
                         dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Documents
              </button>
            </div>
          </div>
          
          {/* Analytics Preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Analytics
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Analytics coming soon
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Track usage patterns and insights
              </p>
            </div>
          </div>
          
          {/* Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Settings
            </h3>
            <button
              disabled
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 
                       dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 
                       dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsPanel;