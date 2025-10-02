import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Quote,
  Star,
  Tag,
  Trash2,
  Search,
  Filter,
  Edit3,
  Share2,
  Heart,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { buildApiUrl } from '../config';
import { Button, Input, Card, Section, Header, Badge } from '../components/ui';

const Content = () => {
  const { token } = useAuth();
  const [quotes, setQuotes] = useState([]);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [loading, setLoading] = useState(true);
  // Removed detect source and general AI suggestions state
  const [similarLoading, setSimilarLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [analysisText, setAnalysisText] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Quote state
  const [newQuote, setNewQuote] = useState({
    content: '',
    source: '',
    author: '',
    bookTitle: '',
    tags: [],
    isImportant: false,
    showInDashboard: false
  });

  const [tagInput, setTagInput] = useState('');

  const fetchQuotes = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/api/book-documents'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Failed to fetch book documents', response.status, text);
        return;
      }

      const data = await response.json();
      const documents = Array.isArray(data) ? data : (data.bookDocuments || data.documents || []);

      const collected = [];
      for (const doc of documents) {
        const notes = doc?.notes || [];
        for (const note of notes) {
          if (note?.isQuote) {
            collected.push({
              _id: note._id,
              content: note.content,
              tags: note.tags || [],
              isImportant: !!note.isImportant,
              isQuote: true,
              timestamp: note.timestamp || note.createdAt || note.updatedAt,
              location: note.location,
              bookTitle: doc.title,
              author: doc.author
            });
          }
        }
      }
      setQuotes(collected);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Removed detect source and general AI suggestions helper

  const handleGetSimilarBooks = async () => {
    if (!newQuote.content.trim()) {
      toast.error('Enter a quote first');
      return;
    }
    setSimilarLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/ai/quote-analysis'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quote: newQuote.content, author: newQuote.author || undefined })
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('Similar books failed', response.status, text);
        if (response.status === 500 && text.includes('429')) {
          setAiUnavailable(true);
          toast.error('AI quota exceeded. Try again later.');
        } else {
          toast.error('Failed to fetch similar books');
        }
        return;
      }
      const data = await response.json();
      const items = Array.isArray(data?.similarBooks) ? data.similarBooks : [];
      const normalized = items.map(b => typeof b === 'string' ? b : (b.title || b.name || 'Unknown'));
      setSimilarBooks(normalized);
      if (normalized.length === 0) toast('No similar books found');
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch similar books');
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleGetAnalysis = async () => {
    if (!newQuote.content.trim()) {
      toast.error('Enter a quote first');
      return;
    }
    setAnalysisLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/ai/quote-analysis'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quote: newQuote.content })
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('Analysis failed', response.status, text);
        if (response.status === 500 && text.includes('429')) {
          setAiUnavailable(true);
          toast.error('AI quota exceeded. Try again later.');
      } else {
          toast.error('Failed to fetch analysis');
        }
        return;
      }
      const data = await response.json();
      const text = data?.analysis || '';
      setAnalysisText(text);
      setShowAnalysis(true);
      if (!text) toast('No analysis available');
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch analysis');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    
    if (!newQuote.content.trim()) {
      toast.error('Please enter quote content');
      return;
    }

    try {
      // Always create/find a container book to attach the quote note to
      const fallbackTitle = newQuote.bookTitle.trim() || 'Unattributed Quotes';
      const fallbackAuthor = newQuote.author.trim() || 'Unknown';
      let bookId = null;

      const bookResponse = await fetch(buildApiUrl('/api/book-documents'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: fallbackTitle,
          author: fallbackAuthor,
          category: 'other',
          status: 'completed'
        })
      });

      if (!bookResponse.ok) {
        const text = await bookResponse.text();
        console.error('Create book failed', bookResponse.status, text);
        toast.error('Failed to create book for quote');
        return;
      }

      const bookData = await bookResponse.json();
      bookId = bookData.book?._id || bookData.bookDocument?._id || bookData._id;
      if (!bookId) {
        console.error('Create book returned no id', bookData);
        toast.error('Invalid book response');
        return;
      }

      // Create the quote as a note
      const noteData = {
        content: newQuote.content,
        location: newQuote.source,
        tags: newQuote.tags,
        isImportant: newQuote.isImportant,
        // Always mark as a quote so it appears in the Quotes page
        isQuote: true,
        // Optional flag the backend may ignore; used for dashboard display
        showInDashboard: !!newQuote.showInDashboard
      };

      const response = await fetch(buildApiUrl(`/api/book-documents/${bookId}/notes`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        setNewQuote({
          content: '',
          source: '',
          author: '',
          bookTitle: '',
          tags: [],
          isImportant: false,
          showInDashboard: false
        });
        setShowQuoteForm(false);
        fetchQuotes();
        toast.success('Quote added successfully!');
      } else {
        const text = await response.text();
        console.error('Add quote failed', response.status, text);
        toast.error('Failed to add quote');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to add quote');
    }
  };

  const addQuoteTag = () => {
    if (tagInput.trim() && !newQuote.tags.includes(tagInput.trim())) {
      setNewQuote({
        ...newQuote,
        tags: [...newQuote.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeQuoteTag = (tagToRemove) => {
    setNewQuote({
      ...newQuote,
      tags: newQuote.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/book-documents/notes/${quoteId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setQuotes(quotes.filter(quote => quote._id !== quoteId));
        toast.success('Quote deleted successfully!');
      } else {
        toast.error('Failed to delete quote');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Failed to delete quote');
    }
  };

  const handleUpdateQuote = async (quoteId, updates) => {
    try {
      const response = await fetch(buildApiUrl(`/api/book-documents/notes/${quoteId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setQuotes(quotes.map(quote => 
          quote._id === quoteId ? { ...quote, ...updates } : quote
        ));
        toast.success('Quote updated successfully!');
      } else {
        toast.error('Failed to update quote');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Failed to update quote');
    }
  };

  const handleShareQuote = (quote) => {
    const shareText = `"${quote.content}"${quote.bookTitle ? ` - ${quote.bookTitle}` : ''}${quote.author ? ` by ${quote.author}` : ''}`;
    navigator.clipboard.writeText(shareText);
    toast.success('Quote copied to clipboard!');
  };

  // Filter and sort quotes
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (quote.bookTitle && quote.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (quote.author && quote.author.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = !filterTag || quote.tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.timestamp) - new Date(a.timestamp);
      case 'oldest':
        return new Date(a.timestamp) - new Date(b.timestamp);
      case 'important':
        return b.isImportant - a.isImportant;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD200] mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading quotes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[minmax(200px,auto)]">
          
          {/* Header Card */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <Card className="h-full">
              <div className="p-6">
                <div className="flex items-center justify-between">
          <div>
                    <h1 className="text-3xl font-bold text-text-primary font-jakarta mb-2">
                      Quote Collection
                    </h1>
                    <p className="text-text-secondary">
                      Collect and organize your favorite quotes
                    </p>
          </div>
          <Button
                    onClick={() => setShowQuoteForm(!showQuoteForm)}
                    variant="primary"
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Quote</span>
          </Button>
        </div>
              </div>
            </Card>
        </div>

          {/* Search and Filter Card */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <Card className="h-full">
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <Input
                    type="text"
                        placeholder="Search quotes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                      Filter by Tag
                    </label>
                    <select
                      value={filterTag}
                      onChange={(e) => setFilterTag(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A0C0F] border border-[#2A313A] rounded-lg text-[#E8EEF2] focus:border-[#FFD200] focus:outline-none"
                    >
                      <option value="">All tags</option>
                      {Array.from(new Set(quotes.flatMap(q => q.tags))).map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                      Sort by
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A0C0F] border border-[#2A313A] rounded-lg text-[#E8EEF2] focus:border-[#FFD200] focus:outline-none"
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="important">Important first</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
                </div>

          {/* Add Quote Form */}
          <AnimatePresence>
            {showQuoteForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4"
              >
                <Card className="h-full">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-text-primary mb-6">Add Inspiring Quote</h3>
                    <form onSubmit={handleCreateQuote} className="space-y-6">
                      {/* Quote Content */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                          Quote *
                  </label>
                        <textarea
                          value={newQuote.content}
                          onChange={(e) => setNewQuote({ ...newQuote, content: e.target.value })}
                          rows={4}
                          className="w-full px-3 py-2 bg-[#0A0C0F] border border-[#2A313A] rounded-lg text-[#E8EEF2] focus:border-[#FFD200] focus:outline-none"
                          placeholder="Paste or type your inspiring quote here..."
                          required
                        />
                </div>

                      {/* AI controls moved to bottom */}

                      {/* Source Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                            Book/Article Title
                    </label>
                          <Input
                            type="text"
                            value={newQuote.bookTitle}
                            onChange={(e) => setNewQuote({ ...newQuote, bookTitle: e.target.value })}
                            placeholder="e.g., The Great Gatsby"
                          />
                  </div>
                <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                            Author
                  </label>
                  <Input
                    type="text"
                            value={newQuote.author}
                            onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
                            placeholder="e.g., F. Scott Fitzgerald"
                          />
                        </div>
                  </div>

                  <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                          Source Location (Optional)
                    </label>
                  <Input
                      type="text"
                          value={newQuote.source}
                          onChange={(e) => setNewQuote({ ...newQuote, source: e.target.value })}
                          placeholder="e.g., Page 45, Chapter 3, or URL"
                    />
                  </div>

                      {/* Tags */}
                  <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                      Tags
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQuoteTag())}
                        className="flex-1 px-3 py-2 bg-[#0A0C0F] border border-[#2A313A] rounded-l-lg text-[#E8EEF2] focus:border-[#FFD200] focus:outline-none"
                        placeholder="Add a tag"
                      />
                      <button
                        type="button"
                            onClick={addQuoteTag}
                      className="px-3 py-2 bg-background-tertiary border border-l-0 border-border-primary rounded-r-lg hover:bg-background-secondary text-text-primary"
                      >
                        Add
                      </button>
                    </div>
                        {newQuote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                            {newQuote.tags.map(tag => (
                          <span
                            key={tag}
                          className="inline-flex items-center px-2 py-1 bg-[#2A313A] text-[#E8EEF2] text-xs rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                                  onClick={() => removeQuoteTag(tag)}
                            className="ml-1 text-[#C9D1D9] hover:text-[#E8EEF2]"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                      {/* Important / Show in Dashboard */}
                      <div className="flex items-center gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                            checked={newQuote.isImportant}
                            onChange={(e) => setNewQuote({ ...newQuote, isImportant: e.target.checked })}
                      className="mr-2 h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-primary rounded"
                    />
                    <span className="text-sm text-text-secondary font-jakarta">Mark as important</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                            checked={newQuote.showInDashboard}
                            onChange={(e) => setNewQuote({ ...newQuote, showInDashboard: e.target.checked })}
                      className="mr-2 h-4 w-4 text-accent-primary focus:ring-accent-primary border-border-primary rounded"
                    />
                          <span className="text-sm text-text-secondary font-jakarta">Show in dashboard</span>
                  </label>
                </div>

                      {/* AI Controls at bottom */}
                      <div className="mt-6 space-y-4">
                        <div className="flex flex-wrap gap-3">
                          <Button type="button" variant="secondary" onClick={handleGetSimilarBooks} disabled={similarLoading || aiUnavailable}>
                            {similarLoading ? 'Loading…' : 'Get Similar Books'}
                          </Button>
                          <Button type="button" variant="ghost" onClick={handleGetAnalysis} disabled={analysisLoading || aiUnavailable}>
                            {analysisLoading ? 'Analyzing…' : 'Deeper Analysis'}
                          </Button>
                        </div>

                        {similarBooks.length > 0 && (
                          <div className="bg-[#1A1F2E] border border-[#2A313A] rounded-lg p-4">
                            <h4 className="text-sm font-medium text-text-primary mb-2">Similar Books</h4>
                            <div className="space-y-1">
                              {similarBooks.map((title, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => setNewQuote({ ...newQuote, bookTitle: title })}
                                  className="text-left w-full px-3 py-1 bg-[#0A0C0F] border border-[#2A313A] rounded text-[#E8EEF2] hover:border-[#FFD200] text-sm"
                                >
                                  {title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {showAnalysis && (
                          <div className="bg-[#1A1F2E] border border-[#2A313A] rounded-lg p-4">
                            <h4 className="text-sm font-medium text-text-primary mb-2">Deeper Analysis</h4>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap">{analysisText}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => {
                            setShowQuoteForm(false);
                            setNewQuote({
                              content: '',
                              source: '',
                              author: '',
                              bookTitle: '',
                              tags: [],
                              isImportant: false
                            });
                    }}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                          Add Quote
                  </Button>
                </div>
              </form>
                  </div>
            </Card>
            </motion.div>
          )}
        </AnimatePresence>

          {/* Quote Cards */}
          {filteredQuotes.map((quote) => (
              <motion.div
              key={quote._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              className="col-span-1"
            >
              <Card className="h-full hover:border-[#FFD200]/30 transition-colors">
                <div className="p-6">
                  {/* Quote Content */}
                  <div className="mb-4">
                    <p className="text-text-primary text-lg leading-relaxed italic">
                      "{quote.content}"
                    </p>
                          </div>

                  {/* Source Information */}
                  {(quote.bookTitle || quote.author) && (
                    <div className="mb-4 text-sm text-text-secondary">
                      {quote.bookTitle && (
                        <div className="flex items-center space-x-1 mb-1">
                          <BookOpen className="h-4 w-4" />
                          <span className="font-medium">{quote.bookTitle}</span>
                          </div>
                      )}
                      {quote.author && (
                        <div className="flex items-center space-x-1">
                          <span>by {quote.author}</span>
                        </div>
                      )}
                      {quote.location && (
                        <div className="text-xs text-text-muted mt-1">
                          {quote.location}
                      </div>
                        )}
                      </div>
                  )}

                  {/* Tags */}
                  {quote.tags && quote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {quote.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#2A313A]">
                      <div className="flex items-center space-x-2">
                        <Button
                        onClick={() => handleUpdateQuote(quote._id, { isImportant: !quote.isImportant })}
                                variant="ghost"
                                size="sm"
                                className={`p-1 ${
                          quote.isImportant 
                                    ? 'text-accent-primary bg-accent-primary/20' 
                                    : 'text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10'
                                }`}
                        title={quote.isImportant ? 'Remove from important' : 'Mark as important'}
                              >
                        <Star className="h-4 w-4" />
                              </Button>
                              <Button
                        onClick={() => handleShareQuote(quote)}
                                variant="ghost"
                                size="sm"
                        className="p-1 text-text-secondary hover:text-accent-primary hover:bg-accent-primary/10"
                        title="Share quote"
                      >
                        <Share2 className="h-4 w-4" />
                              </Button>
                    </div>
                    
                              <Button
                      onClick={() => handleDeleteQuote(quote._id)}
                                variant="ghost"
                                size="sm"
                                className="p-1 text-text-secondary hover:text-status-error"
                      title="Delete quote"
                              >
                      <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
              </Card>
            </motion.div>
          ))}

          {/* Empty State */}
          {filteredQuotes.length === 0 && !showQuoteForm && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
              <Card className="h-full">
                <div className="text-center py-12">
                  <Quote className="mx-auto h-12 w-12 text-text-muted mb-4" />
                  <h3 className="text-lg font-medium text-text-primary font-jakarta mb-2">
                    {quotes.length === 0 ? 'No Quotes Yet' : 'No Quotes Match Your Search'}
                  </h3>
                  <p className="text-text-secondary mb-6">
                    {quotes.length === 0 
                      ? 'Start building your collection of inspiring quotes'
                      : 'Try adjusting your search or filter criteria'
                    }
                  </p>
                  <Button
                    onClick={() => setShowQuoteForm(true)}
                    variant="primary"
                    className="flex items-center space-x-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Your First Quote</span>
                  </Button>
                          </div>
              </Card>
                    </div>
                  )}
                    </div>
                  </div>
          </div>
  );
};

export default Content;