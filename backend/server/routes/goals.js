const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LifestyleGoal = require('../models/Goal');
const GoalAlignedDay = require('../models/GoalAlignedDay');
const GoalAlignedDayService = require('../services/goalAlignedDayService');

// Get all goals for a user
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔍 GET /api/goals - User ID:', req.user.userId);
    console.log('🔍 GET /api/goals - User object:', req.user);
    
    // Fix: Use correct user ID field from JWT token
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      console.error('❌ No user ID found in request');
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    console.log('🎯 Fetching goals for user:', userId);
    const goals = await LifestyleGoal.find({ userId, isActive: true })
      .sort({ priority: -1, name: 1 });
    
    console.log(`✅ Found ${goals.length} goals for user`);
    
    // Validate and clean the data before sending
    const validatedGoals = goals.map(goal => {
      const goalObj = goal.toObject();
      
      // Ensure name is valid
      if (!goalObj.name || typeof goalObj.name !== 'string') {
        console.warn('⚠️ Invalid name in goal:', goalObj._id);
        goalObj.name = 'Untitled Goal';
      }
      
      // Ensure color is valid
      if (!goalObj.color || typeof goalObj.color !== 'string') {
        console.warn('⚠️ Invalid color in goal:', goalObj._id);
        goalObj.color = '#10B981';
      }
      
      // Ensure targetHours is valid
      if (typeof goalObj.targetHours !== 'number' || isNaN(goalObj.targetHours)) {
        console.warn('⚠️ Invalid targetHours in goal:', goalObj._id);
        goalObj.targetHours = 1;
      }
      
      return goalObj;
    });
    
    res.json(validatedGoals);
  } catch (error) {
    console.error('❌ Error fetching goals:', error);
    res.status(500).json({ message: 'Error fetching goals' });
  }
});

// Create a new goal
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    console.log('🎯 Goal creation request received:', req.body);
    const { name, color, description, category, targetHours, priority } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ message: 'Goal name is required' });
    }
    
    const goal = new LifestyleGoal({
      userId,
      name: name.trim(),
      color: color || '#10B981',
      description,
      category,
      targetHours: targetHours || 1,
      priority: priority || 'medium'
    });
    
    await goal.save();
    console.log('✅ Goal created successfully:', goal.name);
    res.status(201).json(goal);
  } catch (error) {
    console.error('❌ Error creating goal:', error);
    res.status(500).json({ message: 'Error creating goal' });
  }
});

// Update a goal
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const { name, color, description, category, targetHours, priority, isActive } = req.body;
    
    const goal = await LifestyleGoal.findOneAndUpdate(
      { _id: req.params.id, userId },
      { name, color, description, category, targetHours, priority, isActive },
      { new: true, runValidators: true }
    );
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ message: 'Error updating goal' });
  }
});

// Delete a goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const goal = await LifestyleGoal.findOneAndDelete({
      _id: req.params.id,
      userId
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ message: 'Error deleting goal' });
  }
});

// Get today's goal-aligned metrics
router.get('/today', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const date = req.query.date ? new Date(req.query.date) : new Date();
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const metrics = await GoalAlignedDayService.calculateDailyMetrics(userId, date);
    res.json(metrics);
  } catch (error) {
    console.error('Error calculating today\'s metrics:', error);
    res.status(500).json({ message: 'Error calculating metrics' });
  }
});

// Get streak information
router.get('/streak', auth, async (req, res) => {
  try {
    const streakInfo = await GoalAlignedDayService.getStreakInfo(req.user.userId);
    res.json(streakInfo);
  } catch (error) {
    console.error('Error getting streak info:', error);
    res.status(500).json({ message: 'Error getting streak info' });
  }
});

// Get weekly summary
router.get('/weekly', auth, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date();
    const weeklyData = await GoalAlignedDayService.getWeeklySummary(req.user.userId, startDate);
    res.json(weeklyData);
  } catch (error) {
    console.error('Error getting weekly summary:', error);
    res.status(500).json({ message: 'Error getting weekly summary' });
  }
});

// Get goal-aligned day history
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 30, startDate, endDate } = req.query;
    
    const query = { userId: req.user.userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const history = await GoalAlignedDay.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('goalBreakdown.goalId');
    
    const total = await GoalAlignedDay.countDocuments(query);
    
    res.json({
      history,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Error fetching history' });
  }
});

module.exports = router;
