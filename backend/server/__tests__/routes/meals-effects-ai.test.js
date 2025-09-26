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
import mealsRoutes from '../../routes/meals.js';
import authRoutes from '../../routes/auth.js';
import mongoose from 'mongoose';
const Meal = mongoose.models.Meal || (await import('../../models/Meal.js')).default || (await import('../../models/Meal.js'));
import User from '../../models/User.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealsRoutes);

const getAuthToken = async () => {
  await User.create({
    email: 'qa-meals@example.com',
    password: 'password123',
    firstName: 'QA',
    lastName: 'Meals'
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'qa-meals@example.com', password: 'password123' });
  return login.body.token;
};

describe('Meals: GET /api/meals/effects/ai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await Meal.deleteMany({});
    await User.deleteMany({});
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
    // Create a minimal meal with computed totals/effects
    await Meal.create({
      userId: (await User.findOne({ email: 'qa-meals@example.com' }))._id,
      ts: new Date(),
      items: [{ foodId: new mongoose.Types.ObjectId(), grams: 100, customName: 'Oatmeal' }],
      computed: {
        totals: { kcal: 150, carbs: 27 },
        effects: { inflammation: { score: 5, label: 'High', why: ['sugar spike'] } }
      },
      context: { stressed: false }
    });

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


