const User = require('../models/User');
const WhatsAppSession = require('../models/WhatsAppSession');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// In-memory cache for quick lookups (backed by database)
const phoneToEmailMap = new Map(); // Map phone numbers to authenticated user sessions

// Generate a simple session token (in production, use JWT or similar)
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Load active sessions from database on startup
async function loadActiveSessions() {
  try {
    console.log('🔄 Loading active WhatsApp sessions from database...');
    const sessions = await WhatsAppSession.find({ isActive: true, expiresAt: { $gt: new Date() } });
    
    phoneToEmailMap.clear(); // Clear existing cache
    
    sessions.forEach(session => {
      phoneToEmailMap.set(session.phoneNumber, {
        email: session.email,
        userId: session.userId,
        name: session.name,
        linkedAt: session.linkedAt,
        sessionToken: session.sessionToken
      });
    });
    
    console.log(`✅ Loaded ${sessions.length} active WhatsApp sessions`);
  } catch (error) {
    console.error('❌ Error loading WhatsApp sessions:', error);
  }
}

// Send message (placeholder for actual WhatsApp API call)
async function sendMessage(phoneNumber, message) {
  // This is a placeholder. The actual sendMessage function is in whatsappService.js
  // For testing auth flow, we'll just log it.
  console.log(`📤 Sending message to ${phoneNumber}: ${message}`);
}

// Direct email/password login for WhatsApp
async function loginWithCredentials(phoneNumber, email, password) {
  try {
    console.log(`🔐 Attempting login for ${email} from phone ${phoneNumber}`);

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return {
        success: false,
        message: '❌ No account found with this email. Please register on the web platform first.'
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: '❌ Invalid password. Please check your credentials.'
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: '❌ Account is inactive. Please contact support.'
      };
    }

    // Link phone number to user account
    user.phoneNumber = phoneNumber;
    user.isTemporary = false; // Mark as non-temporary
    user.source = 'whatsapp_auth';
    await user.save();

    // Remove any temporary user that might have existed for this phone number
    await User.deleteOne({ phoneNumber, isTemporary: true, _id: { $ne: user._id } });

    // Create session token
    const sessionToken = generateSessionToken();
    
    // Store authenticated session in database
    const sessionData = {
      phoneNumber,
      userId: user._id,
      email: user.email,
      name: user.name || `${user.firstName} ${user.lastName}`.trim(),
      sessionToken,
      linkedAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    // Save or update session in database
    await WhatsAppSession.findOneAndUpdate(
      { phoneNumber },
      sessionData,
      { upsert: true, new: true }
    );

    // Also store in memory cache for quick access
    phoneToEmailMap.set(phoneNumber, {
      email: user.email,
      userId: user._id,
      name: user.name || `${user.firstName} ${user.lastName}`.trim(),
      linkedAt: new Date(),
      sessionToken
    });

    console.log(`✅ User ${user.email} successfully authenticated via WhatsApp`);

    return {
      success: true,
      message: `🎉 Welcome back, ${user.name || user.firstName}! You're now logged in via WhatsApp. All your messages will be saved to your account and appear in your dashboard.`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name || `${user.firstName} ${user.lastName}`.trim()
      }
    };
  } catch (error) {
    console.error('Error during WhatsApp login:', error);
    return {
      success: false,
      message: '❌ Login failed. Please try again or contact support.'
    };
  }
}

// Check if a user is authenticated
async function isUserAuthenticated(phoneNumber) {
  // First check in-memory cache
  const session = phoneToEmailMap.get(phoneNumber);
  if (session) {
    return true;
  }
  
  // If not in cache, check database
  try {
    const dbSession = await WhatsAppSession.findOne({ 
      phoneNumber, 
      isActive: true, 
      expiresAt: { $gt: new Date() } 
    });
    
    if (dbSession) {
      // Restore to cache
      phoneToEmailMap.set(phoneNumber, {
        email: dbSession.email,
        userId: dbSession.userId,
        name: dbSession.name,
        linkedAt: dbSession.linkedAt,
        sessionToken: dbSession.sessionToken
      });
      console.log(`🔄 Restored WhatsApp session for ${phoneNumber} from database`);
      return true;
    }
  } catch (error) {
    console.error('Error checking WhatsApp session in database:', error);
  }
  
  return false;
}

// Get the authenticated user object
async function getAuthenticatedUser(phoneNumber) {
  // First check in-memory cache
  const session = phoneToEmailMap.get(phoneNumber);
  if (session && session.userId) {
    return await User.findById(session.userId);
  }
  
  // If not in cache, check database
  try {
    const dbSession = await WhatsAppSession.findOne({ 
      phoneNumber, 
      isActive: true, 
      expiresAt: { $gt: new Date() } 
    });
    
    if (dbSession) {
      // Restore to cache
      phoneToEmailMap.set(phoneNumber, {
        email: dbSession.email,
        userId: dbSession.userId,
        name: dbSession.name,
        linkedAt: dbSession.linkedAt,
        sessionToken: dbSession.sessionToken
      });
      console.log(`🔄 Restored WhatsApp session for ${phoneNumber} from database`);
      return await User.findById(dbSession.userId);
    }
  } catch (error) {
    console.error('Error getting authenticated user from database:', error);
  }
  
  return null;
}

// Logout a user
async function logoutUser(phoneNumber) {
  try {
    // Remove from database
    const result = await WhatsAppSession.findOneAndUpdate(
      { phoneNumber, isActive: true },
      { isActive: false, lastActivity: new Date() }
    );

    // Remove from memory cache
    if (phoneToEmailMap.has(phoneNumber)) {
      phoneToEmailMap.delete(phoneNumber);
    }

    if (result) {
      console.log(`🚪 User ${phoneNumber} logged out from WhatsApp.`);
      return {
        success: true,
        message: '👋 You have been logged out. Use "login email@example.com password" to authenticate again.'
      };
    } else {
      return {
        success: false,
        message: '❌ No active WhatsApp session found.'
      };
    }
  } catch (error) {
    console.error('Error during logout:', error);
    return {
      success: false,
      message: '❌ Error during logout. Please try again.'
    };
  }
}

// Handle authentication commands in the main message flow
async function handleAuthCommands(phoneNumber, messageText) {
  const text = messageText.toLowerCase().trim();
  let responseMessage = '';
  let handled = false;

  // Check if already authenticated
  if (await isUserAuthenticated(phoneNumber)) {
    const user = await getAuthenticatedUser(phoneNumber);
    if (text === 'logout') {
      const result = await logoutUser(phoneNumber);
      responseMessage = result.message;
      handled = true;
    } else if (text === 'status' || text === 'auth status') {
      responseMessage = `✅ You are logged in as ${user.email}. All your messages are being saved to your account.`;
      handled = true;
    }
  } else {
    // Not authenticated - handle login commands
    if (text.startsWith('login ')) {
      const loginParts = text.substring(6).trim().split(' ');
      if (loginParts.length >= 2) {
        const email = loginParts[0];
        const password = loginParts.slice(1).join(' '); // Join remaining parts as password (in case password has spaces)
        
        if (email && password) {
          const result = await loginWithCredentials(phoneNumber, email, password);
          responseMessage = result.message;
          handled = true;
        } else {
          responseMessage = '❌ Please provide both email and password. Format: "login email@example.com password"';
          handled = true;
        }
      } else {
        responseMessage = '❌ Please provide both email and password. Format: "login email@example.com password"';
        handled = true;
      }
    } else if (text === 'status' || text === 'auth status') {
      responseMessage = '❌ You are not logged in. Use "login email@example.com password" to authenticate.';
      handled = true;
    }
  }

  return {
    handled,
    message: responseMessage
  };
}

module.exports = {
  loginWithCredentials,
  isUserAuthenticated,
  getAuthenticatedUser,
  logoutUser,
  handleAuthCommands,
  loadActiveSessions,
  phoneToEmailMap // Export for testing
};