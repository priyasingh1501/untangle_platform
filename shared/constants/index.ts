// Shared constants across the platform

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  TASKS: {
    BASE: '/tasks',
    CREATE: '/tasks',
    UPDATE: (id: string) => `/tasks/${id}`,
    DELETE: (id: string) => `/tasks/${id}`,
  },
  HEALTH: {
    WORKOUTS: '/health/workouts',
    MEALS: '/health/meals',
    METRICS: '/health/metrics',
  },
  FINANCE: {
    EXPENSES: '/finance/expenses',
    INCOME: '/finance/income',
    BUDGETS: '/finance/budgets',
  },
} as const;

export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const TASK_CATEGORIES = [
  'work',
  'personal',
  'health',
  'finance',
  'household',
  'social',
  'learning',
  'other',
] as const;

export const EXPENSE_CATEGORIES = [
  'food',
  'transportation',
  'entertainment',
  'shopping',
  'bills',
  'healthcare',
  'education',
  'travel',
  'other',
] as const;

export const HEALTH_METRICS = [
  'weight',
  'sleep_hours',
  'stress_level',
  'energy_level',
  'mood',
] as const;

export const DEFAULT_CONFIG = {
  API_TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  REFRESH_TOKEN_THRESHOLD: 300000, // 5 minutes in milliseconds
} as const;
