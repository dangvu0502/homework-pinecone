import React from 'react';
import { FileText, TrendingUp, Hash, HelpCircle } from 'lucide-react';

interface DocumentInsightsProps {
  selectedDocument?: string | null;
}

const DocumentInsights: React.FC<DocumentInsightsProps> = ({ selectedDocument }) => {
  // Mock data for demonstration - will be replaced with real data extraction
  const mockInsights = {
    overview: {
      type: 'Spreadsheet',
      format: 'Excel',
      size: '1.1 MB',
      sheets: 5,
      lastModified: '2 hours ago',
      status: 'Analyzed'
    },
    keyTopics: [
      'Financial data',
      'Q3 performance',
      'Growth metrics',
      'Market analysis',
      'Risk factors'
    ],
    keyNumbers: {
      'Revenue': '$2.3M',
      'Growth': '+15% YoY',
      'Customers': '1,247',
      'Profit Margin': '23%',
      'Market Share': '18%'
    },
    suggestedQuestions: [
      'What drove the 15% growth?',
      'Customer breakdown by region?',
      'Compare Q3 to Q2 performance',
      'What are the main risk factors?',
      'Top performing products?'
    ]
  };


  return (
    <div className="h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Document Insights
        </h2>

        {/* Quick Summary */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Quick Summary
            </h3>
          </div>
          <div className="mt-3">
            {selectedDocument ? (
              <dl className="space-y-2">
                {Object.entries(mockInsights.overview).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-gray-600 dark:text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">
                      {value}
                      {key === 'status' && ' ✓'}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Select a document to view summary
              </div>
            )}</div>
        </div>

        {/* Key Topics */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Key Topics
            </h3>
          </div>
          <div className="mt-3">
            {selectedDocument ? (
              <ul className="space-y-2">
                {mockInsights.keyTopics.map((topic, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Document topics will appear here
              </div>
            )}
          </div>
        </div>

        {/* Key Numbers */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Key Numbers
            </h3>
          </div>
          <div className="mt-3">
            {selectedDocument ? (
              <dl className="space-y-2">
                {Object.entries(mockInsights.keyNumbers).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-gray-600 dark:text-gray-400">{key}:</dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-semibold">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Key metrics will appear here
              </div>
            )}
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Try Asking
            </h3>
          </div>
          <div className="mt-3">
            {selectedDocument ? (
              <ul className="space-y-3">
                {mockInsights.suggestedQuestions.map((question, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-gray-400 dark:text-gray-500 mr-2">•</span>
                    {question}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Question suggestions will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentInsights;