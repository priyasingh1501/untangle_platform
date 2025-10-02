import React, { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Card, Button, Input } from '../ui';
import SearchResults from './SearchResults';
import { buildApiUrl } from '../../config';

const FoodSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await fetch(buildApiUrl('/api/food/search'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query: query.trim() })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []); // Removed query dependency to prevent auto-search

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError('');
  };



  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card variant="elevated" className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Input
              label="Search for foods..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., apple, rice, chicken curry (Press Enter to search, Esc to clear)"
              className="w-full pr-10"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>



          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-8"
          >
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card variant="elevated" className="p-4">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Results - Show only when there are results */}
      {results.length > 0 ? (
        <SearchResults 
          results={results} 
          onFoodCreated={(food) => {
            // Refresh search results or add to current results
            setResults(prev => [food, ...prev]);
          }}
        />
      ) : (
        <>
          {/* No Results */}
          {!loading && query && !error && (
            <Card variant="elevated" className="p-8 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No relevant results found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find foods that closely match "{query}". This might be because:
              </p>
              <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Try using simpler, more common terms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Use single words instead of phrases</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Check spelling and try variations</span>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Examples:</strong> Try "rice" instead of "basmati rice", "apple" instead of "red apple"
                </p>
              </div>
            </Card>
          )}

          {/* Search Tips - Only show when no query and no results */}
          {!query && results.length === 0 && (
            <Card variant="elevated" className="p-8">
              <div className="text-center mb-6">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Ready to Search?</h3>
                <p className="text-gray-600">Start exploring foods from all available sources</p>
              </div>
              
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Comprehensive Food Search</h4>
                <p className="text-gray-600">
                  Our search automatically combines results from multiple sources to give you the most comprehensive food information available.
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default FoodSearch;
