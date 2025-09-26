const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MindfulnessCheckin = require('../models/MindfulnessCheckin');

// Helper function to add mindfulness reflection as a journal entry
async function addMindfulnessReflectionToJournal(userId, title, content, tags) {
  try {
    // Find or create the user's journal
    const Journal = require('../models/Journal');
    let journal = await Journal.findOne({ userId });
    
    if (!journal) {
      journal = new Journal({
        userId,
        entries: []
      });
      await journal.save();
    }
    
    // Create the journal entry
    const newEntry = {
      title: title.trim(),
      content: content.trim(),
      type: 'reflection',
      mood: 'neutral',
      tags: tags || ['mindfulness', 'daily-reflection'],
      isPrivate: true
    };
    
    // Add entry to the beginning of the journal
    journal.entries.unshift(newEntry);
    await journal.save();
    
    // Get the newly created entry (it will be at index 0)
    const createdEntry = journal.entries[0];
    
    console.log('📝 Added mindfulness reflection to journal:', journal._id);
    console.log('📝 Entry title:', title);
    console.log('📝 Entry content preview:', content.substring(0, 100) + '...');
    
    return createdEntry;
  } catch (error) {
    console.error('❌ Error adding mindfulness reflection to journal:', error);
    throw error;
  }
}

// Get all mindfulness check-ins for a user
router.get('/', auth, async (req, res) => {
  try {
    console.log('🔍 GET /api/mindfulness - User ID:', req.user.userId);
    console.log('🔍 GET /api/mindfulness - User object:', req.user);
    
    const { date, startDate, endDate, limit } = req.query;
    
    // Fix: Use correct user ID field from JWT token
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      console.error('❌ No user ID found in request');
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const query = { userId };
    
    if (date) {
      const checkDate = new Date(date);
      if (isNaN(checkDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      const startOfDay = new Date(checkDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: 'Invalid date range format' });
      }
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      
      query.date = { $gte: start, $lte: end };
    }
    
    let queryOptions = { sort: { date: -1 } };
    if (limit) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum <= 0) {
        return res.status(400).json({ message: 'Invalid limit parameter' });
      }
      queryOptions.limit = limitNum;
    }
    
    console.log('🔍 Mindfulness query:', query);
    console.log('🔍 Mindfulness query options:', queryOptions);
    
    const checkins = await MindfulnessCheckin.find(query, null, queryOptions);
    
    console.log('✅ Found mindfulness checkins:', checkins.length);
    console.log('✅ Sample checkin:', checkins[0]);
    
    // Validate and clean the data before sending
    const validatedCheckins = checkins.map(checkin => {
      const checkinObj = checkin.toObject();
      
      // Ensure date is valid
      if (!checkinObj.date || isNaN(new Date(checkinObj.date).getTime())) {
        console.warn('⚠️ Invalid date in checkin:', checkinObj._id);
        checkinObj.date = new Date();
      }
      
      // Ensure dimensions are valid
      if (!checkinObj.dimensions) {
        console.warn('⚠️ Missing dimensions in checkin:', checkinObj._id);
        checkinObj.dimensions = {
          presence: { rating: 0 },
          emotionAwareness: { rating: 0 },
          intentionality: { rating: 0 },
          attentionQuality: { rating: 0 },
          compassion: { rating: 0 }
        };
      }
      
      // Ensure totalScore is valid
      if (typeof checkinObj.totalScore !== 'number' || isNaN(checkinObj.totalScore)) {
        console.warn('⚠️ Invalid totalScore in checkin:', checkinObj._id);
        checkinObj.totalScore = 0;
      }
      
      return checkinObj;
    });
    
    res.json(validatedCheckins);
  } catch (error) {
    console.error('❌ Error fetching mindfulness check-ins:', error);
    res.status(500).json({ message: 'Error fetching mindfulness check-ins' });
  }
});

// Get mindfulness check-in for a specific date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const checkDate = new Date(date);
    if (isNaN(checkDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const checkin = await MindfulnessCheckin.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (!checkin) {
      return res.status(404).json({ message: 'No mindfulness check-in found for this date' });
    }
    
    res.json(checkin);
  } catch (error) {
    console.error('Error fetching mindfulness check-in for date:', error);
    res.status(500).json({ message: 'Error fetching mindfulness check-in' });
  }
});

// Get mindfulness statistics for a date range
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    const checkins = await MindfulnessCheckin.find({
      userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    if (checkins.length === 0) {
      return res.json({
        totalCheckins: 0,
        averageScore: 0,
        scoreTrend: [],
        dimensionAverages: {},
        overallAssessment: 'beginner'
      });
    }
    
    // Calculate statistics
    const totalCheckins = checkins.length;
    const totalScore = checkins.reduce((sum, checkin) => sum + (checkin.totalScore || 0), 0);
    const averageScore = totalScore / totalCheckins;
    
    // Score trend over time
    const scoreTrend = checkins.map(checkin => ({
      date: checkin.date,
      score: checkin.totalScore || 0
    }));
    
    // Dimension averages
    const dimensionTotals = {
      presence: 0,
      emotionAwareness: 0,
      intentionality: 0,
      attentionQuality: 0,
      compassion: 0
    };
    
    checkins.forEach(checkin => {
      if (checkin.dimensions) {
        dimensionTotals.presence += checkin.dimensions.presence?.rating || 0;
        dimensionTotals.emotionAwareness += checkin.dimensions.emotionAwareness?.rating || 0;
        dimensionTotals.intentionality += checkin.dimensions.intentionality?.rating || 0;
        dimensionTotals.attentionQuality += checkin.dimensions.attentionQuality?.rating || 0;
        dimensionTotals.compassion += checkin.dimensions.compassion?.rating || 0;
      }
    });
    
    const dimensionAverages = {};
    Object.keys(dimensionTotals).forEach(dimension => {
      dimensionAverages[dimension] = dimensionTotals[dimension] / totalCheckins;
    });
    
    // Most recent overall assessment
    const latestCheckin = checkins[0];
    
    res.json({
      totalCheckins,
      averageScore: Math.round(averageScore * 100) / 100,
      scoreTrend,
      dimensionAverages,
      overallAssessment: latestCheckin.overallAssessment || 'beginner'
    });
    
  } catch (error) {
    console.error('Error fetching mindfulness statistics:', error);
    res.status(500).json({ message: 'Error fetching mindfulness statistics' });
  }
});

// Create a new mindfulness check-in
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const {
      date: customDate,
      dimensions,
      totalScore,
      overallAssessment,
      dailyNotes,
      dayReflection
    } = req.body;
    
    // Validate dimensions
    if (!dimensions || typeof dimensions !== 'object') {
      return res.status(400).json({ message: 'Dimensions are required' });
    }
    
    const requiredDimensions = ['presence', 'emotionAwareness', 'intentionality', 'attentionQuality', 'compassion'];
    for (const dim of requiredDimensions) {
      if (!dimensions[dim] || typeof dimensions[dim].rating !== 'number' || 
          dimensions[dim].rating < 1 || dimensions[dim].rating > 5) {
        return res.status(400).json({ 
          message: `Invalid rating for ${dim}. Must be a number between 1-5.` 
        });
      }
    }
    
    // Use custom date if provided, otherwise use today
    const checkinDate = customDate ? new Date(customDate) : new Date();
    
    if (isNaN(checkinDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    const startOfDay = new Date(checkinDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(checkinDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingCheckin = await MindfulnessCheckin.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    if (existingCheckin) {
      // Update existing check-in instead of creating new one
      console.log('Updating existing check-in for today:', existingCheckin._id);
      
      const updatedCheckin = await MindfulnessCheckin.findOneAndUpdate(
        { _id: existingCheckin._id, userId },
        { dimensions, totalScore, overallAssessment, dailyNotes, dayReflection },
        { new: true, runValidators: true }
      );
      
      // Create journal entry for day reflection if provided
      const journalEntries = [];
      
      if (dayReflection && dayReflection.trim()) {
        console.log('📝 Adding mindfulness reflection to journal:', dayReflection);
        
        const reflectionNote = await addMindfulnessReflectionToJournal(
          userId,
          `Daily Reflection - ${checkinDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`,
          dayReflection,
          ['mindfulness', 'daily-reflection', 'journal']
        );
        
        console.log('📝 Reflection entry added to journal:', reflectionNote._id);
        
        journalEntries.push({
          entryId: reflectionNote._id,
          type: 'day_reflection',
          dimension: 'general'
        });
      } else {
        console.log('📝 No day reflection provided, skipping journal entry creation');
      }
      
      // Update check-in with journal entry references
      updatedCheckin.journalEntries = journalEntries;
      await updatedCheckin.save();
      
      return res.json({
        message: 'Mindfulness check-in updated successfully',
        checkin: updatedCheckin,
        journalEntriesCreated: journalEntries.length,
        wasUpdate: true
      });
    }
    
    // Create the check-in
    const checkin = new MindfulnessCheckin({
      userId,
      date: checkinDate,
      dimensions,
      totalScore,
      overallAssessment,
      dailyNotes,
      dayReflection
    });
    
    await checkin.save();
    
    // Create journal entry for day reflection
    const journalEntries = [];
    
    if (dayReflection && dayReflection.trim()) {
      console.log('📝 Adding mindfulness reflection to journal (create):', dayReflection);
      
      const reflectionNote = await addMindfulnessReflectionToJournal(
        userId,
        `Daily Reflection - ${checkinDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`,
        dayReflection,
        ['mindfulness', 'daily-reflection', 'journal']
      );
      
      console.log('📝 Reflection entry added to journal (create):', reflectionNote._id);
      
      journalEntries.push({
        entryId: reflectionNote._id,
        type: 'day_reflection',
        dimension: 'general'
      });
    } else {
      console.log('📝 No day reflection provided for create, skipping journal entry creation');
    }
    
    // Update check-in with journal entry references
    checkin.journalEntries = journalEntries;
    await checkin.save();
    
    res.status(201).json({
      message: 'Mindfulness check-in created successfully',
      checkin,
      journalEntriesCreated: journalEntries.length
    });
    
  } catch (error) {
    console.error('Error creating mindfulness check-in:', error);
    res.status(500).json({ message: 'Error creating mindfulness check-in' });
  }
});

// Update a mindfulness check-in
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const { dimensions, totalScore, overallAssessment, dailyNotes, dayReflection } = req.body;
    
    const checkin = await MindfulnessCheckin.findOneAndUpdate(
      { _id: req.params.id, userId },
      { dimensions, totalScore, overallAssessment, dailyNotes, dayReflection },
      { new: true, runValidators: true }
    );
    
    if (!checkin) {
      return res.status(404).json({ message: 'Mindfulness check-in not found' });
    }
    
    res.json({
      message: 'Mindfulness check-in updated successfully',
      checkin
    });
    
  } catch (error) {
    console.error('Error updating mindfulness check-in:', error);
    res.status(500).json({ message: 'Error updating mindfulness check-in' });
  }
});

// Delete a mindfulness check-in
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User ID not found in token' });
    }
    
    const checkin = await MindfulnessCheckin.findOneAndDelete({
      _id: req.params.id,
      userId
    });
    
    if (!checkin) {
      return res.status(404).json({ message: 'Mindfulness check-in not found' });
    }
    
    // Note: Journal entries are now stored as notes in the user's journal book
    // They will remain even if the mindfulness check-in is deleted
    console.log('📝 Mindfulness check-in deleted. Journal notes remain in user\'s journal book.');
    
    res.json({ message: 'Mindfulness check-in deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting mindfulness check-in:', error);
    res.status(500).json({ message: 'Error deleting mindfulness check-in' });
  }
});

module.exports = router;
