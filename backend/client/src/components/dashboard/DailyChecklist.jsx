import React from 'react';
import { CheckCircle, Circle, Clock, Target, Utensils, DollarSign, BookOpen, Brain } from 'lucide-react';
import { Card } from '../ui';

const DailyChecklist = ({ 
  habits = [], 
  tasks = [], 
  meals = [], 
  expenses = [], 
  mindfulnessCheckins = [], 
  journalEntries = [] 
}) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-CA');

  // Check if each section has been logged today
  const getSectionStatus = () => {
    // Check habits
    const hasHabitCheckins = habits.some(habit => {
      if (!habit.isActive || !habit.checkins) return false;
      return habit.checkins.some(checkin => {
        const checkinDate = new Date(checkin.date).toLocaleDateString('en-CA');
        return checkinDate === dateStr && checkin.completed;
      });
    });

    // Check tasks
    const hasTaskActivity = tasks.some(task => {
      if (task.status !== 'completed') return false;
      const taskDate = new Date(task.completedAt || task.updatedAt).toLocaleDateString('en-CA');
      return taskDate === dateStr;
    });

    // Check meals
    const hasMeals = meals.some(meal => {
      const mealDate = new Date(meal.ts).toLocaleDateString('en-CA');
      return mealDate === dateStr;
    });

    // Check expenses
    const hasExpenses = expenses.some(expense => {
      const expenseDate = new Date(expense.date).toLocaleDateString('en-CA');
      return expenseDate === dateStr;
    });

    // Check mindfulness
    const hasMindfulness = mindfulnessCheckins.some(checkin => {
      if (!checkin.date) return false;
      const checkinDate = new Date(checkin.date).toLocaleDateString('en-CA');
      return checkinDate === dateStr;
    });

    // Check journal (placeholder - you might need to implement journal data loading)
    const hasJournal = journalEntries.some(entry => {
      const entryDate = new Date(entry.createdAt || entry.date).toLocaleDateString('en-CA');
      return entryDate === dateStr;
    });

    return {
      habits: hasHabitCheckins,
      tasks: hasTaskActivity,
      meals: hasMeals,
      expenses: hasExpenses,
      mindfulness: hasMindfulness,
      journal: hasJournal
    };
  };

  const sectionStatus = getSectionStatus();
  const completedCount = Object.values(sectionStatus).filter(Boolean).length;
  const totalSections = Object.keys(sectionStatus).length;

  const sections = [
    {
      key: 'habits',
      label: 'Habits',
      icon: Target,
      href: '/goal-aligned-day',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-500/30'
    },
    {
      key: 'tasks',
      label: 'Tasks',
      icon: Clock,
      href: '/goal-aligned-day',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30'
    },
    {
      key: 'meals',
      label: 'Meals',
      icon: Utensils,
      href: '/food',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30'
    },
    {
      key: 'expenses',
      label: 'Expenses',
      icon: DollarSign,
      href: '/finance',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/30'
    },
    {
      key: 'mindfulness',
      label: 'Mindfulness',
      icon: Brain,
      href: '/goal-aligned-day',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      borderColor: 'border-purple-500/30'
    },
    {
      key: 'journal',
      label: 'Journal',
      icon: BookOpen,
      href: '/journal',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      borderColor: 'border-pink-500/30'
    }
  ];

  return (
    <Card className="h-full">
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-jakarta text-lg font-semibold text-white mb-1">Daily Checklist</h3>
            <p className="text-sm text-white/60">
              {completedCount}/{totalSections} sections logged today
            </p>
          </div>
          <div className="w-8 h-8 bg-[#1E49C9]/20 rounded-full flex items-center justify-center">
            <span className="text-sm">✅</span>
          </div>
        </div>


        {/* Checklist Items */}
        <div className="space-y-3 flex-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isCompleted = sectionStatus[section.key];
            
            return (
              <a
                key={section.key}
                href={section.href}
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                  isCompleted 
                    ? `${section.bgColor} ${section.borderColor} border-opacity-50` 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isCompleted ? section.bgColor : 'bg-white/10'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className={`w-4 h-4 ${section.color}`} />
                  ) : (
                    <Circle className="w-4 h-4 text-white/40" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-4 h-4 ${isCompleted ? section.color : 'text-white/60'}`} />
                    <span className={`text-sm font-medium ${
                      isCompleted ? 'text-white' : 'text-white/80'
                    }`}>
                      {section.label}
                    </span>
                  </div>
                  <div className={`text-xs ${
                    isCompleted ? 'text-white/70' : 'text-white/50'
                  }`}>
                    {isCompleted ? 'Completed today' : 'Not logged today'}
                  </div>
                </div>

                {isCompleted && (
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                )}
              </a>
            );
          })}
        </div>

        {/* Completion Message */}
        {completedCount === totalSections && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                All sections completed! Great job! 🎉
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DailyChecklist;
