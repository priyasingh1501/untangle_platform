import React from 'react';

const MonthGrid = ({ 
  selectedDate, 
  habits = [], 
  goals = [], 
  mindfulnessCheckins = [],
  tasks = [],
  meals = [],
  expenses = [],
  onDateSelect,
  onMonthChange
}) => {
  // Ensure all props are arrays with fallbacks
  const safeHabits = Array.isArray(habits) ? habits : [];
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeMindfulnessCheckins = Array.isArray(mindfulnessCheckins) ? mindfulnessCheckins : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeMeals = Array.isArray(meals) ? meals : [];
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  try {
    // Input validation to prevent React error #137
    if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
      console.error('MonthGrid: Invalid selectedDate prop', selectedDate);
      return (
        <div className="w-full p-4 text-center text-red-500">
          Error: Invalid date provided to MonthGrid component
        </div>
      );
    }

    // Debug logging for data loading
    console.log('MonthGrid: Data received:', {
      habits: safeHabits.length,
      goals: safeGoals.length,
      mindfulnessCheckins: safeMindfulnessCheckins.length,
      tasks: safeTasks.length,
      meals: safeMeals.length,
      expenses: safeExpenses.length
    });

    console.log('🔍 MonthGrid rendered with props:');
    console.log('🔍 mindfulnessCheckins:', safeMindfulnessCheckins);
    console.log('🔍 mindfulnessCheckins.length:', safeMindfulnessCheckins.length);
    console.log('🔍 mindfulnessCheckins type:', typeof safeMindfulnessCheckins);
    console.log('🔍 Is array:', Array.isArray(safeMindfulnessCheckins));
    
    if (safeMindfulnessCheckins.length > 0) {
      console.log('🔍 First checkin:', safeMindfulnessCheckins[0]);
      console.log('🔍 First checkin date:', safeMindfulnessCheckins[0].date);
      console.log('🔍 First checkin totalScore:', safeMindfulnessCheckins[0].totalScore);
    }

    // Get the current date and calculate the start date (12 months ago)
    const currentDate = new Date();
    
    // Validate current date
    if (isNaN(currentDate.getTime())) {
      console.error('❌ Invalid currentDate detected');
      return (
        <div className="w-full p-4 text-center text-red-500">
          Error: Invalid current date
        </div>
      );
    }
    
    // Debug: Let's see exactly what we're working with
    console.log('🔍 Raw date info:');
    console.log('🔍 currentDate.getFullYear():', currentDate.getFullYear());
    console.log('🔍 currentDate.getMonth():', currentDate.getMonth());
    console.log('🔍 currentDate.getDate():', currentDate.getDate());
    console.log('🔍 Month name:', currentDate.toLocaleDateString('en-US', { month: 'long' }));
    console.log('🔍 Showing current year from January to current month');
    
    // Calculate start date to show current year from January to current month
    // We want to show from January 1st of current year to current month
    const startDate = new Date(currentDate.getFullYear(), 0, 1); // January 1st of current year
    
    // Validate startDate
    if (isNaN(startDate.getTime())) {
      console.error('❌ Invalid startDate calculated:', startDate);
      return (
        <div className="w-full p-4 text-center text-red-500">
          Error: Invalid start date calculation
        </div>
      );
    }
    
    // Set end date to the last day of the current month
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Validate endDate
    if (isNaN(endDate.getTime())) {
      console.error('❌ Invalid endDate calculated:', endDate);
      return (
        <div className="w-full p-4 text-center text-red-500">
          Error: Invalid end date calculation
        </div>
      );
    }
    
    console.log('🔍 Date calculations:');
    console.log('🔍 currentDate:', currentDate);
    console.log('🔍 currentDate.toISOString():', currentDate.toISOString());
    console.log('🔍 startDate (Jan 1st):', startDate);
    console.log('🔍 startDate.toISOString():', startDate.toISOString());
    console.log('🔍 endDate (end of current month):', endDate);
    console.log('🔍 endDate.toISOString():', endDate.toISOString());
    console.log('🔍 startDate <= endDate:', startDate <= endDate);
    
    // Debug: Let's verify the month calculation
    console.log('🔍 Month calculation debug:');
    console.log('🔍 Showing months from January to current month');
    console.log('🔍 Expected start month:', startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    console.log('🔍 Expected end month:', endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
    
    // Get comprehensive daily score for a specific date
    const getComprehensiveDailyScore = (date) => {
      // Validate date input
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error('getComprehensiveDailyScore: Invalid date input', date);
        return {
          totalScore: 0,
          breakdown: {
            mindfulness: 0,
            goalProgress: 0,
            habitCompletion: 0,
            mealEffects: 0,
            impulseBuyPenalty: 0
          }
        };
      }

      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      // 1. Mindfulness Score (0-25 points)
      const mindfulnessScore = getMindfulnessScoreForDate(date);
      
      // 2. Goal Progress Score (0-20 points)
      const goalProgressScore = getGoalProgressScoreForDate(date);
      
      // 3. Habit Completion Score (0-15 points)
      const habitCompletionScore = getHabitCompletionScoreForDate(date);
      
      // 4. Meal Effects Score (0-25 points)
      const mealEffectsScore = getMealEffectsScoreForDate(date);
      
      // 5. Impulse Buy Penalty (0 to -10 points)
      const impulseBuyPenalty = getImpulseBuyPenaltyForDate(date);
      
      const totalScore = Math.max(0, mindfulnessScore + goalProgressScore + habitCompletionScore + mealEffectsScore + impulseBuyPenalty);
      
      return {
        totalScore,
        breakdown: {
          mindfulness: mindfulnessScore,
          goalProgress: goalProgressScore,
          habitCompletion: habitCompletionScore,
          mealEffects: mealEffectsScore,
          impulseBuyPenalty: impulseBuyPenalty
        }
      };
    };

    // Get mindfulness score for a specific date (0-25 points)
    const getMindfulnessScoreForDate = (date) => {
      const dateStr = date.toLocaleDateString('en-CA');
      
      const checkin = safeMindfulnessCheckins.find(checkin => {
        if (!checkin || !checkin.date) return false;
        const checkinDate = new Date(checkin.date).toLocaleDateString('en-CA');
        return dateStr === checkinDate;
      });

      if (!checkin) return 0;
      
      // Calculate total score from dimensions (5 dimensions × 0-5 rating each = 0-25)
      const dimensions = checkin.dimensions || {};
      const totalScore = Object.values(dimensions).reduce((sum, dim) => {
        return sum + (dim.rating || 0);
      }, 0);
      
      return totalScore;
    };

    // Get goal progress score for a specific date (0-20 points)
    const getGoalProgressScoreForDate = (date) => {
      const dateStr = date.toLocaleDateString('en-CA');
      let score = 0;
      
      // Check if any tasks for goals were completed on this date
      const completedTasksForGoals = safeTasks.filter(task => {
        if (!task.goalIds || task.goalIds.length === 0) return false;
        if (task.status !== 'completed') return false;
        
        const taskDate = new Date(task.completedAt || task.updatedAt).toLocaleDateString('en-CA');
        return taskDate === dateStr;
      });
      
      // Score based on completed tasks (up to 20 points)
      if (completedTasksForGoals.length > 0) {
        // Base score for having any goal progress
        score += 10;
        
        // Additional points for multiple completed tasks
        if (completedTasksForGoals.length >= 2) score += 5;
        if (completedTasksForGoals.length >= 3) score += 5;
      }
      
      return Math.min(score, 20);
    };

    // Get habit completion score for a specific date (0-15 points)
    const getHabitCompletionScoreForDate = (date) => {
      const dateStr = date.toLocaleDateString('en-CA');
      let completedCount = 0;
      let totalCount = 0;
      
      safeHabits.forEach(habit => {
        if (!habit || !habit.startDate || !habit.endDate) return;

        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
        const startDate = new Date(habit.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(habit.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        if (habit.isActive && checkDate >= startDate && checkDate <= endDate) {
          totalCount++;
          const checkin = habit.checkins?.find(c => {
            const checkinDate = new Date(c.date).toLocaleDateString('en-CA');
            return checkinDate === dateStr && c.completed;
          });
          if (checkin) completedCount++;
        }
      });
      
      if (totalCount === 0) return 0;
      
      const completionRate = completedCount / totalCount;
      return Math.round(completionRate * 15); // 0-15 points based on completion rate
    };

    // Get meal effects score for a specific date (0-25 points)
    const getMealEffectsScoreForDate = (date) => {
      const dateStr = date.toLocaleDateString('en-CA');
      const dayMeals = safeMeals.filter(meal => {
        const mealDate = new Date(meal.ts).toLocaleDateString('en-CA');
        return mealDate === dateStr;
      });
      
      if (dayMeals.length === 0) return 0;
      
      let totalScore = 0;
      let mealCount = 0;
      
      dayMeals.forEach(meal => {
        if (!meal.computed?.effects) return;
        
        const effects = meal.computed.effects;
        let mealScore = 0;
        
        // Positive effects (0-5 points each)
        const positiveEffects = ['strength', 'antiInflammatory', 'immunity', 'gutFriendly', 'energizing'];
        positiveEffects.forEach(effect => {
          if (effects[effect]?.score) {
            mealScore += Math.round(effects[effect].score / 2); // Convert 0-10 to 0-5
          }
        });
        
        // Negative effects (penalty)
        const negativeEffects = ['inflammation', 'fatForming'];
        negativeEffects.forEach(effect => {
          if (effects[effect]?.score) {
            mealScore -= Math.round(effects[effect].score / 2); // Convert 0-10 to 0-5 penalty
          }
        });
        
        totalScore += Math.max(0, mealScore); // Don't go below 0
        mealCount++;
      });
      
      // Average score per meal, capped at 5 points per meal
      const averageScore = mealCount > 0 ? totalScore / mealCount : 0;
      return Math.min(Math.round(averageScore * dayMeals.length), 25);
    };

    // Get impulse buy penalty for a specific date (0 to -10 points)
    const getImpulseBuyPenaltyForDate = (date) => {
      const dateStr = date.toLocaleDateString('en-CA');
      
      // Check for expenses that were explicitly marked as impulse buys by the user
      const dayExpenses = safeExpenses.filter(expense => {
        const expenseDate = new Date(expense.date).toLocaleDateString('en-CA');
        return expenseDate === dateStr;
      });
      
      if (dayExpenses.length === 0) return 0;
      
      // Only consider expenses explicitly marked as impulse buys by the user
      const impulseExpenses = dayExpenses.filter(expense => 
        expense.impulseBuy === true
      );
      
      if (impulseExpenses.length === 0) return 0;
      
      // Calculate penalty based on number and amount of impulse expenses
      let penalty = 0;
      impulseExpenses.forEach(expense => {
        // Penalty based on amount (more expensive = more penalty)
        if (expense.amount > 1000) penalty += 3;
        else if (expense.amount > 500) penalty += 2;
        else if (expense.amount > 100) penalty += 1;
        else penalty += 0.5;
      });
      
      return Math.min(penalty, 10); // Cap at 10 points penalty
    };

    // Get color based on comprehensive daily score
    const getDayColor = (date) => {
      // Validate date input
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error('getDayColor: Invalid date input', date);
        return '#0f1419'; // Default dark color for invalid dates
      }

      const dailyScore = getComprehensiveDailyScore(date);
      const totalScore = dailyScore.totalScore;
      
      // Color gradient based on total score (0-85 max possible) - Red to Yellow to Green
      if (totalScore === 0) return 'transparent'; // No activity - blank (nothing logged)
      if (totalScore <= 5) return '#ef4444'; // Very low - red
      if (totalScore <= 10) return '#f87171'; // Low - light red
      if (totalScore <= 15) return '#fbbf24'; // Medium-low - yellow-orange
      if (totalScore <= 20) return '#fde047'; // Medium - yellow
      if (totalScore <= 25) return '#fef08a'; // Medium-high - light yellow
      if (totalScore <= 30) return '#fef3c7'; // High - very light yellow
      if (totalScore <= 35) return '#d1fae5'; // Very high - very light green
      if (totalScore <= 40) return '#a7f3d0'; // Excellent - light green
      if (totalScore <= 45) return '#6ee7b7'; // Outstanding - medium green
      if (totalScore <= 50) return '#34d399'; // Exceptional - green
      if (totalScore <= 60) return '#10b981'; // Amazing - emerald green
      if (totalScore <= 70) return '#059669'; // Incredible - dark green
      return '#047857'; // Perfect - darkest green (best)
    };

    // Generate all days for the current year (January to current month)
    const generateAllDays = () => {
      console.log('🔍 generateAllDays function called!');
      const allDays = [];
      
      // Ensure startDate and endDate are valid Date objects
      if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
        console.error('❌ Invalid startDate in generateAllDays:', startDate);
        return [];
      }
      
      if (!endDate || !(endDate instanceof Date) || isNaN(endDate.getTime())) {
        console.error('❌ Invalid endDate in generateAllDays:', endDate);
        return [];
      }
      
      const currentDateCopy = new Date(startDate.getTime()); // Create a proper copy
      
      console.log(`🔍 Generating days from ${startDate.toISOString()} (Jan 1st) to ${endDate.toISOString()} (end of current month)`);
      console.log(`🔍 mindfulnessCheckins count: ${mindfulnessCheckins.length}`);
      
      let dayCount = 0;
      while (currentDateCopy <= endDate) {
        dayCount++;
        
        // Validate the current date
        if (isNaN(currentDateCopy.getTime())) {
          console.error('❌ Invalid currentDateCopy detected:', currentDateCopy);
          break;
        }
        
        const dayDateStr = currentDateCopy.toLocaleDateString('en-CA');
        console.log(`🔍 Day ${dayCount}: Processing ${dayDateStr}`);
        
        const dailyScore = getComprehensiveDailyScore(currentDateCopy);
        
        // Create a new Date object for the day data
        const dayDate = new Date(currentDateCopy.getTime());
        
        allDays.push({
          date: dayDate,
          dailyScore,
          isToday: dayDate.toDateString() === new Date().toDateString()
        });
        
        // Check if we've reached today's date
        if (dayDate.toDateString() === new Date().toDateString()) {
          console.log(`🎯 Found today's date: ${dayDateStr}`);
          console.log(`🎯 Today's date object:`, dayDate);
          console.log(`🎯 Today's date string:`, dayDate.toDateString());
          console.log(`🎯 Current date string:`, new Date().toDateString());
        }
        
        // Move to next day
        currentDateCopy.setDate(currentDateCopy.getDate() + 1);
        
        // Safety check to prevent infinite loops
        if (dayCount > 400) {
          console.error('❌ Loop limit exceeded, breaking');
          break;
        }
      }
      
      console.log(`🔍 Generated ${allDays.length} days`);
      console.log(`🔍 Sample days with scores:`, allDays.slice(0, 5).map(day => ({
        date: day.date.toISOString().split('T')[0],
        score: day.mindfulnessScore
      })));
      
      return allDays;
    };

    // Group days by month
    const groupDaysByMonth = (allDays) => {
      const months = [];
      let currentMonth = null;
      let currentMonthDays = [];
      
      allDays.forEach(day => {
        const monthKey = `${day.date.getFullYear()}-${day.date.getMonth()}`;
        
        if (monthKey !== currentMonth) {
          if (currentMonthDays.length > 0) {
            months.push({
              month: new Date(currentMonthDays[0].date.getFullYear(), currentMonthDays[0].date.getMonth(), 1),
              days: currentMonthDays
            });
          }
          currentMonth = monthKey;
          currentMonthDays = [day];
        } else {
          currentMonthDays.push(day);
        }
      });
      
      if (currentMonthDays.length > 0) {
        months.push({
          month: new Date(currentMonthDays[0].date.getFullYear(), currentMonthDays[0].date.getMonth(), 1),
          days: currentMonthDays
        });
      }
      
      return months;
    };

    const allDays = generateAllDays();
    const months = groupDaysByMonth(allDays);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Debug logging
    console.log('MonthGrid Debug:', {
      startDate: startDate.toDateString(),
      currentDate: currentDate.toDateString(),
      allDaysCount: allDays.length,
      monthsCount: months.length,
      selectedDate: selectedDate.toDateString()
    });

    return (
      <div className="w-full">

        {/* GitHub-style Contribution Grid */}
        <div className="flex gap-1">
          {/* Weekday Labels */}
          <div className="flex flex-col gap-0.5 pt-4">
            {weekdays.map(day => (
              <div key={day} className="h-2.5 text-xs text-[#94A3B8] font-medium w-6 text-center">
                {day === 'Sun' || day === 'Tue' || day === 'Thu' || day === 'Sat' ? '' : day}
              </div>
            ))}
          </div>

          {/* Months Grid */}
          <div className="flex gap-1">
            {months.map((monthData, monthIndex) => (
              <div key={monthIndex} className="flex flex-col">
                {/* Month Label */}
                <div className="text-center mb-1">
                  <span className="text-xs text-[#94A3B8] font-medium">
                    {monthData.month.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
                
                {/* Days Grid for this month */}
                <div className="grid grid-cols-7 gap-0.5">
                  {monthData.days.map((dayData, dayIndex) => {
                    const { date, dailyScore, isToday } = dayData;
                    const backgroundColor = getDayColor(date);
                    const { totalScore, breakdown } = dailyScore;

                    const tooltipText = totalScore === 0 
                      ? `${date.toLocaleDateString()}\nNo activity logged for this day`
                      : `${date.toLocaleDateString()}
Total Score: ${totalScore}/85
• Mindfulness: ${breakdown.mindfulness}/25
• Goal Progress: ${breakdown.goalProgress}/20
• Habits: ${breakdown.habitCompletion}/15
• Meal Effects: ${breakdown.mealEffects}/25
• Impulse Penalty: ${breakdown.impulseBuyPenalty}`;

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => onDateSelect && onDateSelect(date)}
                        className={`w-2.5 h-2.5 rounded-sm cursor-pointer transition-all duration-200 hover:scale-125 hover:ring-2 hover:ring-blue-400 ${
                          isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                        } ${totalScore === 0 ? 'border border-[#2A313A] bg-transparent' : ''}`}
                        style={{ backgroundColor }}
                        title={tooltipText}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-[#94A3B8]">
            <div className="font-medium mb-1">Daily Activity Score (0-85)</div>
            <div className="text-xs opacity-75">
              Mindfulness (25) + Goals (20) + Habits (15) + Meals (25) - User-marked Impulse Buys (10)
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#94A3B8]">Worst</span>
            <div className="flex gap-0.5">
              <div className="w-2.5 h-2.5 bg-transparent rounded-sm border border-[#2A313A]" title="No Activity (0)"></div>
              <div className="w-2.5 h-2.5 bg-[#ef4444] rounded-sm border border-[#2A313A]" title="Very Low (1-5)"></div>
              <div className="w-2.5 h-2.5 bg-[#f87171] rounded-sm border border-[#2A313A]" title="Low (6-10)"></div>
              <div className="w-2.5 h-2.5 bg-[#fbbf24] rounded-sm border border-[#2A313A]" title="Medium-Low (11-15)"></div>
              <div className="w-2.5 h-2.5 bg-[#fde047] rounded-sm border border-[#2A313A]" title="Medium (16-20)"></div>
              <div className="w-2.5 h-2.5 bg-[#fef08a] rounded-sm border border-[#2A313A]" title="Medium-High (21-25)"></div>
              <div className="w-2.5 h-2.5 bg-[#fef3c7] rounded-sm border border-[#2A313A]" title="High (26-30)"></div>
              <div className="w-2.5 h-2.5 bg-[#d1fae5] rounded-sm border border-[#2A313A]" title="Very High (31-35)"></div>
              <div className="w-2.5 h-2.5 bg-[#a7f3d0] rounded-sm border border-[#2A313A]" title="Excellent (36-40)"></div>
              <div className="w-2.5 h-2.5 bg-[#6ee7b7] rounded-sm border border-[#2A313A]" title="Outstanding (41-45)"></div>
              <div className="w-2.5 h-2.5 bg-[#34d399] rounded-sm border border-[#2A313A]" title="Exceptional (46-50)"></div>
              <div className="w-2.5 h-2.5 bg-[#10b981] rounded-sm border border-[#2A313A]" title="Amazing (51-60)"></div>
              <div className="w-2.5 h-2.5 bg-[#059669] rounded-sm border border-[#2A313A]" title="Incredible (61-70)"></div>
              <div className="w-2.5 h-2.5 bg-[#047857] rounded-sm border border-[#2A313A]" title="Best (71-85)"></div>
            </div>
            <span className="text-xs text-[#94A3B8]">Best</span>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('MonthGrid component error:', error);
    return (
      <div className="w-full p-4 text-center text-red-500">
        Error: MonthGrid component failed to render. Please check the console for details.
      </div>
    );
  }
};

export default MonthGrid;
