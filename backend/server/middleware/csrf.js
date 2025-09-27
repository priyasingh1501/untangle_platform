const crypto = require('crypto');
const { securityLogger } = require('../config/logger');

class CSRFProtection {
  constructor() {
    this.secret = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
    this.tokenLength = 32;
    this.tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.tokens = new Map(); // In production, use Redis
  }

  // Generate CSRF token
  generateToken(sessionId) {
    const token = crypto.randomBytes(this.tokenLength).toString('hex');
    const expiresAt = Date.now() + this.tokenExpiry;
    
    this.tokens.set(token, {
      sessionId,
      expiresAt,
      createdAt: Date.now()
    });

    return token;
  }

  // Verify CSRF token
  verifyToken(token, sessionId) {
    if (!token || !sessionId) {
      return false;
    }

    const tokenData = this.tokens.get(token);
    if (!tokenData) {
      return false;
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return false;
    }

    // Check if token belongs to the session
    if (tokenData.sessionId !== sessionId) {
      securityLogger.logSuspiciousActivity(
        'unknown',
        'csrf_token_session_mismatch',
        { 
          token: token.substring(0, 8) + '...',
          expectedSession: sessionId,
          actualSession: tokenData.sessionId
        },
        'unknown'
      );
      return false;
    }

    return true;
  }

  // Revoke token
  revokeToken(token) {
    this.tokens.delete(token);
  }

  // Revoke all tokens for a session
  revokeSessionTokens(sessionId) {
    for (const [token, data] of this.tokens.entries()) {
      if (data.sessionId === sessionId) {
        this.tokens.delete(token);
      }
    }
  }

  // Clean up expired tokens
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }

  // Get token info (for debugging)
  getTokenInfo(token) {
    return this.tokens.get(token);
  }
}

const csrfProtection = new CSRFProtection();

// Clean up expired tokens every hour
setInterval(() => {
  csrfProtection.cleanupExpiredTokens();
}, 60 * 60 * 1000);

// CSRF middleware
const csrfMiddleware = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for API routes that don't need it (like webhooks)
  const skipPaths = [
    '/api/whatsapp/webhook',
    '/api/email-expense/webhook',
    '/api/billing/webhook'
  ];

  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Get session ID from request
  const sessionId = req.header('X-Session-ID') || req.sessionID;
  if (!sessionId) {
    return res.status(400).json({
      message: 'Session ID required for CSRF protection',
      code: 'SESSION_ID_REQUIRED'
    });
  }

  // Get CSRF token from header or body
  const csrfToken = req.header('X-CSRF-Token') || req.body._csrf;
  if (!csrfToken) {
    return res.status(400).json({
      message: 'CSRF token required',
      code: 'CSRF_TOKEN_REQUIRED'
    });
  }

  // Verify CSRF token
  if (!csrfProtection.verifyToken(csrfToken, sessionId)) {
    securityLogger.logSuspiciousActivity(
      req.user?.userId || 'anonymous',
      'csrf_token_verification_failed',
      { 
        token: csrfToken.substring(0, 8) + '...',
        sessionId,
        path: req.path,
        method: req.method
      },
      req.ip
    );

    return res.status(403).json({
      message: 'Invalid CSRF token',
      code: 'INVALID_CSRF_TOKEN'
    });
  }

  next();
};

// Generate CSRF token endpoint
const generateCSRFToken = (req, res) => {
  try {
    const sessionId = req.header('X-Session-ID') || req.sessionID;
    if (!sessionId) {
      return res.status(400).json({
        message: 'Session ID required',
        code: 'SESSION_ID_REQUIRED'
      });
    }

    const token = csrfProtection.generateToken(sessionId);
    
    res.json({
      csrfToken: token,
      expiresIn: csrfProtection.tokenExpiry
    });
  } catch (error) {
    console.error('CSRF token generation error:', error);
    res.status(500).json({
      message: 'Failed to generate CSRF token',
      code: 'CSRF_TOKEN_GENERATION_FAILED'
    });
  }
};

// Verify CSRF token endpoint
const verifyCSRFToken = (req, res) => {
  try {
    const { token } = req.body;
    const sessionId = req.header('X-Session-ID') || req.sessionID;

    if (!token || !sessionId) {
      return res.status(400).json({
        message: 'Token and session ID required',
        code: 'MISSING_FIELDS'
      });
    }

    const isValid = csrfProtection.verifyToken(token, sessionId);
    
    res.json({
      valid: isValid,
      message: isValid ? 'Token is valid' : 'Token is invalid or expired'
    });
  } catch (error) {
    console.error('CSRF token verification error:', error);
    res.status(500).json({
      message: 'Failed to verify CSRF token',
      code: 'CSRF_TOKEN_VERIFICATION_FAILED'
    });
  }
};

// Revoke CSRF token endpoint
const revokeCSRFToken = (req, res) => {
  try {
    const { token } = req.body;
    const sessionId = req.header('X-Session-ID') || req.sessionID;

    if (token) {
      csrfProtection.revokeToken(token);
    } else if (sessionId) {
      csrfProtection.revokeSessionTokens(sessionId);
    } else {
      return res.status(400).json({
        message: 'Token or session ID required',
        code: 'MISSING_FIELDS'
      });
    }

    res.json({
      message: 'CSRF token(s) revoked successfully'
    });
  } catch (error) {
    console.error('CSRF token revocation error:', error);
    res.status(500).json({
      message: 'Failed to revoke CSRF token',
      code: 'CSRF_TOKEN_REVOCATION_FAILED'
    });
  }
};

module.exports = {
  csrfMiddleware,
  generateCSRFToken,
  verifyCSRFToken,
  revokeCSRFToken,
  csrfProtection
};
