const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { securityConfig } = require('../config/security');
const { securityLogger } = require('../config/logger');

class JWTService {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    
    // CRITICAL: Reject fallback secrets in production
    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets not configured. Set JWT_SECRET and JWT_REFRESH_SECRET environment variables.');
    }
    
    // Allow test secrets in test environment
    const isTestEnvironment = process.env.NODE_ENV === 'test';
    
    // Reject weak or default secrets (except in test environment)
    if (!isTestEnvironment) {
      if (this.accessTokenSecret === 'fallback-jwt-secret-for-development-only' ||
          this.accessTokenSecret === 'your-super-secure-jwt-secret-key-here-minimum-64-characters' ||
          this.accessTokenSecret.length < 64) {
        throw new Error('JWT_SECRET is not secure. Generate a secure secret using: openssl rand -hex 64');
      }
      
      if (this.refreshTokenSecret === 'fallback-refresh-secret-for-development-only' ||
          this.refreshTokenSecret === 'your-super-secure-jwt-refresh-secret-key-here-minimum-64-characters' ||
          this.refreshTokenSecret.length < 64) {
        throw new Error('JWT_REFRESH_SECRET is not secure. Generate a secure secret using: openssl rand -hex 64');
      }
    }
    
    if (isTestEnvironment) {
      console.log('✅ JWT secrets configured for testing');
    } else {
      console.log('✅ JWT secrets configured securely');
    }
  }

  // Generate access token
  generateAccessToken(payload) {
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role || 'user',
      iat: Math.floor(Date.now() / 1000),
      iss: securityConfig.jwt.issuer,
      aud: securityConfig.jwt.audience
    };

    return jwt.sign(tokenPayload, this.accessTokenSecret, {
      expiresIn: securityConfig.jwt.accessTokenExpiry,
      algorithm: securityConfig.jwt.algorithm
    });
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    const tokenPayload = {
      userId: payload.userId,
      tokenVersion: payload.tokenVersion || 1,
      iat: Math.floor(Date.now() / 1000),
      iss: securityConfig.jwt.issuer,
      aud: securityConfig.jwt.audience
    };

    return jwt.sign(tokenPayload, this.refreshTokenSecret, {
      expiresIn: securityConfig.jwt.refreshTokenExpiry,
      algorithm: securityConfig.jwt.algorithm
    });
  }

  // Generate token pair
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      expiresIn: securityConfig.jwt.accessTokenExpiry
    };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        algorithms: [securityConfig.jwt.algorithm],
        issuer: securityConfig.jwt.issuer,
        audience: securityConfig.jwt.audience
      });
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        algorithms: [securityConfig.jwt.algorithm],
        issuer: securityConfig.jwt.issuer,
        audience: securityConfig.jwt.audience
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Decode token without verification (for inspection)
  decodeToken(token) {
    return jwt.decode(token, { complete: true });
  }

  // Check if token is expired
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload || !decoded.payload.exp) {
        return true;
      }
      return Date.now() >= decoded.payload.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  // Get token expiration time
  getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.payload || !decoded.payload.exp) {
        return null;
      }
      return new Date(decoded.payload.exp * 1000);
    } catch (error) {
      return null;
    }
  }

  // Generate secure random token for password reset, etc.
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate token hash for storage
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Verify token hash
  verifyTokenHash(token, hash) {
    const tokenHash = this.hashToken(token);
    return crypto.timingSafeEqual(Buffer.from(tokenHash), Buffer.from(hash));
  }
}

// Token blacklist service
class TokenBlacklistService {
  constructor() {
    this.blacklistedTokens = new Set();
  }

  // Add token to blacklist
  blacklistToken(token) {
    const tokenHash = new JWTService().hashToken(token);
    this.blacklistedTokens.add(tokenHash);
  }

  // Check if token is blacklisted
  isTokenBlacklisted(token) {
    const tokenHash = new JWTService().hashToken(token);
    return this.blacklistedTokens.has(tokenHash);
  }

  // Remove token from blacklist (for testing)
  removeFromBlacklist(token) {
    const tokenHash = new JWTService().hashToken(token);
    this.blacklistedTokens.delete(tokenHash);
  }

  // Clear all blacklisted tokens (for testing)
  clearBlacklist() {
    this.blacklistedTokens.clear();
  }
}

// Session management service
class SessionService {
  constructor() {
    this.activeSessions = new Map(); // userId -> Set of sessionIds
  }

  // Create new session
  createSession(userId, sessionId, userAgent, ip) {
    if (!this.activeSessions.has(userId)) {
      this.activeSessions.set(userId, new Set());
    }
    
    this.activeSessions.get(userId).add(sessionId);
    
    securityLogger.logAPIUsage(userId, 'session/create', 'POST', ip, userAgent);
    
    return {
      sessionId,
      userId,
      createdAt: new Date(),
      userAgent,
      ip
    };
  }

  // Remove session
  removeSession(userId, sessionId) {
    if (this.activeSessions.has(userId)) {
      this.activeSessions.get(userId).delete(sessionId);
      if (this.activeSessions.get(userId).size === 0) {
        this.activeSessions.delete(userId);
      }
    }
  }

  // Remove all sessions for user
  removeAllUserSessions(userId) {
    this.activeSessions.delete(userId);
  }

  // Get active sessions for user
  getActiveSessions(userId) {
    return Array.from(this.activeSessions.get(userId) || []);
  }

  // Check if user has too many sessions
  hasTooManySessions(userId) {
    const sessions = this.activeSessions.get(userId);
    return sessions && sessions.size >= securityConfig.session.maxConcurrentSessions;
  }

  // Clean up old sessions (should be called periodically)
  cleanupOldSessions() {
    // This would typically involve checking session timestamps
    // For now, we'll just log the cleanup
    console.log('Cleaning up old sessions...');
  }
}

module.exports = {
  JWTService,
  TokenBlacklistService,
  SessionService
};
