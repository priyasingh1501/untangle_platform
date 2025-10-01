import request from 'supertest';
import express from 'express';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-key';
process.env.OPENAI_API_KEY = 'test-key';

// Mock OpenAIService used by meals route
vi.mock('../../services/openaiService', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      analyzeMealEffects: vi.fn().mockResolvedValue({
        aiInsights: 'Overall balanced diet with room to reduce sugar.',
        inflammation: {
          label: 'Inflammation',
          score: 12,
          aiInsights: 'Spikes correlate with high sugar meals'
        }
      })
    }))
  };
});


// Also mock OpenAI SDK to avoid constructor checks in any transitive imports
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: { completions: { create: vi.fn().mockResolvedValue({ choices: [{ message: { content: '{}' } }] }) } }
  }))
}));

// Import after mocks
import { createTestApp } from '../setup.js';
import mongoose from 'mongoose';
import User from '../../models/User.js';

// Mock the Meal model to avoid Mongoose compilation issues
const Meal = {
  create: vi.fn(),
  find: vi.fn().mockReturnValue({
    populate: vi.fn().mockReturnValue({
      sort: vi.fn().mockResolvedValue([]) // Default to empty array
    })
  }),
  findOne: vi.fn(),
  deleteMany: vi.fn().mockResolvedValue({ deletedCount: 0 })
};

// Mock the ServiceFactory to return our mocked Meal model
vi.mock('../../services/serviceFactory', () => {
  return {
    default: {
      getModels: () => ({
        Meal: Meal,
        FoodItem: {}
      }),
      getServices: () => ({
        OpenAIService: {
          analyzeMealEffects: vi.fn().mockResolvedValue({
            aiInsights: 'Overall balanced diet with room to reduce sugar.',
            inflammation: {
              label: 'Inflammation',
              score: 12,
              aiInsights: 'Spikes correlate with high sugar meals'
            }
          })
        }
      }),
      getExternalDeps: () => ({
        axios: require('axios')
      })
    }
  };
});

// Mock the Meal model directly at the module level
vi.mock('../../models/Meal', () => ({
  default: Meal
}));

process.env.NODE_ENV = 'development';
process.env.DISABLE_AUTH = 'false';

const app = createTestApp();

const getAuthToken = async () => {
  await User.create({
    email: 'qa-meals@example.com',
    password: 'Password123!',
    firstName: 'QA',
    lastName: 'Meals'
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'qa-meals@example.com', password: 'Password123!' });
  return login.body.tokens.accessToken;
};

describe('Meals: GET /api/meals/effects/ai', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Clean up any existing test data
    await User.deleteMany({ email: 'qa-meals@example.com' });
    if (Meal && Meal.deleteMany) {
      await Meal.deleteMany({});
    }
    
    // Reset the Meal.find mock to default behavior
    Meal.find.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue([])
      })
    });
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({ email: 'qa-meals@example.com' });
    if (Meal && Meal.deleteMany) {
      await Meal.deleteMany({});
    }
  });

  test('requires auth token', async () => {
    const res = await request(app)
      .get('/api/meals/effects/ai');
    expect(res.status).toBe(401);
  });

  test('validates effect query param', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/meals/effects/ai')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Missing required query param: effect');
  });

  test('returns no meals message when dataset empty', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .get('/api/meals/effects/ai')
      .set('Authorization', `Bearer ${token}`)
      .query({ effect: 'inflammation' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('No meals in range');
    expect(res.body.effect).toBe('inflammation');
  });

  test('returns AI analysis when meals exist', async () => {
    const token = await getAuthToken();
    
    // Mock the Meal.find to return some test data
    const mockMeals = [{
      _id: new mongoose.Types.ObjectId(),
      userId: new mongoose.Types.ObjectId(),
      ts: new Date(),
      items: [{ foodId: new mongoose.Types.ObjectId(), grams: 100, customName: 'Oatmeal' }],
      computed: {
        totals: { kcal: 150, carbs: 27 },
        effects: { inflammation: { score: 5, label: 'High', why: ['sugar spike'] } }
      },
      context: { stressed: false }
    }];
    
    // Set the mock after beforeEach has run
    Meal.find.mockReturnValue({
      populate: vi.fn().mockReturnValue({
        sort: vi.fn().mockResolvedValue(mockMeals)
      })
    });

    // Debug: Check if the mock is set correctly
    console.log('Meal.find mock:', Meal.find);
    console.log('Meal.find mock calls:', Meal.find.mock.calls);

    const res = await request(app)
      .get('/api/meals/effects/ai')
      .set('Authorization', `Bearer ${token}`)
      .query({ effect: 'inflammation' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('AI effect analysis generated');
    expect(res.body.effect).toBe('inflammation');
    expect(res.body.aiInsights).toBeDefined();
    // analysis may be a nested object from mocked service
    expect(res.body.analysis).toBeDefined();
  });
});


