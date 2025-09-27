const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const { securityLogger } = require('../config/logger');

// Custom validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }));

      securityLogger.logSuspiciousActivity(
        req.user?.userId || 'anonymous',
        'validation_error',
        { errors: errorMessages, endpoint: req.path },
        req.ip
      );

      return res.status(400).json({
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    next();
  };
};

// XSS protection middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return xss(obj);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Common validation schemas
const schemas = {
  // User registration
  userRegistration: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required'
      }),
    firstName: Joi.string().min(1).max(50).required().messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required'
    })
  }),

  // User login
  userLogin: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    }),
    rememberMe: Joi.boolean().optional()
  }),

  // Password change
  passwordChange: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password must not exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  }),

  // Journal entry
  journalEntry: Joi.object({
    title: Joi.string().min(1).max(200).optional().messages({
      'string.min': 'Title must not be empty',
      'string.max': 'Title must not exceed 200 characters'
    }),
    content: Joi.string().min(1).max(10000).required().messages({
      'string.min': 'Content is required',
      'string.max': 'Content must not exceed 10,000 characters',
      'any.required': 'Content is required'
    }),
    mood: Joi.string().valid('excellent', 'good', 'neutral', 'bad', 'terrible').optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    isPrivate: Joi.boolean().optional()
  }),

  // Financial transaction
  financialTransaction: Joi.object({
    amount: Joi.number().positive().precision(2).required().messages({
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
    description: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Description is required',
      'string.max': 'Description must not exceed 200 characters',
      'any.required': 'Description is required'
    }),
    category: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Category is required',
      'string.max': 'Category must not exceed 50 characters',
      'any.required': 'Category is required'
    }),
    date: Joi.date().iso().optional(),
    currency: Joi.string().length(3).uppercase().optional().default('USD'),
    vendor: Joi.string().max(100).optional()
  }),

  // Food item
  foodItem: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Food name is required',
      'string.max': 'Food name must not exceed 100 characters',
      'any.required': 'Food name is required'
    }),
    nutrients: Joi.object({
      kcal: Joi.number().min(0).max(1000).required(),
      protein: Joi.number().min(0).max(100).required(),
      fat: Joi.number().min(0).max(100).required(),
      carbs: Joi.number().min(0).max(100).required(),
      fiber: Joi.number().min(0).max(100).optional(),
      sugar: Joi.number().min(0).max(100).optional()
    }).required(),
    portionGramsDefault: Joi.number().min(1).max(10000).required(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).optional()
  }),

  // Task
  task: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Task title is required',
      'string.max': 'Task title must not exceed 200 characters',
      'any.required': 'Task title is required'
    }),
    description: Joi.string().max(1000).optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional().default('medium'),
    dueDate: Joi.date().iso().optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    isCompleted: Joi.boolean().optional().default(false)
  }),

  // Goal
  goal: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Goal title is required',
      'string.max': 'Goal title must not exceed 200 characters',
      'any.required': 'Goal title is required'
    }),
    description: Joi.string().max(1000).optional(),
    category: Joi.string().valid('health', 'fitness', 'financial', 'personal', 'professional').required(),
    targetValue: Joi.number().positive().optional(),
    targetUnit: Joi.string().max(20).optional(),
    targetDate: Joi.date().iso().optional(),
    isCompleted: Joi.boolean().optional().default(false)
  }),

  // Habit
  habit: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Habit name is required',
      'string.max': 'Habit name must not exceed 100 characters',
      'any.required': 'Habit name is required'
    }),
    description: Joi.string().max(500).optional(),
    frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
    targetCount: Joi.number().positive().integer().optional().default(1),
    category: Joi.string().max(50).optional()
  }),

  // File upload
  fileUpload: Joi.object({
    filename: Joi.string().min(1).max(255).required(),
    mimetype: Joi.string().valid(
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ).required(),
    size: Joi.number().max(10 * 1024 * 1024).required() // 10MB max
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    sortBy: Joi.string().max(50).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional().default('desc')
  }),

  // Search
  search: Joi.object({
    q: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Search query is required',
      'string.max': 'Search query must not exceed 100 characters',
      'any.required': 'Search query is required'
    }),
    filters: Joi.object().optional(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20)
  })
};

// Express-validator rules for common endpoints
const validationRules = {
  // User registration
  userRegistration: [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name must be between 1 and 50 characters'),
    body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name must be between 1 and 50 characters')
  ],

  // User login
  userLogin: [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required')
  ],

  // Password change
  passwordChange: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8, max: 128 })
      .withMessage('New password must be between 8 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],

  // Journal entry
  journalEntry: [
    body('title').optional().trim().isLength({ max: 200 }).withMessage('Title must not exceed 200 characters'),
    body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content must be between 1 and 10,000 characters'),
    body('mood').optional().isIn(['excellent', 'good', 'neutral', 'bad', 'terrible']).withMessage('Invalid mood value'),
    body('tags').optional().isArray({ max: 10 }).withMessage('Maximum 10 tags allowed'),
    body('isPrivate').optional().isBoolean().withMessage('isPrivate must be a boolean')
  ],

  // Financial transaction
  financialTransaction: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('description').trim().isLength({ min: 1, max: 200 }).withMessage('Description must be between 1 and 200 characters'),
    body('category').trim().isLength({ min: 1, max: 50 }).withMessage('Category must be between 1 and 50 characters'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
    body('currency').optional().isLength({ min: 3, max: 3 }).isUppercase().withMessage('Currency must be a 3-letter uppercase code'),
    body('vendor').optional().trim().isLength({ max: 100 }).withMessage('Vendor must not exceed 100 characters')
  ],

  // Food item
  foodItem: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Food name must be between 1 and 100 characters'),
    body('nutrients.kcal').isFloat({ min: 0, max: 1000 }).withMessage('Calories must be between 0 and 1000'),
    body('nutrients.protein').isFloat({ min: 0, max: 100 }).withMessage('Protein must be between 0 and 100'),
    body('nutrients.fat').isFloat({ min: 0, max: 100 }).withMessage('Fat must be between 0 and 100'),
    body('nutrients.carbs').isFloat({ min: 0, max: 100 }).withMessage('Carbohydrates must be between 0 and 100'),
    body('portionGramsDefault').isFloat({ min: 1, max: 10000 }).withMessage('Portion size must be between 1 and 10,000 grams')
  ],

  // Task
  task: [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Task title must be between 1 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid ISO 8601 date'),
    body('tags').optional().isArray({ max: 10 }).withMessage('Maximum 10 tags allowed'),
    body('isCompleted').optional().isBoolean().withMessage('isCompleted must be a boolean')
  ],

  // Goal
  goal: [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Goal title must be between 1 and 200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('category').isIn(['health', 'fitness', 'financial', 'personal', 'professional']).withMessage('Invalid category'),
    body('targetValue').optional().isFloat({ min: 0.01 }).withMessage('Target value must be a positive number'),
    body('targetUnit').optional().trim().isLength({ max: 20 }).withMessage('Target unit must not exceed 20 characters'),
    body('targetDate').optional().isISO8601().withMessage('Target date must be a valid ISO 8601 date'),
    body('isCompleted').optional().isBoolean().withMessage('isCompleted must be a boolean')
  ],

  // Habit
  habit: [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Habit name must be between 1 and 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Frequency must be daily, weekly, or monthly'),
    body('targetCount').optional().isInt({ min: 1 }).withMessage('Target count must be a positive integer'),
    body('category').optional().trim().isLength({ max: 50 }).withMessage('Category must not exceed 50 characters')
  ],

  // Pagination
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().trim().isLength({ max: 50 }).withMessage('Sort field must not exceed 50 characters'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],

  // Search
  search: [
    query('q').trim().isLength({ min: 1, max: 100 }).withMessage('Search query must be between 1 and 100 characters'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],

  // ID parameter validation
  mongoId: [
    param('id').isMongoId().withMessage('Invalid ID format')
  ]
};

module.exports = {
  validate,
  sanitizeInput,
  schemas,
  validationRules
};
