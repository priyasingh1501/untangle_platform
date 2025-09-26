import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MealBuilder from '../components/meal/MealBuilder';
import DailyMealKPIs from '../components/meal/DailyMealKPIs';
import { Section, Banner } from '../components/ui';

const Food = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh of meal data
  const triggerMealRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  if (!user) {
    return (
      <Section>
        <Banner variant="info">
          Please log in to access food search and meal planning features.
        </Banner>
      </Section>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Food & Nutrition</h1>
      
      <div className="space-y-8">
        {/* Daily Meal KPIs */}
        <DailyMealKPIs refreshTrigger={refreshTrigger} />
        
        {/* Meal Builder */}
        <MealBuilder onMealSaved={triggerMealRefresh} />
      </div>
    </div>
  );
};

export default Food;
