import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Heart, 
  Lightbulb,
  Brain,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import { SafeRender } from '../ui';

const JournalTrends = () => {
  const { token } = useAuth();
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchTrends = useCallback(async (forceRefresh = false) => {
    if (!token || loading) return;
    
    setLoading(true);
    setError(null);
    try {
      const url = forceRefresh 
        ? buildApiUrl('/api/journal/trends/refresh')
        : buildApiUrl('/api/journal/trends?limit=50');
      
      const method = forceRefresh ? 'POST' : 'GET';
      const body = forceRefresh ? JSON.stringify({ timeRange: 'month', limit: 50 }) : undefined;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('JournalTrends: Received trends data:', data);
        console.log('JournalTrends: Evolving beliefs count:', data.trendAnalysis?.evolvingBeliefs?.length || 0);
        console.log('JournalTrends: Common topics count:', data.trendAnalysis?.commonTopics?.length || 0);
        setTrends(data.trendAnalysis);
        setError(null);
        
        // Show success message for refresh
        if (forceRefresh) {
          toast.success('Trends refreshed successfully');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Failed to fetch trends';
        setError(errorMessage);
        // Only show toast error once
        if (!hasAttemptedFetch) {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
      setError('Network error');
      // Only show toast error once
      if (!hasAttemptedFetch) {
        toast.error('Failed to fetch trends');
      }
    } finally {
      setLoading(false);
      setHasAttemptedFetch(true);
    }
  }, [token, loading, hasAttemptedFetch]);

  useEffect(() => {
    if (token && !hasAttemptedFetch) {
      fetchTrends();
    }
  }, [token, fetchTrends, hasAttemptedFetch]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return TrendingUp;
      case 'declining': return TrendingDown;
      case 'volatile': return BarChart3;
      default: return Minus;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return 'text-[#1E49C9]';
      case 'declining': return 'text-orange-400';
      case 'volatile': return 'text-purple-400';
      default: return 'text-blue-400';
    }
  };

  const getTrendBgColor = (trend) => {
    switch (trend) {
      case 'improving': return 'bg-[#1E49C9]';
      case 'declining': return 'bg-orange-500';
      case 'volatile': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const getTrendLabel = (trend) => {
    switch (trend) {
      case 'improving': return 'Growing Strong';
      case 'declining': return 'Learning & Growing';
      case 'volatile': return 'Dynamic Journey';
      default: return 'Steady Progress';
    }
  };

  if (!trends && !error && !loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Brain className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <button
              onClick={fetchTrends}
              disabled={loading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-500/90 transition-colors duration-200 disabled:opacity-50 font-jakarta leading-relaxed tracking-wider"
            >
              {loading ? 'Loading...' : 'Load Trends'}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading journal trends...</p>
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
            <Brain className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4"><SafeRender>{error}</SafeRender></p>
            <button
              onClick={fetchTrends}
              disabled={loading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-500/90 transition-colors duration-200 disabled:opacity-50 font-jakarta leading-relaxed tracking-wider"
            >
              {loading ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header with Gradient Background */}
      <div className="relative bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-pink-500/10 p-6 -m-6 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary font-jakarta tracking-wide">Journal Trends</h3>
              <p className="text-sm text-text-secondary">Your emotional patterns and personal insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchTrends(true)}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-primary-500 to-purple-600 text-white rounded-lg hover:from-primary-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 font-jakarta shadow-lg hover:shadow-xl transform hover:scale-105"
              title="Refresh trends"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => fetchTrends(false)}
              disabled={loading}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors duration-200 hover:bg-white/10 rounded-lg"
              title="Reload trends"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 relative z-10">

        {/* AI Analysis with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <Brain className="h-5 w-5 text-blue-400" />
                </div>
                AI Analysis
              </h4>
              <div className="flex items-center space-x-3">
                {React.createElement(getTrendIcon(trends.emotionTrend || trends.sentimentTrend), { 
                  className: `h-5 w-5 ${getTrendColor(trends.emotionTrend || trends.sentimentTrend)}` 
                })}
                <span className={`text-lg font-bold px-3 py-1 rounded-full ${getTrendColor(trends.emotionTrend || trends.sentimentTrend)} bg-opacity-20`}>
                  <SafeRender>{getTrendLabel(trends.emotionTrend || trends.sentimentTrend)}</SafeRender>
                </span>
              </div>
            </div>
            
            {/* Summary Section */}
            {trends.summary && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-text-primary mb-2 font-jakarta">Overview</h5>
                <p className="text-sm text-text-secondary font-jakarta leading-relaxed">
                  <SafeRender>{trends.summary}</SafeRender>
                </p>
              </div>
            )}

            {/* Key Insights */}
            {trends.insights && trends.insights.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-text-primary mb-2 font-jakarta">Key Insights</h5>
                <div className="space-y-2">
                  {trends.insights.slice(0, 3).map((insight, index) => {
                    // Safety check: ensure insight is a string
                    const insightText = typeof insight === 'string' ? insight : String(insight || 'Unknown insight');
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start space-x-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
                      >
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-sm text-text-secondary font-jakarta"><SafeRender>{insightText}</SafeRender></p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}


          </Card>
        </motion.div>

        {/* Common Topics with Enhanced Design */}
        {trends.commonTopics && trends.commonTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <h4 className="text-lg font-semibold text-text-primary mb-4 font-jakarta tracking-wide flex items-center">
                <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                </div>
                Recurring Themes
              </h4>
              <div className="flex flex-wrap gap-3">
                {trends.commonTopics.map((topic, index) => {
                  // Safety check: ensure topic is processed properly
                  if (typeof topic === 'object' && topic !== null) {
                    const topicName = String(topic?.name || topic?.topic || 'Unknown Topic');
                    return (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-sm rounded-full border border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                        <SafeRender>{topicName}</SafeRender>
                      </motion.span>
                    );
                  } else if (typeof topic === 'string') {
                    return (
                      <motion.span
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-sm rounded-full border border-yellow-500/30 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                        <SafeRender>{topic}</SafeRender>
                      </motion.span>
                    );
                  } else {
                    // Skip invalid entries
                    return null;
                  }
                }).filter(Boolean)}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Values and Beliefs with Enhanced Design */}
        {trends.evolvingBeliefs && trends.evolvingBeliefs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
              <h4 className="text-lg font-semibold text-text-primary mb-4 font-jakarta tracking-wide flex items-center">
                <div className="p-2 bg-pink-500/20 rounded-lg mr-3">
                  <Heart className="h-5 w-5 text-pink-400" />
                </div>
                Values & Beliefs
              </h4>
              <div className="space-y-3">
                {trends.evolvingBeliefs.map((belief, index) => {
                  // Safety check: ensure belief is processed properly
                  if (typeof belief === 'object' && belief !== null) {
                    const beliefText = String(belief?.belief || belief?.text || 'Unknown Belief');
                    return (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl border border-pink-500/20 hover:from-pink-500/20 hover:to-rose-500/20 transition-all duration-200 group"
                      >
                        <div className="p-2 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors duration-200">
                          <Heart className="h-4 w-4 text-pink-400" />
                        </div>
                        <p className="text-sm text-text-secondary font-jakarta leading-relaxed flex-1">
                          <SafeRender>{beliefText}</SafeRender>
                        </p>
                      </motion.div>
                    );
                  } else if (typeof belief === 'string') {
                    return (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 rounded-xl border border-pink-500/20 hover:from-pink-500/20 hover:to-rose-500/20 transition-all duration-200 group"
                      >
                        <div className="p-2 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors duration-200">
                          <Heart className="h-4 w-4 text-pink-400" />
                        </div>
                        <p className="text-sm text-text-secondary font-jakarta leading-relaxed flex-1">
                          <SafeRender>{belief}</SafeRender>
                        </p>
                      </motion.div>
                    );
                  } else {
                    // Skip invalid entries
                    return null;
                  }
                }).filter(Boolean)}
              </div>
            </Card>
          </motion.div>
        )}


      </div>
    </Card>
  );
};

export default JournalTrends;
