const formData = require('form-data');
const Mailgun = require('mailgun.js');
const { logger } = require('../config/logger');

class EmailService {
  constructor() {
    this.mailgun = null;
    this.isConfigured = false;
    this.fromEmail = null;
    this.domain = null;
    this.initialize();
  }

  initialize() {
    // Check if Mailgun API key and domain are configured
    const mailgunApiKey = process.env.MAILGUN_API_KEY;
    const mailgunDomain = process.env.MAILGUN_DOMAIN;
    const smtpFrom = process.env.SMTP_FROM || `noreply@${mailgunDomain || 'untangle.com'}`;

    if (!mailgunApiKey || !mailgunDomain) {
      console.warn('⚠️ Email service not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.');
      console.warn('⚠️ Password reset emails will be logged to console instead.');
      this.isConfigured = false;
      this.fromEmail = smtpFrom;
      return;
    }

    try {
      const mailgun = new Mailgun(formData);
      this.mailgun = mailgun.client({
        username: 'api',
        key: mailgunApiKey
      });
      this.domain = mailgunDomain;
      this.fromEmail = smtpFrom;
      this.isConfigured = true;
      console.log('✅ Email service (Mailgun) initialized successfully');
      console.log(`📧 Using domain: ${mailgunDomain}`);
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.isConfigured = false;
    }
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    const resetLink = resetUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const messageData = {
      from: `"Untangle Platform" <${this.fromEmail}>`,
      to: [email],
      subject: 'Reset Your Password - Untangle Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1E49C9 0%, #3B82F6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #FFFFFF; margin: 0;">Untangle Platform</h1>
          </div>
          <div style="background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1E49C9; margin-top: 0;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your Untangle Platform account.</p>
            <p>Click the button below to reset your password. This link will expire in 10 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #1E49C9; color: #FFFFFF; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            <p style="color: #6B7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #1E49C9; font-size: 12px; word-break: break-all; background: #F3F4F6; padding: 10px; border-radius: 4px;">${resetLink}</p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Password - Untangle Platform
        
        Hello,
        
        We received a request to reset your password for your Untangle Platform account.
        
        Click the link below to reset your password. This link will expire in 10 minutes.
        
        ${resetLink}
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        This is an automated message. Please do not reply to this email.
      `
    };

    if (this.isConfigured && this.mailgun) {
      try {
        const response = await this.mailgun.messages.create(this.domain, messageData);
        logger.info(`Password reset email sent to ${email}`, { 
          messageId: response.id,
          message: response.message
        });
        return { success: true, messageId: response.id };
      } catch (error) {
        logger.error(`Failed to send password reset email to ${email}:`, error);
        // Fall through to console logging
      }
    }

    // Fallback: Log to console if email service is not configured
    console.log('\n📧 Password Reset Email (not sent - email service not configured):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email}`);
    console.log(`Subject: Reset Your Password - Untangle Platform`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`Token: ${resetToken}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: false, message: 'Email service not configured - check logs for reset link' };
  }

  async sendEmailVerificationEmail(email, verificationToken, verificationUrl) {
    const verifyLink = verificationUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const messageData = {
      from: `"Untangle Platform" <${this.fromEmail}>`,
      to: [email],
      subject: 'Verify Your Email - Untangle Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1E49C9 0%, #3B82F6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #FFFFFF; margin: 0;">Untangle Platform</h1>
          </div>
          <div style="background: #FFFFFF; padding: 30px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1E49C9; margin-top: 0;">Verify Your Email Address</h2>
            <p>Hello,</p>
            <p>Thank you for signing up for Untangle Platform!</p>
            <p>Please verify your email address by clicking the button below. This link will expire in 24 hours.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyLink}" style="background: #1E49C9; color: #FFFFFF; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Verify Email</a>
            </div>
            <p style="color: #6B7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
            <p style="color: #1E49C9; font-size: 12px; word-break: break-all; background: #F3F4F6; padding: 10px; border-radius: 4px;">${verifyLink}</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            <p style="color: #9CA3AF; font-size: 12px; margin: 0;">This is an automated message. Please do not reply to this email.</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Verify Your Email - Untangle Platform
        
        Hello,
        
        Thank you for signing up for Untangle Platform!
        
        Please verify your email address by clicking the link below. This link will expire in 24 hours.
        
        ${verifyLink}
        
        This is an automated message. Please do not reply to this email.
      `
    };

    if (this.isConfigured && this.mailgun) {
      try {
        const response = await this.mailgun.messages.create(this.domain, messageData);
        logger.info(`Email verification sent to ${email}`, { 
          messageId: response.id,
          message: response.message
        });
        return { success: true, messageId: response.id };
      } catch (error) {
        logger.error(`Failed to send email verification to ${email}:`, error);
        // Fall through to console logging
      }
    }

    // Fallback: Log to console if email service is not configured
    console.log('\n📧 Email Verification (not sent - email service not configured):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${email}`);
    console.log(`Subject: Verify Your Email - Untangle Platform`);
    console.log(`Verification Link: ${verifyLink}`);
    console.log(`Token: ${verificationToken}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: false, message: 'Email service not configured - check logs for verification link' };
  }
}

// Create singleton instance
const emailServiceInstance = new EmailService();

// Export pattern that supports both use cases:
// 1. const emailService = require('./emailService') - gets instance (backward compatible)
// 2. const EmailService = require('./emailService'); new EmailService() - gets class (for emailExpense.js)
//
// Create a constructor function that can be called with 'new' or without
function EmailServiceWrapper(...args) {
  // If called with 'new', create a new instance
  if (new.target || this instanceof EmailServiceWrapper) {
    return new EmailService(...args);
  }
  // If called without 'new', return the singleton instance
  return emailServiceInstance;
}

// Make it work as a constructor by setting up the prototype chain
EmailServiceWrapper.prototype = EmailService.prototype;
EmailServiceWrapper.prototype.constructor = EmailServiceWrapper;

// Copy static properties from the class
Object.setPrototypeOf(EmailServiceWrapper, EmailService);

// Copy instance properties and methods to the wrapper so it can be used as an instance
for (const key in emailServiceInstance) {
  if (emailServiceInstance.hasOwnProperty(key)) {
    EmailServiceWrapper[key] = emailServiceInstance[key];
  }
}

// Copy prototype methods so they're available on instances
Object.getOwnPropertyNames(EmailService.prototype).forEach(name => {
  if (name !== 'constructor' && typeof EmailService.prototype[name] === 'function') {
    EmailServiceWrapper.prototype[name] = EmailService.prototype[name];
  }
});

// Also export the class for destructuring
EmailServiceWrapper.EmailService = EmailService;

module.exports = EmailServiceWrapper;
