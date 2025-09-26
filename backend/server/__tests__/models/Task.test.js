import mongoose from 'mongoose';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import Task from '../../models/Task.js';
import Goal from '../../models/Goal.js';

// Create a mock ObjectId for testing
const mockUserId = new mongoose.Types.ObjectId();

describe('Task Model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up database
    await Task.deleteMany({});
    await Goal.deleteMany({});
  });

  test('should create a task with valid data', async () => {
    const taskData = {
      title: 'Test Task',
      description: 'Test Description',
      userId: mockUserId,
      priority: 'medium',
      dueDate: new Date('2024-12-31')
    };

    const task = await Task.create(taskData);

    expect(task.title).toBe('Test Task');
    expect(task.description).toBe('Test Description');
    expect(task.userId.toString()).toBe(mockUserId.toString());
    expect(task.priority).toBe('medium');
    expect(task.completedAt).toBeUndefined();
  });

  test('should create a task with goal association', async () => {
    // Create a goal first
    const goal = await Goal.create({
      name: 'Test Goal',
      description: 'Test Goal Description',
      userId: mockUserId,
      category: 'health'
    });

    const taskData = {
      title: 'Test Task with Goal',
      description: 'Test Description',
      userId: mockUserId,
      priority: 'high',
      goalIds: [goal._id]
    };

    const task = await Task.create(taskData);

    expect(task.title).toBe('Test Task with Goal');
    expect(task.goalIds).toHaveLength(1);
    expect(task.goalIds[0].toString()).toBe(goal._id.toString());
  });

  test('should mark task as completed', async () => {
    const task = await Task.create({
      title: 'Test Task',
      description: 'Test Description',
      userId: mockUserId,
      priority: 'medium'
    });

    task.completedAt = new Date();
    await task.save();

    expect(task.completedAt).toBeDefined();
  });

  test('should validate required fields', async () => {
    const taskData = {
      // Missing required fields
      description: 'Test Description'
    };

    await expect(Task.create(taskData)).rejects.toThrow();
  });
});

describe('Goal Model', () => {
  afterEach(async () => {
    await Goal.deleteMany({});
  });

  test('should create a goal with valid data', async () => {
    const goalData = {
      name: 'Test Goal',
      description: 'Test Goal Description',
      userId: mockUserId,
      category: 'health'
    };

    const goal = await Goal.create(goalData);

    expect(goal.name).toBe('Test Goal');
    expect(goal.description).toBe('Test Goal Description');
    expect(goal.userId.toString()).toBe(mockUserId.toString());
    expect(goal.category).toBe('health');
  });

  test('should validate required fields', async () => {
    const goalData = {
      // Missing required name field
      description: 'Test Goal Description',
      userId: mockUserId
    };

    await expect(Goal.create(goalData)).rejects.toThrow();
  });
});
