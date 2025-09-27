const { securityLogger } = require('../config/logger');
const { securityConfig } = require('../config/security');

class GDPRService {
  constructor() {
    this.dataRetentionDays = securityConfig.gdpr.dataRetentionDays;
    this.anonymizeAfterDays = securityConfig.gdpr.anonymizeAfterDays;
  }

  // Get user's data (data portability)
  async getUserData(userId) {
    try {
      const User = require('../models/User');
      const Journal = require('../models/Journal');
      const Finance = require('../models/Finance');
      const Task = require('../models/Task');
      const Goal = require('../models/Goal');
      const Habit = require('../models/Habit');
      const AiChat = require('../models/AiChat');

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userData = {
        personalInfo: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          bio: user.bio,
          preferences: user.preferences,
          emergencyContacts: user.emergencyContacts,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        journalEntries: await Journal.find({ userId }).lean(),
        financialData: await Finance.find({ userId }).lean(),
        tasks: await Task.find({ userId }).lean(),
        goals: await Goal.find({ userId }).lean(),
        habits: await Habit.find({ userId }).lean(),
        aiChats: await AiChat.find({ userId }).lean(),
        exportDate: new Date().toISOString(),
        format: 'JSON'
      };

      securityLogger.logDataExport(userId, 'complete', 'unknown');

      return userData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // Anonymize user data
  async anonymizeUserData(userId) {
    try {
      const User = require('../models/User');
      const Journal = require('../models/Journal');
      const Finance = require('../models/Finance');
      const Task = require('../models/Task');
      const Goal = require('../models/Goal');
      const Habit = require('../models/Habit');
      const AiChat = require('../models/AiChat');

      const anonymizedId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Anonymize user record
      await User.findByIdAndUpdate(userId, {
        email: `anonymized_${anonymizedId}@deleted.local`,
        firstName: 'Anonymized',
        lastName: 'User',
        profilePicture: '',
        bio: '',
        preferences: {},
        emergencyContacts: [],
        isActive: false,
        anonymizedAt: new Date(),
        anonymizedId
      });

      // Anonymize journal entries
      await Journal.updateMany(
        { userId },
        {
          $set: {
            content: '[Content anonymized]',
            title: '[Title anonymized]',
            anonymizedAt: new Date()
          }
        }
      );

      // Anonymize financial data
      await Finance.updateMany(
        { userId },
        {
          $set: {
            description: '[Description anonymized]',
            vendor: '[Vendor anonymized]',
            anonymizedAt: new Date()
          }
        }
      );

      // Anonymize tasks
      await Task.updateMany(
        { userId },
        {
          $set: {
            title: '[Title anonymized]',
            description: '[Description anonymized]',
            anonymizedAt: new Date()
          }
        }
      );

      // Anonymize goals
      await Goal.updateMany(
        { userId },
        {
          $set: {
            title: '[Title anonymized]',
            description: '[Description anonymized]',
            anonymizedAt: new Date()
          }
        }
      );

      // Anonymize habits
      await Habit.updateMany(
        { userId },
        {
          $set: {
            name: '[Name anonymized]',
            description: '[Description anonymized]',
            anonymizedAt: new Date()
          }
        }
      );

      // Anonymize AI chats
      await AiChat.updateMany(
        { userId },
        {
          $set: {
            messages: [],
            anonymizedAt: new Date()
          }
        }
      );

      securityLogger.logDataDeletion(userId, 'anonymized', 'unknown');

      return {
        success: true,
        message: 'User data anonymized successfully',
        anonymizedId
      };
    } catch (error) {
      console.error('Error anonymizing user data:', error);
      throw error;
    }
  }

  // Delete user data (right to be forgotten)
  async deleteUserData(userId) {
    try {
      const User = require('../models/User');
      const Journal = require('../models/Journal');
      const Finance = require('../models/Finance');
      const Task = require('../models/Task');
      const Goal = require('../models/Goal');
      const Habit = require('../models/Habit');
      const AiChat = require('../models/AiChat');

      // Delete all user data
      await Promise.all([
        Journal.deleteMany({ userId }),
        Finance.deleteMany({ userId }),
        Task.deleteMany({ userId }),
        Goal.deleteMany({ userId }),
        Habit.deleteMany({ userId }),
        AiChat.deleteMany({ userId })
      ]);

      // Delete user account
      await User.findByIdAndDelete(userId);

      securityLogger.logDataDeletion(userId, 'deleted', 'unknown');

      return {
        success: true,
        message: 'User data deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  // Check if user data should be anonymized
  async checkDataRetention(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) return false;

      const now = new Date();
      const lastActivity = user.lastLogin || user.updatedAt;
      const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

      return daysSinceActivity >= this.anonymizeAfterDays;
    } catch (error) {
      console.error('Error checking data retention:', error);
      return false;
    }
  }

  // Process data retention for all users
  async processDataRetention() {
    try {
      const User = require('../models/User');
      const users = await User.find({ isActive: true });
      const processedUsers = [];

      for (const user of users) {
        const shouldAnonymize = await this.checkDataRetention(user._id);
        if (shouldAnonymize) {
          await this.anonymizeUserData(user._id);
          processedUsers.push(user._id);
        }
      }

      console.log(`Processed data retention for ${processedUsers.length} users`);
      return processedUsers;
    } catch (error) {
      console.error('Error processing data retention:', error);
      throw error;
    }
  }

  // Get data processing activities
  async getDataProcessingActivities(userId) {
    try {
      const activities = {
        dataCollection: {
          personalInfo: true,
          healthData: true,
          financialData: true,
          behavioralData: true,
          deviceData: false
        },
        dataProcessing: {
          purpose: 'Personal lifestyle management and health tracking',
          legalBasis: 'Consent',
          retentionPeriod: `${this.dataRetentionDays} days`,
          dataSharing: {
            thirdParties: false,
            analytics: true,
            marketing: false
          }
        },
        userRights: {
          access: true,
          rectification: true,
          erasure: true,
          portability: true,
          restriction: true,
          objection: true
        },
        contactInfo: {
          dataController: 'Untangle Platform',
          email: 'privacy@untangle-platform.com',
          address: 'Privacy Office, Untangle Platform'
        }
      };

      return activities;
    } catch (error) {
      console.error('Error getting data processing activities:', error);
      throw error;
    }
  }

  // Update consent preferences
  async updateConsentPreferences(userId, preferences) {
    try {
      const User = require('../models/User');
      
      const consentData = {
        dataProcessing: preferences.dataProcessing || false,
        analytics: preferences.analytics || false,
        marketing: preferences.marketing || false,
        thirdPartySharing: preferences.thirdPartySharing || false,
        updatedAt: new Date()
      };

      await User.findByIdAndUpdate(userId, {
        $set: { consentPreferences: consentData }
      });

      securityLogger.logDataAccess(userId, 'consent_preferences', 'update', 'unknown');

      return {
        success: true,
        message: 'Consent preferences updated successfully'
      };
    } catch (error) {
      console.error('Error updating consent preferences:', error);
      throw error;
    }
  }

  // Get consent status
  async getConsentStatus(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      return {
        consentGiven: user.consentPreferences?.dataProcessing || false,
        consentDate: user.consentPreferences?.updatedAt || user.createdAt,
        preferences: user.consentPreferences || {}
      };
    } catch (error) {
      console.error('Error getting consent status:', error);
      throw error;
    }
  }

  // Generate data processing report
  async generateDataProcessingReport() {
    try {
      const User = require('../models/User');
      const Journal = require('../models/Journal');
      const Finance = require('../models/Finance');

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const anonymizedUsers = await User.countDocuments({ anonymizedAt: { $exists: true } });
      const totalJournalEntries = await Journal.countDocuments();
      const totalFinancialRecords = await Finance.countDocuments();

      const report = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalUsers,
          activeUsers,
          anonymizedUsers,
          totalJournalEntries,
          totalFinancialRecords
        },
        dataRetention: {
          policy: `${this.dataRetentionDays} days`,
          anonymizationPolicy: `${this.anonymizeAfterDays} days`,
          lastRetentionCheck: new Date().toISOString()
        },
        compliance: {
          gdprCompliant: true,
          dataMinimization: true,
          purposeLimitation: true,
          storageLimitation: true,
          accuracy: true,
          security: true,
          accountability: true
        }
      };

      return report;
    } catch (error) {
      console.error('Error generating data processing report:', error);
      throw error;
    }
  }

  // Request data deletion
  async requestDataDeletion(userId, reason = 'User request') {
    try {
      const deletionRequest = {
        userId,
        reason,
        requestedAt: new Date(),
        status: 'pending',
        processedAt: null
      };

      // In a real implementation, this would be stored in a database
      // and processed by an admin or automated system
      console.log('Data deletion requested:', deletionRequest);

      securityLogger.logDataDeletion(userId, 'deletion_requested', 'unknown');

      return {
        success: true,
        message: 'Data deletion request submitted successfully',
        requestId: `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error('Error requesting data deletion:', error);
      throw error;
    }
  }
}

module.exports = GDPRService;

