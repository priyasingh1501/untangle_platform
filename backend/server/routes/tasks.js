const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const LifestyleGoal = require('../models/Goal');
const auth = require('../middleware/auth');

// Get all tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, startDate, endDate } = req.query;
    const query = { userId: req.user.userId };
    
    if (status) {
      query.completedAt = status === 'completed' ? { $ne: null } : null;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Set end date to end of day (23:59:59.999)
      end.setHours(23, 59, 59, 999);
      
      query.dueDate = {
        $gte: start,
        $lte: end
      };
    }
    
    const tasks = await Task.find(query);
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get task statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user.userId };
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Set end date to end of day (23:59:59.999)
      end.setHours(23, 59, 59, 999);
      
      query.dueDate = {
        $gte: start,
        $lte: end
      };
    }
    
    const total = await Task.countDocuments(query);
    const completed = await Task.countDocuments({ ...query, completedAt: { $ne: null } });
    const pending = total - completed;
    
    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get task by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, task });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, priority, dueDate, goalIds, estimatedDuration, status, completedAt, actualDuration } = req.body;
    
    console.log('Creating task with data:', { title, description, priority, dueDate, goalIds, estimatedDuration, status, completedAt, actualDuration, userId: req.user.userId });
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    
    // Validate goal IDs if provided
    let filteredGoalIds = [];
    if (goalIds && Array.isArray(goalIds) && goalIds.length > 0) {
      // Check if all goal IDs are valid ObjectId format
      const invalidFormatIds = goalIds.filter(id => typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id));
      if (invalidFormatIds.length > 0) {
        return res.status(400).json({ success: false, message: 'Invalid goal ID format' });
      }
      
      // Check if all goal IDs exist and belong to the user
      const validGoals = await LifestyleGoal.find({ _id: { $in: goalIds }, userId: req.user.userId });
      if (validGoals.length !== goalIds.length) {
        return res.status(400).json({ success: false, message: 'Invalid goal IDs' });
      }
      
      filteredGoalIds = goalIds;
    }
    
    const task = new Task({
      userId: req.user.userId,
      title,
      description,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      goalIds: filteredGoalIds,
      estimatedDuration: estimatedDuration || 30,
      status: status || 'pending',
      completedAt: completedAt ? new Date(completedAt) : null,
      actualDuration: actualDuration || null
    });
    
    await task.save();
    console.log('Task saved successfully:', task._id);
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const updates = req.body;
    Object.assign(task, updates);
    
    await task.save();
    res.json({ success: true, task });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete task
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    task.completedAt = new Date();
    await task.save();
    
    res.json({ success: true, task });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// Uncomplete task
router.post('/:id/uncomplete', auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.userId });
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    task.completedAt = null;
    await task.save();
    
    res.json({ success: true, task });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
