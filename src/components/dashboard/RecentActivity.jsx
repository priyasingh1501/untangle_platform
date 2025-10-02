import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Utensils, 
  BookOpen, 
  DollarSign, 
  Target, 
  Brain,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { buildApiUrl } from '../../config';
import axios from 'axios';
import Card from '../ui/Card';

const RecentActivity = () => {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchRecentActivity();
    }
  }, [token]);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Fetch data from multiple endpoints
      const [tasksRes, mealsRes, journalRes, expensesRes, mindfulnessRes] = await Promise.all([
        axios.get(buildApiUrl(`/api/tasks?startDate=${weekAgo}&endDate=${today}&limit=5`), {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(buildApiUrl(`/api/meals?startDate=${weekAgo}&endDate=${today}&limit=5`), {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { meals: [] } })),
        axios.get(buildApiUrl(`/api/journal?startDate=${weekAgo}&endDate=${today}&limit=5`), {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(buildApiUrl(`/api/finance/expenses?startDate=${weekAgo}&endDate=${today}&limit=5`), {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get(buildApiUrl(`/api/mindfulness/checkins?startDate=${weekAgo}&endDate=${today}&limit=5`), {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      const allActivities = [];

      // Process tasks
      (tasksRes.data || []).forEach(task => {
        allActivities.push({
          id: `task-${task._id}`,
          type: 'task',
          title: task.title || 'Task completed',
          description: task.description || 'Task completed',
          timestamp: task.completedAt || task.createdAt,
          icon: CheckCircle,
          color: 'text-[#1E49C9]',
          bgColor: 'bg-[#1E49C9]'
        });
      });

      // Process meals
      (mealsRes.data.meals || []).forEach(meal => {
        allActivities.push({
          id: `meal-${meal._id}`,
          type: 'meal',
          title: 'Meal logged',
          description: `${meal.items?.length || 0} items logged`,
          timestamp: meal.ts || meal.createdAt,
          icon: Utensils,
          color: 'text-[#1E49C9]',
          bgColor: 'bg-[#1E49C9]'
        });
      });

      // Process journal entries
      (journalRes.data || []).forEach(entry => {
        allActivities.push({
          id: `journal-${entry._id}`,
          type: 'journal',
          title: entry.title || 'Journal entry',
          description: entry.type || 'Daily reflection',
          timestamp: entry.createdAt,
          icon: BookOpen,
          color: 'text-[#1E49C9]',
          bgColor: 'bg-[#1E49C9]'
        });
      });

      // Process expenses
      (expensesRes.data || []).forEach(expense => {
        allActivities.push({
          id: `expense-${expense._id}`,
          type: 'expense',
          title: 'Expense added',
          description: `${expense.description || 'Expense'} - ₹${expense.amount || 0}`,
          timestamp: expense.date || expense.createdAt,
          icon: DollarSign,
          color: 'text-[#1E49C9]',
          bgColor: 'bg-[#1E49C9]'
        });
      });

      // Process mindfulness check-ins
      (mindfulnessRes.data || []).forEach(checkin => {
        allActivities.push({
          id: `mindfulness-${checkin._id}`,
          type: 'mindfulness',
          title: 'Mindfulness check-in',
          description: `Score: ${checkin.overallScore || 0}/10`,
          timestamp: checkin.date || checkin.createdAt,
          icon: Brain,
          color: 'text-[#1E49C9]',
          bgColor: 'bg-[#1E49C9]'
        });
      });

      // Sort by timestamp and take the most recent 8
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivities(allActivities.slice(0, 8));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return activityTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-4 bg-[#2A313A] rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-[#2A313A] rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header Action */}
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchRecentActivity}
          className="font-jakarta text-sm leading-relaxed tracking-wider text-[#1E49C9] hover:text-[#1E49C9]/80 font-medium flex items-center"
        >
          REFRESH
        </button>
      </div>

      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map((activity, index) => {
            const IconComponent = activity.icon;
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3 p-3 bg-[#0A0C0F] rounded-lg border border-[#2A313A] hover:border-[#1E49C9]/30 transition-all duration-200"
              >
                <div className={`p-2 rounded-lg ${activity.bgColor} bg-opacity-20`}>
                  <IconComponent className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-jakarta text-sm leading-relaxed text-text-primary font-medium truncate">
                    {activity.title}
                  </div>
                  <div className="font-jakarta text-xs text-text-secondary truncate">
                    {activity.description}
                  </div>
                </div>
                <div className="font-jakarta text-xs text-text-secondary whitespace-nowrap">
                  {formatTimestamp(activity.timestamp)}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-text-secondary mx-auto mb-3" />
            <h4 className="font-jakarta text-2xl leading-normal text-text-primary font-bold mb-2">No Recent Activity</h4>
            <p className="font-jakarta text-sm text-text-secondary mb-4">Start using the app to see your activity here</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <a 
                href="/goal-aligned-day" 
                className="font-jakarta text-xs text-[#1E49C9] hover:text-[#1E49C9]/80 leading-relaxed tracking-wider"
              >
                ADD TASK
              </a>
              <span className="text-text-secondary">•</span>
              <a 
                href="/food" 
                className="font-jakarta text-xs text-[#1E49C9] hover:text-[#1E49C9]/80 leading-relaxed tracking-wider"
              >
                LOG MEAL
              </a>
              <span className="text-text-secondary">•</span>
              <a 
                href="/journal" 
                className="font-jakarta text-xs text-[#1E49C9] hover:text-[#1E49C9]/80 leading-relaxed tracking-wider"
              >
                JOURNAL
              </a>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;
