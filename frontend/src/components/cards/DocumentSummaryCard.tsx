import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentSummaryCardProps {
  filename: string;
  summary?: string;
  keyTopics?: string[];
  isLoading?: boolean;
}

const DocumentSummaryCard: React.FC<DocumentSummaryCardProps> = ({
  filename,
  summary,
  keyTopics = [],
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📄 Document Summary
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="font-medium">{filename}</div>
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📄 Document Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="font-medium text-lg">{filename}</div>
          
          {summary && (
            <div className="text-sm text-gray-700 leading-relaxed">
              {summary}
            </div>
          )}
          
          {keyTopics.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">🎯 Key Topics:</span>
              <div className="flex flex-wrap gap-1">
                {keyTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-md"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentSummaryCard;