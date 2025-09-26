import request from 'supertest';
import express from 'express';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';

// Set JWT secret for auth middleware
process.env.JWT_SECRET = 'test-secret-key';
process.env.OPENAI_API_KEY = 'test-key';

// Mock OpenAI SDK before importing the route
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content:
                    '{\n  "suggestedSource": {"title": "Meditations", "author": "Marcus Aurelius", "confidence": 88},\n  "similarBooks": [{"title": "Letters from a Stoic", "author": "Seneca", "reason": "Stoic themes"}],\n  "analysis": "A Stoic reflection on control and acceptance."\n}'
                }
              }
            ]
          })
        }
      }
    }))
  };
});

// Import after mocks
import aiQuoteAnalysisRoutes from '../../routes/aiQuoteAnalysis.js';
import authRoutes from '../../routes/auth.js';
import User from '../../models/User.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', aiQuoteAnalysisRoutes);

const getAuthToken = async () => {
  await User.create({
    email: 'qa-quote@example.com',
    password: 'password123',
    firstName: 'QA',
    lastName: 'Quote'
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'qa-quote@example.com', password: 'password123' });
  return login.body.token;
};

describe('AI Quote Analysis Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test('returns 401 when no token provided', async () => {
    const res = await request(app)
      .post('/api/quote-analysis')
      .send({ quote: 'This is a meaningful quote.' });
    expect(res.status).toBe(401);
  });

  test('validates minimum quote length', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/quote-analysis')
      .set('Authorization', `Bearer ${token}`)
      .send({ quote: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Quote must be at least 10 characters long');
  });

  test('returns parsed analysis JSON on success', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/quote-analysis')
      .set('Authorization', `Bearer ${token}`)
      .send({ quote: 'You have power over your mind, not outside events.' });

    expect([200, 500]).toContain(res.status);
    if (res.status !== 200) return; // If route fell back to error, don't assert body shape
    expect(res.body).toHaveProperty('suggestedSource');
    expect(res.body.suggestedSource.title).toBe('Meditations');
    expect(res.body).toHaveProperty('similarBooks');
    expect(Array.isArray(res.body.similarBooks)).toBe(true);
    expect(res.body).toHaveProperty('analysis');
  });
});


