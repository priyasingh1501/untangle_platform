const { JWTService, TokenBlacklistService, SessionService } = require('../services/jwtService');
const { securityLogger } = require('../config/logger');
const User = require('../models/User');

// Initialize services
const jwtService = new JWTService();
const tokenBlacklist = new TokenBlacklistService();
const sessionService = new SessionService();

// Enhanced authentication middleware
const auth = async (req, res, next) => {
  try {
    // Only skip authentication in test environment with explicit test flag
    if (process.env.NODE_ENV === 'test' && process.env.TEST_MODE === 'true') {
      // Set a mock user for tests - use a consistent ObjectId format
      req.user = { _id: '507f1f77bcf86cd799439011', email: 'test@example.com' };
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        message: 'No token, authorization denied',
        code: 'NO_TOKEN'
      });
    }

    // Check if token is blacklisted
    if (tokenBlacklist.isTokenBlacklisted(token)) {
      securityLogger.logSuspiciousActivity(
        'unknown', 
        'blacklisted_token_usage', 
        { token: token.substring(0, 10) + '...' },
        req.ip
      );
      return res.status(401).json({ 
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    // Verify token
    const decoded = jwtService.verifyAccessToken(token);
    const userId = decoded.userId || decoded.id || decoded._id || decoded.sub;
    
    if (!userId) {
      return res.status(401).json({ 
        message: 'Token missing user identifier',
        code: 'INVALID_TOKEN_PAYLOAD'
      });
    }

    // Check if user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      securityLogger.logSuspiciousActivity(
        userId, 
        'inactive_user_token_usage', 
        { isActive: user?.isActive },
        req.ip
      );
      return res.status(401).json({ 
        message: 'User not found or inactive',
        code: 'USER_INACTIVE'
      });
    }

    // Check if user account is locked
    if (user.isLocked) {
      securityLogger.logSuspiciousActivity(
        userId, 
        'locked_account_access_attempt', 
        { lockedUntil: user.lockedUntil },
        req.ip
      );
      return res.status(423).json({ 
        message: 'Account is temporarily locked',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil
      });
    }

    // Check if user needs to change password
    if (user.mustChangePassword) {
      return res.status(403).json({ 
        message: 'Password change required',
        code: 'PASSWORD_CHANGE_REQUIRED'
      });
    }

    // Log successful authentication
    securityLogger.logAPIUsage(userId, req.path, req.method, req.ip, req.get('User-Agent'));

    // Attach user info to request
    req.user = {
      ...decoded,
      userId,
      id: userId,
      email: user.email,
      role: user.role || 'user'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    securityLogger.logSuspiciousActivity(
      'unknown', 
      'auth_middleware_error', 
      { error: error.message },
      req.ip
    );
    res.status(401).json({ 
      message: 'Token is not valid',
      code: 'INVALID_TOKEN'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return next();
    }

    if (tokenBlacklist.isTokenBlacklisted(token)) {
      return next();
    }

    const decoded = jwtService.verifyAccessToken(token);
    const userId = decoded.userId || decoded.id || decoded._id || decoded.sub;
    
    if (userId) {
      const user = await User.findById(userId);
      if (user && user.isActive && !user.isLocked) {
        req.user = {
          ...decoded,
          userId,
          id: userId,
          email: user.email,
          role: user.role || 'user'
        };
      }
    }

    next();
  } catch (error) {
    // Don't fail for optional auth
    next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role || 'user';
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      securityLogger.logSuspiciousActivity(
        req.user.userId, 
        'unauthorized_role_access', 
        { userRole, requiredRoles: allowedRoles, endpoint: req.path },
        req.ip
      );
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

// Admin only middleware
const requireAdmin = requireRole(['admin', 'superadmin']);

// Check if user can access resource
const requireResourceAccess = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceId = req.params.id || req.params.userId;
    const userId = req.user.userId;

    // Admin can access any resource
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      return next();
    }

    // User can only access their own resources
    if (resourceId && resourceId !== userId) {
      securityLogger.logSuspiciousActivity(
        userId, 
        'unauthorized_resource_access', 
        { resourceType, resourceId, requestedBy: userId },
        req.ip
      );
      return res.status(403).json({ 
        message: 'Access denied to this resource',
        code: 'RESOURCE_ACCESS_DENIED'
      });
    }

    next();
  };
};

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
  // Skip rate limiting in test environment
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMITING === 'true') {
    return next();
  }

  const ip = req.ip;
  const key = `auth_${ip}`;
  
  // This would typically use Redis or similar for production
  // For now, we'll use a simple in-memory store
  if (!global.authAttempts) {
    global.authAttempts = new Map();
  }

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = process.env.NODE_ENV === 'development' ? 50 : 5; // More permissive in development

  if (!global.authAttempts.has(key)) {
    global.authAttempts.set(key, { count: 1, firstAttempt: now });
    return next();
  }

  const attempts = global.authAttempts.get(key);
  
  if (now - attempts.firstAttempt > windowMs) {
    // Reset window
    global.authAttempts.set(key, { count: 1, firstAttempt: now });
    return next();
  }

  if (attempts.count >= maxAttempts) {
    securityLogger.logAccountLockout('unknown', ip, 'rate_limit_exceeded');
    return res.status(429).json({ 
      message: 'Too many attempts. Please wait a few minutes before trying again.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil((attempts.firstAttempt + windowMs - now) / 1000)
    });
  }

  attempts.count++;
  next();
};

// Session management middleware
const sessionAuth = async (req, res, next) => {
  try {
    const sessionId = req.header('X-Session-ID');
    if (!sessionId) {
      return res.status(401).json({ 
        message: 'Session ID required',
        code: 'SESSION_REQUIRED'
      });
    }

    // In a real implementation, you'd validate the session against a database
    // For now, we'll just check if it exists in our session service
    const userId = req.user?.userId;
    if (userId && !sessionService.getActiveSessions(userId).includes(sessionId)) {
      return res.status(401).json({ 
        message: 'Invalid session',
        code: 'INVALID_SESSION'
      });
    }

    next();
  } catch (error) {
    console.error('Session auth error:', error);
    res.status(401).json({ 
      message: 'Session validation failed',
      code: 'SESSION_VALIDATION_FAILED'
    });
  }
};

module.exports = {
  auth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireResourceAccess,
  authRateLimit,
  sessionAuth,
  jwtService,
  tokenBlacklist,
  sessionService
};