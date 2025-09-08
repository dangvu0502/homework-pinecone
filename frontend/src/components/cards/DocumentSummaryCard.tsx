import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DocumentSummaryCardProps {
  filename: string;
  summary?: string;
  isLoading?: boolean;
}

const DocumentSummaryCard: React.FC<DocumentSummaryCardProps> = ({
  filename,
  summary,
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
            <div className="font-medium text-lg">{filename}</div>
            <div className="h-20 bg-gray-100 rounded animate-pulse"></div>
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
          
          {!summary && !isLoading && (
            <div className="text-sm text-gray-500 italic">
              No summary available yet. Document may still be processing.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentSummaryCard;