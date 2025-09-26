import request from 'supertest';
import express from 'express';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';

process.env.JWT_SECRET = 'test-secret-key';

// Mock Razorpay to avoid network usage and missing keys
vi.mock('razorpay', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: {
        create: vi.fn().mockResolvedValue({ id: 'order_123', amount: 49900, currency: 'INR' })
      }
    }))
  };
});

// Set fake Razorpay keys for route guard
process.env.RAZORPAY_KEY_ID = 'key_id_test';
process.env.RAZORPAY_KEY_SECRET = 'key_secret_test';

import billingRoutes from '../../routes/billing.js';
import authRoutes from '../../routes/auth.js';
import Subscription from '../../models/Subscription.js';
import Payment from '../../models/Payment.js';
import User from '../../models/User.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/billing', billingRoutes);

const getAuthToken = async () => {
  await User.create({
    email: 'qa-billing@example.com',
    password: 'password123',
    firstName: 'QA',
    lastName: 'Billing'
  });
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'qa-billing@example.com', password: 'password123' });
  return login.body.token;
};

describe('Billing Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await Subscription.deleteMany({});
    await Payment.deleteMany({});
    await User.deleteMany({});
  });

  test('GET /subscription creates trial if none exists', async () => {
    const token = await getAuthToken();
    vi.spyOn(Subscription, 'getActiveSubscription').mockResolvedValue(null);
    vi.spyOn(Subscription, 'createTrial').mockResolvedValue({ _id: 'sub_1', status: 'trialing' });

    const res = await request(app)
      .get('/api/billing/subscription')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.subscription).toBeDefined();
  });

  test('POST /create-payment-intent validates plan', async () => {
    const token = await getAuthToken();
    const res = await request(app)
      .post('/api/billing/create-payment-intent')
      .set('Authorization', `Bearer ${token}`)
      .send({ plan: 'weekly' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid plan. Must be monthly or yearly.');
  });
});


