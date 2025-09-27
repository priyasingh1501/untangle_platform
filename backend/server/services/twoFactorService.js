const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { securityLogger } = require('../config/logger');

class TwoFactorService {
  constructor() {
    this.issuer = 'Untangle Platform';
  }

  // Generate 2FA secret for a user
  generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: this.issuer,
      length: 32
    });

    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url,
      manualEntryKey: secret.base32
    };
  }

  // Generate QR code for 2FA setup
  async generateQRCode(secret, userEmail) {
    try {
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(this.issuer)}:${encodeURIComponent(userEmail)}?secret=${secret}&issuer=${encodeURIComponent(this.issuer)}`;
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Verify 2FA token
  verifyToken(secret, token, window = 2) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window, // Allow 2 time steps (60 seconds) of tolerance
        time: Math.floor(Date.now() / 1000)
      });

      return {
        verified,
        delta: verified ? 0 : null
      };
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return {
        verified: false,
        delta: null,
        error: error.message
      };
    }
  }

  // Generate backup codes
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Hash backup codes for storage
  hashBackupCodes(codes) {
    const crypto = require('crypto');
    return codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
  }

  // Verify backup code
  verifyBackupCode(providedCode, hashedCodes) {
    const crypto = require('crypto');
    const hashedProvidedCode = crypto.createHash('sha256').update(providedCode).digest('hex');
    return hashedCodes.includes(hashedProvidedCode);
  }

  // Generate recovery codes
  generateRecoveryCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 12).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Hash recovery codes for storage
  hashRecoveryCodes(codes) {
    const crypto = require('crypto');
    return codes.map(code => crypto.createHash('sha256').update(code).digest('hex'));
  }

  // Verify recovery code
  verifyRecoveryCode(providedCode, hashedCodes) {
    const crypto = require('crypto');
    const hashedProvidedCode = crypto.createHash('sha256').update(providedCode).digest('hex');
    return hashedCodes.includes(hashedProvidedCode);
  }

  // Check if 2FA is properly configured
  is2FAConfigured(user) {
    return !!(user.twoFactorSecret && user.twoFactorEnabled);
  }

  // Enable 2FA for user
  async enable2FA(user, secret, token, backupCodes) {
    try {
      // Verify the token first
      const verification = this.verifyToken(secret, token);
      if (!verification.verified) {
        throw new Error('Invalid 2FA token');
      }

      // Hash backup codes
      const hashedBackupCodes = this.hashBackupCodes(backupCodes);

      // Update user with 2FA settings
      user.twoFactorSecret = secret;
      user.twoFactorEnabled = true;
      user.twoFactorBackupCodes = hashedBackupCodes;
      user.twoFactorEnabledAt = new Date();

      await user.save();

      securityLogger.logPasswordChange(user._id, 'unknown', '2FA enabled');

      return {
        success: true,
        message: '2FA enabled successfully'
      };
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  // Disable 2FA for user
  async disable2FA(user, token) {
    try {
      // Verify the token if 2FA is enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        const verification = this.verifyToken(user.twoFactorSecret, token);
        if (!verification.verified) {
          throw new Error('Invalid 2FA token');
        }
      }

      // Disable 2FA
      user.twoFactorSecret = undefined;
      user.twoFactorEnabled = false;
      user.twoFactorBackupCodes = [];
      user.twoFactorEnabledAt = undefined;

      await user.save();

      securityLogger.logPasswordChange(user._id, 'unknown', '2FA disabled');

      return {
        success: true,
        message: '2FA disabled successfully'
      };
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }

  // Verify 2FA during login
  async verify2FALogin(user, token, ip, userAgent) {
    try {
      if (!this.is2FAConfigured(user)) {
        return {
          verified: true,
          message: '2FA not configured'
        };
      }

      // Check if it's a backup code
      if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        const isBackupCode = this.verifyBackupCode(token, user.twoFactorBackupCodes);
        if (isBackupCode) {
          // Remove used backup code
          const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
          user.twoFactorBackupCodes = user.twoFactorBackupCodes.filter(hash => hash !== tokenHash);
          await user.save();

          securityLogger.logPasswordChange(user._id, ip, '2FA backup code used');
          
          return {
            verified: true,
            message: '2FA verified with backup code',
            usedBackupCode: true
          };
        }
      }

      // Verify with TOTP
      const verification = this.verifyToken(user.twoFactorSecret, token);
      if (!verification.verified) {
        securityLogger.logFailedLogin(user.email, ip, 'Invalid 2FA token', userAgent);
        return {
          verified: false,
          message: 'Invalid 2FA token'
        };
      }

      securityLogger.logPasswordChange(user._id, ip, '2FA verified');
      
      return {
        verified: true,
        message: '2FA verified successfully'
      };
    } catch (error) {
      console.error('Error verifying 2FA login:', error);
      securityLogger.logFailedLogin(user.email, ip, '2FA verification error', userAgent);
      return {
        verified: false,
        message: '2FA verification failed'
      };
    }
  }

  // Generate new backup codes
  async generateNewBackupCodes(user, token) {
    try {
      // Verify the token if 2FA is enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        const verification = this.verifyToken(user.twoFactorSecret, token);
        if (!verification.verified) {
          throw new Error('Invalid 2FA token');
        }
      }

      // Generate new backup codes
      const newBackupCodes = this.generateBackupCodes();
      const hashedBackupCodes = this.hashBackupCodes(newBackupCodes);

      // Update user with new backup codes
      user.twoFactorBackupCodes = hashedBackupCodes;
      await user.save();

      securityLogger.logPasswordChange(user._id, 'unknown', '2FA backup codes regenerated');

      return {
        success: true,
        backupCodes: newBackupCodes,
        message: 'New backup codes generated successfully'
      };
    } catch (error) {
      console.error('Error generating new backup codes:', error);
      throw error;
    }
  }

  // Get 2FA status for user
  get2FAStatus(user) {
    return {
      enabled: this.is2FAConfigured(user),
      hasBackupCodes: !!(user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0),
      backupCodesCount: user.twoFactorBackupCodes ? user.twoFactorBackupCodes.length : 0,
      enabledAt: user.twoFactorEnabledAt
    };
  }
}

module.exports = TwoFactorService;
