const express = require('express');
const BookDocument = require('../models/BookDocument');
const User = require('../models/User');
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

// Get all book documents for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const bookDocuments = await BookDocument.find(query)
      .sort({ updatedAt: -1 })
      .populate('userId', 'firstName lastName');
    
    res.json(bookDocuments);
  } catch (error) {
    console.error('Error fetching book documents:', error);
    res.status(500).json({ message: 'Error fetching book documents' });
  }
});

// Get a specific book document
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const bookDocument = await BookDocument.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('userId', 'firstName lastName');
    
    if (!bookDocument) {
      return res.status(404).json({ message: 'Book document not found' });
    }
    
    res.json(bookDocument);
  } catch (error) {
    console.error('Error fetching book document:', error);
    res.status(500).json({ message: 'Error fetching book document' });
  }
});

// Create a new book document
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      author,
      isbn,
      coverImage,
      description,
      category,
      tags,
      totalPages,
      difficulty,
      language,
      publicationYear,
      publisher
    } = req.body;
    
    const bookDocument = new BookDocument({
      userId: req.user._id,
      title,
      author,
      isbn,
      coverImage,
      description,
      category: category || 'other',
      tags: tags || [],
      totalPages,
      difficulty: difficulty || 'intermediate',
      language: language || 'English',
      publicationYear,
      publisher
    });
    
    await bookDocument.save();
    
    res.status(201).json({
      message: 'Book document created successfully',
      bookDocument
    });
  } catch (error) {
    console.error('Error creating book document:', error);
    res.status(500).json({ message: 'Error creating book document' });
  }
});

// Update a book document
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    
    const bookDocument = await BookDocument.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    
    if (!bookDocument) {
      return res.status(404).json({ message: 'Book document not found' });
    }
    
    res.json({
      message: 'Book document updated successfully',
      bookDocument
    });
  } catch (error) {
    console.error('Error updating book document:', error);
    res.status(500).json({ message: 'Error updating book document' });
  }
});

// Delete a book document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const bookDocument = await BookDocument.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookDocument) {
      return res.status(404).json({ message: 'Book document not found' });
    }
    
    res.json({ message: 'Book document deleted successfully' });
  } catch (error) {
    console.error('Error deleting book document:', error);
    res.status(500).json({ message: 'Error deleting book document' });
  }
});

// Add a note to a book document
router.post('/:id/notes', authenticateToken, async (req, res) => {
  try {
    const { content, location, tags, isImportant, isQuote } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Note content is required' });
    }
    
    const bookDocument = await BookDocument.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookDocument) {
      return res.status(404).json({ message: 'Book document not found' });
    }
    
    const note = {
      content: content.trim(),
      location: location || '',
      tags: tags || [],
      isImportant: isImportant || false,
      isQuote: isQuote || false
    };
    
    bookDocument.notes.push(note);
    await bookDocument.save();
    
    const newNote = bookDocument.notes[bookDocument.notes.length - 1];
    
    res.status(201).json({
      message: 'Note added successfully',
      note: newNote
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Error adding note' });
  }
});

// Update a note
router.put('/:id/notes/:noteId', authenticateToken, async (req, res) => {
  try {
    const { content, location, tags, isImportant, isQuote } = req.body;
    
    const bookDocument = await BookDocument.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookDocument) {
      return res.status(404).json({ message: 'Book document not found' });
    }
    
    const noteIndex = bookDocument.notes.findIndex(
      note => note._id.toString() === req.params.noteId
    );
    
    if (noteIndex === -1) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Update note fields
    if (content !== undefined) bookDocument.notes[noteIndex].content = content;
    if (location !== undefined) bookDocument.notes[noteIndex].location = location;
    if (tags !== undefined) bookDocument.notes[noteIndex].tags = tags;
    if (isImportant !== undefined) bookDocument.notes[noteIndex].isImportant = isImportant;
    if (isQuote !== undefined) bookDocument.notes[noteIndex].isQuote = isQuote;
    
    await bookDocument.save();
    
    res.json({
      message: 'Note updated successfully',
      note: bookDocument.notes[noteIndex]
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Error updating note' });
  }
});

// Delete a note
router.delete('/:id/notes/:noteId', authenticateToken, async (req, res) => {
  try {
    const bookDocument = await BookDocument.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookDocument) {
      return res.status(404).json({ message: 'Book document not found' });
    }
    
    const noteIndex = bookDocument.notes.findIndex(
      note => note._id.toString() === req.params.noteId
    );
    
    if (noteIndex === -1) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    bookDocument.notes.splice(noteIndex, 1);
    await bookDocument.save();
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note' });
  }
});

// Update reading progress
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const { currentPage, totalPages } = req.body;
    
    const bookDocument = await BookDocument.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!bookDocument) {
      return res.status(404).json({ message: 'Book document not found' });
    }
    
    await bookDocument.updateProgress(currentPage, totalPages);
    
    res.json({
      message: 'Progress updated successfully',
      bookDocument
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress' });
  }
});

// Get user's default journal
router.get('/journal/default', authenticateToken, async (req, res) => {
  try {
    let journal = await BookDocument.findOne({
      userId: req.user._id,
      isDefault: true
    });
    
    if (!journal) {
      // Create default journal if it doesn't exist
      journal = new BookDocument({
        userId: req.user._id,
        title: `${req.user.firstName}'s Journal`,
        description: 'Your personal reading and reflection journal',
        category: 'memoir',
        isDefault: true,
        status: 'currently_reading'
      });
      
      await journal.save();
    }
    
    res.json(journal);
  } catch (error) {
    console.error('Error fetching default journal:', error);
    res.status(500).json({ message: 'Error fetching default journal' });
  }
});

// Get all quote notes for dashboard
router.get('/quotes/all', authenticateToken, async (req, res) => {
  try {
    const bookDocuments = await BookDocument.find({ userId: req.user._id });
    
    const allQuotes = [];
    bookDocuments.forEach(book => {
      const quoteNotes = book.notes.filter(note => note.isQuote);
      quoteNotes.forEach(note => {
        allQuotes.push({
          id: note._id,
          content: note.content,
          bookTitle: book.title,
          bookAuthor: book.author,
          location: note.location,
          timestamp: note.timestamp,
          tags: note.tags,
          isImportant: note.isImportant
        });
      });
    });
    
    // Sort by timestamp (newest first)
    allQuotes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(allQuotes);
  } catch (error) {
    console.error('Error fetching quote notes:', error);
    res.status(500).json({ message: 'Error fetching quote notes' });
  }
});

// Get book statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const stats = await BookDocument.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalBooks: { $sum: 1 },
          completedBooks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          currentlyReading: { $sum: { $cond: [{ $eq: ['$status', 'currently_reading'] }, 1, 0] } },
          totalNotes: { $sum: { $size: '$notes' } },
          averageRating: { $avg: '$rating' },
          totalPages: { $sum: '$totalPages' },
          totalReadingTime: { $sum: '$readingTime.actualHours' }
        }
      }
    ]);
    
    const categoryStats = await BookDocument.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    const statusStats = await BookDocument.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      overview: stats[0] || {
        totalBooks: 0,
        completedBooks: 0,
        currentlyReading: 0,
        totalNotes: 0,
        averageRating: 0,
        totalPages: 0,
        totalReadingTime: 0
      },
      categoryStats,
      statusStats
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching book statistics:', error);
    res.status(500).json({ message: 'Error fetching book statistics' });
  }
});

module.exports = router;
