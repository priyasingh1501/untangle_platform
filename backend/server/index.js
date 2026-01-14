// Load environment variables FIRST, before any other imports
const dotenv = require('dotenv');
const path = require('path');
const ServiceFactory = require('./services/serviceFactory');

// Load environment variables from project root directory
console.log('🔍 Loading .env from project root directory');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get facades and config
const ConfigFacade = ServiceFactory.get('ConfigFacade');
const LoggerFacade = ServiceFactory.get('LoggerFacade');
const appConfig = require('./config/appConfig');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');

// Import security configuration
const { securityConfig, validateSecurityConfig } = require('./config/security');
const { logger, securityLogger } = require('./config/logger');
const { 
  generalRateLimit, 
  authRateLimit, 
  passwordResetRateLimit,
  fileUploadRateLimit,
  apiRateLimit,
  searchRateLimit,
  dataExportRateLimit
} = require('./middleware/rateLimiting');
const { sanitizeInput } = require('./middleware/validation');

// Import routes
const authRoutes = require('./routes/auth');
const financeRoutes = require('./routes/finance');
const journalRoutes = require('./routes/journal');
const contentRoutes = require('./routes/content');
const bookDocumentRoutes = require('./routes/bookDocuments');
const aiChatRoutes = require('./routes/aiChat');
const habitRoutes = require('./routes/habits');
const mindfulnessRoutes = require('./routes/mindfulness');
const foodRoutes = require('./routes/food');
const mealsRoutes = require('./routes/meals');
const devRoutes = require('./routes/dev');
const aiQuoteAnalysisRoutes = require('./routes/aiQuoteAnalysis');
const billingRoutes = require('./routes/billing');
const tasksRoutes = require('./routes/tasks');
const emailExpenseRoutes = require('./routes/emailExpense');
const calendarRoutes = require('./routes/calendar');
const whatsappRoutes = require('./routes/whatsapp');
const { loadActiveSessions } = require('./services/whatsappAuthService');

// Validate security configuration
validateSecurityConfig();

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
console.log('🔍 FORCE REBUILD:', 'MONGODB CONNECTION TEST - ' + Math.random().toString(36).substr(2, 9));

const app = express();
const PORT = appConfig.get('app.port');

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// CORS configuration - MUST be before other middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = securityConfig.cors.origin;
    if (Array.isArray(allowedOrigins)) {
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in development
      }
    } else {
      callback(null, true);
    }
  },
  credentials: securityConfig.cors.credentials,
  optionsSuccessStatus: securityConfig.cors.optionsSuccessStatus,
  methods: securityConfig.cors.methods,
  allowedHeaders: [...securityConfig.cors.allowedHeaders, 'X-Session-ID'],
  exposedHeaders: ['Authorization']
};

// Handle OPTIONS requests FIRST, before any other middleware
app.options('*', cors(corsOptions));

// Apply CORS before other middleware
app.use(cors(corsOptions));

// Security middleware (order matters!)
// Configure Helmet to not interfere with CORS
const helmetConfig = {
  ...securityConfig.helmet,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    ...securityConfig.helmet.contentSecurityPolicy,
    directives: {
      ...securityConfig.helmet.contentSecurityPolicy.directives,
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5000", "https:"]
    }
  }
};
app.use(helmet(helmetConfig));
app.use(compression());

// Request logging
app.use((req, res, next) => {
  LoggerFacade.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Body parsing with size limits
app.use(express.json({ 
  limit: securityConfig.api.maxRequestSize,
  verify: (req, res, buf) => {
    // Add raw body for webhook signature verification
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: securityConfig.api.maxRequestSize 
}));

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use(generalRateLimit);

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

// Routes with specific rate limiting
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/finance', apiRateLimit, financeRoutes);
app.use('/api/journal', apiRateLimit, journalRoutes);
app.use('/api/content', apiRateLimit, contentRoutes);
app.use('/api/book-documents', apiRateLimit, bookDocumentRoutes);
app.use('/api/ai-chat', apiRateLimit, aiChatRoutes);
app.use('/api/habits', apiRateLimit, habitRoutes);
app.use('/api/mindfulness', apiRateLimit, mindfulnessRoutes);
app.use('/api/food', apiRateLimit, foodRoutes);
app.use('/api/meals', apiRateLimit, mealsRoutes);
app.use('/api/dev', apiRateLimit, devRoutes);
app.use('/api/ai', apiRateLimit, aiQuoteAnalysisRoutes);
app.use('/api/billing', apiRateLimit, billingRoutes);
app.use('/api/tasks', apiRateLimit, tasksRoutes);
app.use('/api/email-expense', fileUploadRateLimit, emailExpenseRoutes);
app.use('/api/calendar', apiRateLimit, calendarRoutes);
app.use('/api/whatsapp', apiRateLimit, whatsappRoutes);

// Root health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../web/client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../web/client/build', 'index.html'));
  });
}

// Error handling middleware
const { ErrorHandler } = require('./utils/errorHandler');

app.use((err, req, res, next) => {
  const { statusCode, response } = ErrorHandler.handleError(err, req);
  res.status(statusCode).json(response);
});

// Test endpoint to verify full server is running
app.get('/api/server-test', (req, res) => {
  res.json({ 
    message: 'Full server with authentication is running!',
    timestamp: new Date().toISOString(),
    hasAuth: true,
    hasFinance: true,
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

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Full server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check available at: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🔗 Server test available at: http://0.0.0.0:${PORT}/api/server-test`);
  
  // Load active WhatsApp sessions after server starts
  if (mongoose.connection.readyState === 1) {
    await loadActiveSessions();
  } else {
    console.log('⚠️ MongoDB not connected, skipping WhatsApp session loading');
  }
});
