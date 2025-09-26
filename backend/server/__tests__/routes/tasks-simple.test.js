import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import Task from '../../models/Task.js';
import LifestyleGoal from '../../models/Goal.js';
import User from '../../models/User.js';
import authRoutes from '../../routes/auth.js';
import tasksRoutes from '../../routes/tasks.js';
import bcrypt from 'bcryptjs';

// Set JWT_SECRET for testing
process.env.JWT_SECRET = 'test-secret-key';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);

describe('Tasks Routes (Simplified)', () => {
  let mockUserId;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up database
    await Task.deleteMany({});
    await LifestyleGoal.deleteMany({});
    await User.deleteMany({});
  });

  // Helper function to get a real JWT token
  const getAuthToken = async () => {
    // Create a test user
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    });

    mockUserId = user._id;

    // Login to get a real token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    return loginResponse.body.token;
  };

  test('should get all tasks for user', async () => {
    const token = await getAuthToken();

    // Create test tasks
    await Task.create({
      title: 'Test Task 1',
      description: 'Test Description 1',
      userId: mockUserId,
      priority: 'high'
    });

    await Task.create({
      title: 'Test Task 2',
      description: 'Test Description 2',
      userId: mockUserId,
      priority: 'medium'
    });

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.tasks).toHaveLength(2);
  });

  test('should create new task', async () => {
    const token = await getAuthToken();

    const taskData = {
      title: 'New Task',
      description: 'New Description',
      priority: 'high'
    };

    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(taskData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.task.title).toBe('New Task');
  });

  test('should get task by id', async () => {
    const token = await getAuthToken();

    const task = await Task.create({
      title: 'Test Task',
      description: 'Test Description',
      userId: mockUserId,
      priority: 'high'
    });

    const response = await request(app)
      .get(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.task.title).toBe('Test Task');
  });

  test('should update task', async () => {
    const token = await getAuthToken();

    const task = await Task.create({
      title: 'Original Task',
      description: 'Original Description',
      userId: mockUserId,
      priority: 'high'
    });

    const updateData = {
      title: 'Updated Task',
      description: 'Updated Description'
    };

    const response = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.task.title).toBe('Updated Task');
  });

  test('should delete task', async () => {
    const token = await getAuthToken();

    const task = await Task.create({
      title: 'Task to Delete',
      description: 'Description',
      userId: mockUserId,
      priority: 'high'
    });

    const response = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('deleted');
  });

  test('should mark task as completed', async () => {
    const token = await getAuthToken();

    const task = await Task.create({
      title: 'Task to Complete',
      description: 'Description',
      userId: mockUserId,
      priority: 'high'
    });

    const response = await request(app)
      .post(`/api/tasks/${task._id}/complete`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.task.completedAt).toBeDefined();
  });

  test('should get task statistics', async () => {
    const token = await getAuthToken();

    // Create test tasks
    const createdTasks = await Task.create([
      {
        userId: mockUserId,
        title: 'Completed Task 1',
        description: 'Description',
        priority: 'high',
        dueDate: new Date(),
        completedAt: new Date()
      },
      {
        userId: mockUserId,
        title: 'Pending Task',
        description: 'Description',
        priority: 'low',
        dueDate: new Date(),
        completedAt: null
      }
    ]);

    const response = await request(app)
      .get('/api/tasks/stats')
      .set('Authorization', `Bearer ${token}`);

    console.log('Stats response status:', response.status);
    console.log('Stats response body:', response.body);
    console.log('Created tasks count:', createdTasks.length);
    console.log('Mock user ID:', mockUserId);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.stats.total).toBe(2);
    expect(response.body.stats.completed).toBe(1);
    expect(response.body.stats.pending).toBe(1);
  });
});