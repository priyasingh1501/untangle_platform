const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Expense, Income } = require('../models/Finance');
const ExpenseGoal = require('../models/ExpenseGoal');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all expenses for a user
router.get('/expenses', auth, async (req, res) => {
  try {
    console.log('🔍 Finance route - Fetching expenses for user:', req.user.userId);
    
    const expenses = await Expense.find({ userId: req.user.userId })
      .sort({ date: -1 })
      .limit(100);
    
    console.log('🔍 Found expenses:', expenses.length);
    console.log('🔍 First expense (if any):', expenses[0]);
    
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
});

// Get all income for a user
router.get('/income', auth, async (req, res) => {
  try {
    const income = await Income.find({ userId: req.user.userId })
      .sort({ date: -1 })
      .limit(100);
    
    res.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ message: 'Error fetching income' });
  }
});

// Get financial summary (expenses and income)
router.get('/summary', auth, async (req, res) => {
  try {
    console.log('🔍 Finance route - Fetching summary for user:', req.user.userId);
    
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }
    
    const expenses = await Expense.find({ 
      userId: req.user.userId,
      ...dateFilter
    });
    
    const income = await Income.find({ 
      userId: req.user.userId,
      ...dateFilter
    });
    
    console.log('🔍 Summary - Expenses found:', expenses.length);
    console.log('🔍 Summary - Income found:', income.length);
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);
    
    // Group expenses by category
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});
    
    const summary = {
      totalExpenses,
      totalIncome,
      netAmount: totalIncome - totalExpenses,
      expensesByCategory,
      recentExpenses: expenses.slice(0, 5),
      recentIncome: income.slice(0, 5)
    };
    
    console.log('🔍 Summary response:', summary);
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ message: 'Error fetching financial summary' });
  }
});

// Create a new expense
router.post('/expenses', auth, async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      userId: req.user.userId
    });
    
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({ message: 'Error creating expense', error: error.message });
  }
});

// Create a new income
router.post('/income', auth, async (req, res) => {
  try {
    const income = new Income({
      ...req.body,
      userId: req.user.userId
    });
    
    await income.save();
    res.status(201).json(income);
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(400).json({ message: 'Error creating income', error: error.message });
  }
});

// Update an expense
router.put('/expenses/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(400).json({ message: 'Error updating expense', error: error.message });
  }
});

// Update an income
router.put('/income/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.json(income);
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(400).json({ message: 'Error updating income', error: error.message });
  }
});

// Delete an expense
router.delete('/expenses/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ message: 'Error deleting expense' });
  }
});

// Delete an income
router.delete('/income/:id', auth, async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ message: 'Error deleting income' });
  }
});

// Analyze bill image using OCR
router.post('/analyze-bill', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    console.log('🔍 Analyzing bill image for user:', req.user.userId);
    console.log('🔍 File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Check if OpenAI API key is available
    console.log('🔍 Environment check - OPENAI_API_KEY:', {
      exists: !!process.env.OPENAI_API_KEY,
      length: process.env.OPENAI_API_KEY?.length || 0,
      startsWith: process.env.OPENAI_API_KEY?.substring(0, 10) || 'N/A',
      isSampleKey: process.env.OPENAI_API_KEY === 'SAMPLE_KEY'
    });
    
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'SAMPLE_KEY') {
      console.log('⚠️ OpenAI API key not configured, using fallback OCR');
      
      // Fallback: Return mock data for testing
      const mockResult = {
        amount: Math.floor(Math.random() * 1000) + 100, // Random amount between 100-1100
        description: 'Bill receipt (OCR not available)',
        vendor: 'Store/Company',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        warning: 'OpenAI API key not configured. This is mock data for testing.'
      };
      
      console.log('🔍 Fallback OCR result:', mockResult);
      return res.json(mockResult);
    }

    // Convert image to base64 for OpenAI Vision API
    const base64Image = req.file.buffer.toString('base64');
    
    try {
      // Use OpenAI Vision API to analyze the image
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Updated to current model
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this bill/receipt image and extract the following information in JSON format:
                {
                  "amount": "total amount (number only)",
                  "description": "brief description of what was purchased",
                  "vendor": "store/company name",
                  "category": "expense category (food, transportation, shopping, entertainment, healthcare, utilities, housing, travel, education, other)",
                  "date": "date if visible (YYYY-MM-DD format)"
                }
                
                Focus on finding the total amount, store name, and what was purchased. If any field cannot be determined, use null.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${req.file.mimetype};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const analysisText = response.choices[0].message.content;
      console.log('🔍 OpenAI analysis result:', analysisText);

      // Parse the JSON response
      let extractedData;
      try {
        // Extract JSON from the response (it might be wrapped in markdown)
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        return res.status(500).json({ 
          message: 'Failed to parse analysis result',
          error: 'OCR parsing failed'
        });
      }

      // Validate and clean the extracted data
      const result = {
        amount: extractedData.amount ? parseFloat(extractedData.amount) : null,
        description: extractedData.description || null,
        vendor: extractedData.vendor || null,
        category: extractedData.category || null,
        date: extractedData.date || null
      };

      console.log('🔍 Extracted data:', result);

      // If amount was found, validate it's a reasonable number
      if (result.amount && (result.amount <= 0 || result.amount > 1000000)) {
        result.amount = null;
        result.error = 'Amount seems unreasonable, please verify manually';
      }

      res.json(result);
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Fallback: Return mock data if OpenAI fails
      const fallbackResult = {
        amount: Math.floor(Math.random() * 1000) + 100,
        description: 'Bill receipt (OCR failed)',
        vendor: 'Store/Company',
        category: 'other',
        date: new Date().toISOString().split('T')[0],
        warning: 'OpenAI API failed. This is fallback data.'
      };
      
      console.log('🔍 Fallback OCR result due to OpenAI error:', fallbackResult);
      res.json(fallbackResult);
    }
  } catch (error) {
    console.error('Error analyzing bill image:', error);
    res.status(500).json({ 
      message: 'Error analyzing bill image',
      error: error.message 
    });
  }
});

// ===== EXPENSE GOALS ROUTES =====

// Get all expense goals for a user
router.get('/goals', auth, async (req, res) => {
  try {
    const goals = await ExpenseGoal.find({ userId: req.user.userId, isActive: true })
      .sort({ category: 1 });
    
    res.json(goals);
  } catch (error) {
    console.error('Error fetching expense goals:', error);
    res.status(500).json({ message: 'Error fetching expense goals' });
  }
});

// Create a new expense goal
router.post('/goals', auth, async (req, res) => {
  try {
    const { category, amount, period, notes, color } = req.body;
    
    // Check if goal already exists for this category
    const existingGoal = await ExpenseGoal.findOne({ 
      userId: req.user.userId, 
      category 
    });
    
    if (existingGoal) {
      return res.status(400).json({ 
        message: 'Goal already exists for this category. Use PUT to update instead.' 
      });
    }
    
    const goal = new ExpenseGoal({
      userId: req.user.userId,
      category,
      amount: parseFloat(amount),
      period: period || 'monthly',
      notes,
      color: color || '#1E49C9'
    });
    
    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating expense goal:', error);
    res.status(500).json({ message: 'Error creating expense goal' });
  }
});

// Update an existing expense goal
router.put('/goals/:id', auth, async (req, res) => {
  try {
    const { amount, period, notes, color, isActive } = req.body;
    
    const goal = await ExpenseGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      {
        amount: parseFloat(amount),
        period,
        notes,
        color,
        isActive
      },
      { new: true, runValidators: true }
    );
    
    if (!goal) {
      return res.status(404).json({ message: 'Expense goal not found' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Error updating expense goal:', error);
    res.status(500).json({ message: 'Error updating expense goal' });
  }
});

// Delete an expense goal
router.delete('/goals/:id', auth, async (req, res) => {
  try {
    const goal = await ExpenseGoal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!goal) {
      return res.status(404).json({ message: 'Expense goal not found' });
    }
    
    res.json({ message: 'Expense goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense goal:', error);
    res.status(500).json({ message: 'Error deleting expense goal' });
  }
});

// Bulk update expense goals (for the existing category goals functionality)
router.put('/goals/bulk', auth, async (req, res) => {
  try {
    const { categoryGoals } = req.body;
    
    const operations = Object.entries(categoryGoals).map(([category, amount]) => ({
      updateOne: {
        filter: { userId: req.user.userId, category },
        update: { 
          $set: { 
            amount: parseFloat(amount) || 0,
            period: 'monthly'
          }
        },
        upsert: true
      }
    }));
    
    const result = await ExpenseGoal.bulkWrite(operations);
    
    res.json({ 
      message: 'Goals updated successfully',
      updated: result.modifiedCount,
      upserted: result.upsertedCount
    });
  } catch (error) {
    console.error('Error bulk updating expense goals:', error);
    res.status(500).json({ message: 'Error updating expense goals' });
  }
});

module.exports = router;
