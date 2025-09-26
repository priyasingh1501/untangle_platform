import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  Heart, 
  Lightbulb,
  Brain,
  RefreshCw,
  Calendar,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Users,
  Sun,
  Moon,
  ChevronRight,
  ChevronDown,
  Download,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import { SafeRender } from '../ui';

const EnhancedJournalTrends = () => {
  const { token } = useAuth();
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    emotions: true,
    topics: true,
    beliefs: true,
    insights: true
  });

  const fetchTrends = useCallback(async () => {
    if (!token || loading) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(buildApiUrl(`/api/journal/trends?limit=50&timeRange=${timeRange}`), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('EnhancedJournalTrends: Received trends data:', data);
        console.log('EnhancedJournalTrends: Evolving beliefs count:', data.trendAnalysis?.evolvingBeliefs?.length || 0);
        console.log('EnhancedJournalTrends: Common topics count:', data.trendAnalysis?.commonTopics?.length || 0);
        setTrends(data.trendAnalysis);
        setError(null);
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
  }, [token, timeRange, loading, hasAttemptedFetch]);

  useEffect(() => {
    if (token && !hasAttemptedFetch) {
      fetchTrends();
    }
  }, [token, fetchTrends, hasAttemptedFetch]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      joy: 'text-yellow-400',
      sadness: 'text-blue-400',
      anger: 'text-red-400',
      fear: 'text-purple-400',
      love: 'text-pink-400',
      anxiety: 'text-red-300',
      excitement: 'text-orange-400',
      contentment: 'text-[#1E49C9]',
      gratitude: 'text-yellow-500',
      hope: 'text-blue-300',
      peace: 'text-indigo-400',
      overwhelmed: 'text-red-500',
      confident: 'text-[#1E49C9]',
      motivated: 'text-orange-500',
      calm: 'text-blue-300',
      stressed: 'text-red-400',
      curious: 'text-purple-400',
      nostalgic: 'text-indigo-500'
    };
    return colors[emotion] || 'text-gray-400';
  };

  const getEmotionBgColor = (emotion) => {
    const colors = {
      joy: 'bg-yellow-500',
      sadness: 'bg-blue-500',
      anger: 'bg-red-500',
      fear: 'bg-purple-500',
      love: 'bg-pink-500',
      anxiety: 'bg-red-400',
      excitement: 'bg-orange-500',
      contentment: 'bg-[#1E49C9]',
      gratitude: 'bg-yellow-600',
      hope: 'bg-blue-400',
      peace: 'bg-indigo-500',
      overwhelmed: 'bg-red-600',
      confident: 'bg-[#1E49C9]',
      motivated: 'bg-orange-600',
      calm: 'bg-blue-400',
      stressed: 'bg-red-500',
      curious: 'bg-purple-500',
      nostalgic: 'bg-indigo-600'
    };
    return colors[emotion] || 'bg-gray-500';
  };

  const getGrowthIndicator = (trend) => {
    switch (trend) {
      case 'improving': return { icon: CheckCircle, color: 'text-[#1E49C9]', text: 'Thriving & Growing' };
      case 'declining': return { icon: Target, color: 'text-orange-400', text: 'Learning & Evolving' };
      case 'volatile': return { icon: Zap, color: 'text-purple-400', text: 'Dynamic & Adaptable' };
      default: return { icon: Activity, color: 'text-blue-400', text: 'Steady Progress' };
    }
  };

  if (!trends && !error) {
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
      {/* Header with Enhanced Gradient Background */}
      <div className="relative bg-gradient-to-r from-primary-500/10 via-purple-500/10 to-pink-500/10 p-6 -m-6 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-transparent"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl shadow-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-text-primary font-jakarta tracking-wide">Personal Insights</h3>
              <p className="text-sm text-text-secondary">Your emotional journey and growth patterns</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Enhanced Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-text-primary text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-200"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            
            <button
              onClick={fetchTrends}
              disabled={loading}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors duration-200 hover:bg-white/10 rounded-lg"
              title="Refresh Analysis"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Growth Overview with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 bg-gradient-to-br from-primary-500/15 to-purple-500/15 border-primary-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide flex items-center">
                <div className="p-2 bg-primary-500/20 rounded-lg mr-3">
                  <Target className="h-5 w-5 text-primary-400" />
                </div>
                Growth Overview
              </h4>
              <div className="flex items-center space-x-3">
                {(() => {
                  const indicator = getGrowthIndicator(trends.sentimentTrend);
                  return (
                    <>
                      <indicator.icon className={`h-5 w-5 ${indicator.color}`} />
                      <span className={`text-lg font-bold px-3 py-1 rounded-full ${indicator.color} bg-opacity-20`}>
                        {indicator.text}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <p className="text-sm text-text-secondary font-jakarta leading-relaxed">
              {trends.summary || 'Your emotional patterns reveal beautiful insights about your personal growth journey and inner strength.'}
            </p>
          </Card>
        </motion.div>

        {/* Emotion Analysis with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6 bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-pink-500/10 transition-colors duration-200 rounded-lg p-2 -m-2"
              onClick={() => toggleSection('emotions')}
            >
              <h4 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide flex items-center">
                <div className="p-2 bg-pink-500/20 rounded-lg mr-3">
                  <Heart className="h-5 w-5 text-pink-400" />
                </div>
                Emotional Patterns
              </h4>
              {expandedSections.emotions ? (
                <ChevronDown className="h-5 w-5 text-text-tertiary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-text-tertiary" />
              )}
            </div>
          
          <AnimatePresence>
            {expandedSections.emotions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-3"
              >
                {/* Emotion Frequency */}
                {trends.emotionFrequency && (
                  <div>
                    <h5 className="text-xs font-medium text-text-tertiary mb-2 font-jakarta">Most Common Emotions</h5>
                    <div className="space-y-2">
                      {(trends.emotionFrequency || []).slice(0, 5).map((emotion, index) => {
                        // Enhanced safety check: ensure emotion is processed properly and never render objects directly
                        try {
                          if (typeof emotion === 'object' && emotion !== null) {
                            const emotionName = String(emotion?.name || emotion?.emotion || 'Unknown');
                            const emotionFrequency = Number(emotion?.frequency || 0);
                            const maxFrequency = Number(trends.emotionFrequency[0]?.frequency || 1);
                            
                            // Extra safety: ensure we're not rendering objects
                            if (typeof emotionName !== 'string' || isNaN(emotionFrequency) || isNaN(maxFrequency)) {
                              return null;
                            }
                            
                            return (
                              <div key={`emotion-${index}-${emotionName}`} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${getEmotionBgColor(emotionName)}`}></div>
                                  <span className={`text-sm font-medium ${getEmotionColor(emotionName)}`}>
                                    <SafeRender>{emotionName.charAt(0).toUpperCase() + emotionName.slice(1)}</SafeRender>
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${getEmotionBgColor(emotionName)}`}
                                      style={{ width: `${Math.min(100, (emotionFrequency / maxFrequency) * 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-text-tertiary"><SafeRender>{emotionFrequency}</SafeRender></span>
                                </div>
                              </div>
                            );
                          } else if (typeof emotion === 'string' && emotion.trim()) {
                            const emotionName = String(emotion);
                            const emotionFrequency = 1;
                            const maxFrequency = Number(trends.emotionFrequency[0]?.frequency || 1);
                            
                            return (
                              <div key={`emotion-string-${index}-${emotionName}`} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className={`w-3 h-3 rounded-full ${getEmotionBgColor(emotionName)}`}></div>
                                  <span className={`text-sm font-medium ${getEmotionColor(emotionName)}`}>
                                    {emotionName.charAt(0).toUpperCase() + emotionName.slice(1)}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${getEmotionBgColor(emotionName)}`}
                                      style={{ width: `${Math.min(100, (emotionFrequency / maxFrequency) * 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-text-tertiary"><SafeRender>{emotionFrequency}</SafeRender></span>
                                </div>
                              </div>
                            );
                          } else {
                            // Skip invalid entries
                            return null;
                          }
                        } catch (error) {
                          console.warn('Error rendering emotion:', emotion, error);
                          return null;
                        }
                      }).filter(Boolean)}
                    </div>
                  </div>
                )}

                {/* Emotional Stability */}
                {trends.emotionalStability && (
                  <div>
                    <h5 className="text-xs font-medium text-text-tertiary mb-2 font-jakarta">Emotional Stability</h5>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${trends.emotionalStability.score}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-text-primary">
                        {trends.emotionalStability.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      {trends.emotionalStability.description}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Topic Analysis with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-yellow-500/10 transition-colors duration-200 rounded-lg p-2 -m-2"
              onClick={() => toggleSection('topics')}
            >
              <h4 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide flex items-center">
                <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                </div>
                Recurring Themes
              </h4>
              {expandedSections.topics ? (
                <ChevronDown className="h-5 w-5 text-text-tertiary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-text-tertiary" />
              )}
            </div>
          
          <AnimatePresence>
            {expandedSections.topics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                {trends.commonTopics && trends.commonTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {trends.commonTopics.map((topic, index) => {
                      const topicName = typeof topic === 'string' ? topic : (topic?.name || topic?.belief || 'Unknown Topic');
                      return (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-yellow-500 bg-opacity-20 text-yellow-300 text-sm rounded-full hover:bg-opacity-30 transition-colors duration-200 cursor-pointer"
                          onClick={() => setSelectedEmotion(topic)}
                        >
                          <SafeRender>{topicName}</SafeRender>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary font-jakarta">Your unique themes are emerging as you continue your journey.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Belief Evolution with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-purple-500/20">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-purple-500/10 transition-colors duration-200 rounded-lg p-2 -m-2"
              onClick={() => toggleSection('beliefs')}
            >
              <h4 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide flex items-center">
                <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                  <Heart className="h-5 w-5 text-purple-400" />
                </div>
                Values & Beliefs
              </h4>
              {expandedSections.beliefs ? (
                <ChevronDown className="h-5 w-5 text-text-tertiary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-text-tertiary" />
              )}
            </div>
          
          <AnimatePresence>
            {expandedSections.beliefs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-2"
              >
                {trends.evolvingBeliefs && trends.evolvingBeliefs.length > 0 ? (
                  trends.evolvingBeliefs.map((belief, index) => {
                    const beliefText = typeof belief === 'string' ? belief : (belief?.belief || belief?.name || 'Unknown Belief');
                    return (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-pink-500 bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-colors duration-200">
                        <Heart className="h-4 w-4 mt-0.5 text-pink-400 flex-shrink-0" />
                        <p className="text-sm text-text-secondary font-jakarta">
                          <SafeRender>{beliefText}</SafeRender>
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-text-secondary font-jakarta">Your values and beliefs are taking shape beautifully as you grow.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Actionable Insights with Enhanced Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-[#1E49C9]/15 to-blue-500/15 border-[#1E49C9]/30 shadow-lg">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-[#1E49C9]/10 transition-colors duration-200 rounded-lg p-2 -m-2"
              onClick={() => toggleSection('insights')}
            >
              <h4 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide flex items-center">
                <div className="p-2 bg-[#1E49C9]/20 rounded-lg mr-3">
                  <Zap className="h-5 w-5 text-[#1E49C9]" />
                </div>
                Actionable Insights
              </h4>
              {expandedSections.insights ? (
                <ChevronDown className="h-5 w-5 text-text-tertiary" />
              ) : (
                <ChevronRight className="h-5 w-5 text-text-tertiary" />
              )}
            </div>
          
          <AnimatePresence>
            {expandedSections.insights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-3"
              >
                {/* Growth Areas */}
                {trends.growthAreas && (
                  <div>
                    <h5 className="text-xs font-medium text-text-tertiary mb-2 font-jakarta">Areas of Growth</h5>
                    <div className="space-y-2">
                      {trends.growthAreas.map((area, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-[#1E49C9] bg-opacity-10 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-[#1E49C9]" />
                          <span className="text-sm text-text-secondary font-jakarta"><SafeRender>{area}</SafeRender></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {trends.recommendations && (
                  <div>
                    <h5 className="text-xs font-medium text-text-tertiary mb-2 font-jakarta">Recommendations</h5>
                    <div className="space-y-2">
                      {trends.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 bg-blue-500 bg-opacity-10 rounded-lg">
                          <Lightbulb className="h-4 w-4 text-blue-400 mt-0.5" />
                          <span className="text-sm text-text-secondary font-jakarta"><SafeRender>{rec}</SafeRender></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </Card>
  );
};

export default EnhancedJournalTrends;
