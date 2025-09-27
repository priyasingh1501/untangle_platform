// WhatsApp Bot Configuration
// This file contains configuration settings for the WhatsApp bot

module.exports = {
  // Bot settings
  bot: {
    name: 'Untangle Bot',
    version: '1.0.0',
    language: 'en',
    timezone: 'Asia/Kolkata'
  },

  // Message classification thresholds
  classification: {
    confidenceThreshold: 0.7,
    fallbackEnabled: true,
    maxRetries: 3
  },

  // Parsing settings
  parsing: {
    // Expense parsing
    expense: {
      defaultCurrency: 'INR',
      supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP', 'JPY'],
      dateFormats: ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM/DD/YYYY'],
      defaultCategory: 'other'
    },

    // Food parsing
    food: {
      defaultMealType: 'snack',
      supportedMealTypes: ['breakfast', 'lunch', 'dinner', 'snack'],
      calorieEstimation: true,
      nutritionAnalysis: false
    },

    // Habit parsing
    habit: {
      defaultDuration: 30, // minutes
      supportedStatuses: ['completed', 'skipped'],
      autoCreateHabits: true,
      streakTracking: true
    },

    // Journal parsing
    journal: {
      defaultMood: 'neutral',
      supportedMoods: ['excellent', 'good', 'neutral', 'bad', 'terrible'],
      moodAnalysis: true,
      sentimentAnalysis: true,
      topicExtraction: true
    }
  },

  // WhatsApp API settings
  whatsapp: {
    apiVersion: 'v18.0',
    messageTimeout: 30000, // 30 seconds
    maxRetries: 3,
    retryDelay: 1000 // 1 second
  },

  // Media processing settings
  media: {
    // Image processing
    image: {
      maxSize: 5 * 1024 * 1024, // 5MB
      supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      ocrEnabled: true,
      ocrProvider: 'google' // 'google', 'aws', 'azure'
    },

    // Audio processing
    audio: {
      maxSize: 16 * 1024 * 1024, // 16MB
      supportedFormats: ['mp3', 'wav', 'ogg', 'webm'],
      speechToTextEnabled: true,
      sttProvider: 'google' // 'google', 'aws', 'azure'
    },

    // Document processing
    document: {
      maxSize: 10 * 1024 * 1024, // 10MB
      supportedFormats: ['pdf', 'doc', 'docx'],
      textExtraction: true
    }
  },

  // Database settings
  database: {
    userCreation: {
      autoCreate: true,
      defaultSettings: {
        privacy: 'private',
        reminders: true,
        notifications: true
      }
    },

    // Data retention
    retention: {
      expenses: 365, // days
      food: 90, // days
      habits: 365, // days
      journal: 365 // days
    }
  },

  // AI settings
  ai: {
    openai: {
      model: 'gpt-3.5-turbo',
      temperature: 0.1,
      maxTokens: 1000,
      timeout: 30000 // 30 seconds
    },

    // Fallback rules
    fallback: {
      enabled: true,
      confidenceThreshold: 0.5,
      useRegex: true,
      useKeywords: true
    }
  },

  // Response settings
  responses: {
    // Response templates
    templates: {
      expense: '💰 Logged expense: {currency}{amount} — {vendor} — {date}. Category: {category}. Want to change category? (1) Yes (2) No',
      food: '🍽️ Logged food: {mealType} - {description}. Edit? [Edit] [OK]',
      habit: '✅ Nice — {habit} marked {status} for {date}. Streak: {streak} days.',
      journal: '📝 Saved journal entry. Mood detected: {mood}.',
      error: 'Sorry, I encountered an error processing your message. Please try again.',
      help: 'I can help you log expenses, track food, manage habits, and journal. Try: "₹450 Uber" for expenses, "ate breakfast" for food, "meditation done" for habits, or just write your thoughts for journaling.'
    },

    // Interactive elements
    interactive: {
      buttons: true,
      lists: true,
      quickReplies: true
    }
  },

  // Logging settings
  logging: {
    level: 'info', // 'debug', 'info', 'warn', 'error'
    logMessages: true,
    logParsing: true,
    logErrors: true,
    logPerformance: true
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    maxRequests: 100, // per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    skipSuccessfulRequests: false
  },

  // Security settings
  security: {
    webhookVerification: true,
    messageValidation: true,
    sanitizeInput: true,
    encryptSensitiveData: true
  },

  // Feature flags
  features: {
    // Core features
    expenseTracking: true,
    foodTracking: true,
    habitTracking: true,
    journaling: true,

    // Advanced features
    voiceMessages: true,
    imageProcessing: true,
    documentProcessing: false,
    twoWayConversation: false,
    smartReminders: false,
    analytics: true,

    // Experimental features
    moodAnalysis: true,
    sentimentAnalysis: true,
    topicExtraction: true,
    duplicateDetection: true,
    autoCategorization: true
  }
};
