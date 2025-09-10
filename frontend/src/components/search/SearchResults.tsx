import React from 'react';
import { BarChart3, FileText, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SearchResultItem {
  documentId: string;
  filename: string;
  text: string;
  relevanceScore: number;
  chunkIndex: number;
}

interface SearchResult {
  query: string;
  results: SearchResultItem[];
  resultCount: number;
  message?: string;
}

interface SearchResultsProps {
  result: SearchResult | null;
  onClearSearch: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ result, onClearSearch }) => {
  if (!result) {
    return null;
  }

  // If no results or error message, show appropriate message
  if (!result.results || result.results.length === 0) {
    return (
      <Card>
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Search Results
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSearch}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          <div className="text-xs text-muted-foreground font-normal">
            "{result.query}"
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3">
          <div className="text-sm text-muted-foreground">
            {result.message || 'No results found for this search.'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="py-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4" />
            Document Finding
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear search
          </Button>
        </div>
        <div className="text-xs text-muted-foreground font-normal">
          "{result.query}"
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        {/* Search Results */}
        <div className="space-y-2">
          {result.results.map((item, index) => (
            <div key={index} className="p-2 border rounded-md bg-muted/20">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-xs font-medium text-primary">
                  Chunk {item.chunkIndex + 1}
                </div>
                <Badge variant="secondary" className="text-xs h-4 px-1.5">
                  {Math.round(item.relevanceScore * 100)}%
                </Badge>
              </div>
              <div className="text-sm text-foreground mb-1">
                {item.text.length > 200 ? `${item.text.substring(0, 200)}...` : item.text}
              </div>
              <div className="text-xs text-muted-foreground">
                From: {item.filename}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchResults;