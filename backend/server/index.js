// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from project root directory
console.log('🔍 Loading .env from project root directory');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finance');
const journalRoutes = require('./routes/journal');
const contentRoutes = require('./routes/content');
const bookDocumentRoutes = require('./routes/bookDocuments');
const aiChatRoutes = require('./routes/aiChat');
const goalRoutes = require('./routes/goals');
const habitRoutes = require('./routes/habits');
const mindfulnessRoutes = require('./routes/mindfulness');
const foodRoutes = require('./routes/food');
const mealsRoutes = require('./routes/meals');
const devRoutes = require('./routes/dev');
const aiQuoteAnalysisRoutes = require('./routes/aiQuoteAnalysis');
const billingRoutes = require('./routes/billing');
const tasksRoutes = require('./routes/tasks');
const emailExpenseRoutes = require('./routes/emailExpense');
const whatsappRoutes = require('./routes/whatsapp');

// Debug environment variable loading
console.log('🔍 Environment check on startup:');
console.log('🔍 Current working directory:', process.cwd());
console.log('🔍 .env file path:', path.resolve('../.env'));
console.log('🔍 OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('🔍 OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
console.log('🔍 USDA_API_KEY exists:', !!process.env.USDA_API_KEY);
console.log('🔍 USDA_API_KEY length:', process.env.USDA_API_KEY?.length || 0);
console.log('🔍 PORT:', process.env.PORT);
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 COMMIT (Railway):', process.env.RAILWAY_GIT_COMMIT_SHA || 'n/a');
console.log('🔍 COMMIT (Vercel):', process.env.VERCEL_GIT_COMMIT_SHA || 'n/a');
console.log('🔍 DEPLOY TRIGGER:', new Date().toISOString());
console.log('🔍 FORCE REBUILD:', 'AUTHENTICATION SERVER DEPLOYMENT - ' + Math.random().toString(36).substr(2, 9));

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
// Configure CORS to allow Vercel frontend and local development
const envOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...envOrigins,
  'https://untangle-six.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Relaxed CORS: reflect request origin and succeed on preflight
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins for now to fix CORS issues
    callback(null, true);
  },
  credentials: false,
  optionsSuccessStatus: 204,
};
console.log('🔍 CORS mode: allow-all origins via callback');

app.use(cors(corsOptions));

// Global OPTIONS short-circuit to guarantee preflight success
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin, Access-Control-Request-Headers');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers') || 'content-type,authorization');
    // If using cookies, uncomment:
    // res.header('Access-Control-Allow-Credentials', 'true');

    return res.sendStatus(204);
  }
  next();
});

// Handle preflight requests using same options
app.options('*', cors(corsOptions));

// Explicit preflight for login to guarantee headers
app.options('/api/auth/login', (req, res) => {
  const reqOrigin = req.headers.origin;
  if (reqOrigin) {
    res.header('Access-Control-Allow-Origin', reqOrigin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers') || 'content-type,authorization');
  return res.sendStatus(204);
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
const connectDB = async () => {
  try {
    console.log('🔍 Attempting to connect to MongoDB...');
    console.log('🔍 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('🔍 MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/untangle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('❌ MongoDB error details:', err);
    // Don't exit the process, let the health check handle it
    console.log('⚠️ Continuing without MongoDB connection...');
  }
};

// Connect to database
connectDB();

// Add a startup delay to ensure everything is ready
let serverReady = false;
setTimeout(() => {
  serverReady = true;
  console.log('✅ Server is fully ready for health checks');
}, 5000);

// Routes
// Route-scoped CORS for auth to guarantee preflight success on prod
const authCors = cors({ origin: true, credentials: false, optionsSuccessStatus: 204 });
app.options('/api/auth/*', authCors);
app.use('/api/auth', authCors, authRoutes);

// Root health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
app.use('/api/finance', financeRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/book-documents', bookDocumentRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/mindfulness', mindfulnessRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/meals', mealsRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/ai', aiQuoteAnalysisRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/email-expense', emailExpenseRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers') || 'content-type,authorization');
  // If using cookies, uncomment the next line
  // res.header('Access-Control-Allow-Credentials', 'true');
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong!' });
});

// Test endpoint to verify full server is running
app.get('/api/server-test', (req, res) => {
  res.json({ 
    message: 'Full server with authentication is running!',
    timestamp: new Date().toISOString(),
    hasAuth: true,
    hasFinance: true,
    hasEmailExpense: true,
    mongodbConnected: mongoose.connection.readyState === 1,
    mongodbState: mongoose.connection.readyState
  });
});

// MongoDB status endpoint
app.get('/api/mongodb-status', (req, res) => {
  res.json({
    connected: mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
    stateText: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    name: mongoose.connection.name,
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI?.length || 0
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Full server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check available at: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🔗 Server test available at: http://0.0.0.0:${PORT}/api/server-test`);
});
