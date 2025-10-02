const User = require('../models/User');
const crypto = require('crypto');

// Store temporary auth codes (in production, use Redis)
const authCodes = new Map();
const phoneToEmailMap = new Map();
const phoneToSessionMap = new Map(); // Map phone numbers to session tokens

// Generate 6-digit auth code
function generateAuthCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate secure session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Send auth code via WhatsApp (placeholder - you'll implement actual sending)
async function sendAuthCode(phoneNumber, code) {
  // This would integrate with your WhatsApp sending service
  console.log(`📱 Auth code for ${phoneNumber}: ${code}`);
  // In real implementation, send via WhatsApp API
  return true;
}

// Send email verification (placeholder)
async function sendEmailVerification(email, code) {
  console.log(`📧 Email verification for ${email}: ${code}`);
  // In real implementation, send via email service
  return true;
}

// Step 1: User requests authentication
async function initiateAuth(phoneNumber) {
  try {
    // Check if phone number is already linked
    const existingMapping = phoneToEmailMap.get(phoneNumber);
    if (existingMapping) {
      return {
        success: true,
        message: `✅ You're already logged in as ${existingMapping.email}. All your messages will be saved to your account.`,
        status: 'already_authenticated'
      };
    }

    // Generate auth code
    const authCode = generateAuthCode();
    const sessionToken = generateSessionToken();
    
    // Store auth session
    authCodes.set(sessionToken, {
      phoneNumber,
      authCode,
      timestamp: Date.now(),
      step: 'awaiting_code'
    });
    
    // Map phone number to session token
    phoneToSessionMap.set(phoneNumber, sessionToken);

    // Send auth code via WhatsApp
    await sendAuthCode(phoneNumber, authCode);

    return {
      success: true,
      message: `🔐 Authentication initiated! I've sent a 6-digit code to your WhatsApp. Please reply with: "code <6-digit-code>" to verify your phone number.`,
      sessionToken,
      status: 'awaiting_code'
    };
  } catch (error) {
    console.error('Error initiating auth:', error);
    return {
      success: false,
      message: '❌ Failed to initiate authentication. Please try again.'
    };
  }
}

// Step 2: Verify auth code
async function verifyAuthCode(phoneNumber, code) {
  try {
    // Get session token for phone number
    const sessionToken = phoneToSessionMap.get(phoneNumber);
    if (!sessionToken) {
      return {
        success: false,
        message: '❌ No active authentication session. Please start authentication again with "login".'
      };
    }
    
    const authSession = authCodes.get(sessionToken);
    
    if (!authSession) {
      return {
        success: false,
        message: '❌ Invalid or expired session. Please start authentication again with "login".'
      };
    }

    // Check if code is correct
    if (authSession.authCode !== code) {
      return {
        success: false,
        message: '❌ Invalid code. Please try again with "code <6-digit-code>".'
      };
    }

    // Check if session is not too old (10 minutes)
    if (Date.now() - authSession.timestamp > 10 * 60 * 1000) {
      authCodes.delete(sessionToken);
      return {
        success: false,
        message: '❌ Session expired. Please start authentication again with "login".'
      };
    }

    // Update session
    authSession.step = 'phone_verified';
    authSession.timestamp = Date.now();

    return {
      success: true,
      message: `✅ Phone number verified! Now please provide your email address. Reply with: "email your-email@example.com"`,
      status: 'awaiting_email'
    };
  } catch (error) {
    console.error('Error verifying auth code:', error);
    return {
      success: false,
      message: '❌ Failed to verify code. Please try again.'
    };
  }
}

// Step 3: Verify email and complete authentication
async function verifyEmailAndCompleteAuth(phoneNumber, email) {
  try {
    // Get session token for phone number
    const sessionToken = phoneToSessionMap.get(phoneNumber);
    if (!sessionToken) {
      return {
        success: false,
        message: '❌ No active authentication session. Please start authentication again with "login".'
      };
    }
    
    const authSession = authCodes.get(sessionToken);
    
    if (!authSession || authSession.step !== 'phone_verified') {
      return {
        success: false,
        message: '❌ Invalid session. Please start authentication again with "login".'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        message: '❌ Invalid email format. Please provide a valid email address.'
      };
    }

    // Check if user exists with this email
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      user = new User({
        email,
        name: `WhatsApp User ${authSession.phoneNumber}`,
        phoneNumber: authSession.phoneNumber,
        isActive: true,
        source: 'whatsapp_auth'
      });
      await user.save();
      console.log(`👤 Created new user via WhatsApp auth: ${email}`);
    } else {
      // Link phone number to existing user
      user.phoneNumber = authSession.phoneNumber;
      await user.save();
      console.log(`🔗 Linked phone ${authSession.phoneNumber} to existing user: ${email}`);
    }

    // Create permanent mapping
    phoneToEmailMap.set(authSession.phoneNumber, {
      email: user.email,
      userId: user._id,
      name: user.name,
      linkedAt: new Date()
    });

    // Clean up auth session
    authCodes.delete(sessionToken);
    phoneToSessionMap.delete(phoneNumber);

    return {
      success: true,
      message: `🎉 Authentication complete! You're now logged in as ${user.name} (${user.email}). All your WhatsApp messages will be saved to your account and appear in your dashboard.`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      status: 'authenticated'
    };
  } catch (error) {
    console.error('Error completing auth:', error);
    return {
      success: false,
      message: '❌ Failed to complete authentication. Please try again.'
    };
  }
}

// Get user by phone number (for authenticated users)
async function getAuthenticatedUser(phoneNumber) {
  try {
    const mapping = phoneToEmailMap.get(phoneNumber);
    
    if (!mapping) {
      return null; // User not authenticated
    }

    const user = await User.findById(mapping.userId);
    return user;
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

// Check if user is authenticated
function isUserAuthenticated(phoneNumber) {
  return phoneToEmailMap.has(phoneNumber);
}

// Logout user
function logoutUser(phoneNumber) {
  phoneToEmailMap.delete(phoneNumber);
  return {
    success: true,
    message: '👋 You have been logged out. Use "login" to authenticate again.'
  };
}

// Get authentication status
function getAuthStatus(phoneNumber) {
  const mapping = phoneToEmailMap.get(phoneNumber);
  
  if (!mapping) {
    return {
      authenticated: false,
      message: 'You are not logged in. Use "login" to authenticate.'
    };
  }

  return {
    authenticated: true,
    user: {
      email: mapping.email,
      name: mapping.name,
      linkedAt: mapping.linkedAt
    },
    message: `You are logged in as ${mapping.name} (${mapping.email})`
  };
}

module.exports = {
  initiateAuth,
  verifyAuthCode,
  verifyEmailAndCompleteAuth,
  getAuthenticatedUser,
  isUserAuthenticated,
  logoutUser,
  getAuthStatus,
  generateAuthCode,
  generateSessionToken
};
