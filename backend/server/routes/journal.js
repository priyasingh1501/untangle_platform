const express = require('express');
const Journal = require('../models/Journal');
const JournalTrends = require('../models/JournalTrends');
const JournalAnalysisService = require('../services/journalAnalysisService');
const router = express.Router();

const analysisService = new JournalAnalysisService();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const normalizedUserId = decoded.userId || decoded.id || decoded._id || decoded.sub;
    if (!normalizedUserId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    const User = require('../models/User');
    const user = await User.findById(normalizedUserId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Get user's journal
router.get('/', authenticateToken, async (req, res) => {
  try {
    let journal = await Journal.findOne({ userId: req.user._id });
    
    if (!journal) {
      // Create new journal if it doesn't exist
      journal = new Journal({
        userId: req.user._id,
        entries: []
      });
      await journal.save();
    }
    
    res.json(journal);
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ message: 'Error fetching journal' });
  }
});

// Add new journal entry
router.post('/entries', authenticateToken, async (req, res) => {
  try {
    console.log('Creating journal entry for user:', req.user._id);
    console.log('Entry data:', { title: req.body.title, content: req.body.content?.substring(0, 50) + '...' });
    
    const { title, content, type, mood, tags, isPrivate, location, weather } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      console.error('Missing required fields:', { title: !!title, content: !!content });
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    let journal = await Journal.findOne({ userId: req.user._id });
    
    if (!journal) {
      journal = new Journal({
        userId: req.user._id,
        entries: []
      });
    }
    
    const newEntry = {
      title,
      content,
      type: type || 'daily',
      mood: mood || 'neutral',
      tags: tags || [],
      isPrivate: isPrivate !== undefined ? isPrivate : journal.settings.defaultPrivacy === 'private',
      location,
      weather
    };
    
    journal.entries.unshift(newEntry); // Add to beginning
    await journal.save();
    
    // Return success immediately, then analyze in background
    res.status(201).json({
      message: 'Journal entry created successfully',
      entry: journal.entries[0],
      journal
    });
    
    // Analyze the new entry with Alfred in background (non-blocking)
    setImmediate(async () => {
      try {
        console.log('Starting Alfred analysis for entry:', newEntry.title);
        const analysis = await analysisService.analyzeJournalEntry(newEntry.content, newEntry.title);
        console.log('Analysis result:', JSON.stringify(analysis, null, 2));
        
        // Find the entry and update it with analysis
        const updatedJournal = await Journal.findOne({ userId: req.user._id });
        if (updatedJournal) {
          // Find the most recent entry with the same title and content
          // Look for entries created in the last 5 minutes to avoid timing issues
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const entryIndex = updatedJournal.entries.findIndex(entry => 
            entry.title === newEntry.title && 
            entry.content === newEntry.content &&
            new Date(entry.createdAt) > fiveMinutesAgo &&
            (!entry.alfredAnalysis || 
             !entry.alfredAnalysis.emotion || 
             !entry.alfredAnalysis.emotion.primary ||
             entry.alfredAnalysis.insights.length === 0) // Check if analysis is incomplete
          );
          
          if (entryIndex !== -1) {
            updatedJournal.entries[entryIndex].alfredAnalysis = analysis;
            await updatedJournal.save();
            console.log('Alfred analysis completed for entry:', newEntry.title);
          } else {
            console.log('Entry not found for analysis update. Available entries:', updatedJournal.entries.map(e => ({
              title: e.title,
              hasAnalysis: !!e.alfredAnalysis,
              createdAt: e.createdAt
            })));
          }
        }
      } catch (analysisError) {
        console.error('Error analyzing journal entry:', analysisError);
        // Analysis failure doesn't affect the user experience
      }
    });
  } catch (error) {
    console.error('Error creating journal entry:', error);
    res.status(500).json({ message: 'Error creating journal entry' });
  }
});

// Update journal entry
router.put('/entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const { entryId } = req.params;
    const updates = req.body;
    
    const journal = await Journal.findOne({ userId: req.user._id });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    const entryIndex = journal.entries.findIndex(entry => entry._id.toString() === entryId);
    if (entryIndex === -1) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    // Update entry fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        journal.entries[entryIndex][key] = updates[key];
      }
    });
    
    await journal.save();
    
    res.json({
      message: 'Entry updated successfully',
      entry: journal.entries[entryIndex]
    });
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ message: 'Error updating journal entry' });
  }
});

// Delete journal entry
router.delete('/entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const { entryId } = req.params;
    
    const journal = await Journal.findOne({ userId: req.user._id });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    const entryIndex = journal.entries.findIndex(entry => entry._id.toString() === entryId);
    if (entryIndex === -1) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    journal.entries.splice(entryIndex, 1);
    await journal.save();
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ message: 'Error deleting journal entry' });
  }
});

// Get journal entry by ID
router.get('/entries/:entryId', authenticateToken, async (req, res) => {
  try {
    const { entryId } = req.params;
    
    const journal = await Journal.findOne({ userId: req.user._id });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    const entry = journal.entries.find(entry => entry._id.toString() === entryId);
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    res.json(entry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    res.status(500).json({ message: 'Error fetching journal entry' });
  }
});

// Get journal entries with filters
router.get('/entries', authenticateToken, async (req, res) => {
  try {
    const { type, mood, tags, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    const journal = await Journal.findOne({ userId: req.user._id });
    if (!journal) {
      return res.json({ entries: [], total: 0, page: 1, totalPages: 0 });
    }
    
    let filteredEntries = journal.entries;
    
    // Apply filters
    if (type) {
      filteredEntries = filteredEntries.filter(entry => entry.type === type);
    }
    
    if (mood) {
      filteredEntries = filteredEntries.filter(entry => entry.mood === mood);
    }
    
    if (tags && tags.length > 0) {
      filteredEntries = filteredEntries.filter(entry => 
        tags.some(tag => entry.tags.includes(tag))
      );
    }
    
    if (startDate || endDate) {
      filteredEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        if (startDate && entryDate < new Date(startDate)) return false;
        if (endDate && entryDate > new Date(endDate)) return false;
        return true;
      });
    }
    
    // Pagination
    const total = filteredEntries.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);
    
    res.json({
      entries: paginatedEntries,
      total,
      page: parseInt(page),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ message: 'Error fetching journal entries' });
  }
});

// Update journal settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { defaultPrivacy, reminderTime, enableReminders, journalingPrompts } = req.body;
    
    let journal = await Journal.findOne({ userId: req.user._id });
    if (!journal) {
      journal = new Journal({
        userId: req.user._id,
        entries: []
      });
    }
    
    if (defaultPrivacy) journal.settings.defaultPrivacy = defaultPrivacy;
    if (reminderTime) journal.settings.reminderTime = reminderTime;
    if (enableReminders !== undefined) journal.settings.enableReminders = enableReminders;
    if (journalingPrompts !== undefined) journal.settings.journalingPrompts = journalingPrompts;
    
    await journal.save();
    
    res.json({
      message: 'Settings updated successfully',
      settings: journal.settings
    });
  } catch (error) {
    console.error('Error updating journal settings:', error);
    res.status(500).json({ message: 'Error updating journal settings' });
  }
});

// Get journal statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const journal = await Journal.findOne({ userId: req.user._id });
    if (!journal) {
      return res.json({
        totalEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastEntryDate: null,
        entriesByType: {},
        entriesByMood: {},
        monthlyEntries: []
      });
    }
    
    // Calculate additional stats
    const entriesByType = {};
    const entriesByMood = {};
    const monthlyEntries = new Array(12).fill(0);
    
    journal.entries.forEach(entry => {
      // Count by type
      entriesByType[entry.type] = (entriesByType[entry.type] || 0) + 1;
      
      // Count by mood
      entriesByMood[entry.mood] = (entriesByMood[entry.mood] || 0) + 1;
      
      // Count by month
      const month = new Date(entry.createdAt).getMonth();
      monthlyEntries[month]++;
    });
    
    res.json({
      totalEntries: journal.stats.totalEntries,
      currentStreak: journal.stats.currentStreak,
      longestStreak: journal.stats.longestStreak,
      lastEntryDate: journal.stats.lastEntryDate,
      entriesByType,
      entriesByMood,
      monthlyEntries
    });
  } catch (error) {
    console.error('Error fetching journal stats:', error);
    res.status(500).json({ message: 'Error fetching journal statistics' });
  }
});

// Analyze a specific journal entry
router.post('/entries/:entryId/analyze', authenticateToken, async (req, res) => {
  try {
    const { entryId } = req.params;
    
    const journal = await Journal.findOne({ userId: req.user._id });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    const entryIndex = journal.entries.findIndex(entry => entry._id.toString() === entryId);
    if (entryIndex === -1) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    const entry = journal.entries[entryIndex];
    
    // Analyze the entry
    const analysis = await analysisService.analyzeJournalEntry(entry.content, entry.title);
    
    // Update the entry with analysis
    journal.entries[entryIndex].alfredAnalysis = analysis;
    await journal.save();
    
    res.json({
      message: 'Entry analyzed successfully',
      analysis,
      entry: journal.entries[entryIndex]
    });
  } catch (error) {
    console.error('Error analyzing journal entry:', error);
    res.status(500).json({ message: 'Error analyzing journal entry' });
  }
});

// Get trend analysis for user's journal
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, timeRange = 'month' } = req.query;
    const userId = req.user._id;
    
    // Try to get cached trends first
    const cachedTrends = await JournalTrends.getOrCreateTrends(userId, timeRange, parseInt(limit));
    
    if (cachedTrends && !cachedTrends.needsRefresh()) {
      return res.json({
        message: 'Trend analysis retrieved from cache',
        trendAnalysis: cachedTrends.trendAnalysis,
        analyzedEntries: cachedTrends.metadata.analyzedEntries,
        totalEntries: cachedTrends.metadata.totalEntries,
        cached: true,
        lastUpdated: cachedTrends.metadata.lastUpdated
      });
    }
    
    // If no cache or needs refresh, generate new trends
    const journal = await Journal.findOne({ userId });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    // Get recent entries with analysis
    const recentEntries = journal.entries
      .filter(entry => entry.alfredAnalysis)
      .slice(0, parseInt(limit));
    
    if (recentEntries.length === 0) {
      // Store empty trends to avoid repeated API calls
      const emptyTrends = new JournalTrends({
        userId,
        timeRange,
        trendAnalysis: {
          emotionTrend: 'stable',
          commonTopics: [],
          evolvingBeliefs: [],
          summary: 'No entries available for trend analysis.',
          insights: [],
          sentimentTrend: 'stable',
          emotionalRange: {
            min: 1,
            max: 10,
            average: 5
          },
          topicEvolution: [],
          beliefChanges: []
        },
        metadata: {
          analyzedEntries: 0,
          totalEntries: journal.entries.length,
          analysisDate: new Date(),
          lastUpdated: new Date()
        },
        cacheKey: JournalTrends.generateCacheKey(userId, timeRange, parseInt(limit))
      });
      
      await emptyTrends.save();
      
      return res.json({
        message: 'No analyzed entries found',
        trendAnalysis: emptyTrends.trendAnalysis,
        analyzedEntries: 0,
        totalEntries: journal.entries.length,
        cached: false
      });
    }
    
    // Generate trend analysis
    const analyses = recentEntries.map(entry => ({
      _id: entry._id,
      analysis: entry.alfredAnalysis
    }));
    
    const trendAnalysis = await analysisService.generateTrendAnalysis(analyses);
    
    // Store the generated trends
    const newTrends = new JournalTrends({
      userId,
      timeRange,
      trendAnalysis,
      metadata: {
        analyzedEntries: recentEntries.length,
        totalEntries: journal.entries.length,
        analysisDate: new Date(),
        lastUpdated: new Date()
      },
      cacheKey: JournalTrends.generateCacheKey(userId, timeRange, parseInt(limit))
    });
    
    // Remove old trends for this user and timeRange
    await JournalTrends.deleteMany({ 
      userId, 
      timeRange,
      _id: { $ne: newTrends._id }
    });
    
    await newTrends.save();
    
    res.json({
      message: 'Trend analysis completed',
      trendAnalysis,
      analyzedEntries: recentEntries.length,
      totalEntries: journal.entries.length,
      cached: false,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error generating trend analysis:', error);
    res.status(500).json({ message: 'Error generating trend analysis' });
  }
});

// Force refresh trends (bypass cache)
router.post('/trends/refresh', authenticateToken, async (req, res) => {
  try {
    const { timeRange = 'month', limit = 10 } = req.body;
    const userId = req.user._id;
    
    // Delete existing trends for this user and timeRange
    await JournalTrends.deleteMany({ userId, timeRange });
    
    // Get journal entries
    const journal = await Journal.findOne({ userId });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    // Get recent entries with analysis
    const recentEntries = journal.entries
      .filter(entry => entry.alfredAnalysis)
      .slice(0, parseInt(limit));
    
    if (recentEntries.length === 0) {
      return res.json({
        message: 'No analyzed entries found',
        trendAnalysis: {
          sentimentTrend: 'stable',
          commonTopics: [],
          evolvingBeliefs: [],
          summary: 'No entries available for trend analysis.'
        }
      });
    }
    
    // Generate trend analysis
    const analyses = recentEntries.map(entry => ({
      _id: entry._id,
      analysis: entry.alfredAnalysis
    }));
    
    const trendAnalysis = await analysisService.generateTrendAnalysis(analyses);
    
    // Store the new trends
    const newTrends = new JournalTrends({
      userId,
      timeRange,
      trendAnalysis,
      metadata: {
        analyzedEntries: recentEntries.length,
        totalEntries: journal.entries.length,
        analysisDate: new Date(),
        lastUpdated: new Date()
      },
      cacheKey: JournalTrends.generateCacheKey(userId, timeRange, parseInt(limit))
    });
    
    await newTrends.save();
    
    res.json({
      message: 'Trend analysis refreshed',
      trendAnalysis,
      analyzedEntries: recentEntries.length,
      totalEntries: journal.entries.length,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error refreshing trend analysis:', error);
    res.status(500).json({ message: 'Error refreshing trend analysis' });
  }
});

// Analyze all entries without analysis
router.post('/analyze-all', authenticateToken, async (req, res) => {
  try {
    const journal = await Journal.findOne({ userId: req.user._id });
    if (!journal) {
      return res.status(404).json({ message: 'Journal not found' });
    }
    
    // Find entries without analysis
    const unanalyzedEntries = journal.entries.filter(entry => !entry.alfredAnalysis);
    
    if (unanalyzedEntries.length === 0) {
      return res.json({
        message: 'All entries already analyzed',
        analyzedCount: 0
      });
    }
    
    let analyzedCount = 0;
    
    // Analyze each unanalyzed entry
    for (let i = 0; i < unanalyzedEntries.length; i++) {
      const entry = unanalyzedEntries[i];
      const entryIndex = journal.entries.findIndex(e => e._id.toString() === entry._id.toString());
      
      try {
        const analysis = await analysisService.analyzeJournalEntry(entry.content, entry.title);
        journal.entries[entryIndex].alfredAnalysis = analysis;
        analyzedCount++;
        
        // Save periodically to avoid memory issues
        if (i % 5 === 0) {
          await journal.save();
        }
      } catch (analysisError) {
        console.error(`Error analyzing entry ${entry._id}:`, analysisError);
      }
    }
    
    await journal.save();
    
    res.json({
      message: `Analysis completed for ${analyzedCount} entries`,
      analyzedCount,
      totalUnanalyzed: unanalyzedEntries.length
    });
  } catch (error) {
    console.error('Error analyzing all entries:', error);
    res.status(500).json({ message: 'Error analyzing entries' });
  }
});

module.exports = router;
