import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import authRoutes from '../../routes/auth.js';
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';

// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-secret-key';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up database
    await User.deleteMany({});
  });

  // Helper function to get a real JWT token
  const getAuthToken = async (email = 'test@example.com') => {
    // Create a test user
    const user = await User.create({
      email: email,
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });

    // Login to get a real token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: email,
        password: 'password123'
      });

    return loginResponse.body.token;
  };

  describe('POST /api/auth/register', () => {
    test('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
    });

    test('should return error if user already exists', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      // Create existing user
      await User.create({
        ...userData,
        password: await bcrypt.hash(userData.password, 10)
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });

    test('should return error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
    });

    test('should return error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Error creating user');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login user with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Create user
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        email: userData.email,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return error for invalid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      // Create user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    test('should return error for non-existent user', async () => {
      const userData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(userData);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    test('should get user profile with valid token', async () => {
      const token = await getAuthToken('profile@example.com');

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('profile@example.com');
    });

    test('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidToken');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Invalid token');
    });

    test('should return error for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Access token required');
    });
  });

  describe('PUT /api/auth/profile', () => {
    test('should update user profile with valid token', async () => {
      const token = await getAuthToken('update@example.com');

      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.firstName).toBe('Jane');
      expect(response.body.user.lastName).toBe('Smith');
    });

    test('should return error for invalid update data', async () => {
      const token = await getAuthToken('invalid@example.com');

      const updateData = {
        email: 'invalid-email'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    test('should change password with valid current password', async () => {
      const token = await getAuthToken('changepass@example.com');

      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newPassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Password changed');
    });

    test('should return error for incorrect current password', async () => {
      const token = await getAuthToken('wrongpass@example.com');

      const passwordData = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123'
      };

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Current password is incorrect');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    test('should refresh token successfully', async () => {
      const token = await getAuthToken('refresh@example.com');

      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    test('should return error for invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .set('Authorization', 'Bearer invalidToken');

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Invalid token');
    });
  });
});