import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import toast from 'react-hot-toast';
import Card from '../ui/Card';

const EmotionalJourneyChart = () => {
  console.log('EmotionalJourneyChart: Component rendering...');
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year

  const moodValues = {
    'terrible': 1,
    'bad': 2,
    'neutral': 3,
    'good': 4,
    'excellent': 5
  };

  const moodColors = {
    'terrible': '#ef4444', // red-500
    'bad': '#f59e0b', // yellow-500
    'neutral': '#6b7280', // gray-500
    'good': '#3b82f6', // blue-500
    'excellent': '#10b981' // emerald-500
  };

  const fetchJournalEntries = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl('/api/journal'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const journalEntries = data.entries || [];
        console.log('EmotionalJourneyChart: Raw journal data:', data);
        console.log('EmotionalJourneyChart: Journal entries:', journalEntries);
        
        // Filter entries by time range
        const now = new Date();
        const filteredEntries = journalEntries.filter(entry => {
          const entryDate = new Date(entry.createdAt);
          const daysDiff = (now - entryDate) / (1000 * 60 * 60 * 24);
          
          switch (timeRange) {
            case 'week':
              return daysDiff <= 7;
            case 'month':
              return daysDiff <= 30;
            case 'year':
              return daysDiff <= 365;
            default:
              return true;
          }
        });
        
        // Sort by date and add mood values
        const sortedEntries = filteredEntries
          .filter(entry => entry.mood) // Only include entries with mood data
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
          .map(entry => ({
            ...entry,
            moodValue: moodValues[entry.mood] || 3,
            moodColor: moodColors[entry.mood] || moodColors['neutral']
          }));
        
        console.log('EmotionalJourneyChart: Processed entries:', sortedEntries);
        setEntries(sortedEntries);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Failed to fetch journal entries';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      setError('Network error');
      toast.error('Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  }, [token, timeRange]);

  useEffect(() => {
    if (token) {
      console.log('EmotionalJourneyChart: Token available, fetching entries...');
      fetchJournalEntries();
    } else {
      console.log('EmotionalJourneyChart: No token available');
    }
  }, [token, fetchJournalEntries]);


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMoodLabel = (mood) => {
    return mood.charAt(0).toUpperCase() + mood.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading emotional journey...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Heart className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchJournalEntries}
              disabled={loading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-500/90 transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Heart className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Journal Entries</h3>
            <p className="text-text-secondary">Start writing to see your emotional journey</p>
          </div>
        </div>
      </Card>
    );
  }

  const maxMood = 5;
  const minMood = 1;
  const chartHeight = 200;
  const chartWidth = Math.max(400, entries.length * 40);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 p-6 -m-6 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-transparent"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl shadow-lg">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary font-jakarta tracking-wide">Emotional Journey</h3>
              <p className="text-sm text-text-secondary">Your mood changes over time</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:border-primary-500 focus:outline-none text-sm"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>
            
            <button
              onClick={fetchJournalEntries}
              disabled={loading}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors duration-200 hover:bg-white/10 rounded-lg"
              title="Refresh data"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            
            <div className="relative overflow-x-auto">
              <div className="min-w-full" style={{ width: `${chartWidth}px` }}>
                <svg
                  width={chartWidth}
                  height={chartHeight}
                  className="w-full"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                >
                  {/* Grid lines */}
                  {[1, 2, 3, 4, 5].map(mood => {
                    const y = chartHeight - ((mood - minMood) / (maxMood - minMood)) * chartHeight;
                    return (
                      <g key={mood}>
                        <line
                          x1={0}
                          y1={y}
                          x2={chartWidth}
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-border-primary opacity-30"
                        />
                        <text
                          x={-10}
                          y={y + 5}
                          textAnchor="end"
                          className="text-xs fill-current text-text-tertiary"
                        >
                          {getMoodLabel(Object.keys(moodValues).find(key => moodValues[key] === mood))}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Data points and lines */}
                  {entries.map((entry, index) => {
                    const x = (index / (entries.length - 1)) * (chartWidth - 40) + 20;
                    const y = chartHeight - ((entry.moodValue - minMood) / (maxMood - minMood)) * chartHeight;
                    
                    return (
                      <g key={entry._id}>
                        {/* Line to next point */}
                        {index < entries.length - 1 && (
                          <motion.line
                            x1={x}
                            y1={y}
                            x2={(index + 1) / (entries.length - 1) * (chartWidth - 40) + 20}
                            y2={chartHeight - ((entries[index + 1].moodValue - minMood) / (maxMood - minMood)) * chartHeight}
                            stroke={entry.moodColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                          />
                        )}
                        
                        {/* Data point */}
                        <motion.circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill={entry.moodColor}
                          stroke="white"
                          strokeWidth="2"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="hover:r-8 transition-all duration-200 cursor-pointer"
                        />
                        
                        {/* Tooltip on hover */}
                        <g className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <rect
                            x={x - 30}
                            y={y - 40}
                            width="60"
                            height="30"
                            fill="rgba(0, 0, 0, 0.8)"
                            rx="4"
                          />
                          <text
                            x={x}
                            y={y - 20}
                            textAnchor="middle"
                            className="text-xs fill-white font-medium"
                          >
                            {getMoodLabel(entry.mood)}
                          </text>
                          <text
                            x={x}
                            y={y - 5}
                            textAnchor="middle"
                            className="text-xs fill-gray-300"
                          >
                            {formatDate(entry.createdAt)}
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 justify-center">
              {Object.entries(moodValues).map(([mood, value]) => (
                <div key={mood} className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: moodColors[mood] }}
                  />
                  <span className="text-sm text-text-secondary capitalize">{mood}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </Card>
  );
};

export default EmotionalJourneyChart;
