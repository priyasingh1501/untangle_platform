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

describe('Tasks Routes', () => {
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

  describe('GET /api/tasks', () => {
    test('should get all tasks for user', async () => {
      const token = await getAuthToken();

      // Create test tasks
      await Task.create([
        {
          userId: mockUserId,
          title: 'Task 1',
          description: 'Description 1',
          priority: 'high',
          dueDate: new Date(),
          completedAt: null
        },
        {
          userId: mockUserId,
          title: 'Task 2',
          description: 'Description 2',
          priority: 'medium',
          dueDate: new Date(),
          completedAt: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tasks).toHaveLength(2);
    });

    test('should filter tasks by status', async () => {
      const token = await getAuthToken();

      // Create test tasks
      await Task.create([
        {
          userId: mockUserId,
          title: 'Completed Task',
          description: 'Description 1',
          priority: 'high',
          dueDate: new Date(),
          completedAt: new Date()
        },
        {
          userId: mockUserId,
          title: 'Pending Task',
          description: 'Description 2',
          priority: 'medium',
          dueDate: new Date(),
          completedAt: null
        }
      ]);

      const response = await request(app)
        .get('/api/tasks')
        .query({ status: 'completed' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].title).toBe('Completed Task');
    });

    test('should filter tasks by priority', async () => {
      const token = await getAuthToken();

      // Create test tasks
      await Task.create([
        {
          userId: mockUserId,
          title: 'High Priority Task',
          description: 'Description 1',
          priority: 'high',
          dueDate: new Date(),
          completedAt: null
        },
        {
          userId: mockUserId,
          title: 'Low Priority Task',
          description: 'Description 2',
          priority: 'low',
          dueDate: new Date(),
          completedAt: null
        }
      ]);

      const response = await request(app)
        .get('/api/tasks')
        .query({ priority: 'high' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].title).toBe('High Priority Task');
    });

    test('should filter tasks by date range', async () => {
      const token = await getAuthToken();
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create test tasks
      await Task.create([
        {
          userId: mockUserId,
          title: 'Today Task',
          description: 'Description 1',
          priority: 'high',
          dueDate: today,
          completedAt: null
        },
        {
          userId: mockUserId,
          title: 'Tomorrow Task',
          description: 'Description 2',
          priority: 'medium',
          dueDate: tomorrow,
          completedAt: null
        }
      ]);

      const response = await request(app)
        .get('/api/tasks')
        .query({ 
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].title).toBe('Today Task');
    });
  });

  describe('GET /api/tasks/:id', () => {
    test('should get task by id', async () => {
      const token = await getAuthToken();

      const task = await Task.create({
        userId: mockUserId,
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        dueDate: new Date(),
        completedAt: null
      });

      const response = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task.title).toBe('Test Task');
    });

    test('should return error for non-existent task', async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .get('/api/tasks/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });

    test('should return error for invalid id format', async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .get('/api/tasks/invalid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid ID format');
    });
  });

  describe('POST /api/tasks', () => {
    test('should create new task', async () => {
      const token = await getAuthToken();

      const taskData = {
        title: 'New Task',
        description: 'New Description',
        priority: 'medium',
        dueDate: new Date().toISOString(),
        goalIds: []
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.task.title).toBe('New Task');
      expect(response.body.task.userId).toBe(mockUserId.toString());
    });

    test('should create task with goal association', async () => {
      const token = await getAuthToken();

      // Create a goal first
      const goal = await LifestyleGoal.create({
        userId: mockUserId,
        name: 'Test Goal',
        description: 'Test Goal Description',
        category: 'health',
        color: '#10B981',
        isActive: true
      });

      const taskData = {
        title: 'New Task',
        description: 'New Description',
        priority: 'medium',
        dueDate: new Date().toISOString(),
        goalIds: [goal._id.toString()]
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.task.goalIds).toContain(goal._id.toString());
    });

    test('should return error for missing required fields', async () => {
      const token = await getAuthToken();

      const taskData = {
        description: 'New Description'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(taskData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should return error for invalid goal ids', async () => {
      const token = await getAuthToken();

      const taskData = {
        title: 'New Task',
        description: 'New Description',
        priority: 'medium',
        dueDate: new Date().toISOString(),
        goalIds: ['507f1f77bcf86cd799439011'] // Non-existent goal
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(taskData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid goal IDs');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    test('should update task', async () => {
      const token = await getAuthToken();

      const task = await Task.create({
        userId: mockUserId,
        title: 'Original Task',
        description: 'Original Description',
        priority: 'high',
        dueDate: new Date(),
        completedAt: null
      });

      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        priority: 'low'
      };

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task.title).toBe('Updated Task');
      expect(response.body.task.description).toBe('Updated Description');
      expect(response.body.task.priority).toBe('low');
    });

    test('should mark task as completed', async () => {
      const token = await getAuthToken();

      const task = await Task.create({
        userId: mockUserId,
        title: 'Task to Complete',
        description: 'Description',
        priority: 'high',
        dueDate: new Date(),
        completedAt: null
      });

      const updateData = {
        completedAt: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task.completedAt).toBeDefined();
    });

    test('should return error for non-existent task', async () => {
      const token = await getAuthToken();

      const updateData = {
        title: 'Updated Task'
      };

      const response = await request(app)
        .put('/api/tasks/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    test('should delete task', async () => {
      const token = await getAuthToken();

      const task = await Task.create({
        userId: mockUserId,
        title: 'Task to Delete',
        description: 'Description',
        priority: 'high',
        dueDate: new Date(),
        completedAt: null
      });

      const response = await request(app)
        .delete(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');

      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    test('should return error for non-existent task', async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .delete('/api/tasks/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });
  });

  describe('POST /api/tasks/:id/complete', () => {
    test('should mark task as completed', async () => {
      const token = await getAuthToken();

      const task = await Task.create({
        userId: mockUserId,
        title: 'Task to Complete',
        description: 'Description',
        priority: 'high',
        dueDate: new Date(),
        completedAt: null
      });

      const response = await request(app)
        .post(`/api/tasks/${task._id}/complete`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task.completedAt).toBeDefined();
    });

    test('should return error for non-existent task', async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .post('/api/tasks/507f1f77bcf86cd799439011/complete')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });
  });

  describe('POST /api/tasks/:id/uncomplete', () => {
    test('should mark task as uncompleted', async () => {
      const token = await getAuthToken();

      const task = await Task.create({
        userId: mockUserId,
        title: 'Completed Task',
        description: 'Description',
        priority: 'high',
        dueDate: new Date(),
        completedAt: new Date()
      });

      const response = await request(app)
        .post(`/api/tasks/${task._id}/uncomplete`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.task.completedAt).toBeNull();
    });

    test('should return error for non-existent task', async () => {
      const token = await getAuthToken();

      const response = await request(app)
        .post('/api/tasks/507f1f77bcf86cd799439011/uncomplete')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Task not found');
    });
  });

  describe('GET /api/tasks/stats', () => {
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
          title: 'Completed Task 2',
          description: 'Description',
          priority: 'medium',
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

      console.log('Created tasks:', createdTasks.length);
      console.log('Mock user ID:', mockUserId);
      console.log('Token user ID:', JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).userId);

      const response = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${token}`);

      if (response.status !== 200) {
        console.log('Stats error response:', response.body);
      }
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats.total).toBe(3);
      expect(response.body.stats.completed).toBe(2);
      expect(response.body.stats.pending).toBe(1);
    });

    test('should get task statistics for date range', async () => {
      const token = await getAuthToken();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Create test tasks
      await Task.create([
        {
          userId: mockUserId,
          title: 'Today Task',
          description: 'Description',
          priority: 'high',
          dueDate: today,
          completedAt: new Date()
        },
        {
          userId: mockUserId,
          title: 'Yesterday Task',
          description: 'Description',
          priority: 'medium',
          dueDate: yesterday,
          completedAt: new Date()
        }
      ]);

      const response = await request(app)
        .get('/api/tasks/stats')
        .query({ 
          startDate: today.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats.total).toBe(1);
      expect(response.body.stats.completed).toBe(1);
    });
  });
});