import { vi } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import cors from 'cors';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.OPENAI_API_KEY = 'test-key';
process.env.DISABLE_RATE_LIMITING = 'true';
process.env.DISABLE_AUTH = 'true';

// Create test app
const createTestApp = () => {
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  
  // Mock rate limiting middleware (no-op in test)
  const noOpRateLimit = (req, res, next) => next();
  
  // Import routes
  const authRoutes = require('../routes/auth');
  const financeRoutes = require('../routes/finance');
  const journalRoutes = require('../routes/journal');
  const contentRoutes = require('../routes/content');
  const bookDocumentRoutes = require('../routes/bookDocuments');
  const aiChatRoutes = require('../routes/aiChat');
  const goalRoutes = require('../routes/goals');
  const habitRoutes = require('../routes/habits');
  const mindfulnessRoutes = require('../routes/mindfulness');
  const foodRoutes = require('../routes/food');
  const mealsRoutes = require('../routes/meals');
  const devRoutes = require('../routes/dev');
  const aiQuoteAnalysisRoutes = require('../routes/aiQuoteAnalysis');
  const billingRoutes = require('../routes/billing');
  const tasksRoutes = require('../routes/tasks');
  const emailExpenseRoutes = require('../routes/emailExpense');
  const whatsappRoutes = require('../routes/whatsapp');
  
  // Set up routes with no-op rate limiting
  app.use('/api/auth', noOpRateLimit, authRoutes);
  app.use('/api/finance', noOpRateLimit, financeRoutes);
  app.use('/api/journal', noOpRateLimit, journalRoutes);
  app.use('/api/content', noOpRateLimit, contentRoutes);
  app.use('/api/book-documents', noOpRateLimit, bookDocumentRoutes);
  app.use('/api/ai-chat', noOpRateLimit, aiChatRoutes);
  app.use('/api/goals', noOpRateLimit, goalRoutes);
  app.use('/api/habits', noOpRateLimit, habitRoutes);
  app.use('/api/mindfulness', noOpRateLimit, mindfulnessRoutes);
  app.use('/api/food', noOpRateLimit, foodRoutes);
  app.use('/api/meals', noOpRateLimit, mealsRoutes);
  app.use('/api/dev', noOpRateLimit, devRoutes);
  app.use('/api/ai', noOpRateLimit, aiQuoteAnalysisRoutes);
  app.use('/api/billing', noOpRateLimit, billingRoutes);
  app.use('/api/tasks', noOpRateLimit, tasksRoutes);
  app.use('/api/email-expense', noOpRateLimit, emailExpenseRoutes);
  app.use('/api/whatsapp', noOpRateLimit, whatsappRoutes);
  
  // Health check endpoints
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  return app;
};

// Export the test app
export { createTestApp };

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

let mongod;

// Setup in-memory database connection before all tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, {
    maxPoolSize: 10,
  });
});

// Clean up collections after each test
afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map(c => c.deleteMany({})));
});

// Close database connection and stop memory server after all tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});
