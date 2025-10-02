import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import axios from 'axios';
import Card from '../ui/Card';

const FinancialOverview = () => {
  const { token } = useAuth();
  const [financialData, setFinancialData] = useState({
    summary: {},
    recentExpenses: [],
    goals: [],
    monthlyExpenses: [],
    impulseBuys: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];
      
      const [summaryRes, expensesRes, goalsRes, monthlyExpensesRes] = await Promise.all([
        axios.get(buildApiUrl('/api/finance/summary'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(buildApiUrl('/api/finance/expenses?limit=5'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(buildApiUrl('/api/finance/goals'), {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(buildApiUrl(`/api/finance/expenses?startDate=${startDate}&endDate=${endDate}`), {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Calculate impulse buys for current month
      const monthlyExpenses = monthlyExpensesRes.data || [];
      const impulseBuys = calculateImpulseBuys(monthlyExpenses);

      setFinancialData({
        summary: summaryRes.data,
        recentExpenses: expensesRes.data || [],
        goals: goalsRes.data || [],
        monthlyExpenses: monthlyExpenses,
        impulseBuys: impulseBuys
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateImpulseBuys = (expenses) => {
    // Count expenses that were explicitly marked as impulse buys by the user
    return expenses.filter(expense => expense.impulseBuy === true).length;
  };

  const getExpenseGoalDisplayLabel = (goal) => {
    // Map category values to display labels
    const categoryLabels = {
      'nourishing_food': 'Nourishing food',
      'safe_convenient_travel': 'Safe, convenient travel',
      'safe_comfortable_home': 'Safe, comfortable and peaceful home',
      'living_essentials': 'Maintain living essentials',
      'healthcare_wellbeing': 'Long term wellbeing and protective healthcare',
      'enjoy_life': 'Enjoy life, have fun',
      'value_shopping': 'Value, comfort or joyful shopping',
      'learning_growing': 'Learning, growing and investing in my future',
      'exploring_places': 'Exploring new places',
      'prepare_unexpected': 'Prepare for the unexpected',
      'other': 'Other'
    };
    
    // Use custom notes if available, otherwise use the mapped category label
    return goal.notes || categoryLabels[goal.category] || goal.category?.charAt(0).toUpperCase() + goal.category?.slice(1) || 'Goal';
  };

  const getTop3ExpenseGoals = () => {
    return financialData.goals
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  };

  const calculateGoalProgress = (goal) => {
    // Calculate how much has been spent in this category this month
    const categoryExpenses = financialData.monthlyExpenses.filter(expense => 
      expense.category === goal.category
    );
    
    const totalSpent = categoryExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const goalAmount = goal.amount || 0;
    
    if (goalAmount === 0) return 0;
    
    return Math.min(100, Math.round((totalSpent / goalAmount) * 100));
  };

  const calculateBudgetAdherence = () => {
    const { totalExpenses = 0, monthlyBudget = 0 } = financialData.summary;
    if (monthlyBudget === 0) return 0;
    return Math.max(0, Math.min(100, ((monthlyBudget - totalExpenses) / monthlyBudget) * 100));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-[#2A313A] rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-[#2A313A] rounded"></div>
            <div className="h-4 bg-[#2A313A] rounded w-2/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  const budgetAdherence = calculateBudgetAdherence();
  const isOverBudget = budgetAdherence < 0;

  return (
    <Card>
      {/* Header Action */}
      <div className="flex justify-end mb-4">
        <a 
          href="/finance" 
          className="font-jakarta text-sm leading-relaxed tracking-wider text-[#1E49C9] hover:text-[#1E49C9]/80 font-medium flex items-center"
        >
          VIEW DETAILS
        </a>
      </div>

      <div className="space-y-6">
        {/* Impulse Buys This Month */}
        <div className="bg-[#0A0C0F] border border-[#2A313A] rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-jakarta text-sm leading-relaxed tracking-wider text-text-primary font-medium">Impulse Buys This Month</span>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4 text-[#D64545]" />
              <span className="font-jakarta text-2xl font-bold text-[#D64545]">
                {financialData.impulseBuys}
              </span>
            </div>
          </div>
          <div className="text-xs text-text-secondary">
            Unplanned purchases detected this month
          </div>
        </div>

        {/* Top 3 Expense Goals */}
        {getTop3ExpenseGoals().length > 0 && (
          <div className="space-y-2">
            <h4 className="font-jakarta text-2xl leading-normal text-text-primary font-bold tracking-wide flex items-center">
              <Target className="h-4 w-4 mr-2 text-[#1E49C9]" />
              Top Expense Goals
            </h4>
            <div className="space-y-2">
              {getTop3ExpenseGoals().map((goal, index) => {
                const progress = calculateGoalProgress(goal);
                const isOverBudget = progress > 100;
                
                return (
                  <div key={goal._id || index} className="p-3 bg-[#0A0C0F] rounded border border-[#2A313A]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-jakarta text-sm leading-relaxed text-text-primary font-medium">
                        {getExpenseGoalDisplayLabel(goal)}
                      </span>
                      <span className={`font-jakarta text-sm font-bold ${
                        isOverBudget ? 'text-[#D64545]' : progress > 80 ? 'text-[#FFD200]' : 'text-[#1E49C9]'
                      }`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-jakarta text-sm leading-relaxed tracking-wider font-medium text-[#1E49C9]">
                        {formatCurrency(goal.amount || 0)}
                      </span>
                      <div className="w-16 bg-[#2A313A] rounded-full h-1">
                        <div 
                          className={`h-1 rounded-full transition-all duration-500 ${
                            isOverBudget ? 'bg-[#D64545]' : progress > 80 ? 'bg-[#FFD200]' : 'bg-[#1E49C9]'
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                    </div>
                    {goal.notes && goal.category && (
                      <div className="mt-1 text-xs text-text-secondary">
                        Category: {goal.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* No Data State */}
        {financialData.goals.length === 0 && (
          <div className="text-center py-4">
            <Target className="h-8 w-8 text-text-secondary mx-auto mb-2" />
            <p className="font-jakarta text-sm text-text-secondary">No expense goals set yet</p>
            <a 
              href="/finance" 
              className="font-jakarta text-xs text-[#1E49C9] hover:text-[#1E49C9]/80 leading-relaxed tracking-wider"
            >
              SET GOALS
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FinancialOverview;
