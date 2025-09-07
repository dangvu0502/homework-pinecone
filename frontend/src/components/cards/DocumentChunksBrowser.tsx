import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface ChunkItem {
  documentId: string;
  filename: string;
  text: string;
  relevanceScore: number;
  chunkIndex: number;
}

interface DocumentChunksBrowserProps {
  chunks: ChunkItem[];
  isLoading?: boolean;
}

const DocumentChunksBrowser: React.FC<DocumentChunksBrowserProps> = ({
  chunks = [],
  isLoading = false
}) => {
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredChunks = useMemo(() => {
    if (!filter.trim()) return chunks;
    
    const query = filter.toLowerCase();
    return chunks.filter(chunk =>
      chunk.text.toLowerCase().includes(query) ||
      chunk.filename.toLowerCase().includes(query) ||
      (chunk.chunkIndex + 1).toString().includes(query)
    );
  }, [chunks, filter]);

  const visibleChunks = showAll ? filteredChunks : filteredChunks.slice(0, 6);
  const hasMore = filteredChunks.length > 6;

  const clearFilter = () => {
    setFilter('');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📚 Document Chunks
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          📚 Document Chunks ({filteredChunks.length} {filter ? 'filtered' : 'total'}, {visibleChunks.length} shown)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by keywords, tags, or content..."
              className="pl-10"
            />
          </div>
          {filter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilter}
              className="px-3"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Chunks List */}
        <div className="space-y-3">
          {visibleChunks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {filter ? 'No chunks match your filter.' : 'No chunks available.'}
            </div>
          ) : (
            visibleChunks.map((chunk) => (
              <div key={`${chunk.documentId}-${chunk.chunkIndex}`} className="border rounded-lg p-4 space-y-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-600">
                      [#{String(chunk.chunkIndex + 1).padStart(2, '0')}]
                    </span>
                    <span className="text-sm text-gray-600">
                      {chunk.filename}
                    </span>
                  </div>
                  {chunk.relevanceScore > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {Math.round(chunk.relevanceScore * 100)}%
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-700 leading-relaxed">
                  {chunk.text.length > 200 ? `${chunk.text.substring(0, 200)}...` : chunk.text}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasMore && !showAll && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowAll(true)}
              className="text-sm"
            >
              Load More Chunks... ({filteredChunks.length - 6} remaining)
            </Button>
          </div>
        )}
        
        {showAll && hasMore && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              onClick={() => setShowAll(false)}
              className="text-sm"
            >
              Show Less
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentChunksBrowser;