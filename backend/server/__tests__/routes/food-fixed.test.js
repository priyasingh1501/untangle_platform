import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import foodRoutes from '../../routes/food.js';
import FoodItem from '../../models/FoodItem.js';
import FoodTracking from '../../models/FoodTracking.js';
import User from '../../models/User.js';
import authRoutes from '../../routes/auth.js';

// Create a mock ObjectId for testing
const mockUserId = new mongoose.Types.ObjectId();

// Helper function to create valid food item data
const createFoodItemData = (overrides = {}) => ({
  name: 'Apple',
  nameFold: 'apple',
  source: 'USDA',
  portionGramsDefault: 100,
  nutrients: {
    kcal: 52,
    protein: 0.3,
    carbs: 13.8,
    fat: 0.2
  },
  ...overrides
});

// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-secret-key';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);

// Helper function to get a real JWT token
const getAuthToken = async () => {
  // Create a test user
  const user = await User.create({
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  });

  // Login to get a real token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });

  return loginResponse.body.token;
};

describe('Food Routes (Fixed)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up database
    await FoodItem.deleteMany({});
    await FoodTracking.deleteMany({});
    await User.deleteMany({});
  });

  describe('GET /api/food/search', () => {
    test('should search food items with query', async () => {
      const token = await getAuthToken();
      
      // Create test food items
      await FoodItem.create(createFoodItemData({ name: 'Apple', nameFold: 'apple' }));
      await FoodItem.create(createFoodItemData({ name: 'Banana', nameFold: 'banana' }));

      const response = await request(app)
        .get('/api/food/search')
        .set('Authorization', `Bearer ${token}`)
        .query({ q: 'apple' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Foods found');
      expect(response.body.foods).toHaveLength(1);
      expect(response.body.foods[0].name).toBe('Apple');
    });

    test('should return error for empty search query', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .get('/api/food/search')
        .set('Authorization', `Bearer ${token}`)
        .query({ q: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Search query is required');
    });

    test('should return empty array when no items found', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .get('/api/food/search')
        .set('Authorization', `Bearer ${token}`)
        .query({ q: 'nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Foods found');
      expect(response.body.foods).toHaveLength(0);
    });

    test('should handle limit parameter', async () => {
      const token = await getAuthToken();
      
      // Create multiple food items
      for (let i = 0; i < 5; i++) {
        await FoodItem.create(createFoodItemData({ 
          name: `Apple ${i}`, 
          nameFold: `apple ${i}` 
        }));
      }

      const response = await request(app)
        .get('/api/food/search')
        .set('Authorization', `Bearer ${token}`)
        .query({ q: 'apple', limit: 3 });

      expect(response.status).toBe(200);
      expect(response.body.foods).toHaveLength(3);
    });
  });

  describe('POST /api/food/search', () => {
    test('should search with POST method', async () => {
      const token = await getAuthToken();
      
      await FoodItem.create(createFoodItemData({ name: 'Apple', nameFold: 'apple' }));

      const response = await request(app)
        .post('/api/food/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'apple', source: 'local' })
        .timeout(10000); // 10 second timeout

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Search completed');
      expect(response.body.results.length).toBeGreaterThan(0);
      // Check if our specific result is in the results
      const appleResult = response.body.results.find(r => r.name === 'Apple');
      expect(appleResult).toBeDefined();
    }, 15000); // 15 second test timeout

    test('should return error for empty query', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .post('/api/food/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: '' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Search query is required');
    });
  });

  describe('GET /api/food/categories', () => {
    test('should get food categories', async () => {
      const token = await getAuthToken();
      
      await FoodItem.create(createFoodItemData({ source: 'USDA' }));
      await FoodItem.create(createFoodItemData({ source: 'IFCT' }));

      const response = await request(app)
        .get('/api/food/categories')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Categories found');
      expect(response.body.categories).toHaveLength(2);
    });
  });

  describe('GET /api/food/popular', () => {
    test('should get popular foods', async () => {
      const token = await getAuthToken();
      
      await FoodItem.create(createFoodItemData({ 
        name: 'High Protein Food',
        nutrients: { kcal: 100, protein: 20, carbs: 5, fat: 2 }
      }));

      const response = await request(app)
        .get('/api/food/popular')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Popular foods found');
      expect(response.body.foods).toBeDefined();
    });
  });

  describe('GET /api/food/suggestions', () => {
    test('should get food suggestions', async () => {
      const token = await getAuthToken();
      
      await FoodItem.create(createFoodItemData({ 
        name: 'Vegetable',
        tags: ['veg'],
        nutrients: { kcal: 50, protein: 2, carbs: 10, fat: 0.5, fiber: 5 }
      }));

      const response = await request(app)
        .get('/api/food/suggestions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Food suggestions found');
      expect(response.body.suggestions).toBeDefined();
    });
  });

  describe('GET /api/food/:id', () => {
    test('should get food item by id', async () => {
      const token = await getAuthToken();
      
      const food = await FoodItem.create(createFoodItemData({ name: 'Apple' }));

      const response = await request(app)
        .get(`/api/food/${food._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Food item found');
      expect(response.body.food.name).toBe('Apple');
    });

    test('should return error for non-existent food item', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .get('/api/food/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Food item not found');
    });

    test('should return error for invalid id format', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .get('/api/food/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/food/test-search', () => {
    test('should work without authentication', async () => {
      await FoodItem.create(createFoodItemData({ name: 'Apple', nameFold: 'apple' }));

      const response = await request(app)
        .post('/api/food/test-search')
        .send({ query: 'apple', source: 'local' })
        .timeout(10000); // 10 second timeout

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Test search completed');
      // Note: This test might return more results than expected due to fuzzy matching
      expect(response.body.results.length).toBeGreaterThan(0);
    }, 15000); // 15 second test timeout
  });
});
