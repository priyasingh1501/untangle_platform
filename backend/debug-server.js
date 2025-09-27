// Debug server to identify startup issues
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5002;

console.log('🔍 DEBUG SERVER STARTING...');
console.log('🔍 Environment check:');
console.log('🔍 NODE_ENV:', process.env.NODE_ENV);
console.log('🔍 PORT:', PORT);
console.log('🔍 MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('🔍 MONGODB_URI length:', process.env.MONGODB_URI?.length || 0);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Debug server is running',
    timestamp: new Date().toISOString(),
    port: PORT,
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
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI?.length || 0,
    mongoUriPreview: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'Not set'
  });
});

// Test MongoDB connection
const connectDB = async () => {
  try {
    console.log('🔍 Attempting MongoDB connection...');
    console.log('🔍 MONGODB_URI preview:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'Not set');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/untangle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('❌ Error details:', err);
  }
};

// Connect to database
connectDB();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Debug server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 MongoDB status: http://localhost:${PORT}/api/mongodb-status`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Debug server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Debug server shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
