import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Expand, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Constants
const CHUNK_CONFIG = {
  INITIAL_VISIBLE: 6,
  PREVIEW_LENGTH: 200,
  LOADING_SKELETONS: 3,
} as const;

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

// Helper functions
const formatChunkNumber = (index: number) => 
  `#${String(index + 1).padStart(2, '0')}`;

const truncateText = (text: string, maxLength = CHUNK_CONFIG.PREVIEW_LENGTH) =>
  text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

// Sub-components
const DocumentIcon = () => (
  <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
);

const LoadingSpinner = () => (
  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
);

const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  resultCount: number;
}> = ({ value, onChange, onClear, resultCount }) => (
  <div className="space-y-2">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search chunks..."
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
    {value && (
      <div className="text-xs text-muted-foreground">
        {resultCount} result{resultCount !== 1 ? 's' : ''} found
      </div>
    )}
  </div>
);

const ChunkItem: React.FC<{
  chunk: ChunkItem;
  index: number;
  onClick: () => void;
}> = ({ chunk, index, onClick }) => (
  <div key={`${chunk.documentId}-${chunk.chunkIndex}`} className="relative">
    {index > 0 && <div className="absolute top-0 left-0 right-0 h-px bg-border" />}
    <div 
      className="py-4 space-y-3 hover:bg-accent/50 -mx-2 px-2 rounded transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {formatChunkNumber(chunk.chunkIndex)}
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
            onClick();
          }}
        >
          <Expand className="h-3 w-3" />
        </Button>
      </div>
      <div className="text-sm text-foreground/80 leading-relaxed">
        {truncateText(chunk.text)}
      </div>
    </div>
  </div>
);

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

  const visibleChunks = showAll ? filteredChunks : filteredChunks.slice(0, CHUNK_CONFIG.INITIAL_VISIBLE);
  const hasMore = filteredChunks.length > CHUNK_CONFIG.INITIAL_VISIBLE;

  const clearFilter = useCallback(() => setFilter(''), []);
  const selectChunk = useCallback((chunk: ChunkItem) => setSelectedChunk(chunk), []);
  const closeDialog = useCallback(() => setSelectedChunk(null), []);

  if (isLoading || isProcessing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DocumentIcon />
            Document Chunks
            <LoadingSpinner />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: CHUNK_CONFIG.LOADING_SKELETONS }, (_, i) => (
                <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
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
            <DocumentIcon />
            Document Chunks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput
            value={filter}
            onChange={setFilter}
            onClear={clearFilter}
            resultCount={filteredChunks.length}
          />

          <div className="space-y-3">
            {visibleChunks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {filter ? 'No chunks match your filter.' : 'No chunks available.'}
              </div>
            ) : (
              visibleChunks.map((chunk, index) => (
                <ChunkItem
                  key={`${chunk.documentId}-${chunk.chunkIndex}`}
                  chunk={chunk}
                  index={index}
                  onClick={() => selectChunk(chunk)}
                />
              ))
            )}
          </div>

          {hasMore && !showAll && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                onClick={() => setShowAll(true)}
                className="text-sm"
              >
                Load More Chunks... ({filteredChunks.length - CHUNK_CONFIG.INITIAL_VISIBLE} remaining)
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

      <Dialog open={!!selectedChunk} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {selectedChunk && formatChunkNumber(selectedChunk.chunkIndex)}
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