
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { buildApiUrl } from '../config';
import { CreateHabitPopup } from '../components/habits';
import { CreateGoalPopup, EditGoalPopup } from '../components/goals';
import { CreateTaskPopup } from '../components/tasks';

const GoalAlignedDay = () => {
  const { user, token } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  
  const [tasks, setTasks] = useState([]);
  const [showCreateHabitPopup, setShowCreateHabitPopup] = useState(false);
  const [showCreateGoalPopup, setShowCreateGoalPopup] = useState(false);
  const [showCreateTaskPopup, setShowCreateTaskPopup] = useState(false);
  const [showEditGoalPopup, setShowEditGoalPopup] = useState(false);
  const [selectedGoalForTask, setSelectedGoalForTask] = useState(null);
  const [selectedGoalForHabit, setSelectedGoalForHabit] = useState(null);
  const [selectedGoalForEdit, setSelectedGoalForEdit] = useState(null);
  const [deletingGoal, setDeletingGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingHabits, setCompletingHabits] = useState(new Set());
  const [completedHabits, setCompletedHabits] = useState(new Set());

  // Utility: check if a date is today (local timezone)
  const isDateToday = (dateLike) => {
    if (!dateLike) return false;
    const d = new Date(dateLike);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Format date components separately
  const formatDateComponents = (date) => {
    return {
      day: date.getDate(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      month: date.toLocaleDateString('en-US', { month: 'long' }),
      year: date.getFullYear()
    };
  };

  // Get day title
  const getDayTitle = () => {
    const dateComponents = formatDateComponents(selectedDate);
    return `${dateComponents.dayName}, ${dateComponents.month} ${dateComponents.day}`;
  };

  // Load user's habits
  const loadHabits = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/api/habits?all=true'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHabits(Array.isArray(data) ? data : (data.habits || []));
      } else {
        console.error('❌ Habits response not ok:', response.status);
        const errorText = await response.text();
        console.error('❌ Habits error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading habits:', error);
    }
  }, [token]);

  // Load user's goals
  const loadGoals = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/api/goals'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoals(data || []);
      } else {
        console.error('❌ Goals response not ok:', response.status);
        const errorText = await response.text();
        console.error('❌ Goals error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading goals:', error);
    }
  }, [token]);

  // Load user's tasks
  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/api/tasks'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Tasks loaded successfully:', data);
        setTasks(data.tasks || []);
      } else {
        console.error('❌ Tasks response not ok:', response.status);
        const errorText = await response.text();
        console.error('❌ Tasks error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
    }
  }, [token]);


  // Handle habit creation
  const handleHabitCreated = (newHabit) => {
    setHabits(prev => [newHabit, ...prev]);
  };

  // Handle goal creation
  const handleGoalCreated = (newGoal) => {
    setGoals(prev => [newGoal, ...prev]);
  };

  // Handle task creation
  const handleTaskCreated = (newTask) => {
    console.log('✅ Task created successfully:', newTask);
    setTasks(prev => [newTask, ...prev]);
  };

  // Handle goal update
  const handleGoalUpdated = (updatedGoal) => {
    setGoals(prev => prev.map(goal => 
      goal._id === updatedGoal._id ? updatedGoal : goal
    ));
  };

  // Handle goal deletion
  const handleDeleteGoal = async (goal) => {
    if (!window.confirm(`Are you sure you want to delete the goal "${goal.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingGoal(goal._id);
    
    try {
      const response = await fetch(buildApiUrl(`/api/goals/${goal._id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('✅ Goal deleted successfully');
        setGoals(prev => prev.filter(g => g._id !== goal._id));
      } else {
        const error = await response.json();
        console.error('❌ Goal deletion failed:', error);
        alert(`Error deleting goal: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Error deleting goal:', error);
      alert('Error deleting goal. Please try again.');
    } finally {
      setDeletingGoal(null);
    }
  };

  // Handle opening edit goal popup
  const handleEditGoal = (goal) => {
    setSelectedGoalForEdit(goal);
    setShowEditGoalPopup(true);
  };

  // Handle opening task creation popup for a specific goal
  const handleAddTaskToGoal = (goal) => {
    console.log('🎯 Opening task creation popup for goal:', goal);
    setSelectedGoalForTask(goal);
    setShowCreateTaskPopup(true);
  };

  // Handle opening habit creation popup for a specific goal
  const handleAddHabitToGoal = (goal) => {
    setSelectedGoalForHabit(goal);
    setShowCreateHabitPopup(true);
  };

  // Get tasks for a specific goal (both completed and pending)
  const getTasksForGoal = (goalId) => {
    // Show only tasks created today
    return tasks.filter(task => 
      task.goalIds && 
      task.goalIds.includes(goalId) &&
      isDateToday(task.createdAt)
    );
  };

  // Get habits for a specific goal
  const getHabitsForGoal = (goalId) => {
    const goalHabits = habits.filter(habit => {
      const habitGoalId = habit.goalId;
      let matches = false;
      
      // Handle both string and object goalId
      if (typeof habitGoalId === 'object' && habitGoalId !== null) {
        // If goalId is populated object, compare _id
        matches = habitGoalId._id === goalId || habitGoalId._id === goalId.toString();
      } else {
        // If goalId is string, compare directly
        matches = habitGoalId === goalId || habitGoalId === goalId.toString() || habitGoalId?.toString() === goalId?.toString();
      }
      
      const isActive = habit.isActive !== false;
      const result = matches && isActive;
      
      // Debug logging
      if (result) {
        console.log(`🔍 Habit "${habit.habit}" matches goal ${goalId}:`, {
          habitGoalId,
          goalId,
          matches,
          isActive,
          result
        });
      }
      
      return result;
    });
    
    console.log(`🔍 Found ${goalHabits.length} habits for goal ${goalId}:`, goalHabits.map(h => h.habit));
    
    return goalHabits;
  };

  // Get all activities (tasks + habits) for a specific goal
  const getActivitiesForGoal = (goalId) => {
    const goalTasks = getTasksForGoal(goalId);
    const goalHabits = getHabitsForGoal(goalId);
    
    // Combine tasks and habits into a unified list with stable IDs
    const activities = [
      ...goalHabits.map(habit => ({
        ...habit,
        _id: habit._id || `habit-${habit.habit}`,
        type: 'habit',
        displayName: habit.habit,
        duration: habit.valueMin || 0,
        isCompleted: isHabitCompletedToday(habit)
      })),
      ...goalTasks.map(task => ({
        ...task,
        _id: task._id,
        type: 'task',
        displayName: task.title,
        duration: task.estimatedDuration || 0,
        isCompleted: task.status === 'completed'
      }))
    ];
    
    return activities;
  };

  // Check if a habit is completed today (local timezone)
  const isHabitCompletedToday = (habit) => {
    if (!habit.checkins || !Array.isArray(habit.checkins)) {
      console.log(`🔍 Habit "${habit.habit}" has no checkins`);
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isCompleted = habit.checkins.some(checkin => {
      const checkinDate = new Date(checkin.date);
      checkinDate.setHours(0, 0, 0, 0);
      const matches = checkinDate.getTime() === today.getTime() && checkin.completed;
      
      if (matches) {
        console.log(`🔍 Habit "${habit.habit}" completed today:`, {
          checkinDate: checkinDate.toISOString(),
          today: today.toISOString(),
          completed: checkin.completed,
          duration: checkin.duration
        });
      }
      
      return matches;
    });
    
    console.log(`🔍 Habit "${habit.habit}" completion status:`, {
      isCompleted,
      checkinsCount: habit.checkins.length,
      checkins: habit.checkins.map(c => ({
        date: c.date,
        completed: c.completed,
        duration: c.duration
      }))
    });
    
    return isCompleted;
  };

  // Handle habit completion
  const handleHabitComplete = async (habit) => {
    // Add habit to completing set
    setCompletingHabits(prev => new Set([...prev, habit._id]));
    
    try {
      const response = await fetch(buildApiUrl(`/api/habits/${habit._id}/checkin`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString(),
          completed: true,
          duration: habit.valueMin || 0,
          notes: '',
          quality: 'good'
        })
      });

      if (response.ok) {
        console.log('✅ Habit completed successfully, reloading data...');
        
        // Show success state briefly
        setCompletedHabits(prev => new Set([...prev, habit._id]));
        setTimeout(() => {
          setCompletedHabits(prev => {
            const newSet = new Set(prev);
            newSet.delete(habit._id);
            return newSet;
          });
        }, 2000);
        
        // Reload data to get updated habit checkins
        await Promise.all([
          loadHabits(),
          loadGoals()
        ]);
        
        // Also trigger backend goal progress recalculation
        try {
          await fetch(buildApiUrl('/api/goals/today'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Goal progress recalculated on backend');
        } catch (error) {
          console.warn('⚠️ Failed to recalculate goal progress on backend:', error);
        }
      } else {
        console.error('❌ Failed to complete habit:', response.status);
      }
    } catch (error) {
      console.error('❌ Error completing habit:', error);
    } finally {
      // Remove habit from completing set
      setCompletingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habit._id);
        return newSet;
      });
    }
  };

  // Handle activity deletion (habits or tasks)
  const handleDeleteActivity = async (activity) => {
    const activityType = activity.type === 'habit' ? 'habit' : 'task';
    const activityName = activity.displayName;
    
    if (!window.confirm(`Are you sure you want to delete this ${activityType} "${activityName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      let response;
      
      if (activity.type === 'habit') {
        // Delete habit
        response = await fetch(buildApiUrl(`/api/habits/${activity._id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Delete task
        response = await fetch(buildApiUrl(`/api/tasks/${activity._id}`), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }

      if (response.ok) {
        console.log(`✅ ${activityType} deleted successfully`);
        
        // Reload data to reflect the deletion
        await Promise.all([
          loadHabits(),
          loadGoals(),
          loadTasks()
        ]);
        
        // Trigger backend goal progress recalculation
        try {
          await fetch(buildApiUrl('/api/goals/today'), {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          console.log('✅ Goal progress recalculated after deletion');
        } catch (error) {
          console.warn('⚠️ Failed to recalculate goal progress after deletion:', error);
        }
      } else {
        const error = await response.json();
        console.error(`❌ ${activityType} deletion failed:`, error);
        alert(`Error deleting ${activityType}: ${error.message}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting ${activityType}:`, error);
      alert(`Error deleting ${activityType}. Please try again.`);
    }
  };

  // Helper: does a habit occur today based on frequency and date range
  const doesHabitOccurToday = (habit) => {
    if (!habit || habit.isActive === false) return false;
    const today = new Date();
    const start = new Date(habit.startDate || today);
    const end = new Date(habit.endDate || today);
    // Normalize
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    if (today < start || today > end) return false;

    const freq = habit.frequency || 'daily';
    if (freq === 'daily') return true;
    if (freq === 'weekly') {
      return today.getDay() === new Date(habit.startDate || today).getDay();
    }
    if (freq === 'monthly') {
      return today.getDate() === new Date(habit.startDate || today).getDate();
    }
    return false;
  };

  // Helper: get today's check-in for a habit
  const getTodayHabitCheckin = (habit) => {
    if (!habit || !Array.isArray(habit.checkins)) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return habit.checkins.find((c) => {
      const d = new Date(c.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
  };

  // Build a pseudo-task from a completed habit check-in
  const mapHabitToPseudoTask = (habit, checkin) => {
    const durationMin = (checkin && checkin.duration) || habit.valueMin || 0;
    const completedAt = (checkin && checkin.date) || new Date().toISOString();
    return {
      _id: `habit-${habit._id}`,
      title: habit.habit,
      estimatedDuration: durationMin,
      completedAt: typeof completedAt === 'string' ? completedAt : new Date(completedAt).toISOString(),
      goalIds: habit.goalId ? [habit.goalId] : [],
      isHabit: true,
    };
  };

  // Get today's tasks for a specific goal, merging completed habits for today
  const getTodayTasksForGoal = (goalId) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Completed normal tasks today
    const completedTasksToday = tasks.filter((task) =>
      task.goalIds &&
      task.goalIds.includes(goalId) &&
      task.completedAt &&
      task.completedAt.split('T')[0] === todayStr
    );

    // Completed habits today (as pseudo tasks)
    const completedHabitsToday = (habits || [])
      .filter((h) => h.goalId && (h.goalId === goalId || (h.goalId?._id && h.goalId._id === goalId)))
      .filter((h) => doesHabitOccurToday(h))
      .map((h) => ({ habit: h, checkin: getTodayHabitCheckin(h) }))
      .filter(({ checkin }) => checkin && checkin.completed)
      .map(({ habit, checkin }) => mapHabitToPseudoTask(habit, checkin));

    return [...completedTasksToday, ...completedHabitsToday];
  };

  // Get tasks for a specific goal completed on the selected date
  const getTasksForGoalOnDate = (goalId) => {
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    return tasks.filter(task => 
      task.goalIds && 
      task.goalIds.includes(goalId) && 
      task.completedAt && 
      task.completedAt.split('T')[0] === selectedDateStr
    );
  };

  // Get total hours logged for a goal (all time)
  const getTotalHoursForGoal = (goalId) => {
    const goalTasks = getTasksForGoal(goalId);
    return goalTasks.reduce((total, task) => {
      const duration = task.estimatedDuration || 0;
      return total + (duration / 60); // Convert minutes to hours
    }, 0);
  };

  // Get today's hours logged for a goal (tasks + completed habits)
  const getTodayHoursForGoal = (goalId) => {
    const todayTasks = getTodayTasksForGoal(goalId);
    const taskHours = todayTasks.reduce((total, task) => {
      const duration = task.estimatedDuration || 0;
      return total + duration / 60;
    }, 0);

    // Add completed habits for this goal
    const goalHabits = getHabitsForGoal(goalId);
    const habitHours = goalHabits.reduce((total, habit) => {
      if (isHabitCompletedToday(habit)) {
        // Get the actual duration from today's check-in
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayCheckin = habit.checkins?.find(checkin => {
          const checkinDate = new Date(checkin.date);
          checkinDate.setHours(0, 0, 0, 0);
          return checkinDate.getTime() === today.getTime() && checkin.completed;
        });
        
        const duration = todayCheckin?.duration || habit.valueMin || 0;
        return total + duration / 60; // Convert minutes to hours
      }
      return total;
    }, 0);

    const totalHours = taskHours + habitHours;
    
    // Debug logging
    console.log(`🔍 Goal ${goalId} hours calculation:`, {
      goalId,
      taskHours,
      habitHours,
      totalHours,
      goalHabits: goalHabits.map(h => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCheckin = h.checkins?.find(checkin => {
          const checkinDate = new Date(checkin.date);
          checkinDate.setHours(0, 0, 0, 0);
          return checkinDate.getTime() === today.getTime() && checkin.completed;
        });
        return {
          habit: h.habit,
          valueMin: h.valueMin,
          isCompleted: isHabitCompletedToday(h),
          actualDuration: todayCheckin?.duration || h.valueMin,
          checkins: h.checkins
        };
      }),
      todayTasks: todayTasks.map(t => ({
        title: t.title,
        estimatedDuration: t.estimatedDuration,
        status: t.status
      }))
    });
    
    return totalHours;
  };

  // Get hours logged for a goal on the selected date
  const getHoursForGoalOnDate = (goalId) => {
    const goalTasks = getTasksForGoalOnDate(goalId);
    const taskHours = goalTasks.reduce((total, task) => {
      const duration = task.estimatedDuration || 0;
      return total + (duration / 60); // Convert minutes to hours
    }, 0);

    // Add completed habits for this goal on the selected date
    const goalHabits = getHabitsForGoal(goalId);
    const selectedDateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const habitHours = goalHabits.reduce((total, habit) => {
      if (habit.checkins && Array.isArray(habit.checkins)) {
        const checkinForDate = habit.checkins.find(checkin => {
          const checkinDate = new Date(checkin.date);
          const checkinStr = checkinDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          return checkinStr === selectedDateStr && checkin.completed;
        });
        
        if (checkinForDate) {
          const duration = habit.valueMin || 0;
          return total + duration / 60; // Convert minutes to hours
        }
      }
      return total;
    }, 0);

    return taskHours + habitHours;
  };

  // Get month progress for a goal (hours logged this month)
  const getMonthHoursForGoal = (goalId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get all tasks for this goal completed this month
    const monthTasks = tasks.filter(task => {
      if (!task.goalIds || !task.goalIds.includes(goalId) || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= startOfMonth && completedDate <= endOfMonth;
    });
    
    const taskHours = monthTasks.reduce((total, task) => {
      const duration = task.estimatedDuration || 0;
      return total + (duration / 60); // Convert minutes to hours
    }, 0);

    // Get all habits for this goal completed this month
    const goalHabits = getHabitsForGoal(goalId);
    const habitHours = goalHabits.reduce((total, habit) => {
      if (habit.checkins && Array.isArray(habit.checkins)) {
        const monthCheckins = habit.checkins.filter(checkin => {
          const checkinDate = new Date(checkin.date);
          return checkinDate >= startOfMonth && checkinDate <= endOfMonth && checkin.completed;
        });
        
        const habitMonthHours = monthCheckins.reduce((sum, checkin) => {
          const duration = checkin.duration || habit.valueMin || 0;
          return sum + duration / 60; // Convert minutes to hours
        }, 0);
        
        return total + habitMonthHours;
      }
      return total;
    }, 0);

    const totalMonthHours = taskHours + habitHours;
    
    // Debug logging for monthly calculation
    console.log(`🔍 Monthly calculation for goal ${goalId}:`, {
      startOfMonth: startOfMonth.toISOString(),
      endOfMonth: endOfMonth.toISOString(),
      monthTasks: monthTasks.length,
      taskHours,
      goalHabits: goalHabits.length,
      habitHours,
      totalMonthHours
    });
    
    return totalMonthHours;
  };

  // Get number of activities completed this month for a goal
  const getMonthActivitiesCountForGoal = (goalId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Count completed tasks this month
    const monthTasks = tasks.filter(task => {
      if (!task.goalIds || !task.goalIds.includes(goalId) || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= startOfMonth && completedDate <= endOfMonth;
    }).length;

    // Count completed habits this month
    const goalHabits = getHabitsForGoal(goalId);
    const monthHabits = goalHabits.reduce((count, habit) => {
      if (habit.checkins && Array.isArray(habit.checkins)) {
        const monthCheckins = habit.checkins.filter(checkin => {
          const checkinDate = new Date(checkin.date);
          return checkinDate >= startOfMonth && checkinDate <= endOfMonth && checkin.completed;
        });
        return count + monthCheckins.length;
      }
      return count;
    }, 0);

    return monthTasks + monthHabits;
  };


  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };


  // Load data on component mount
  useEffect(() => {
    if (user && token) {
      setLoading(true);
      setError(null);
      
      const loadAllData = async () => {
        try {
          await Promise.all([
            loadHabits(),
            loadGoals(),
            loadTasks()
          ]);
        } catch (err) {
          console.error('Error loading data:', err);
          setError('Failed to load data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [user, token]);

  // Debug summary when tasks and goals are loaded
  useEffect(() => {
    if (tasks.length > 0 && goals.length > 0) {
      const totalTasks = tasks.length;
      const tasksWithGoals = tasks.filter(t => t.goalIds && t.goalIds.length > 0).length;
      const totalHours = tasks.reduce((sum, t) => sum + ((t.actualDuration || t.estimatedDuration || 0) / 60), 0);
    }
  }, [tasks, goals]);



  const dateComponents = formatDateComponents(selectedDate);

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <Card className="h-full">
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E49C9] mx-auto mb-4"></div>
                  <p className="text-[#94A3B8]">Loading your goals and activities...</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <Card className="h-full">
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="text-[#FF6B6B] text-6xl mb-4">⚠️</div>
                  <p className="text-[#FF6B6B] text-lg mb-4">{error}</p>
                  <Button 
                    variant="primary" 
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Bento Grid Layout - Pinterest Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[minmax(200px,auto)] [&>*:nth-child(odd)]:animate-fade-in [&>*:nth-child(even)]:animate-fade-in-delayed">
        
        {/* Header Card - Full width */}
        <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
          <Card className="h-full">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#E8EEF2] font-oswald tracking-tight">
                  Goal-Aligned Day
                </h1>
                <p className="text-[#94A3B8] mt-2 text-lg">
                  Focus on your goals and daily activities
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowCreateGoalPopup(true)}
                  className="px-6 py-2"
                >
                  Add Goal
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Goals Cards */}
        {goals.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <Card className="h-full">
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-[#E8EEF2] mb-2">
                  No goals found
                </h3>
                <p className="text-[#94A3B8] mb-6">
                  Create some goals to get started with your goal-aligned day!
                </p>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowCreateGoalPopup(true)}
                  className="px-6 py-2"
                >
                  Create Your First Goal
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          goals.map((goal, index) => {
            const goalTasks = getTodayTasksForGoal(goal._id);
            const goalActivities = getActivitiesForGoal(goal._id);
            const todayHours = getTodayHoursForGoal(goal._id);
            const monthHours = getMonthHoursForGoal(goal._id);
            const monthActivitiesCount = getMonthActivitiesCountForGoal(goal._id);
            
            // Debug logging for each goal
            console.log(`🔍 Goal ${goal.title} (${goal._id}):`, {
              todayHours,
              targetHours: goal.targetHours,
              goalActivities: goalActivities.length,
              goalTasks: goalTasks.length
            });
            
            return (
              <div key={goal._id || index} className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                <Card className="h-full min-h-[500px] group relative hover:border-[rgba(255,255,255,0.3)] hover:shadow-lg hover:shadow-[#1E49C9]/20 transition-all duration-300">
                  
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-bold text-[#E8EEF2] truncate">
                        {goal.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={goal.isActive ? "default" : "secondary"} className="text-xs px-3 py-1 flex-shrink-0">
                          {goal.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditGoal(goal)}
                            className="p-1.5 text-[#94A3B8] hover:text-[#1E49C9] hover:bg-[#1E49C9]/10 rounded-md transition-colors"
                            title="Edit goal"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal)}
                            disabled={deletingGoal === goal._id}
                            className="p-1.5 text-[#94A3B8] hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete goal"
                          >
                            {deletingGoal === goal._id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b border-[#FF6B6B]"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[#94A3B8] leading-relaxed line-clamp-2">
                      {goal.description}
                    </p>
                  </div>

                  {/* Split Layout: Left (KPIs) and Right (Activities) */}
                  <div className="flex gap-6 mb-6">
                    {/* Left Side - KPIs */}
                    <div className="flex-1 space-y-4">
                      {/* Day Progress */}
                      <div className="bg-[#11151A]/50 rounded-lg p-4 border border-[rgba(255,255,255,0.1)]">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-[#E8EEF2]">Today's Progress</span>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#1E49C9]">
                              {Math.round(todayHours * 10) / 10}h / {goal.targetHours || 0}h
                            </div>
                            <div className="text-xs text-[#94A3B8]">
                              {Math.round(todayHours * 60)}m / {Math.round((goal.targetHours || 0) * 60)}m
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-[#2A313A] rounded-full h-3 mb-3 relative">
                          <div 
                            className="bg-gradient-to-r from-[#1E49C9] to-[#3EA6FF] h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min((todayHours / (goal.targetHours || 1)) * 100, 100)}%` 
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-white/80">
                              {Math.round((todayHours / (goal.targetHours || 1)) * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm text-[#94A3B8]">
                          <span>0m</span>
                          <span>{Math.round((goal.targetHours || 0) * 60)}m target</span>
                        </div>
                      </div>

                      {/* Month Progress */}
                      <div className="bg-[#11151A]/50 rounded-lg p-4 border border-[rgba(255,255,255,0.1)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#E8EEF2]">This Month</span>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#1E49C9]">
                              {Math.round(monthHours * 10) / 10}h
                            </div>
                            <div className="text-xs text-[#94A3B8]">
                              {Math.round(monthHours * 60)}m
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-[#94A3B8]">
                          Hours logged this month
                        </div>
                      </div>

                      {/* Activities Count */}
                      <div className="bg-[#11151A]/50 rounded-lg p-4 border border-[rgba(255,255,255,0.1)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#E8EEF2]">Activities Done</span>
                          <span className="text-lg font-bold text-[#1E49C9]">
                            {monthActivitiesCount}
                          </span>
                        </div>
                        <div className="text-xs text-[#94A3B8]">
                          Completed this month
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Activities */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-[#E8EEF2]">
                          All Activities ({goalActivities.length})
                        </span>
                      </div>
                      
                      {goalActivities.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {goalActivities.map((activity, activityIndex) => (
                            <div key={`${activity.type || 'activity'}-${activity._id || activityIndex}`} className="flex items-center justify-between p-3 bg-[#11151A]/50 rounded-lg border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-colors">
                              {/* Activity Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-[#1E49C9] bg-[#1E49C9]/10 px-2 py-1 rounded">
                                    {activity.type === 'habit' ? 'Habit' : 'Task'}
                                  </span>
                                  <span className="text-xs text-[#94A3B8]">
                                    {activity.duration}m
                                  </span>
                                </div>
                                <div className="text-sm text-[#E8EEF2] truncate">
                                  {activity.displayName}
                                </div>
                              </div>
                              
                              {/* Action Button/Status */}
                              <div className="ml-3 flex-shrink-0 flex items-center gap-2">
                                {activity.type === 'habit' ? (
                                  activity.isCompleted || completedHabits.has(activity._id) ? (
                                    <div className="flex items-center gap-1 text-xs text-[#1E49C9] font-medium">
                                      <span className="text-[#1E49C9]">✓</span>
                                      <span>Done</span>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleHabitComplete(activity)}
                                      disabled={completingHabits.has(activity._id)}
                                      className="text-xs px-3 py-1 bg-[#1E49C9]/10 border border-[#1E49C9]/30 text-[#1E49C9] rounded-md hover:bg-[#1E49C9]/20 hover:border-[#1E49C9]/50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                      {completingHabits.has(activity._id) ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b border-[#1E49C9]"></div>
                                          <span>Marking...</span>
                                        </>
                                      ) : (
                                        'Mark'
                                      )}
                                    </button>
                                  )
                                ) : (
                                  <div className="flex items-center gap-1 text-xs text-[#94A3B8]">
                                    <span>{activity.isCompleted ? '✓' : '⏳'}</span>
                                    <span>{activity.isCompleted ? 'Done' : 'Pending'}</span>
                                  </div>
                                )}
                                
                                {/* Delete Button */}
                                <button
                                  onClick={() => handleDeleteActivity(activity)}
                                  className="text-xs px-2 py-1 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-md transition-colors"
                                  title={`Delete ${activity.type}`}
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-[#94A3B8]">
                          <div className="text-4xl mb-2">📝</div>
                          <p className="text-sm">No activities yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                
                  {/* Action Buttons - Moved below activities */}
                  <div className="mt-auto pt-4 border-t border-[rgba(255,255,255,0.1)]">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTaskToGoal(goal)}
                        className="text-xs px-3 py-1 flex-1 border-[#1E49C9]/30 text-[#1E49C9] hover:bg-[#1E49C9]/10"
                      >
                        + Add Task
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddHabitToGoal(goal)}
                        className="text-xs px-3 py-1 flex-1 border-[#1E49C9]/30 text-[#1E49C9] hover:bg-[#1E49C9]/10"
                      >
                        + Add Habit
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })
        )}
      </div>

      {/* Create Habit Popup */}
      <CreateHabitPopup
        isOpen={showCreateHabitPopup}
        onClose={() => {
          setShowCreateHabitPopup(false);
          setSelectedGoalForHabit(null);
        }}
        onHabitCreated={handleHabitCreated}
        goals={goals}
        selectedGoal={selectedGoalForHabit}
      />

      {/* Create Goal Popup */}
      <CreateGoalPopup
        isOpen={showCreateGoalPopup}
        onClose={() => setShowCreateGoalPopup(false)}
        onGoalCreated={handleGoalCreated}
      />

      {/* Create Task Popup */}
      <CreateTaskPopup
        isOpen={showCreateTaskPopup}
        onClose={() => {
          setShowCreateTaskPopup(false);
          setSelectedGoalForTask(null);
        }}
        onTaskCreated={handleTaskCreated}
        goalId={selectedGoalForTask?._id}
        goalName={selectedGoalForTask?.name}
      />

      {/* Edit Goal Popup */}
      <EditGoalPopup
        isOpen={showEditGoalPopup}
        onClose={() => {
          setShowEditGoalPopup(false);
          setSelectedGoalForEdit(null);
        }}
        onGoalUpdated={handleGoalUpdated}
        goal={selectedGoalForEdit}
      />
    </div>
  );
};

export default GoalAlignedDay;
