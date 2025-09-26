const express = require('express');
const ContentCollection = require('../models/Content');
const router = express.Router();

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
    const User = require('../models/User');
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Get user's content collections
router.get('/collections', authenticateToken, async (req, res) => {
  try {
    const collections = await ContentCollection.find({ userId: req.user._id });
    res.json(collections);
  } catch (error) {
    console.error('Error fetching content collections:', error);
    res.status(500).json({ message: 'Error fetching content collections' });
  }
});

// Create new content collection
router.post('/collections', authenticateToken, async (req, res) => {
  try {
    const { name, description, type, isPublic } = req.body;
    
    const collection = new ContentCollection({
      userId: req.user._id,
      name,
      description,
      type: type || 'wishlist',
      isPublic: isPublic || false
    });
    
    await collection.save();
    
    res.status(201).json({
      message: 'Content collection created successfully',
      collection
    });
  } catch (error) {
    console.error('Error creating content collection:', error);
    res.status(500).json({ message: 'Error creating content collection' });
  }
});

// Get content collection by ID
router.get('/collections/:collectionId', authenticateToken, async (req, res) => {
  try {
    const { collectionId } = req.params;
    
    const collection = await ContentCollection.findOne({
      _id: collectionId,
      userId: req.user._id
    });
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    res.json(collection);
  } catch (error) {
    console.error('Error fetching content collection:', error);
    res.status(500).json({ message: 'Error fetching content collection' });
  }
});

// Update content collection
router.put('/collections/:collectionId', authenticateToken, async (req, res) => {
  try {
    const { collectionId } = req.params;
    const updates = req.body;
    
    const collection = await ContentCollection.findOneAndUpdate(
      { _id: collectionId, userId: req.user._id },
      updates,
      { new: true }
    );
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    res.json({
      message: 'Collection updated successfully',
      collection
    });
  } catch (error) {
    console.error('Error updating content collection:', error);
    res.status(500).json({ message: 'Error updating content collection' });
  }
});

// Delete content collection
router.delete('/collections/:collectionId', authenticateToken, async (req, res) => {
  try {
    const { collectionId } = req.params;
    
    const collection = await ContentCollection.findOneAndDelete({
      _id: collectionId,
      userId: req.user._id
    });
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    res.json({ message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Error deleting content collection:', error);
    res.status(500).json({ message: 'Error deleting content collection' });
  }
});

// Add content item to collection
router.post('/collections/:collectionId/items', authenticateToken, async (req, res) => {
  try {
    const { collectionId } = req.params;
    const itemData = req.body;
    
    const collection = await ContentCollection.findOne({
      _id: collectionId,
      userId: req.user._id
    });
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    collection.items.push(itemData);
    await collection.save();
    
    const newItem = collection.items[collection.items.length - 1];
    
    res.status(201).json({
      message: 'Content item added successfully',
      item: newItem
    });
  } catch (error) {
    console.error('Error adding content item:', error);
    res.status(500).json({ message: 'Error adding content item' });
  }
});

// Update content item
router.put('/collections/:collectionId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { collectionId, itemId } = req.params;
    const updates = req.body;
    
    const collection = await ContentCollection.findOne({
      _id: collectionId,
      userId: req.user._id
    });
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    const itemIndex = collection.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Update item fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'createdAt' && key !== 'updatedAt') {
        collection.items[itemIndex][key] = updates[key];
      }
    });
    
    await collection.save();
    
    res.json({
      message: 'Content item updated successfully',
      item: collection.items[itemIndex]
    });
  } catch (error) {
    console.error('Error updating content item:', error);
    res.status(500).json({ message: 'Error updating content item' });
  }
});

// Delete content item
router.delete('/collections/:collectionId/items/:itemId', authenticateToken, async (req, res) => {
  try {
    const { collectionId, itemId } = req.params;
    
    const collection = await ContentCollection.findOne({
      _id: collectionId,
      userId: req.user._id
    });
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    const itemIndex = collection.items.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    collection.items.splice(itemIndex, 1);
    await collection.save();
    
    res.json({ message: 'Content item deleted successfully' });
  } catch (error) {
    console.error('Error deleting content item:', error);
    res.status(500).json({ message: 'Error deleting content item' });
  }
});

// Get content items with filters
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const { type, category, status, difficulty, timeInvestment, page = 1, limit = 20 } = req.query;
    
    const collections = await ContentCollection.find({ userId: req.user._id });
    
    let allItems = [];
    collections.forEach(collection => {
      allItems = allItems.concat(collection.items);
    });
    
    // Apply filters
    if (type) {
      allItems = allItems.filter(item => item.type === type);
    }
    
    if (category) {
      allItems = allItems.filter(item => item.category === category);
    }
    
    if (status) {
      allItems = allItems.filter(item => item.status === status);
    }
    
    if (difficulty) {
      allItems = allItems.filter(item => item.difficulty === difficulty);
    }
    
    if (timeInvestment) {
      allItems = allItems.filter(item => item.timeInvestment === timeInvestment);
    }
    
    // Sort by creation date (newest first)
    allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedItems = allItems.slice(startIndex, endIndex);
    
    res.json({
      items: paginatedItems,
      total,
      page: parseInt(page),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching content items:', error);
    res.status(500).json({ message: 'Error fetching content items' });
  }
});

// Get content recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { type, category, difficulty, timeInvestment } = req.query;
    
    // This would typically integrate with external APIs (Goodreads, TMDB, etc.)
    // For now, return sample recommendations
    const recommendations = [
      {
        title: "Atomic Habits",
        type: "book",
        category: "self_help",
        author: "James Clear",
        description: "Tiny Changes, Remarkable Results: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        rating: 4.8,
        difficulty: "beginner",
        timeInvestment: "moderate",
        coverImage: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg"
      },
      {
        title: "The Social Network",
        type: "movie",
        category: "business",
        director: "David Fincher",
        year: 2010,
        description: "As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea.",
        rating: 4.2,
        difficulty: "beginner",
        timeInvestment: "quick",
        coverImage: "https://m.media-amazon.com/images/M/MV5BMjAyMDkzMTE5Nl5BMl5BanBnXkFtZTcwNTk1ODc2Mw@@._V1_.jpg"
      },
      {
        title: "How I Built This",
        type: "podcast",
        category: "business",
        author: "Guy Raz",
        description: "Stories behind some of the world's best known companies. How they got started and the moments that defined their success.",
        rating: 4.6,
        difficulty: "beginner",
        timeInvestment: "moderate",
        coverImage: "https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/8c/e3/8b/8ce38b9c-1e26-0c0e-5c09-6e9c637a8aa8/mza_16442781038773487278.jpg/1200x1200bb.jpg"
      }
    ];
    
    // Filter recommendations based on query parameters
    let filteredRecommendations = recommendations;
    
    if (type) {
      filteredRecommendations = filteredRecommendations.filter(item => item.type === type);
    }
    
    if (category) {
      filteredRecommendations = filteredRecommendations.filter(item => item.category === category);
    }
    
    if (difficulty) {
      filteredRecommendations = filteredRecommendations.filter(item => item.difficulty === difficulty);
    }
    
    if (timeInvestment) {
      filteredRecommendations = filteredRecommendations.filter(item => item.timeInvestment === timeInvestment);
    }
    
    res.json({
      recommendations: filteredRecommendations,
      total: filteredRecommendations.length
    });
  } catch (error) {
    console.error('Error fetching content recommendations:', error);
    res.status(500).json({ message: 'Error fetching content recommendations' });
  }
});

// Get content statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const collections = await ContentCollection.find({ userId: req.user._id });
    
    let totalItems = 0;
    let completedItems = 0;
    let totalRating = 0;
    let ratedItems = 0;
    const itemsByType = {};
    const itemsByCategory = {};
    const itemsByStatus = {};
    
    collections.forEach(collection => {
      totalItems += collection.stats.totalItems;
      completedItems += collection.stats.completedItems;
      totalRating += collection.stats.averageRating * collection.stats.totalItems;
      ratedItems += collection.stats.totalItems;
      
      collection.items.forEach(item => {
        // Count by type
        itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
        
        // Count by category
        itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1;
        
        // Count by status
        itemsByStatus[item.status] = (itemsByStatus[item.status] || 0) + 1;
      });
    });
    
    const averageRating = ratedItems > 0 ? Math.round((totalRating / ratedItems) * 10) / 10 : 0;
    
    res.json({
      totalItems,
      completedItems,
      averageRating,
      itemsByType,
      itemsByCategory,
      itemsByStatus,
      completionRate: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching content statistics:', error);
    res.status(500).json({ message: 'Error fetching content statistics' });
  }
});

module.exports = router;
