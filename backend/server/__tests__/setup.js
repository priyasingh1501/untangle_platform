const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import actual routes
const authRoutes = require('../routes/auth');
const financeRoutes = require('../routes/finance');
const tasksRoutes = require('../routes/tasks');
const aiQuoteAnalysisRoutes = require('../routes/aiQuoteAnalysis');
const mealsRoutes = require('../routes/meals');

// Mock the auth middleware for testing
const mockAuthMiddleware = (req, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
};

const createTestApp = () => {
  const app = express();

  // Basic middleware
  app.use(helmet());
  app.use(compression());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);

  // Mount actual routes
  app.use('/api/auth', authRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/ai', aiQuoteAnalysisRoutes);
  app.use('/api/meals', mealsRoutes);

  // Mock auth middleware for other routes
  app.use(mockAuthMiddleware);

  return app;
};

module.exports = { createTestApp };