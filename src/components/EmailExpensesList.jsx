import React, { useState, useEffect } from 'react';
import { Mail, Eye, Edit, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { buildApiUrl } from '../config';

const EmailExpensesList = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchEmailExpenses();
  }, [pagination.page]);

  const fetchEmailExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view email expenses');
        setLoading(false);
        return;
      }

      const response = await fetch(
        buildApiUrl(`/api/email-expense/email-expenses?page=${pagination.page}&limit=${pagination.limit}`),
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses);
        setPagination(data.pagination);
      } else {
        setError('Failed to load email expenses');
      }
    } catch (err) {
      console.error('Error fetching email expenses:', err);
      setError('Error loading email expenses');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-[rgba(34,197,94,0.2)] border border-green-600/30';
      case 'medium': return 'text-yellow-600 bg-[rgba(234,179,8,0.2)] border border-yellow-600/30';
      case 'low': return 'text-red-600 bg-[rgba(239,68,68,0.2)] border border-red-600/30';
      default: return 'text-text-secondary bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)]';
    }
  };

  const getStatusIcon = (status, needsManualReview) => {
    if (needsManualReview) {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
    
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E49C9]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-text-secondary mx-auto mb-4" />
          <p className="text-lg font-semibold text-text-primary font-jakarta mb-2">No email expenses yet</p>
          <p className="text-sm text-text-secondary font-jakarta mb-6">Forward your receipts and invoices to your unique email address to see them here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense._id} className="bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-lg p-4 backdrop-blur-sm hover:border-[#1E49C9]/30 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide">
                      {expense.description}
                    </h3>
                    {getStatusIcon(expense.status, expense.emailData?.needsManualReview)}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-text-secondary mb-3 font-jakarta">
                    <span className="font-medium text-[#1E49C9] font-mono">
                      {formatCurrency(expense.amount)}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{expense.vendor}</span>
                    <span>•</span>
                    <span className="capitalize">{expense.category}</span>
                    <span>•</span>
                    <span>{formatDate(expense.date)}</span>
                  </div>

                  {expense.emailData && (
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4 text-text-secondary" />
                        <span className="text-text-secondary font-jakarta">
                          From: {expense.emailData.from}
                        </span>
                      </div>
                      
                      {expense.emailData.confidence && (
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium font-jakarta tracking-wider ${getConfidenceColor(expense.emailData.confidence)}`}>
                            {expense.emailData.confidence} confidence
                          </span>
                        </div>
                      )}

                      {expense.emailData.subject && (
                        <div className="text-text-secondary truncate max-w-md font-jakarta">
                          Subject: {expense.emailData.subject}
                        </div>
                      )}
                    </div>
                  )}

                  {expense.notes && (
                    <div className="mt-2 text-sm text-text-secondary font-jakarta">
                      {expense.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {expense.emailData?.needsManualReview && (
                    <span className="px-2 py-1 bg-[rgba(255,210,0,0.2)] text-[#FFD200] text-xs font-medium rounded-full font-jakarta tracking-wider border border-[#FFD200]/30">
                      Needs Review
                    </span>
                  )}
                  
                  <button className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-[rgba(30,73,201,0.1)]">
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  <button className="p-2 text-text-secondary hover:text-[#1E49C9] transition-colors rounded-lg hover:bg-[rgba(30,73,201,0.1)]">
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button className="p-2 text-text-secondary hover:text-[#FF6B6B] transition-colors rounded-lg hover:bg-[rgba(255,107,107,0.1)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.3)] rounded-lg p-4 flex items-center space-x-2 backdrop-blur-sm">
          <AlertCircle className="h-5 w-5 text-[#FF6B6B]" />
          <span className="text-[#FF6B6B] font-jakarta">{error}</span>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.1)]">
          <div className="text-sm text-text-secondary font-jakarta">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-md hover:bg-[rgba(30,73,201,0.1)] disabled:opacity-50 disabled:cursor-not-allowed text-text-primary font-jakarta backdrop-blur-sm"
            >
              Previous
            </button>
            
            <span className="px-3 py-1 text-sm text-text-secondary font-jakarta">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 text-sm bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.1)] rounded-md hover:bg-[rgba(30,73,201,0.1)] disabled:opacity-50 disabled:cursor-not-allowed text-text-primary font-jakarta backdrop-blur-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailExpensesList;
