import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import { RefreshCw, Utensils, Calendar, BarChart3 } from 'lucide-react';
import Card from '../ui/Card';

const DailyMealKPIs = ({ refreshTrigger }) => {
  const { token } = useAuth();
  const [dailyMeals, setDailyMeals] = useState([]);
  const [weeklyMeals, setWeeklyMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEffect, setSelectedEffect] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');

  // Get today's local date in YYYY-MM-DD format (avoid UTC shift)
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get date range for past 7 days
  const getWeeklyDateRange = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6); // 7 days including today
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      startDate: formatDate(weekAgo),
      endDate: formatDate(today)
    };
  };


  // Fetch meals for today
  const fetchTodayMeals = useCallback(async (isRefresh = false) => {
    if (!token) {
      return;
    }

    console.log('DailyMealKPIs: Fetching today\'s meals...', { isRefresh, token: !!token });
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const today = getTodayDate();
      console.log('DailyMealKPIs: Fetching meals for date:', today);
      
      const url = `${buildApiUrl('/api/meals')}?startDate=${today}&endDate=${today}&_t=${Date.now()}`;
      console.log('DailyMealKPIs: Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('DailyMealKPIs: Failed to fetch meals:', response.status, errorData);
        throw new Error(`Failed to fetch meals: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('DailyMealKPIs: Received meals data:', { mealCount: data.meals?.length || 0, meals: data.meals });
      setDailyMeals(data.meals || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching today\'s meals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Fetch meals for past 7 days
  const fetchWeeklyMeals = useCallback(async (isRefresh = false) => {
    if (!token) {
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const { startDate, endDate } = getWeeklyDateRange();
      
      const url = `${buildApiUrl('/api/meals')}?startDate=${startDate}&endDate=${endDate}&_t=${Date.now()}`;
      console.log('DailyMealKPIs: Fetching weekly meals from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('DailyMealKPIs: Failed to fetch weekly meals:', response.status, errorData);
        throw new Error(`Failed to fetch weekly meals: ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      setWeeklyMeals(data.meals || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching weekly meals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);


  useEffect(() => {
    fetchTodayMeals();
    fetchWeeklyMeals();
  }, [fetchTodayMeals, fetchWeeklyMeals]);

  // Respond to refresh trigger from parent component
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('DailyMealKPIs: Refresh triggered, refreshing data...', refreshTrigger);
      fetchTodayMeals(true);
      fetchWeeklyMeals(true);
    }
  }, [refreshTrigger, fetchTodayMeals, fetchWeeklyMeals]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (activeTab === 'daily') {
      fetchTodayMeals(true);
    } else {
      fetchWeeklyMeals(true);
    }
  };

  // Helper function to format meal time
  const formatMealTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Helper function to get meal effect level
  const getMealEffectLevel = (score) => {
    if (score >= 8) return { level: 'Excellent', color: 'text-[#1E49C9]' };
    if (score >= 6) return { level: 'Good', color: 'text-blue-600' };
    if (score >= 4) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Needs Attention', color: 'text-red-600' };
  };

  const handleEffectClick = (effectKey, effectData, meal) => {
    console.log('🔍 Effect clicked:', effectKey, effectData);
    setSelectedEffect({ key: effectKey, data: effectData });
    setSelectedMeal(meal);
  };

  const closeEffectDetails = () => {
    setSelectedEffect(null);
    setSelectedMeal(null);
  };

  // Icons and labels for effects
  const icons = {
    strength: 'Strength',
    immunity: 'Immunity',
    inflammation: 'Inflammation',
    antiInflammatory: 'Anti-Inflammatory',
    energizing: 'Energizing',
    gutFriendly: 'Gut Friendly',
    moodLifting: 'Mood',
    fatForming: 'Fat Forming'
  };

  const labels = {
    strength: 'Strength',
    immunity: 'Immunity',
    inflammation: 'Inflammatory',
    antiInflammatory: 'Anti-Inflammatory',
    energizing: 'Energy',
    gutFriendly: 'Gut Health',
    moodLifting: 'Mood',
    fatForming: 'Fat Formation'
  };


  // Get current data based on active tab
  const getCurrentMeals = () => {
    return activeTab === 'daily' ? dailyMeals : weeklyMeals;
  };

  // Calculate nutrition totals for current period
  const calculateNutrition = (meals) => {
    return meals.reduce((acc, meal) => {
      if (meal.computed?.totals) {
        Object.keys(meal.computed.totals).forEach(nutrient => {
          acc[nutrient] = (acc[nutrient] || 0) + (meal.computed.totals[nutrient] || 0);
        });
      }
      return acc;
    }, {});
  };

  // Calculate aggregated effects for current period
  const calculateEffects = (meals) => {
    return meals.reduce((acc, meal) => {
      if (meal.computed?.effects) {
        Object.entries(meal.computed.effects).forEach(([effectKey, effectData]) => {
          if (!acc[effectKey]) {
            acc[effectKey] = {
              score: 0,
              level: 'Very Low',
              why: []
            };
          }
          
          // Sum up scores
          acc[effectKey].score += effectData.score || 0;
          
          // Combine reasons (avoid duplicates)
          if (effectData.why && Array.isArray(effectData.why)) {
            effectData.why.forEach(reason => {
              if (!acc[effectKey].why.includes(reason)) {
                acc[effectKey].why.push(reason);
              }
            });
          }
        });
      }
      return acc;
    }, {});
  };


  // Get current data based on active tab
  const currentMeals = getCurrentMeals();
  const currentNutrition = calculateNutrition(currentMeals);
  const currentEffects = calculateEffects(currentMeals);
  
  if (loading) {
    return (
      <Card variant="elevated">
        <div className="animate-pulse">
          <div className="h-4 bg-background-tertiary rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-16 bg-background-tertiary rounded"></div>
            <div className="h-16 bg-background-tertiary rounded"></div>
            <div className="h-16 bg-background-tertiary rounded"></div>
            <div className="h-16 bg-background-tertiary rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="elevated">
        <div className="text-center">
          <p className="font-jakarta text-sm text-accent mb-4">Error loading meals: {error}</p>
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

  if (!currentMeals.length) {
    return (
      <Card variant="elevated">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-[#2A313A] rounded-full mx-auto mb-4 flex items-center justify-center">
            <Utensils className="text-[#C9D1D9]" size={24} />
          </div>
          <h3 className="font-jakarta text-lg font-semibold text-text-primary mb-2">
            No Meals {activeTab === 'daily' ? 'Today' : 'This Week'}
          </h3>
          <p className="font-jakarta text-text-secondary mb-4">
            Log your meals to see {activeTab === 'daily' ? 'daily' : 'weekly'} nutrition insights and track your eating patterns
          </p>
          <a
            href="/food"
            className="inline-flex items-center px-4 py-2 bg-[#1E49C9] text-white text-sm rounded-lg hover:bg-[#1E49C9]/80 transition-colors"
          >
            LOG MEAL
          </a>
        </div>
        
        {/* Empty State Meal List Placeholder */}
        <div className="mt-6 p-6 bg-background-tertiary rounded-xl border border-border-primary">
          <div className="text-lg font-semibold text-text-primary mb-4 text-center">
            {activeTab === 'daily' ? 'Today\'s Meals' : 'This Week\'s Meals'}
          </div>
          <div className="text-center py-8 text-text-secondary">
            <div className="w-12 h-12 bg-background-primary rounded-full mx-auto mb-3 flex items-center justify-center">
              <Utensils className="text-text-muted" size={20} />
            </div>
            <p className="text-sm">No meals logged yet</p>
            <p className="text-xs mt-1 opacity-75">Your logged meals will appear here</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-jakarta text-3xl font-bold text-text-primary">
          Nutrition Insights
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 font-jakarta text-sm font-medium text-text-secondary hover:text-text-primary disabled:opacity-50 transition-all duration-200 bg-background-tertiary rounded-lg border border-border-primary hover:bg-background-secondary hover:border-border-secondary"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-8 bg-background-tertiary p-2 rounded-xl border border-border-primary">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'daily'
              ? 'bg-background-primary text-text-primary shadow-sm border border-border-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Daily
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'weekly'
              ? 'bg-background-primary text-text-primary shadow-sm border border-border-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-background-secondary'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Weekly
        </button>
      </div>

      {/* Nutrition Summary */}
      <div className="mb-6 p-6 bg-background-tertiary rounded-xl border border-border-primary">
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary mb-1">{Math.round(currentNutrition.kcal || 0)}</div>
            <div className="text-sm text-text-secondary font-medium">kcal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary mb-1">{Math.round(currentNutrition.protein || 0)}g</div>
            <div className="text-sm text-text-secondary font-medium">protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary mb-1">{Math.round(currentNutrition.carbs || 0)}g</div>
            <div className="text-sm text-text-secondary font-medium">carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary mb-1">{Math.round(currentNutrition.fat || 0)}g</div>
            <div className="text-sm text-text-secondary font-medium">fat</div>
          </div>
        </div>
        
        {/* Health Effects Summary */}
        {Object.entries(currentEffects).some(([effectKey, effectData]) => (effectData.score || 0) > 0) && (
          <div className="pt-6 border-t border-border-primary">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 mb-4">
                <span>Effects</span>
                <span className="px-3 py-1 bg-background-primary rounded-lg border border-border-primary text-xs font-semibold text-text-primary">
                  {Object.entries(currentEffects).filter(([effectKey, effectData]) => (effectData.score || 0) > 0).length}
                </span>
              </summary>
              <div className="flex flex-wrap gap-3 justify-center">
                {Object.entries(currentEffects)
                  .filter(([effectKey, effectData]) => (effectData.score || 0) > 0)
                  .map(([effectKey, effectData]) => {
                  const score = effectData.score || 0;
                  const bgColor = score >= 6 ? 'bg-[#1E49C9]/20 border-[#1E49C9]/30 text-[#1E49C9] hover:bg-[#1E49C9]/30' : 
                                 score >= 4 ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-900/30' : 
                                 'bg-red-900/20 border-red-500/30 text-red-300 hover:bg-red-900/30';

                  return (
                    <div 
                      key={effectKey} 
                      className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-all duration-200 font-medium ${bgColor}`}
                      onClick={() => handleEffectClick(effectKey, effectData, null)}
                    >
                      <span className="font-medium">{labels[effectKey] || effectKey}</span>
                      <span className="ml-2 text-xs opacity-75">({score})</span>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Day-Level Summary */}
      {currentMeals.length > 0 && (
        <div className="p-6 bg-background-tertiary rounded-xl border border-border-primary">
          <div className="text-center mb-6">
            <div className="text-sm font-medium text-text-secondary">
              {currentMeals.length} meal{currentMeals.length !== 1 ? 's' : ''} logged {activeTab === 'daily' ? 'today' : 'this week'}
            </div>
          </div>
          
          {/* Health Impact */}
          {Object.entries(currentEffects).some(([effectKey, effectData]) => (effectData.score || 0) > 0) && (
            <div>
              <div className="text-lg font-semibold text-text-primary mb-4 text-center">
                {activeTab === 'daily' ? 'Daily' : 'Weekly'} Health Impact
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {Object.entries(currentEffects)
                  .filter(([effectKey, effectData]) => (effectData.score || 0) > 0)
                  .sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
                  .map(([effectKey, effectData]) => {
                  const score = effectData.score || 0;
                  const bgColor = score >= 6 ? 'bg-[#1E49C9]/20 border-[#1E49C9]/30 text-[#1E49C9] hover:bg-[#1E49C9]/30' : 
                                 score >= 4 ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-900/30' : 
                                 'bg-red-900/20 border-red-500/30 text-red-300 hover:bg-red-900/30';

                  return (
                    <div 
                      key={effectKey} 
                      className={`px-4 py-2 rounded-lg border text-sm cursor-pointer transition-all duration-200 font-medium ${bgColor}`}
                      onClick={() => handleEffectClick(effectKey, effectData, null)}
                    >
                      <span className="font-medium">{labels[effectKey] || effectKey}</span>
                      <span className="ml-2 text-xs opacity-75">({score})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Meal List */}
      {currentMeals.length > 0 && (
        <div className="mt-6 p-6 bg-background-tertiary rounded-xl border border-border-primary">
          <div className="text-lg font-semibold text-text-primary mb-4 text-center">
            {activeTab === 'daily' ? 'Today\'s Meals' : 'This Week\'s Meals'}
          </div>
          
          <div className="space-y-4">
            {currentMeals.map((meal, index) => (
              <div key={meal._id || index} className="bg-background-primary rounded-lg border border-border-primary p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1E49C9]/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-[#1E49C9]">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">
                        {formatMealTime(meal.ts)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {meal.items?.length || 0} item{(meal.items?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {/* Meal Score */}
                  {meal.computed?.mindfulMealScore && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-secondary">Score:</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        meal.computed.mindfulMealScore >= 4 
                          ? 'bg-green-900/30 text-green-300 border border-green-500/30'
                          : meal.computed.mindfulMealScore >= 3
                          ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30'
                          : 'bg-red-900/30 text-red-300 border border-red-500/30'
                      }`}>
                        {meal.computed.mindfulMealScore}/5
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Meal Items */}
                {meal.items && meal.items.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-text-secondary mb-2">Items:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {meal.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between bg-background-tertiary rounded px-3 py-2">
                          <span className="text-sm text-text-primary font-medium">
                            {item.customName || item.foodId?.name || 'Unknown Item'}
                          </span>
                          <span className="text-xs text-text-secondary">
                            {item.grams}g
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Nutritional Summary */}
                {meal.computed?.totals && (
                  <div className="mt-3 pt-3 border-t border-border-primary">
                    <div className="text-sm font-medium text-text-secondary mb-2">Nutrition:</div>
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          {Math.round(meal.computed.totals.kcal || 0)}
                        </div>
                        <div className="text-xs text-text-secondary">kcal</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          {Math.round(meal.computed.totals.protein || 0)}g
                        </div>
                        <div className="text-xs text-text-secondary">protein</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          {Math.round(meal.computed.totals.carbs || 0)}g
                        </div>
                        <div className="text-xs text-text-secondary">carbs</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary">
                          {Math.round(meal.computed.totals.fat || 0)}g
                        </div>
                        <div className="text-xs text-text-secondary">fat</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Meal Effects */}
                {meal.computed?.effects && Object.keys(meal.computed.effects).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-primary">
                    <div className="text-sm font-medium text-text-secondary mb-2">Health Effects:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(meal.computed.effects)
                        .filter(([effectKey, effectData]) => (effectData.score || 0) > 0)
                        .slice(0, 4) // Show only top 4 effects
                        .map(([effectKey, effectData]) => {
                        const score = effectData.score || 0;
                        const bgColor = score >= 6 ? 'bg-[#1E49C9]/20 border-[#1E49C9]/30 text-[#1E49C9]' : 
                                       score >= 4 ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300' : 
                                       'bg-red-900/20 border-red-500/30 text-red-300';

                        return (
                          <div 
                            key={effectKey} 
                            className={`px-2 py-1 rounded text-xs font-medium border ${bgColor}`}
                          >
                            {labels[effectKey] || effectKey} ({score})
                          </div>
                        );
                      })}
                      {Object.keys(meal.computed.effects).filter(key => (meal.computed.effects[key]?.score || 0) > 0).length > 4 && (
                        <div className="px-2 py-1 rounded text-xs font-medium border bg-background-secondary text-text-secondary border-border-primary">
                          +{Object.keys(meal.computed.effects).filter(key => (meal.computed.effects[key]?.score || 0) > 0).length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Meal Notes */}
                {meal.notes && (
                  <div className="mt-3 pt-3 border-t border-border-primary">
                    <div className="text-sm font-medium text-text-secondary mb-1">Notes:</div>
                    <div className="text-sm text-text-primary italic">
                      "{meal.notes}"
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Effect Details Modal */}
      {selectedEffect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-border-primary rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">
                  {icons[selectedEffect.key]} {labels[selectedEffect.key]} Details
                </h3>
                <button
                  onClick={closeEffectDetails}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Score</span>
                  <span className={`text-lg font-bold ${getMealEffectLevel(selectedEffect.data.score || 0).color}`}>
                    {selectedEffect.data.score || 0}/10
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">Level</span>
                  <span className="text-sm text-text-secondary">
                    {selectedEffect.data.label || selectedEffect.data.level || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">Contributing Factors</h4>
                {selectedEffect.data.why && selectedEffect.data.why.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedEffect.data.why.map((reason, index) => (
                      <li key={index} className="text-sm text-text-secondary flex items-start">
                        <span className="mr-2">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-text-muted">No specific factors identified</p>
                )}
              </div>

              {/* AI Insights */}
              {selectedEffect.data.aiInsights && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">AI</span>
                    <h4 className="text-sm font-medium text-blue-300">AI Insights</h4>
                  </div>
                  <p className="text-sm text-blue-200 leading-relaxed">
                    {selectedEffect.data.aiInsights}
                  </p>
                </div>
              )}

              {/* AI Enhanced Indicator */}
              {selectedEffect.data.aiEnhanced && (
                <div className="mb-4 flex items-center gap-2 text-xs text-[#1E49C9]">
                  <span>✨</span>
                  <span>Enhanced with AI analysis</span>
                </div>
              )}

              <div className="mb-4">
                <h4 className="text-sm font-medium text-text-primary mb-2">
                  {selectedMeal ? 'Meal Items' : 'All Meals Today'}
                </h4>
                <div className="space-y-2">
                  {selectedMeal ? (
                    selectedMeal.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background-tertiary rounded">
                        <span className="text-sm text-text-primary">{item.customName}</span>
                        <span className="text-xs text-text-secondary">{item.grams}g</span>
                      </div>
                    ))
                  ) : (
                    currentMeals
                      .filter(meal => (meal.computed?.effects?.[selectedEffect.key]?.score || 0) > 0)
                      .map((meal, mealIndex) => (
                        <div key={mealIndex} className="p-2 bg-background-tertiary rounded">
                          <div className="text-sm font-medium text-text-primary mb-1">
                            Meal {mealIndex + 1} - {formatMealTime(meal.ts)}
                          </div>
                          <div className="space-y-1">
                            {meal.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center justify-between text-xs">
                                <span className="text-text-secondary">{item.customName}</span>
                                <span className="text-text-muted">{item.grams}g</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeEffectDetails}
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

export default DailyMealKPIs;