const express = require('express');
const { body } = require('express-validator');
const { validationRules, validate } = require('../middleware/validation');
const { auth, authRateLimit } = require('../middleware/auth');
const { passwordResetRateLimit } = require('../middleware/rateLimiting');
const ServiceFactory = require('../services/serviceFactory');

const router = express.Router();

// Get services through dependency injection
const { User } = ServiceFactory.getModels();
const { TwoFactorService, EncryptionService, GDPRService, JWTService, TokenBlacklistService, SessionService } = ServiceFactory.getServices();
const { securityLogger } = ServiceFactory.getLoggers();
const { crypto } = ServiceFactory.getExternalDeps();

const twoFactorService = ServiceFactory.get('TwoFactorService');
const encryptionService = ServiceFactory.get('EncryptionService');
const gdprService = ServiceFactory.get('GDPRService');
const jwtService = ServiceFactory.get('JWTService');
const tokenBlacklist = ServiceFactory.get('TokenBlacklistService');
const sessionService = ServiceFactory.get('SessionService');

// Register new user
router.post('/register', 
  authRateLimit,
  validate(validationRules.userRegistration),
  async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        securityLogger.logSuspiciousActivity(
          'anonymous',
          'duplicate_registration_attempt',
          { email },
          req.ip
        );
        return res.status(409).json({ 
          message: 'User already exists with this email',
          code: 'USER_EXISTS'
        });
      }

      // Create new user
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        emailVerified: false
      });

      // Generate email verification token
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Log successful registration
      securityLogger.logLoginAttempt(email, req.ip, true, req.get('User-Agent'));

      // Generate tokens
      const tokens = jwtService.generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role
      });

      // Create session
      const sessionId = crypto.randomUUID();
      user.addActiveSession(sessionId, req.get('User-Agent'), req.ip);
      await user.save();

      res.status(201).json({
        message: 'User registered successfully',
        user: user.getProfile(),
        tokens,
        sessionId,
        requiresEmailVerification: true,
        verificationToken // In production, send via email
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.code === 'PASSWORD_REUSE') {
        return res.status(400).json({
          message: 'Cannot reuse recent passwords',
          code: 'PASSWORD_REUSE'
        });
      }

      securityLogger.logSuspiciousActivity(
        'anonymous',
        'registration_error',
        { error: error.message, email: req.body.email },
        req.ip
      );

      res.status(500).json({ 
        message: 'Registration failed',
        code: 'REGISTRATION_FAILED'
      });
    }
  }
);

// Login user
router.post('/login',
  authRateLimit,
  validate(validationRules.userLogin),
  async (req, res) => {
    try {
      const { email, password, rememberMe } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        securityLogger.logFailedLogin(email, req.ip, 'User not found', req.get('User-Agent'));
        return res.status(401).json({ 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is locked
      if (user.isAccountLocked()) {
        securityLogger.logAccountLockout(email, req.ip, 'Account locked');
        return res.status(423).json({ 
          message: 'Account is temporarily locked',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: user.lockedUntil
        });
      }

      // Check if user is active
      if (!user.isActive) {
        securityLogger.logFailedLogin(email, req.ip, 'Account inactive', req.get('User-Agent'));
        return res.status(401).json({ 
          message: 'Account is deactivated',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        user.incrementLoginAttempts();
        user.addFailedLoginAttempt(req.ip, req.get('User-Agent'));
        await user.save();

        securityLogger.logFailedLogin(email, req.ip, 'Invalid password', req.get('User-Agent'));
        return res.status(401).json({ 
          message: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Reset login attempts on successful login
      user.resetLoginAttempts();
      user.lastLogin = new Date();
      await user.save();

      // Check if 2FA is required
      if (user.twoFactorEnabled) {
        // Generate temporary token for 2FA verification
        const tempToken = jwtService.generateAccessToken({
          userId: user._id,
          email: user.email,
          requires2FA: true
        });

        return res.status(200).json({
          message: '2FA required',
          code: '2FA_REQUIRED',
          tempToken,
          requires2FA: true
        });
      }

      // Generate tokens
      const tokens = jwtService.generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role
      });

      // Create session
      const sessionId = crypto.randomUUID();
      user.addActiveSession(sessionId, req.get('User-Agent'), req.ip);
      await user.save();

      securityLogger.logLoginAttempt(email, req.ip, true, req.get('User-Agent'));

      res.json({
        message: 'Login successful',
        user: user.getProfile(),
        tokens,
        sessionId
      });
    } catch (error) {
      console.error('Login error:', error);
      securityLogger.logSuspiciousActivity(
        'anonymous',
        'login_error',
        { error: error.message, email: req.body.email },
        req.ip
      );
      res.status(500).json({ 
        message: 'Login failed',
        code: 'LOGIN_FAILED'
      });
    }
  }
);

// Verify 2FA
router.post('/verify-2fa',
  authRateLimit,
  async (req, res) => {
    try {
      const { token, tempToken } = req.body;

      if (!tempToken) {
        return res.status(400).json({
          message: 'Temporary token required',
          code: 'TEMP_TOKEN_REQUIRED'
        });
      }

      // Verify temp token
      const decoded = jwtService.verifyAccessToken(tempToken);
      if (!decoded.requires2FA) {
        return res.status(400).json({
          message: 'Invalid temporary token',
          code: 'INVALID_TEMP_TOKEN'
        });
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.twoFactorEnabled) {
        return res.status(400).json({
          message: '2FA not enabled for this user',
          code: '2FA_NOT_ENABLED'
        });
      }

      // Verify 2FA token
      const verification = await twoFactorService.verify2FALogin(
        user, 
        token, 
        req.ip, 
        req.get('User-Agent')
      );

      if (!verification.verified) {
        return res.status(401).json({
          message: verification.message,
          code: '2FA_VERIFICATION_FAILED'
        });
      }

      // Generate final tokens
      const tokens = jwtService.generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role
      });

      // Create session
      const sessionId = crypto.randomUUID();
      user.addActiveSession(sessionId, req.get('User-Agent'), req.ip);
      await user.save();

      securityLogger.logLoginAttempt(user.email, req.ip, true, req.get('User-Agent'));

      res.json({
        message: '2FA verification successful',
        user: user.getProfile(),
        tokens,
        sessionId
      });
    } catch (error) {
      console.error('2FA verification error:', error);
      res.status(500).json({
        message: '2FA verification failed',
        code: '2FA_VERIFICATION_FAILED'
      });
    }
  }
);

// Refresh token
router.post('/refresh',
  authRateLimit,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          message: 'Refresh token required',
          code: 'REFRESH_TOKEN_REQUIRED'
        });
      }

      // Verify refresh token
      const decoded = jwtService.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          message: 'Invalid refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Generate new tokens
      const tokens = jwtService.generateTokenPair({
        userId: user._id,
        email: user.email,
        role: user.role
      });

      res.json({
        message: 'Tokens refreshed successfully',
        tokens
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
  }
);

// Logout
router.post('/logout',
  auth,
  async (req, res) => {
    try {
      const { sessionId } = req.body;
      const token = req.header('Authorization')?.replace('Bearer ', '');

      // Blacklist current token
      if (token) {
        tokenBlacklist.blacklistToken(token);
      }

      // Remove session
      if (sessionId && req.user) {
        const user = await User.findById(req.user._id);
        if (user) {
          user.removeActiveSession(sessionId);
          await user.save();
        }
      }

      securityLogger.logAPIUsage(req.user._id, 'logout', 'POST', req.ip, req.get('User-Agent'));

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        message: 'Logout failed',
        code: 'LOGOUT_FAILED'
      });
    }
  }
);

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      user: user.getProfile(),
      securityStatus: user.getSecurityStatus()
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch profile',
      code: 'PROFILE_FETCH_FAILED'
    });
  }
});

// Change password
router.put('/change-password',
  auth,
  validate(validationRules.passwordChange),
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id);

      // Verify current password
      const isValidPassword = await user.comparePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          message: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      securityLogger.logPasswordChange(user._id, req.ip, req.get('User-Agent'));

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change error:', error);
      
      if (error.code === 'PASSWORD_REUSE') {
        return res.status(400).json({
          message: 'Cannot reuse recent passwords',
          code: 'PASSWORD_REUSE'
        });
      }

      res.status(500).json({
        message: 'Password change failed',
        code: 'PASSWORD_CHANGE_FAILED'
      });
    }
  }
);

// Request password reset
router.post('/forgot-password',
  passwordResetRateLimit,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists
        return res.json({
          message: 'If an account with that email exists, a password reset link has been sent'
        });
      }

      // Generate reset token
      const resetToken = user.generatePasswordResetToken();
      await user.save();

      // In production, send email with reset token
      console.log('Password reset token:', resetToken);

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({
        message: 'Password reset request failed',
        code: 'PASSWORD_RESET_FAILED'
      });
    }
  }
);

// Reset password
router.post('/reset-password',
  passwordResetRateLimit,
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          message: 'Token and new password are required',
          code: 'MISSING_FIELDS'
        });
      }

      // Hash the token to compare with stored hash
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          message: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }

      // Update password
      user.password = newPassword;
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save();

      securityLogger.logPasswordChange(user._id, req.ip, req.get('User-Agent'));

      res.json({
        message: 'Password reset successfully'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        message: 'Password reset failed',
        code: 'PASSWORD_RESET_FAILED'
      });
    }
  }
);

// 2FA setup
router.post('/2fa/setup',
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (user.twoFactorEnabled) {
        return res.status(400).json({
          message: '2FA is already enabled',
          code: '2FA_ALREADY_ENABLED'
        });
      }

      // Generate 2FA secret
      const secretData = twoFactorService.generateSecret(user.email);
      const qrCode = await twoFactorService.generateQRCode(secretData.secret, user.email);

      res.json({
        secret: secretData.secret,
        qrCode,
        manualEntryKey: secretData.manualEntryKey
      });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({
        message: '2FA setup failed',
        code: '2FA_SETUP_FAILED'
      });
    }
  }
);

// Enable 2FA
router.post('/2fa/enable',
  auth,
  async (req, res) => {
    try {
      const { secret, token, backupCodes } = req.body;
      const user = await User.findById(req.user._id);

      const result = await twoFactorService.enable2FA(user, secret, token, backupCodes);

      res.json(result);
    } catch (error) {
      console.error('2FA enable error:', error);
      res.status(500).json({
        message: '2FA enable failed',
        code: '2FA_ENABLE_FAILED'
      });
    }
  }
);

// Disable 2FA
router.post('/2fa/disable',
  auth,
  async (req, res) => {
    try {
      const { token } = req.body;
      const user = await User.findById(req.user._id);

      const result = await twoFactorService.disable2FA(user, token);

      res.json(result);
    } catch (error) {
      console.error('2FA disable error:', error);
      res.status(500).json({
        message: '2FA disable failed',
        code: '2FA_DISABLE_FAILED'
      });
    }
  }
);

// Get 2FA status
router.get('/2fa/status',
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      const status = twoFactorService.get2FAStatus(user);

      res.json(status);
    } catch (error) {
      console.error('2FA status error:', error);
      res.status(500).json({
        message: 'Failed to get 2FA status',
        code: '2FA_STATUS_FAILED'
      });
    }
  }
);

// Generate new backup codes
router.post('/2fa/backup-codes',
  auth,
  async (req, res) => {
    try {
      const { token } = req.body;
      const user = await User.findById(req.user._id);

      const result = await twoFactorService.generateNewBackupCodes(user, token);

      res.json(result);
    } catch (error) {
      console.error('Backup codes generation error:', error);
      res.status(500).json({
        message: 'Failed to generate backup codes',
        code: 'BACKUP_CODES_FAILED'
      });
    }
  }
);

// GDPR - Get user data
router.get('/gdpr/data',
  auth,
  async (req, res) => {
    try {
      const userData = await gdprService.getUserData(req.user._id);
      res.json(userData);
    } catch (error) {
      console.error('GDPR data export error:', error);
      res.status(500).json({
        message: 'Failed to export user data',
        code: 'DATA_EXPORT_FAILED'
      });
    }
  }
);

// GDPR - Update consent preferences
router.put('/gdpr/consent',
  auth,
  async (req, res) => {
    try {
      const { preferences } = req.body;
      const result = await gdprService.updateConsentPreferences(req.user._id, preferences);
      res.json(result);
    } catch (error) {
      console.error('GDPR consent update error:', error);
      res.status(500).json({
        message: 'Failed to update consent preferences',
        code: 'CONSENT_UPDATE_FAILED'
      });
    }
  }
);

// GDPR - Request data deletion
router.post('/gdpr/delete',
  auth,
  async (req, res) => {
    try {
      const { reason } = req.body;
      const result = await gdprService.requestDataDeletion(req.user._id, reason);
      res.json(result);
    } catch (error) {
      console.error('GDPR deletion request error:', error);
      res.status(500).json({
        message: 'Failed to request data deletion',
        code: 'DELETION_REQUEST_FAILED'
      });
    }
  }
);

// Get active sessions
router.get('/sessions',
  auth,
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      const sessions = user.activeSessions || [];

      res.json({
        sessions: sessions.map(session => ({
          sessionId: session.sessionId,
          userAgent: session.userAgent,
          ip: session.ip,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        }))
      });
    } catch (error) {
      console.error('Sessions fetch error:', error);
      res.status(500).json({
        message: 'Failed to fetch sessions',
        code: 'SESSIONS_FETCH_FAILED'
      });
    }
  }
);

// Revoke session
router.delete('/sessions/:sessionId',
  auth,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const user = await User.findById(req.user._id);

      user.removeActiveSession(sessionId);
      await user.save();

      res.json({
        message: 'Session revoked successfully'
      });
    } catch (error) {
      console.error('Session revocation error:', error);
      res.status(500).json({
        message: 'Failed to revoke session',
        code: 'SESSION_REVOKE_FAILED'
      });
    }
  }
);

module.exports = router;