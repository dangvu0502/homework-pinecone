import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Expand } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  isProcessing?: boolean;
  message?: string;
}

const DocumentChunksBrowser: React.FC<DocumentChunksBrowserProps> = ({
  chunks = [],
  isLoading = false,
  isProcessing = false,
  message
}) => {
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<ChunkItem | null>(null);

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

  if (isLoading || isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Document Chunks
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
              ))}
            </div>
            {isProcessing && message && (
              <div className="text-center text-sm text-muted-foreground">
                {message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Document Chunks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search chunks..."
            className="pl-9 pr-9"
          />
          {filter && (
            <button
              onClick={clearFilter}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {filter && (
          <div className="text-xs text-muted-foreground">
            {filteredChunks.length} result{filteredChunks.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Chunks List */}
        <div className="space-y-3">
          {visibleChunks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {filter ? 'No chunks match your filter.' : 'No chunks available.'}
            </div>
          ) : (
            visibleChunks.map((chunk, index) => (
              <div key={`${chunk.documentId}-${chunk.chunkIndex}`} className="relative">
                {index > 0 && <div className="absolute top-0 left-0 right-0 h-px bg-border"></div>}
                <div className="py-4 space-y-3 hover:bg-accent/50 -mx-2 px-2 rounded transition-colors cursor-pointer group"
                     onClick={() => setSelectedChunk(chunk)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        #{String(chunk.chunkIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {chunk.filename}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChunk(chunk);
                      }}
                    >
                      <Expand className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="text-sm text-foreground/80 leading-relaxed">
                    {chunk.text.length > 200 ? `${chunk.text.substring(0, 200)}...` : chunk.text}
                  </div>
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

    {/* Chunk Detail Dialog */}
    <Dialog open={!!selectedChunk} onOpenChange={(open) => !open && setSelectedChunk(null)}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
              #{selectedChunk && String(selectedChunk.chunkIndex + 1).padStart(2, '0')}
            </span>
            <span className="text-sm text-muted-foreground">
              {selectedChunk?.filename}
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {selectedChunk?.text}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default DocumentChunksBrowser;