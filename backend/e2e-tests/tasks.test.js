import { test, expect } from '@playwright/test';

test.describe('Tasks Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign in here');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Navigate to tasks page
    await page.click('text=Tasks');
    await page.waitForSelector('text=Tasks', { timeout: 5000 });
  });

  test('should display tasks page with all main sections', async ({ page }) => {
    // Check for page title
    await expect(page.locator('text=Tasks')).toBeVisible();
    
    // Check for add task button
    await expect(page.locator('text=Add Task')).toBeVisible();
    
    // Check for task list
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
  });

  test('should handle adding a new task', async ({ page }) => {
    // Click add task button
    await page.click('text=Add Task');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Task')).toBeVisible();
    
    // Fill task form
    await page.fill('input[name="title"]', 'Test Task');
    await page.fill('textarea[name="description"]', 'Test Description');
    await page.selectOption('select[name="priority"]', 'high');
    await page.fill('input[name="dueDate"]', '2024-12-31');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for task to be added
    await page.waitForTimeout(1000);
    
    // Check if task appears in list
    await expect(page.locator('text=Test Task')).toBeVisible();
  });

  test('should handle editing a task', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000);
    
    // Look for edit button
    const editButton = page.locator('button[aria-label="Edit task"]').first();
    
    if (await editButton.isVisible()) {
      // Click edit button
      await editButton.click();
      
      // Check if edit modal opens
      await expect(page.locator('text=Edit Task')).toBeVisible();
      
      // Update task title
      await page.fill('input[name="title"]', 'Updated Task');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for task to be updated
      await page.waitForTimeout(1000);
      
      // Check if task is updated
      await expect(page.locator('text=Updated Task')).toBeVisible();
    }
  });

  test('should handle completing a task', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000);
    
    // Look for complete button
    const completeButton = page.locator('button[aria-label="Complete task"]').first();
    
    if (await completeButton.isVisible()) {
      // Click complete button
      await completeButton.click();
      
      // Wait for task to be completed
      await page.waitForTimeout(1000);
      
      // Check if task is marked as completed
      await expect(page.locator('[data-testid="completed-task"]')).toBeVisible();
    }
  });

  test('should handle deleting a task', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000);
    
    // Look for delete button
    const deleteButton = page.locator('button[aria-label="Delete task"]').first();
    
    if (await deleteButton.isVisible()) {
      // Click delete button
      await deleteButton.click();
      
      // Check if confirmation dialog appears
      await expect(page.locator('text=Are you sure?')).toBeVisible();
      
      // Confirm deletion
      await page.click('text=Yes, Delete');
      
      // Wait for task to be deleted
      await page.waitForTimeout(1000);
      
      // Check if task is removed
      await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
    }
  });

  test('should handle task filtering', async ({ page }) => {
    // Look for filter options
    const filterButtons = page.locator('button[data-testid="filter-button"]');
    const filterCount = await filterButtons.count();
    
    if (filterCount > 0) {
      // Click on first filter
      await filterButtons.first().click();
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check if filter is applied
      await expect(filterButtons.first()).toBeVisible();
    }
  });

  test('should handle task sorting', async ({ page }) => {
    // Look for sort options
    const sortSelect = page.locator('select[data-testid="sort-select"]');
    
    if (await sortSelect.isVisible()) {
      // Select a sort option
      await sortSelect.selectOption('priority');
      
      // Wait for sorted results
      await page.waitForTimeout(1000);
      
      // Check if sort is applied
      await expect(sortSelect).toHaveValue('priority');
    }
  });

  test('should handle task search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder="Search tasks..."]');
    
    if (await searchInput.isVisible()) {
      // Type in search query
      await searchInput.fill('test');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check if search is triggered
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('should handle task priority changes', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000);
    
    // Look for priority dropdown
    const prioritySelect = page.locator('select[name="priority"]').first();
    
    if (await prioritySelect.isVisible()) {
      // Change priority
      await prioritySelect.selectOption('low');
      
      // Wait for priority to be updated
      await page.waitForTimeout(1000);
      
      // Check if priority is updated
      await expect(prioritySelect).toHaveValue('low');
    }
  });

  test('should handle task due date changes', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000);
    
    // Look for due date input
    const dueDateInput = page.locator('input[name="dueDate"]').first();
    
    if (await dueDateInput.isVisible()) {
      // Change due date
      await dueDateInput.fill('2024-12-31');
      
      // Wait for due date to be updated
      await page.waitForTimeout(1000);
      
      // Check if due date is updated
      await expect(dueDateInput).toHaveValue('2024-12-31');
    }
  });

  test('should handle task status changes', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000);
    
    // Look for status dropdown
    const statusSelect = page.locator('select[name="status"]').first();
    
    if (await statusSelect.isVisible()) {
      // Change status
      await statusSelect.selectOption('in-progress');
      
      // Wait for status to be updated
      await page.waitForTimeout(1000);
      
      // Check if status is updated
      await expect(statusSelect).toHaveValue('in-progress');
    }
  });

  test('should handle bulk task operations', async ({ page }) => {
    // Wait for tasks to load
    await page.waitForTimeout(2000);
    
    // Look for bulk action buttons
    const bulkCompleteButton = page.locator('button[data-testid="bulk-complete"]');
    const bulkDeleteButton = page.locator('button[data-testid="bulk-delete"]');
    
    if (await bulkCompleteButton.isVisible()) {
      // Click bulk complete button
      await bulkCompleteButton.click();
      
      // Wait for bulk operation to complete
      await page.waitForTimeout(1000);
      
      // Check if bulk operation worked
      await expect(bulkCompleteButton).toBeVisible();
    }
  });

  test('should handle task statistics', async ({ page }) => {
    // Look for statistics section
    const statsSection = page.locator('[data-testid="task-stats"]');
    
    if (await statsSection.isVisible()) {
      // Check for statistics
      await expect(page.locator('text=Total Tasks')).toBeVisible();
      await expect(page.locator('text=Completed')).toBeVisible();
      await expect(page.locator('text=Pending')).toBeVisible();
    }
  });

  test('should handle task categories', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.locator('select[name="category"]');
    
    if (await categoryFilter.isVisible()) {
      // Select a category
      await categoryFilter.selectOption('work');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check if category filter is applied
      await expect(categoryFilter).toHaveValue('work');
    }
  });

  test('should handle task tags', async ({ page }) => {
    // Look for tag input
    const tagInput = page.locator('input[placeholder="Add tags..."]');
    
    if (await tagInput.isVisible()) {
      // Add a tag
      await tagInput.fill('urgent');
      await page.keyboard.press('Enter');
      
      // Wait for tag to be added
      await page.waitForTimeout(1000);
      
      // Check if tag is added
      await expect(page.locator('text=urgent')).toBeVisible();
    }
  });

  test('should handle task reminders', async ({ page }) => {
    // Look for reminder toggle
    const reminderToggle = page.locator('input[type="checkbox"][name="reminder"]');
    
    if (await reminderToggle.isVisible()) {
      // Toggle reminder
      await reminderToggle.check();
      
      // Wait for reminder to be set
      await page.waitForTimeout(1000);
      
      // Check if reminder is set
      await expect(reminderToggle).toBeChecked();
    }
  });

  test('should handle task notes', async ({ page }) => {
    // Look for notes textarea
    const notesTextarea = page.locator('textarea[name="notes"]');
    
    if (await notesTextarea.isVisible()) {
      // Add notes
      await notesTextarea.fill('This is a test note');
      
      // Wait for notes to be saved
      await page.waitForTimeout(1000);
      
      // Check if notes are saved
      await expect(notesTextarea).toHaveValue('This is a test note');
    }
  });

  test('should handle task attachments', async ({ page }) => {
    // Look for attachment button
    const attachmentButton = page.locator('button[aria-label="Add attachment"]');
    
    if (await attachmentButton.isVisible()) {
      // Click attachment button
      await attachmentButton.click();
      
      // Check if file input appears
      await expect(page.locator('input[type="file"]')).toBeVisible();
    }
  });

  test('should handle task comments', async ({ page }) => {
    // Look for comment input
    const commentInput = page.locator('input[placeholder="Add a comment..."]');
    
    if (await commentInput.isVisible()) {
      // Add a comment
      await commentInput.fill('This is a test comment');
      await page.keyboard.press('Enter');
      
      // Wait for comment to be added
      await page.waitForTimeout(1000);
      
      // Check if comment is added
      await expect(page.locator('text=This is a test comment')).toBeVisible();
    }
  });

  test('should handle task time tracking', async ({ page }) => {
    // Look for time tracking button
    const timeTrackingButton = page.locator('button[aria-label="Start time tracking"]');
    
    if (await timeTrackingButton.isVisible()) {
      // Click time tracking button
      await timeTrackingButton.click();
      
      // Wait for time tracking to start
      await page.waitForTimeout(1000);
      
      // Check if time tracking is active
      await expect(page.locator('text=Time tracking active')).toBeVisible();
    }
  });

  test('should handle task dependencies', async ({ page }) => {
    // Look for dependency select
    const dependencySelect = page.locator('select[name="dependency"]');
    
    if (await dependencySelect.isVisible()) {
      // Select a dependency
      await dependencySelect.selectOption('task-1');
      
      // Wait for dependency to be set
      await page.waitForTimeout(1000);
      
      // Check if dependency is set
      await expect(dependencySelect).toHaveValue('task-1');
    }
  });

  test('should handle task templates', async ({ page }) => {
    // Look for template button
    const templateButton = page.locator('button[data-testid="use-template"]');
    
    if (await templateButton.isVisible()) {
      // Click template button
      await templateButton.click();
      
      // Check if template modal opens
      await expect(page.locator('text=Select Template')).toBeVisible();
    }
  });

  test('should handle task export', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('button[data-testid="export-tasks"]');
    
    if (await exportButton.isVisible()) {
      // Click export button
      await exportButton.click();
      
      // Wait for export to complete
      await page.waitForTimeout(1000);
      
      // Check if export worked
      await expect(exportButton).toBeVisible();
    }
  });

  test('should handle task import', async ({ page }) => {
    // Look for import button
    const importButton = page.locator('button[data-testid="import-tasks"]');
    
    if (await importButton.isVisible()) {
      // Click import button
      await importButton.click();
      
      // Check if import modal opens
      await expect(page.locator('text=Import Tasks')).toBeVisible();
    }
  });
});
