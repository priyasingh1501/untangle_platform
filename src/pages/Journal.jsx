import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  BookOpen, 
  Heart, 
  Target, 
  Moon, 
  Star, 
  Calendar, 
  Tag, 
  MapPin, 
  Cloud,
  Edit3,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import AlfredAnalysis from '../components/journal/AlfredAnalysis';
import JournalTrends from '../components/journal/JournalTrends';
import EmotionalJourneyChart from '../components/journal/EmotionalJourneyChart';
import MindfulnessCheckin from '../components/mindfulness/MindfulnessCheckin';
import { buildApiUrl } from '../config';
import { Button, Input, Card, Section, Header } from '../components/ui';

const Journal = () => {
  const { token } = useAuth();
  const [entries, setEntries] = useState([]);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [showMindfulnessCheckin, setShowMindfulnessCheckin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    mood: '',
    tags: []
  });

  // New entry form state
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    type: 'daily',
    mood: 'neutral',
    tags: [],
    isPrivate: false,
    // Mindfulness dimensions
    mindfulnessDimensions: {
      presence: { rating: 0 },
      emotionAwareness: { rating: 0 },
      intentionality: { rating: 0 },
      attentionQuality: { rating: 0 },
      compassion: { rating: 0 }
    }
  });

  const [tagInput, setTagInput] = useState('');

  const entryTypes = [
    { value: 'daily', label: 'Daily', icon: Calendar, color: 'bg-blue-500' },
    { value: 'gratitude', label: 'Gratitude', icon: Heart, color: 'bg-pink-500' },
    { value: 'reflection', label: 'Reflection', icon: BookOpen, color: 'bg-purple-500' },
    { value: 'goal', label: 'Goal', icon: Target, color: 'bg-[#1E49C9]' },
    { value: 'dream', label: 'Dream', icon: Moon, color: 'bg-indigo-500' },
    { value: 'memory', label: 'Memory', icon: Star, color: 'bg-yellow-500' },
    { value: 'creative', label: 'Creative', icon: BookOpen, color: 'bg-orange-500' }
  ];

  const moods = [
    { value: 'excellent', label: 'Excellent', color: 'bg-[#1E49C9]' },
    { value: 'good', label: 'Good', color: 'bg-blue-500' },
    { value: 'neutral', label: 'Neutral', color: 'bg-gray-500' },
    { value: 'bad', label: 'Bad', color: 'bg-yellow-500' },
    { value: 'terrible', label: 'Terrible', color: 'bg-red-500' }
  ];

  const fetchJournal = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/api/journal'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Fetched journal data:', data);
      console.log('Entries:', data.entries);
      setEntries(data.entries || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching journal:', error);
      toast.error('Failed to load journal');
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/api/journal/stats'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }, [token]);

  // Load user's tasks
  const loadTasks = useCallback(async () => {
    try {
      let allTasks = [];
      let page = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        const response = await fetch(buildApiUrl(`/api/tasks?limit=100&page=${page}`), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const tasksData = data.tasks || [];
          allTasks = [...allTasks, ...tasksData];
          hasMorePages = page < data.totalPages;
          page++;
        } else {
          break;
        }
      }
      
      setTasks(allTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [token]);

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
        setHabits(data || []);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      const loadAllData = async () => {
        try {
          await Promise.all([
            fetchJournal(),
            fetchStats(),
            loadGoals(),
            loadTasks(),
            loadHabits()
          ]);
        } catch (err) {
          console.error('Error loading data:', err);
        }
      };
      
      loadAllData();
    }
  }, [token, fetchJournal, fetchStats, loadGoals, loadTasks, loadHabits]);

  const handleCreateEntry = async (e) => {
    e.preventDefault();
    
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('/api/journal/entries'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newEntry)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Server response data:', data);
        console.log('Entry data:', data.entry);
        console.log('Entry ID:', data.entry?._id);
        
        // Ensure the entry has an _id before adding to state
        if (data.entry && data.entry._id) {
          setEntries([data.entry, ...entries]);
          setShowNewEntryForm(false);
          setNewEntry({
            title: '',
            content: '',
            type: 'daily',
            mood: 'neutral',
            tags: [],
            isPrivate: false,
            mindfulnessDimensions: {
              presence: { rating: 0 },
              emotionAwareness: { rating: 0 },
              intentionality: { rating: 0 },
              attentionQuality: { rating: 0 },
              compassion: { rating: 0 }
            }
          });
          toast.success('Journal entry created successfully!');
          fetchStats();
        } else {
          console.error('Entry missing _id:', data.entry);
          toast.error('Entry created but missing ID. Refreshing entries...');
          // Refresh the journal entries to get the latest data with proper IDs
          fetchJournal();
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to create entry:', errorData);
        toast.error(errorData.message || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error('Failed to create entry');
    }
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      const response = await fetch(buildApiUrl(`/api/journal/entries/${entryId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setEntries(entries.filter(entry => entry._id !== entryId));
        toast.success('Entry deleted successfully');
        fetchStats();
      } else {
        toast.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const handleAnalyzeEntry = async (entryId) => {
    console.log('Analyzing entry with ID:', entryId);
    if (!entryId) {
      toast.error('Entry ID is missing');
      return;
    }
    
    try {
      const response = await fetch(buildApiUrl(`/api/journal/entries/${entryId}/analyze`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Update the entry in the local state
        setEntries(entries.map(entry => 
          entry._id === entryId 
            ? { ...entry, alfredAnalysis: data.analysis }
            : entry
        ));
        toast.success('Entry analyzed successfully!');
      } else {
        toast.error('Failed to analyze entry');
      }
    } catch (error) {
      console.error('Error analyzing entry:', error);
      toast.error('Failed to analyze entry');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !newEntry.tags.includes(tagInput.trim())) {
      setNewEntry({
        ...newEntry,
        tags: [...newEntry.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNewEntry({
      ...newEntry,
      tags: newEntry.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Helper functions for mindfulness checkin
  const getTasksForGoal = (goalId) => {
    return tasks.filter(task => 
      task.goalIds && 
      task.goalIds.includes(goalId)
    );
  };

  const getHabitsForGoal = (goalId) => {
    const goalHabits = habits.filter(habit => {
      const habitGoalId = habit.goalId;
      let matches = false;
      
      if (typeof habitGoalId === 'object' && habitGoalId !== null) {
        matches = habitGoalId._id === goalId || habitGoalId._id === goalId.toString();
      } else {
        matches = habitGoalId === goalId || habitGoalId === goalId.toString() || habitGoalId?.toString() === goalId?.toString();
      }
      
      const isActive = habit.isActive !== false;
      return matches && isActive;
    });
    return goalHabits;
  };

  const getActivitiesForGoal = (goalId) => {
    const goalTasks = getTasksForGoal(goalId);
    const goalHabits = getHabitsForGoal(goalId);
    
    const activities = [
      ...goalTasks.map(task => ({
        ...task,
        type: 'task',
        displayName: task.title,
        duration: task.estimatedDuration || 0,
        isCompleted: task.status === 'completed'
      })),
      ...goalHabits.map(habit => ({
        ...habit,
        type: 'habit',
        displayName: habit.habit,
        duration: habit.valueMin || 0,
        isCompleted: isHabitCompletedToday(habit)
      }))
    ];
    
    return activities;
  };

  const isHabitCompletedToday = (habit) => {
    if (!habit.checkins || !Array.isArray(habit.checkins)) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return habit.checkins.some(checkin => {
      const checkinDate = new Date(checkin.date);
      checkinDate.setHours(0, 0, 0, 0);
      return checkinDate.getTime() === today.getTime() && checkin.completed;
    });
  };

  const getTodayTasksForGoal = (goalId) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const completedTasksToday = tasks.filter((task) =>
      task.goalIds &&
      task.goalIds.includes(goalId) &&
      task.completedAt &&
      task.completedAt.split('T')[0] === todayStr
    );

    return completedTasksToday;
  };

  const getTodayHoursForGoal = (goalId) => {
    const todayTasks = getTodayTasksForGoal(goalId);
    const taskHours = todayTasks.reduce((total, task) => {
      const duration = task.estimatedDuration || 0;
      return total + duration / 60;
    }, 0);

    const goalHabits = getHabitsForGoal(goalId);
    const habitHours = goalHabits.reduce((total, habit) => {
      if (isHabitCompletedToday(habit)) {
        const duration = habit.valueMin || 0;
        return total + duration / 60;
      }
      return total;
    }, 0);

    return taskHours + habitHours;
  };

  const handleMindfulnessComplete = () => {
    // Refresh data after mindfulness checkin
    fetchJournal();
    fetchStats();
  };

  // Show all entries since filters are removed
  const filteredEntries = entries;

  const getTypeIcon = (type) => {
    const typeConfig = entryTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.icon : BookOpen;
  };

  const getMoodColor = (mood) => {
    const moodConfig = moods.find(m => m.value === mood);
    return moodConfig ? moodConfig.color : 'bg-gray-500';
  };

  if (loading) {
    return (
      <Section>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading your journal entries...</p>
          </div>
        </div>
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
                  <Header level={1} className="tracking-tight">Journal</Header>
                  <p className="text-text-secondary mt-2">Capture your thoughts, memories, and reflections</p>
                </div>
              </div>
              
              {/* Action Bar */}
              <div className="flex justify-start gap-4">
                <Button
                  onClick={() => setShowNewEntryForm(true)}
                  variant="primary"
                  className="inline-flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  NEW ENTRY
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* New Entry Form - Full Width - Appears right after title */}
        <AnimatePresence>
          {showNewEntryForm && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
              <Card className="h-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 font-jakarta tracking-wide">Create New Entry</h3>
              
              <form onSubmit={handleCreateEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Title *"
                    type="text"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    placeholder="What's on your mind?"
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                      Entry Type
                    </label>
                    <select
                      value={newEntry.type}
                      onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
                      className="input w-full"
                    >
                      {entryTypes.map(type => (
                        <option key={type.value} value={type.value} className="bg-background-primary text-text-primary">{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Input
                  label="Your Reflection *"
                  type="textarea"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  rows={6}
                  placeholder="Write your thoughts, feelings, or experiences..."
                  required
                />

                {/* Mindfulness Dimensions */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide">Mindfulness Check-in</h4>
                  <p className="text-sm text-text-secondary">Rate each dimension from 1-5 (1 = needs attention, 5 = excellent)</p>
                  
                  {/* Presence */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary font-jakarta">
                      Presence - How present and aware were you today?
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewEntry({
                            ...newEntry,
                            mindfulnessDimensions: {
                              ...newEntry.mindfulnessDimensions,
                              presence: { rating }
                            }
                          })}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                            newEntry.mindfulnessDimensions.presence.rating === rating
                              ? 'bg-primary-500 border-primary-500 text-white'
                              : 'border-border-primary text-text-secondary hover:border-primary-500'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emotion Awareness */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary font-jakarta">
                      Emotion Awareness - How well did you recognize and understand your emotions?
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewEntry({
                            ...newEntry,
                            mindfulnessDimensions: {
                              ...newEntry.mindfulnessDimensions,
                              emotionAwareness: { rating }
                            }
                          })}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                            newEntry.mindfulnessDimensions.emotionAwareness.rating === rating
                              ? 'bg-primary-500 border-primary-500 text-white'
                              : 'border-border-primary text-text-secondary hover:border-primary-500'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intentionality */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary font-jakarta">
                      Intentionality - How intentional and purposeful were your actions?
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewEntry({
                            ...newEntry,
                            mindfulnessDimensions: {
                              ...newEntry.mindfulnessDimensions,
                              intentionality: { rating }
                            }
                          })}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                            newEntry.mindfulnessDimensions.intentionality.rating === rating
                              ? 'bg-primary-500 border-primary-500 text-white'
                              : 'border-border-primary text-text-secondary hover:border-primary-500'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attention Quality */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary font-jakarta">
                      Attention Quality - How focused and undistracted was your attention?
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewEntry({
                            ...newEntry,
                            mindfulnessDimensions: {
                              ...newEntry.mindfulnessDimensions,
                              attentionQuality: { rating }
                            }
                          })}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                            newEntry.mindfulnessDimensions.attentionQuality.rating === rating
                              ? 'bg-primary-500 border-primary-500 text-white'
                              : 'border-border-primary text-text-secondary hover:border-primary-500'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Compassion */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-secondary font-jakarta">
                      Compassion - How kind and compassionate were you toward yourself and others?
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setNewEntry({
                            ...newEntry,
                            mindfulnessDimensions: {
                              ...newEntry.mindfulnessDimensions,
                              compassion: { rating }
                            }
                          })}
                          className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors ${
                            newEntry.mindfulnessDimensions.compassion.rating === rating
                              ? 'bg-primary-500 border-primary-500 text-white'
                              : 'border-border-primary text-text-secondary hover:border-primary-500'
                          }`}
                        >
                          {rating}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                      Mood
                    </label>
                    <select
                      value={newEntry.mood}
                      onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value })}
                      className="w-full px-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:border-primary-500 focus:outline-none"
                    >
                      {moods.map(mood => (
                        <option key={mood.value} value={mood.value} className="bg-background-primary text-text-primary">{mood.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-jakarta">
                      Tags
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-3 py-2 bg-background-primary border border-border-primary rounded-lg text-text-primary focus:border-primary-500 focus:outline-none"
                        placeholder="Add a tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 bg-border-primary border border-l-0 border-border-primary rounded-r-lg hover:bg-border-secondary text-text-primary"
                      >
                        Add
                      </button>
                    </div>
                    {newEntry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newEntry.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 text-primary-600 hover:text-primary-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newEntry.isPrivate}
                        onChange={(e) => setNewEntry({ ...newEntry, isPrivate: e.target.checked })}
                        className="mr-2 rounded border-border-primary text-primary-500 focus:ring-primary-500 bg-background-primary"
                      />
                      <span className="text-sm text-text-secondary font-jakarta">Private entry</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    onClick={() => setShowNewEntryForm(false)}
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    Create Entry
                  </Button>
                  </div>
                </form>
                </div>
              </Card>
            </div>
          )}
        </AnimatePresence>

        {/* Alfred's Trend Analysis - Full Width */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <div className="h-full">
            <JournalTrends />
          </div>
        </div>

        {/* Emotional Journey Chart - Full Width */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
          <div className="h-full">
            <EmotionalJourneyChart />
          </div>
        </div>

        {/* Stats Overview Cards */}
        {stats && (
          <>
            <div className="col-span-1">
              <Card className="h-full">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <p className="text-sm font-medium text-text-secondary font-jakarta tracking-wide">TOTAL ENTRIES</p>
                      <p className="text-2xl font-bold text-text-primary font-mono">{stats.totalEntries}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-span-1">
              <Card className="h-full">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <p className="text-sm font-medium text-text-secondary font-jakarta tracking-wide">CURRENT STREAK</p>
                      <p className="text-2xl font-bold text-text-primary font-mono">{stats.currentStreak} days</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-span-1">
              <Card className="h-full">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <p className="text-sm font-medium text-text-secondary font-jakarta tracking-wide">LONGEST STREAK</p>
                      <p className="text-2xl font-bold text-text-primary font-mono">{stats.longestStreak} days</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="col-span-1">
              <Card className="h-full">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <p className="text-sm font-medium text-text-secondary font-jakarta tracking-wide">LAST ENTRY</p>
                      <p className="text-lg font-bold text-text-primary font-mono">
                        {stats.lastEntryDate ? new Date(stats.lastEntryDate).toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Mindfulness Check-in - Full Width */}
        <AnimatePresence>
          {showMindfulnessCheckin && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
              <Card className="h-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide">Mindfulness Check-in</h3>
                    <Button
                      onClick={() => setShowMindfulnessCheckin(false)}
                      variant="ghost"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                  <MindfulnessCheckin 
                    onCheckinComplete={handleMindfulnessComplete}
                    goals={goals}
                    getTodayTasksForGoal={getTodayTasksForGoal}
                    getActivitiesForGoal={getActivitiesForGoal}
                    getTodayHoursForGoal={getTodayHoursForGoal}
                  />
                </div>
              </Card>
            </div>
          )}
        </AnimatePresence>

        {/* Journal Entries */}
        {filteredEntries.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <Card className="h-full">
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-text-tertiary" />
                <h3 className="mt-2 text-sm font-medium text-text-primary font-jakarta tracking-wide">No entries yet</h3>
                <p className="mt-1 text-sm text-text-secondary font-jakarta">
                  {filters.type || filters.mood ? 'Try adjusting your filters' : 'Get started by creating your first journal entry'}
                </p>
              </div>
            </Card>
          </div>
        ) : (
          filteredEntries.map((entry, index) => (
            <div key={entry._id} className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2">
              <Card className="h-full overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${getTypeIcon(entry.type).color} bg-opacity-20`}>
                        {React.createElement(getTypeIcon(entry.type), { className: "h-5 w-5 text-text-primary" })}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary font-jakarta tracking-wide">{entry.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-text-secondary font-jakarta">
                          <span className="capitalize">{entry.type}</span>
                          <span>•</span>
                          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                          {entry.isPrivate && (
                            <>
                              <span>•</span>
                              <EyeOff className="h-4 w-4 inline" />
                              <span>Private</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getMoodColor(entry.mood)}`}></div>
                      <span className="text-sm text-text-secondary capitalize font-jakarta">{entry.mood}</span>
                    </div>
                  </div>

                  <div className="prose max-w-none mb-4">
                    <p className="text-text-secondary whitespace-pre-wrap font-jakarta">{entry.content}</p>
                  </div>

                  {/* Alfred Analysis */}
                  {entry._id ? (
                    <AlfredAnalysis 
                      analysis={entry.alfredAnalysis} 
                      entryId={entry._id}
                      onAnalyze={handleAnalyzeEntry}
                    />
                  ) : (
                    <div className="mt-4 p-4 bg-yellow-800 border border-yellow-600 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <p className="text-yellow-300 text-sm">Entry is being processed. Analysis will be available shortly.</p>
                      </div>
                    </div>
                  )}

                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {entry.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 bg-border-primary text-text-primary text-xs rounded-full"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-text-secondary font-jakarta">
                      {entry.location?.city && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {entry.location.city}
                        </div>
                      )}
                      {entry.weather?.condition && (
                        <div className="flex items-center">
                          <Cloud className="h-4 w-4 mr-1" />
                          {entry.weather.condition}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDeleteEntry(entry._id)}
                        className="p-2 text-text-secondary hover:text-red-400 transition-colors duration-200"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Journal;
