import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import { RefreshCw, TrendingUp, TrendingDown, Calendar, BarChart3, Target, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import { motion } from 'framer-motion';

const WeeklyBodyEffectsAnalysis = ({ refreshTrigger }) => {
  const { token } = useAuth();
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Get the start and end of current week (Monday to Sunday)
  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(now.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0]
    };
  };

  // Fetch weekly meal data
  const fetchWeeklyData = useCallback(async (isRefresh = false) => {
    if (!token) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { startDate, endDate } = getWeekRange();
      
      const response = await fetch(
        `${buildApiUrl('/api/meals')}?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('WeeklyAnalysis: Failed to fetch meals:', response.status, errorData);
        throw new Error(`Failed to fetch meals: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const meals = data.meals || [];
      
      // Process weekly data
      const processedData = processWeeklyData(meals, startDate, endDate);
      setWeeklyData(processedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching weekly data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Process weekly data to calculate trends and insights
  const processWeeklyData = (meals, startDate, endDate) => {
    // Group meals by day
    const mealsByDay = {};
    const days = [];
    
    // Generate all days in the week
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStr = d.toISOString().split('T')[0];
      days.push(dayStr);
      mealsByDay[dayStr] = [];
    }

    // Group meals by day
    meals.forEach(meal => {
      const mealDate = new Date(meal.ts).toISOString().split('T')[0];
      if (mealsByDay[mealDate]) {
        mealsByDay[mealDate].push(meal);
      }
    });

    // Calculate daily effects for each day
    const dailyEffects = {};
    const effectCategories = [
      'fatForming', 'strength', 'immunity', 'inflammation', 
      'antiInflammatory', 'energizing', 'gutFriendly', 'moodLifting'
    ];

    days.forEach(day => {
      const dayMeals = mealsByDay[day];
      dailyEffects[day] = {};

      effectCategories.forEach(category => {
        dailyEffects[day][category] = {
          score: 0,
          count: 0,
          reasons: []
        };

        dayMeals.forEach(meal => {
          if (meal.computed?.effects?.[category]) {
            const effect = meal.computed.effects[category];
            dailyEffects[day][category].score += effect.score || 0;
            dailyEffects[day][category].count += 1;
            
            if (effect.reasons || effect.why) {
              const reasons = effect.reasons || effect.why || [];
              reasons.forEach(reason => {
                if (!dailyEffects[day][category].reasons.includes(reason)) {
                  dailyEffects[day][category].reasons.push(reason);
                }
              });
            }
          }
        });

        // Calculate average score for the day
        if (dailyEffects[day][category].count > 0) {
          dailyEffects[day][category].averageScore = dailyEffects[day][category].score / dailyEffects[day][category].count;
        }
      });
    });

    // Calculate weekly trends
    const weeklyTrends = {};
    effectCategories.forEach(category => {
      const scores = days.map(day => dailyEffects[day][category].averageScore || 0);
      const totalScore = scores.reduce((sum, score) => sum + score, 0);
      const averageScore = totalScore / scores.length;
      
      // Calculate trend direction
      const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
      
      let trend = 'stable';
      if (secondHalfAvg > firstHalfAvg + 0.5) trend = 'improving';
      else if (secondHalfAvg < firstHalfAvg - 0.5) trend = 'declining';

      weeklyTrends[category] = {
        averageScore,
        trend,
        scores,
        totalMeals: days.reduce((sum, day) => sum + dailyEffects[day][category].count, 0),
        peakDay: days[scores.indexOf(Math.max(...scores))],
        lowDay: days[scores.indexOf(Math.min(...scores))]
      };
    });

    // Generate insights
    const insights = generateInsights(weeklyTrends, dailyEffects, days);

    return {
      days,
      dailyEffects,
      weeklyTrends,
      insights,
      totalMeals: meals.length,
      weekRange: { startDate, endDate }
    };
  };

  // Generate insights based on weekly data
  const generateInsights = (trends, dailyEffects, days) => {
    const insights = [];

    // Find best performing effects
    const bestEffects = Object.entries(trends)
      .filter(([_, data]) => data.averageScore >= 6)
      .sort((a, b) => b[1].averageScore - a[1].averageScore)
      .slice(0, 3);

    if (bestEffects.length > 0) {
      insights.push({
        type: 'positive',
        title: 'Strong Areas',
        message: `Your ${bestEffects.map(([effect]) => getEffectLabel(effect)).join(', ')} scores are consistently high this week.`,
        effects: bestEffects.map(([effect, data]) => ({ effect, score: data.averageScore }))
      });
    }

    // Find areas for improvement
    const improvingEffects = Object.entries(trends)
      .filter(([_, data]) => data.trend === 'improving')
      .sort((a, b) => b[1].averageScore - a[1].averageScore);

    if (improvingEffects.length > 0) {
      insights.push({
        type: 'improving',
        title: 'Improving Trends',
        message: `Your ${improvingEffects.map(([effect]) => getEffectLabel(effect)).join(', ')} scores are trending upward.`,
        effects: improvingEffects.map(([effect, data]) => ({ effect, score: data.averageScore }))
      });
    }

    // Find declining areas
    const decliningEffects = Object.entries(trends)
      .filter(([_, data]) => data.trend === 'declining')
      .sort((a, b) => a[1].averageScore - b[1].averageScore);

    if (decliningEffects.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Areas to Watch',
        message: `Your ${decliningEffects.map(([effect]) => getEffectLabel(effect)).join(', ')} scores are declining this week.`,
        effects: decliningEffects.map(([effect, data]) => ({ effect, score: data.averageScore }))
      });
    }

    // Find low performing effects
    const lowEffects = Object.entries(trends)
      .filter(([_, data]) => data.averageScore < 4)
      .sort((a, b) => a[1].averageScore - b[1].averageScore)
      .slice(0, 3);

    if (lowEffects.length > 0) {
      insights.push({
        type: 'attention',
        title: 'Focus Areas',
        message: `Consider focusing on ${lowEffects.map(([effect]) => getEffectLabel(effect)).join(', ')} for better overall health.`,
        effects: lowEffects.map(([effect, data]) => ({ effect, score: data.averageScore }))
      });
    }

    // Add overall health score insight
    const overallScore = Object.values(trends).reduce((sum, data) => sum + data.averageScore, 0) / Object.keys(trends).length;
    if (overallScore >= 6) {
      insights.push({
        type: 'positive',
        title: 'Overall Health',
        message: `Your overall body effects score is ${overallScore.toFixed(1)}/10 - excellent work!`,
        effects: []
      });
    } else if (overallScore >= 4) {
      insights.push({
        type: 'improving',
        title: 'Overall Health',
        message: `Your overall body effects score is ${overallScore.toFixed(1)}/10 - good progress!`,
        effects: []
      });
    } else {
      insights.push({
        type: 'attention',
        title: 'Overall Health',
        message: `Your overall body effects score is ${overallScore.toFixed(1)}/10 - there's room for improvement.`,
        effects: []
      });
    }

    return insights;
  };

  // Get effect labels
  const getEffectLabel = (effect) => {
    const labels = {
      fatForming: 'Fat Formation',
      strength: 'Strength',
      immunity: 'Immunity',
      inflammation: 'Inflammation',
      antiInflammatory: 'Anti-Inflammatory',
      energizing: 'Energy',
      gutFriendly: 'Gut Health',
      moodLifting: 'Mood'
    };
    return labels[effect] || effect;
  };

  // Get effect icons
  const getEffectIcon = (effect) => {
    const icons = {
      fatForming: '🍔',
      strength: '💪',
      immunity: '🌿',
      inflammation: '🔥',
      antiInflammatory: '❄️',
      energizing: '⚡️',
      gutFriendly: '🌀',
      moodLifting: '😊'
    };
    return icons[effect] || '📊';
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get score color
  const getScoreColor = (score, effect) => {
    // For inflammation and fatForming, lower is better
    if (effect === 'inflammation' || effect === 'fatForming') {
      if (score <= 2) return 'text-green-500';
      if (score <= 4) return 'text-blue-500';
      if (score <= 6) return 'text-yellow-500';
      if (score <= 8) return 'text-orange-500';
      return 'text-red-500';
    }
    
    // For other effects, higher is better
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-blue-500';
    if (score >= 4) return 'text-yellow-500';
    if (score >= 2) return 'text-orange-500';
    return 'text-red-500';
  };

  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchWeeklyData(true);
    }
  }, [refreshTrigger, fetchWeeklyData]);

  const handleRefresh = () => {
    fetchWeeklyData(true);
  };

  const handleEffectClick = (effect, day = null) => {
    setSelectedEffect(effect);
    setSelectedDay(day);
  };

  const closeDetails = () => {
    setSelectedEffect(null);
    setSelectedDay(null);
  };

  if (loading) {
    return (
      <Card variant="elevated">
        <div className="animate-pulse">
          <div className="h-6 bg-background-tertiary rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-background-tertiary rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="elevated">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="font-jakarta text-sm text-red-500 mb-4">Error loading weekly analysis: {error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  if (!weeklyData || weeklyData.totalMeals === 0) {
    return (
      <Card variant="elevated">
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-jakarta text-lg font-semibold text-text-primary mb-2">No Meals This Week</h3>
          <p className="font-jakarta text-text-secondary mb-4">Log meals to see your weekly body effects analysis</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-jakarta text-2xl leading-normal text-text-primary font-bold">
            Weekly Body Effects Analysis
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            {weeklyData.weekRange.startDate} to {weeklyData.weekRange.endDate} • {weeklyData.totalMeals} meals
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 font-jakarta text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Insights */}
      {weeklyData.insights.length > 0 && (
        <div className="mb-6 space-y-3">
          {weeklyData.insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg border ${
                insight.type === 'positive' ? 'bg-green-900/20 border-green-500/30' :
                insight.type === 'improving' ? 'bg-blue-900/20 border-blue-500/30' :
                insight.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500/30' :
                'bg-orange-900/20 border-orange-500/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {insight.type === 'positive' && <Target className="h-4 w-4 text-green-500" />}
                {insight.type === 'improving' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                {insight.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                {insight.type === 'attention' && <AlertCircle className="h-4 w-4 text-orange-500" />}
                <h3 className="font-semibold text-text-primary">{insight.title}</h3>
              </div>
              <p className="text-sm text-text-secondary mb-2">{insight.message}</p>
              <div className="flex flex-wrap gap-2">
                {insight.effects.map(({ effect, score }) => (
                  <span
                    key={effect}
                    className="px-2 py-1 bg-background-tertiary rounded text-xs cursor-pointer hover:opacity-80"
                    onClick={() => handleEffectClick(effect)}
                  >
                    {getEffectIcon(effect)} {getEffectLabel(effect)} ({score.toFixed(1)})
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Weekly Summary */}
      <div className="mb-6 p-4 bg-background-tertiary rounded-lg border border-border-primary">
        <h3 className="font-semibold text-text-primary mb-3">Weekly Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {weeklyData.totalMeals}
            </div>
            <div className="text-xs text-text-secondary">Total Meals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {Object.values(weeklyData.weeklyTrends).filter(trend => trend.trend === 'improving').length}
            </div>
            <div className="text-xs text-text-secondary">Improving</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {Object.values(weeklyData.weeklyTrends).filter(trend => trend.trend === 'declining').length}
            </div>
            <div className="text-xs text-text-secondary">Declining</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">
              {(Object.values(weeklyData.weeklyTrends).reduce((sum, data) => sum + data.averageScore, 0) / Object.keys(weeklyData.weeklyTrends).length).toFixed(1)}
            </div>
            <div className="text-xs text-text-secondary">Avg Score</div>
          </div>
        </div>
      </div>

      {/* Weekly Trends Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(weeklyData.weeklyTrends).map(([effect, data]) => (
          <motion.div
            key={effect}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-background-tertiary rounded-lg border border-border-primary hover:border-accent-primary/30 transition-colors cursor-pointer"
            onClick={() => handleEffectClick(effect)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{getEffectIcon(effect)}</span>
              {getTrendIcon(data.trend)}
            </div>
            <h3 className="font-semibold text-text-primary text-sm mb-1">
              {getEffectLabel(effect)}
            </h3>
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${getScoreColor(data.averageScore, effect)}`}>
                {data.averageScore.toFixed(1)}
              </span>
              <span className="text-xs text-text-secondary">
                {data.totalMeals} meals
              </span>
            </div>
            <div className="text-xs text-text-muted mt-1">
              {data.trend === 'improving' && '↗ Improving'}
              {data.trend === 'declining' && '↘ Declining'}
              {data.trend === 'stable' && '→ Stable'}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Daily Breakdown */}
      <div className="mb-6">
        <h3 className="font-semibold text-text-primary mb-4">Daily Breakdown</h3>
        <div className="space-y-2">
          {weeklyData.days.map((day, index) => {
            const dayMeals = weeklyData.dailyEffects[day];
            const hasMeals = Object.values(dayMeals).some(effect => effect.count > 0);
            
            if (!hasMeals) return null;

            return (
              <motion.div
                key={day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 bg-background-tertiary/50 rounded-lg border border-border-primary"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-text-primary">
                    {new Date(day).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <span className="text-xs text-text-secondary">
                    {Object.values(dayMeals).reduce((sum, effect) => sum + effect.count, 0)} meals
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(dayMeals)
                    .filter(([_, effect]) => effect.count > 0)
                    .map(([effect, data]) => (
                    <div
                      key={effect}
                      className="text-center cursor-pointer hover:opacity-80"
                      onClick={() => handleEffectClick(effect, day)}
                    >
                      <div className="text-lg">{getEffectIcon(effect)}</div>
                      <div className={`text-sm font-medium ${getScoreColor(data.averageScore, effect)}`}>
                        {data.averageScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-text-muted">
                        {getEffectLabel(effect)}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Effect Details Modal */}
      {selectedEffect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border-primary rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">
                  {getEffectIcon(selectedEffect)} {getEffectLabel(selectedEffect)} Analysis
                </h3>
                <button
                  onClick={closeDetails}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
              
              {selectedDay ? (
                <div>
                  <h4 className="font-medium text-text-primary mb-2">
                    {new Date(selectedDay).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <div className="space-y-2">
                    {weeklyData.dailyEffects[selectedDay][selectedEffect].reasons.map((reason, index) => (
                      <div key={index} className="text-sm text-text-secondary flex items-start">
                        <span className="mr-2">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-text-primary">Weekly Average</span>
                      <span className={`text-lg font-bold ${getScoreColor(weeklyData.weeklyTrends[selectedEffect].averageScore, selectedEffect)}`}>
                        {weeklyData.weeklyTrends[selectedEffect].averageScore.toFixed(1)}/10
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-text-primary">Trend</span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(weeklyData.weeklyTrends[selectedEffect].trend)}
                        <span className="text-sm text-text-secondary capitalize">
                          {weeklyData.weeklyTrends[selectedEffect].trend}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text-primary mb-2">Daily Scores</h4>
                    <div className="space-y-1">
                      {weeklyData.days.map(day => {
                        const dayData = weeklyData.dailyEffects[day][selectedEffect];
                        if (dayData.count === 0) return null;
                        
                        return (
                          <div key={day} className="flex items-center justify-between text-sm">
                            <span className="text-text-secondary">
                              {new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className={`font-medium ${getScoreColor(dayData.averageScore, selectedEffect)}`}>
                              {dayData.averageScore.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-text-primary mb-2">Peak Performance</h4>
                    <p className="text-sm text-text-secondary">
                      Best day: {new Date(weeklyData.weeklyTrends[selectedEffect].peakDay).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeDetails}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default WeeklyBodyEffectsAnalysis;
