import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { auth, optionalAuth, requireRole, requireResourceAccess } from '../../middleware/auth.js';
import User from '../../models/User.js';

// Mock the logger to avoid console output during tests
vi.mock('../../config/logger.js', () => ({
  securityLogger: {
    logSuspiciousActivity: vi.fn(),
    logAPIUsage: vi.fn(),
    logAccountLockout: vi.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mongoServer;
  let app;
  let testUser;
  let validToken;

  beforeEach(async () => {
    // Set environment variables to disable auth bypass for middleware tests
    process.env.NODE_ENV = 'development';
    process.env.DISABLE_AUTH = 'false';
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Disconnect existing connection if any
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      role: 'user'
    });
    await testUser.save();

    // Create a simple Express app for testing
    app = express();
    app.use(express.json());

    // Test route that uses auth middleware
    app.get('/protected', auth, (req, res) => {
      res.json({ message: 'Protected route', user: req.user });
    });

    // Test route that uses optional auth
    app.get('/optional', optionalAuth, (req, res) => {
      res.json({ message: 'Optional route', user: req.user || null });
    });

    // Test route that requires specific role
    app.get('/admin', auth, requireRole(['admin']), (req, res) => {
      res.json({ message: 'Admin route' });
    });

    // Test route that requires resource access
    app.get('/resource/:id', auth, requireResourceAccess('user'), (req, res) => {
      res.json({ message: 'Resource accessed', resourceId: req.params.id });
    });

    // Mock JWT token generation (simplified for testing)
    const jwt = await import('jsonwebtoken');
    validToken = jwt.default.sign(
      { 
        userId: testUser._id.toString(),
        email: testUser.email,
        role: testUser.role,
        iat: Math.floor(Date.now() / 1000)
      },
      process.env.JWT_SECRET || 'test-secret',
      { 
        expiresIn: '1h',
        algorithm: 'HS256',
        issuer: 'untangle-platform',
        audience: 'untangle-users'
      }
    );
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    
    // Reset environment variables
    process.env.NODE_ENV = 'test';
    process.env.DISABLE_AUTH = 'true';
  });

  describe('auth middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Protected route');
      expect(response.body.user.userId).toBe(testUser._id.toString());
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
      expect(response.body.code).toBe('NO_TOKEN');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBe('Token is not valid');
      expect(response.body.code).toBe('INVALID_TOKEN');
    });

    it('should deny access for inactive user', async () => {
      // Make user inactive
      testUser.isActive = false;
      await testUser.save();

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(401);

      expect(response.body.message).toBe('User not found or inactive');
      expect(response.body.code).toBe('USER_INACTIVE');
    });

    it('should allow access in test environment without token', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const response = await request(app)
        .get('/protected')
        .expect(200);

      expect(response.body.message).toBe('Protected route');
      expect(response.body.user.email).toBe('test@example.com');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('optionalAuth middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/optional')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Optional route');
      expect(response.body.user).toBeTruthy();
    });

    it('should allow access without token', async () => {
      const response = await request(app)
        .get('/optional')
        .expect(200);

      expect(response.body.message).toBe('Optional route');
      expect(response.body.user).toBeNull();
    });
  });

  describe('requireRole middleware', () => {
    it('should allow access for user with required role', async () => {
      // Make user admin
      testUser.role = 'admin';
      await testUser.save();

      const response = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Admin route');
    });

    it('should deny access for user without required role', async () => {
      const response = await request(app)
        .get('/admin')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);

      expect(response.body.message).toBe('Insufficient permissions');
      expect(response.body.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('requireResourceAccess middleware', () => {
    it('should allow access to own resource', async () => {
      const response = await request(app)
        .get(`/resource/${testUser._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.message).toBe('Resource accessed');
      expect(response.body.resourceId).toBe(testUser._id.toString());
    });

    it('should deny access to other user resource', async () => {
      const otherUser = new User({
        email: 'other@example.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'User',
        isActive: true
      });
      await otherUser.save();

      const response = await request(app)
        .get(`/resource/${otherUser._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(403);

      expect(response.body.message).toBe('Access denied to this resource');
      expect(response.body.code).toBe('RESOURCE_ACCESS_DENIED');
    });
  });
});
