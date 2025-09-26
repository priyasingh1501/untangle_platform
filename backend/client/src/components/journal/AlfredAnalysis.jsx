import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Heart, 
  Lightbulb, 
  Target, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  BarChart3,
  MessageSquare
} from 'lucide-react';
import Card from '../ui/Card';
import { SafeRender } from '../ui';

const AlfredAnalysis = ({ analysis, entryId, onAnalyze }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  console.log('AlfredAnalysis received entryId:', entryId);

  // Safety check for malformed analysis data
  if (!analysis || typeof analysis !== 'object') {
    return (
      <Card className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-primary-500" />
            <span className="text-sm font-medium text-text-primary font-jakarta">Alfred Analysis</span>
          </div>
          <button
            onClick={async () => {
              console.log('Analyze button clicked with entryId:', entryId);
              setIsAnalyzing(true);
              try {
                await onAnalyze(entryId);
              } finally {
                setIsAnalyzing(false);
              }
            }}
            disabled={isAnalyzing}
            className="px-3 py-1 bg-primary-500 text-white text-xs rounded-lg hover:bg-primary-500/90 transition-colors duration-200 disabled:opacity-50 font-jakarta"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </Card>
    );
  }

  const getEmotionColor = (emotion) => {
    if (!emotion) return 'text-text-secondary';
    switch (emotion) {
      case 'joy': return 'text-yellow-400';
      case 'sadness': return 'text-blue-400';
      case 'anger': return 'text-red-400';
      case 'fear': return 'text-purple-400';
      case 'surprise': return 'text-orange-400';
      case 'disgust': return 'text-[#1E49C9]';
      case 'love': return 'text-pink-400';
      case 'anxiety': return 'text-red-300';
      case 'excitement': return 'text-yellow-300';
      case 'contentment': return 'text-[#1E49C9]';
      case 'frustration': return 'text-red-500';
      case 'gratitude': return 'text-yellow-500';
      case 'loneliness': return 'text-gray-400';
      case 'hope': return 'text-blue-300';
      case 'disappointment': return 'text-gray-500';
      case 'pride': return 'text-purple-300';
      case 'shame': return 'text-red-600';
      case 'relief': return 'text-[#1E49C9]';
      case 'confusion': return 'text-gray-400';
      case 'peace': return 'text-blue-200';
      case 'overwhelmed': return 'text-red-400';
      case 'confident': return 'text-[#1E49C9]';
      case 'vulnerable': return 'text-pink-300';
      case 'motivated': return 'text-orange-500';
      case 'tired': return 'text-gray-500';
      case 'energetic': return 'text-yellow-400';
      case 'calm': return 'text-blue-300';
      case 'stressed': return 'text-red-400';
      case 'curious': return 'text-purple-400';
      case 'nostalgic': return 'text-indigo-400';
      default: return 'text-text-secondary';
    }
  };

  const getEmotionBgColor = (emotion) => {
    if (!emotion) return 'bg-gray-500';
    switch (emotion) {
      case 'joy': return 'bg-yellow-500';
      case 'sadness': return 'bg-blue-500';
      case 'anger': return 'bg-red-500';
      case 'fear': return 'bg-purple-500';
      case 'surprise': return 'bg-orange-500';
      case 'disgust': return 'bg-[#1E49C9]';
      case 'love': return 'bg-pink-500';
      case 'anxiety': return 'bg-red-400';
      case 'excitement': return 'bg-yellow-400';
      case 'contentment': return 'bg-[#1E49C9]';
      case 'frustration': return 'bg-red-600';
      case 'gratitude': return 'bg-yellow-600';
      case 'loneliness': return 'bg-gray-500';
      case 'hope': return 'bg-blue-400';
      case 'disappointment': return 'bg-gray-600';
      case 'pride': return 'bg-purple-400';
      case 'shame': return 'bg-red-700';
      case 'relief': return 'bg-[#1E49C9]';
      case 'confusion': return 'bg-gray-500';
      case 'peace': return 'bg-blue-300';
      case 'overwhelmed': return 'bg-red-500';
      case 'confident': return 'bg-[#1E49C9]';
      case 'vulnerable': return 'bg-pink-400';
      case 'motivated': return 'bg-orange-600';
      case 'tired': return 'bg-gray-600';
      case 'energetic': return 'bg-yellow-500';
      case 'calm': return 'bg-blue-400';
      case 'stressed': return 'bg-red-500';
      case 'curious': return 'bg-purple-500';
      case 'nostalgic': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  // Alias for getSentimentBgColor to fix the undefined error
  const getSentimentBgColor = getEmotionBgColor;

  const getEmotionLabel = (emotion) => {
    if (!emotion) return 'Unknown';
    return emotion.charAt(0).toUpperCase() + emotion.slice(1);
  };

  const getBeliefCategoryIcon = (category) => {
    switch (category) {
      case 'personal_values': return Heart;
      case 'life_philosophy': return Lightbulb;
      case 'relationships': return MessageSquare;
      case 'work_ethics': return Target;
      case 'spirituality': return Sparkles;
      case 'health_wellness': return TrendingUp;
      default: return Brain;
    }
  };

  const getBeliefCategoryColor = (category) => {
    switch (category) {
      case 'personal_values': return 'text-pink-400';
      case 'life_philosophy': return 'text-yellow-400';
      case 'relationships': return 'text-blue-400';
      case 'work_ethics': return 'text-green-400';
      case 'spirituality': return 'text-purple-400';
      case 'health_wellness': return 'text-emerald-400';
      default: return 'text-text-tertiary';
    }
  };

  const getBeliefCategoryBgColor = (category) => {
    switch (category) {
      case 'personal_values': return 'bg-pink-500/10 border-pink-500/20';
      case 'life_philosophy': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'relationships': return 'bg-blue-500/10 border-blue-500/20';
      case 'work_ethics': return 'bg-green-500/10 border-green-500/20';
      case 'spirituality': return 'bg-purple-500/10 border-purple-500/20';
      case 'health_wellness': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  return (
    <Card className="mt-4">
      {/* Header */}
      <div 
        className="cursor-pointer hover:bg-gray-700/50 transition-colors duration-200 rounded-lg p-2 -m-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500 bg-opacity-20 rounded-lg">
              <Brain className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-text-primary font-jakarta tracking-wide">Alfred's Analysis</h4>
              <p className="text-xs text-text-tertiary font-jakarta">
                Analyzed on {analysis?.analyzedAt ? new Date(analysis.analyzedAt).toLocaleDateString() : 'Unknown date'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getEmotionBgColor(analysis?.emotion?.primary)}`}></div>
            <span className={`text-sm font-medium ${getEmotionColor(analysis?.emotion?.primary)}`}>
              {getEmotionLabel(analysis?.emotion?.primary)}
            </span>
            {analysis?.emotion?.intensity && (
              <span className="text-xs text-text-tertiary">
                ({analysis.emotion.intensity}/10)
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-text-tertiary" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-tertiary" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-border-primary mt-4"
          >
            <div className="pt-4 space-y-4">
              {/* Summary */}
              <div>
                <h5 className="text-sm font-semibold text-text-primary mb-2 font-jakarta tracking-wide flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-blue-400" />
                  Summary
                </h5>
                <p className="text-sm text-text-secondary font-jakarta">{analysis?.summary || 'No summary available'}</p>
              </div>

              {/* Emotion Analysis */}
              <div>
                <h5 className="text-sm font-semibold text-text-primary mb-2 font-jakarta tracking-wide flex items-center">
                  <Heart className="h-4 w-4 mr-2 text-pink-400" />
                  Emotion Analysis
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-tertiary">Primary:</span>
                      <span className={`text-sm font-medium ${getEmotionColor(analysis?.emotion?.primary)}`}>
                        {getEmotionLabel(analysis?.emotion?.primary)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-tertiary">Intensity:</span>
                      <span className="text-sm text-text-secondary">
                        {analysis?.emotion?.intensity || 0}/10
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-tertiary">Confidence:</span>
                      <span className="text-sm text-text-secondary">
                        {((analysis?.emotion?.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {analysis?.emotion?.secondary && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-tertiary">Secondary:</span>
                      <span className={`text-sm font-medium ${getEmotionColor(analysis?.emotion?.secondary)}`}>
                        {getEmotionLabel(analysis?.emotion?.secondary)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Topics */}
              {analysis?.topics && analysis.topics.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-text-primary mb-3 font-jakarta tracking-wide flex items-center">
                    <Target className="h-4 w-4 mr-2 text-purple-400" />
                    Main Topics
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.topics || []).map((topic, index) => {
                      // Enhanced safety check: ensure topic is an object and never render objects directly
                      try {
                        if (typeof topic !== 'object' || topic === null) {
                          return null;
                        }
                        
                        const topicName = String(topic.name || 'Unknown topic');
                        const confidence = Number(topic.confidence || 0);
                        
                        // Extra safety: ensure we're not rendering objects and have valid values
                        if (typeof topicName !== 'string' || isNaN(confidence)) {
                          return null;
                        }
                        
                        return (
                          <span
                            key={`topic-${index}-${topicName}`}
                            className="inline-flex items-center px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs rounded-lg font-medium"
                          >
                            <SafeRender>{topicName}</SafeRender>
                            <span className="ml-2 text-purple-400 font-semibold">
                              <SafeRender>{Math.min(100, Math.max(0, confidence * 100)).toFixed(0)}%</SafeRender>
                            </span>
                          </span>
                        );
                      } catch (error) {
                        console.warn('Error rendering topic:', topic, error);
                        return null;
                      }
                    }).filter(Boolean)}
                  </div>
                </div>
              )}

              {/* Beliefs and Values */}
              {analysis?.beliefs && analysis.beliefs.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-text-primary mb-3 font-jakarta tracking-wide flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-pink-400" />
                    Beliefs & Values
                  </h5>
                  <div className="space-y-3">
                    {(analysis.beliefs || []).map((belief, index) => {
                      // Enhanced safety check: ensure belief is an object and never render objects directly
                      try {
                        if (typeof belief !== 'object' || belief === null) {
                          return null;
                        }
                        
                        const beliefText = String(belief.belief || 'Unknown belief');
                        const category = String(belief.category || 'general');
                        const confidence = Number(belief.confidence || 0);
                        
                        // Extra safety: ensure we're not rendering objects and have valid values
                        if (typeof beliefText !== 'string' || typeof category !== 'string' || isNaN(confidence)) {
                          return null;
                        }
                        
                        const IconComponent = getBeliefCategoryIcon(category);
                        const bgColor = getBeliefCategoryBgColor(category);
                        const textColor = getBeliefCategoryColor(category);
                        
                        return (
                          <div key={`belief-${index}-${category}`} className={`flex items-start space-x-3 p-3 rounded-lg border ${bgColor}`}>
                            <div className={`p-2 rounded-lg ${bgColor.replace('bg-', 'bg-').replace('/10', '/20')}`}>
                              <IconComponent className={`h-4 w-4 ${textColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary font-jakarta leading-relaxed mb-2">
                                <SafeRender>{beliefText}</SafeRender>
                              </p>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-medium ${textColor} capitalize`}>
                                  <SafeRender>{category.replace('_', ' ')}</SafeRender>
                                </span>
                                <span className="text-xs text-text-muted">
                                  {Math.min(100, Math.max(0, confidence * 100)).toFixed(0)}% confidence
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      } catch (error) {
                        console.warn('Error rendering belief:', belief, error);
                        return null;
                      }
                    }).filter(Boolean)}
                  </div>
                </div>
              )}

              {/* Insights */}
              {analysis?.insights && analysis.insights.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-text-primary mb-3 font-jakarta tracking-wide flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />
                    Insights
                  </h5>
                  <div className="space-y-3">
                    {analysis.insights.map((insight, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <div className="p-2 rounded-lg bg-yellow-500/20">
                          <Sparkles className="h-4 w-4 text-yellow-400" />
                        </div>
                        <p className="text-sm text-text-primary font-jakarta leading-relaxed"><SafeRender>{insight}</SafeRender></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default AlfredAnalysis;
