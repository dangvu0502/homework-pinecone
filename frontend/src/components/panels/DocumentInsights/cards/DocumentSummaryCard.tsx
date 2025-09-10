import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DocumentSummaryCardProps {
  filename: string;
  summary?: string;
  isLoading?: boolean;
}

const DocumentSummaryCard: React.FC<DocumentSummaryCardProps> = ({
  filename,
  summary,
  isLoading = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Document Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="font-medium text-lg dark:text-gray-200">
              {filename}
            </div>
            <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="font-medium text-lg">{filename}</div>

            {summary && (
              <div className="text-sm text-foreground/80 leading-relaxed">
                {summary}
              </div>
            )}

            {!summary && !isLoading && (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                No summary available yet. Document may still be processing.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentSummaryCard;
