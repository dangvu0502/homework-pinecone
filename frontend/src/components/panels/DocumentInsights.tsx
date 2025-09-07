import React from 'react';
import { TrendingUp, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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
    <div className="h-full overflow-y-auto">
      <div className="p-3 pt-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            Document Insights
          </h2>
        </div>

        {/* Key Topics */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4" />
              Key Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {selectedDocument ? (
              <div className="flex flex-wrap gap-2">
                {mockInsights.keyTopics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                Document topics will appear here
              </div>
            )}
          </CardContent>
        </Card>

        {/* Key Numbers */}
        {selectedDocument && (
          <Card>
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm">Key Numbers</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(mockInsights.keyNumbers).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-xs text-muted-foreground">{key}</div>
                    <div className="text-sm font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggested Questions */}
        <Card>
          <CardHeader className="py-2 px-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HelpCircle className="h-4 w-4" />
              Try Asking
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            {selectedDocument ? (
              <div className="space-y-1">
                {mockInsights.suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-2 text-left justify-start whitespace-normal text-xs w-full"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-4">
                Question suggestions will appear here
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentInsights;