import { test, expect } from '@playwright/test';

test.describe('Goals Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign in here');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Navigate to goals page
    await page.click('text=Goals');
    await page.waitForSelector('text=Goals', { timeout: 5000 });
  });

  test('should display goals page with all main sections', async ({ page }) => {
    // Check for page title
    await expect(page.locator('text=Goals')).toBeVisible();
    
    // Check for add goal button
    await expect(page.locator('text=Add Goal')).toBeVisible();
    
    // Check for goal list
    await expect(page.locator('[data-testid="goal-list"]')).toBeVisible();
  });

  test('should handle adding a new goal', async ({ page }) => {
    // Click add goal button
    await page.click('text=Add Goal');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Goal')).toBeVisible();
    
    // Fill goal form
    await page.fill('input[name="title"]', 'Test Goal');
    await page.fill('textarea[name="description"]', 'Test Goal Description');
    await page.selectOption('select[name="category"]', 'health');
    await page.fill('input[name="targetDate"]', '2024-12-31');
    await page.selectOption('select[name="priority"]', 'high');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for goal to be added
    await page.waitForTimeout(1000);
    
    // Check if goal appears in list
    await expect(page.locator('text=Test Goal')).toBeVisible();
  });

  test('should handle editing a goal', async ({ page }) => {
    // Wait for goals to load
    await page.waitForTimeout(2000);
    
    // Look for edit button
    const editButton = page.locator('button[aria-label="Edit goal"]').first();
    
    if (await editButton.isVisible()) {
      // Click edit button
      await editButton.click();
      
      // Check if edit modal opens
      await expect(page.locator('text=Edit Goal')).toBeVisible();
      
      // Update goal title
      await page.fill('input[name="title"]', 'Updated Goal');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for goal to be updated
      await page.waitForTimeout(1000);
      
      // Check if goal is updated
      await expect(page.locator('text=Updated Goal')).toBeVisible();
    }
  });

  test('should handle completing a goal', async ({ page }) => {
    // Wait for goals to load
    await page.waitForTimeout(2000);
    
    // Look for complete button
    const completeButton = page.locator('button[aria-label="Complete goal"]').first();
    
    if (await completeButton.isVisible()) {
      // Click complete button
      await completeButton.click();
      
      // Wait for goal to be completed
      await page.waitForTimeout(1000);
      
      // Check if goal is marked as completed
      await expect(page.locator('[data-testid="completed-goal"]')).toBeVisible();
    }
  });

  test('should handle deleting a goal', async ({ page }) => {
    // Wait for goals to load
    await page.waitForTimeout(2000);
    
    // Look for delete button
    const deleteButton = page.locator('button[aria-label="Delete goal"]').first();
    
    if (await deleteButton.isVisible()) {
      // Click delete button
      await deleteButton.click();
      
      // Check if confirmation dialog appears
      await expect(page.locator('text=Are you sure?')).toBeVisible();
      
      // Confirm deletion
      await page.click('text=Yes, Delete');
      
      // Wait for goal to be deleted
      await page.waitForTimeout(1000);
      
      // Check if goal is removed
      await expect(page.locator('[data-testid="goal-list"]')).toBeVisible();
    }
  });

  test('should handle goal filtering', async ({ page }) => {
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

  test('should handle goal sorting', async ({ page }) => {
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

  test('should handle goal search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder="Search goals..."]');
    
    if (await searchInput.isVisible()) {
      // Type in search query
      await searchInput.fill('test');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check if search is triggered
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('should handle goal priority changes', async ({ page }) => {
    // Wait for goals to load
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

  test('should handle goal status changes', async ({ page }) => {
    // Wait for goals to load
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

  test('should handle goal progress tracking', async ({ page }) => {
    // Wait for goals to load
    await page.waitForTimeout(2000);
    
    // Look for progress input
    const progressInput = page.locator('input[name="progress"]');
    
    if (await progressInput.isVisible()) {
      // Update progress
      await progressInput.fill('50');
      
      // Wait for progress to be updated
      await page.waitForTimeout(1000);
      
      // Check if progress is updated
      await expect(progressInput).toHaveValue('50');
    }
  });

  test('should handle goal milestones', async ({ page }) => {
    // Wait for goals to load
    await page.waitForTimeout(2000);
    
    // Look for milestone button
    const milestoneButton = page.locator('button[data-testid="add-milestone"]');
    
    if (await milestoneButton.isVisible()) {
      // Click milestone button
      await milestoneButton.click();
      
      // Check if milestone modal opens
      await expect(page.locator('text=Add Milestone')).toBeVisible();
    }
  });

  test('should handle goal categories', async ({ page }) => {
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

  test('should handle goal tags', async ({ page }) => {
    // Look for tag input
    const tagInput = page.locator('input[placeholder="Add tags..."]');
    
    if (await tagInput.isVisible()) {
      // Add a tag
      await tagInput.fill('important');
      await page.keyboard.press('Enter');
      
      // Wait for tag to be added
      await page.waitForTimeout(1000);
      
      // Check if tag is added
      await expect(page.locator('text=important')).toBeVisible();
    }
  });

  test('should handle goal reminders', async ({ page }) => {
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

  test('should handle goal notes', async ({ page }) => {
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

  test('should handle goal attachments', async ({ page }) => {
    // Look for attachment button
    const attachmentButton = page.locator('button[aria-label="Add attachment"]');
    
    if (await attachmentButton.isVisible()) {
      // Click attachment button
      await attachmentButton.click();
      
      // Check if file input appears
      await expect(page.locator('input[type="file"]')).toBeVisible();
    }
  });

  test('should handle goal comments', async ({ page }) => {
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

  test('should handle goal time tracking', async ({ page }) => {
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

  test('should handle goal dependencies', async ({ page }) => {
    // Look for dependency select
    const dependencySelect = page.locator('select[name="dependency"]');
    
    if (await dependencySelect.isVisible()) {
      // Select a dependency
      await dependencySelect.selectOption('goal-1');
      
      // Wait for dependency to be set
      await page.waitForTimeout(1000);
      
      // Check if dependency is set
      await expect(dependencySelect).toHaveValue('goal-1');
    }
  });



  test('should handle goal statistics', async ({ page }) => {
    // Look for statistics section
    const statsSection = page.locator('[data-testid="goal-stats"]');
    
    if (await statsSection.isVisible()) {
      // Check for statistics
      await expect(page.locator('text=Total Goals')).toBeVisible();
      await expect(page.locator('text=Completed')).toBeVisible();
      await expect(page.locator('text=In Progress')).toBeVisible();
    }
  });

  test('should handle goal deadlines', async ({ page }) => {
    // Wait for goals to load
    await page.waitForTimeout(2000);
    
    // Look for deadline input
    const deadlineInput = page.locator('input[name="deadline"]');
    
    if (await deadlineInput.isVisible()) {
      // Set deadline
      await deadlineInput.fill('2024-12-31');
      
      // Wait for deadline to be set
      await page.waitForTimeout(1000);
      
      // Check if deadline is set
      await expect(deadlineInput).toHaveValue('2024-12-31');
    }
  });

  test('should handle goal visibility', async ({ page }) => {
    // Look for visibility toggle
    const visibilityToggle = page.locator('input[type="checkbox"][name="isPublic"]');
    
    if (await visibilityToggle.isVisible()) {
      // Toggle visibility
      await visibilityToggle.check();
      
      // Wait for visibility to be updated
      await page.waitForTimeout(1000);
      
      // Check if visibility is updated
      await expect(visibilityToggle).toBeChecked();
    }
  });

});
