import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import MealBuilder from '../components/meal/MealBuilder';
import DailyMealKPIs from '../components/meal/DailyMealKPIs';
import { Section, Banner, Card, Header } from '../components/ui';

const Food = () => {
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to trigger refresh of meal data
  const triggerMealRefresh = useCallback(() => {
    console.log('Food page: Triggering meal refresh...');
    setRefreshTrigger(prev => {
      const newValue = prev + 1;
      console.log('Food page: Refresh trigger updated from', prev, 'to', newValue);
      return newValue;
    });
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
    <div className="p-6">
      {/* Bento Grid Layout - Pinterest Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[minmax(200px,auto)] [&>*:nth-child(odd)]:animate-fade-in [&>*:nth-child(even)]:animate-fade-in-delayed">
        
        {/* Header Card - Full Width */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <Card className="h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Header level={1} className="tracking-tight">Food & Nutrition</Header>
                  <p className="text-text-secondary mt-2">Track your meals and analyze nutritional data</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Daily Meal KPIs - Takes up 2 columns on larger screens */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2">
          <DailyMealKPIs refreshTrigger={refreshTrigger} />
        </div>
        
        {/* Meal Builder - Takes up remaining space */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2">
          <MealBuilder onMealSaved={triggerMealRefresh} />
        </div>
      </div>
    </div>
  );
};

export default Food;
