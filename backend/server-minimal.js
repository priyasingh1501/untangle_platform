// Minimal server with authentication for Railway testing
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Minimal server with auth is running',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Minimal server test endpoint',
    timestamp: new Date().toISOString()
  });
});

// Server test endpoint
app.get('/api/server-test', (req, res) => {
  res.json({ 
    message: 'Minimal server with authentication routes is running!',
    timestamp: new Date().toISOString(),
    hasAuth: true
  });
});

// Simple authentication endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required' 
    });
  }
  
  // Simple mock authentication for testing
  if (email === 'test@example.com' && password === 'test123') {
    res.json({
      success: true,
      message: 'Login successful',
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: '1',
        email: email,
        name: 'Test User'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal server with auth running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Auth test: http://localhost:${PORT}/api/auth/login`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server shutting down gracefully');
  process.exit(0);
});
