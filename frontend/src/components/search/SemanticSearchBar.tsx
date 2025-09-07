import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SemanticSearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  selectedDocument?: string | null;
  suggestedQuestions?: string[];
}

const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({
  onSearch,
  isLoading = false,
  selectedDocument,
  suggestedQuestions = []
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={query}
        onChange={handleInputChange}
        placeholder={selectedDocument ? "Find specific data or insights..." : "Select a document to search"}
        disabled={!selectedDocument || isLoading}
        className="flex-1"
      />
      <Button
        type="submit"
        size="default"
        disabled={!selectedDocument || !query.trim() || isLoading}
        className="px-4"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <BarChart3 className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
};

export default SemanticSearchBar;