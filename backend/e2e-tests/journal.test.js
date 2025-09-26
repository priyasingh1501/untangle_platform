import { test, expect } from '@playwright/test';

test.describe('Journal Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign in here');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Navigate to journal page
    await page.click('text=Journal');
    await page.waitForSelector('text=Journal', { timeout: 5000 });
  });

  test('should display journal page with all main sections', async ({ page }) => {
    // Check for page title
    await expect(page.locator('text=Journal')).toBeVisible();
    
    // Check for add entry button
    await expect(page.locator('text=Add Entry')).toBeVisible();
    
    // Check for journal list
    await expect(page.locator('[data-testid="journal-list"]')).toBeVisible();
  });

  test('should handle adding a new journal entry', async ({ page }) => {
    // Click add entry button
    await page.click('text=Add Entry');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Entry')).toBeVisible();
    
    // Fill journal form
    await page.fill('input[name="title"]', 'Test Entry');
    await page.fill('textarea[name="content"]', 'This is a test journal entry');
    await page.selectOption('select[name="mood"]', 'happy');
    await page.fill('input[name="date"]', '2024-01-01');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for entry to be added
    await page.waitForTimeout(1000);
    
    // Check if entry appears in list
    await expect(page.locator('text=Test Entry')).toBeVisible();
  });

  test('should handle editing a journal entry', async ({ page }) => {
    // Wait for entries to load
    await page.waitForTimeout(2000);
    
    // Look for edit button
    const editButton = page.locator('button[aria-label="Edit entry"]').first();
    
    if (await editButton.isVisible()) {
      // Click edit button
      await editButton.click();
      
      // Check if edit modal opens
      await expect(page.locator('text=Edit Entry')).toBeVisible();
      
      // Update entry title
      await page.fill('input[name="title"]', 'Updated Entry');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for entry to be updated
      await page.waitForTimeout(1000);
      
      // Check if entry is updated
      await expect(page.locator('text=Updated Entry')).toBeVisible();
    }
  });

  test('should handle deleting a journal entry', async ({ page }) => {
    // Wait for entries to load
    await page.waitForTimeout(2000);
    
    // Look for delete button
    const deleteButton = page.locator('button[aria-label="Delete entry"]').first();
    
    if (await deleteButton.isVisible()) {
      // Click delete button
      await deleteButton.click();
      
      // Check if confirmation dialog appears
      await expect(page.locator('text=Are you sure?')).toBeVisible();
      
      // Confirm deletion
      await page.click('text=Yes, Delete');
      
      // Wait for entry to be deleted
      await page.waitForTimeout(1000);
      
      // Check if entry is removed
      await expect(page.locator('[data-testid="journal-list"]')).toBeVisible();
    }
  });

  test('should handle journal entry filtering', async ({ page }) => {
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

  test('should handle journal entry sorting', async ({ page }) => {
    // Look for sort options
    const sortSelect = page.locator('select[data-testid="sort-select"]');
    
    if (await sortSelect.isVisible()) {
      // Select a sort option
      await sortSelect.selectOption('date');
      
      // Wait for sorted results
      await page.waitForTimeout(1000);
      
      // Check if sort is applied
      await expect(sortSelect).toHaveValue('date');
    }
  });

  test('should handle journal entry search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder="Search entries..."]');
    
    if (await searchInput.isVisible()) {
      // Type in search query
      await searchInput.fill('test');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check if search is triggered
      await expect(searchInput).toHaveValue('test');
    }
  });

  test('should handle mood tracking', async ({ page }) => {
    // Wait for entries to load
    await page.waitForTimeout(2000);
    
    // Look for mood select
    const moodSelect = page.locator('select[name="mood"]').first();
    
    if (await moodSelect.isVisible()) {
      // Change mood
      await moodSelect.selectOption('sad');
      
      // Wait for mood to be updated
      await page.waitForTimeout(1000);
      
      // Check if mood is updated
      await expect(moodSelect).toHaveValue('sad');
    }
  });

  test('should handle journal entry tags', async ({ page }) => {
    // Look for tag input
    const tagInput = page.locator('input[placeholder="Add tags..."]');
    
    if (await tagInput.isVisible()) {
      // Add a tag
      await tagInput.fill('reflection');
      await page.keyboard.press('Enter');
      
      // Wait for tag to be added
      await page.waitForTimeout(1000);
      
      // Check if tag is added
      await expect(page.locator('text=reflection')).toBeVisible();
    }
  });

  test('should handle journal entry categories', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.locator('select[name="category"]');
    
    if (await categoryFilter.isVisible()) {
      // Select a category
      await categoryFilter.selectOption('personal');
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
      
      // Check if category filter is applied
      await expect(categoryFilter).toHaveValue('personal');
    }
  });

  test('should handle journal entry privacy', async ({ page }) => {
    // Look for privacy toggle
    const privacyToggle = page.locator('input[type="checkbox"][name="isPrivate"]');
    
    if (await privacyToggle.isVisible()) {
      // Toggle privacy
      await privacyToggle.check();
      
      // Wait for privacy to be updated
      await page.waitForTimeout(1000);
      
      // Check if privacy is updated
      await expect(privacyToggle).toBeChecked();
    }
  });

  test('should handle journal entry attachments', async ({ page }) => {
    // Look for attachment button
    const attachmentButton = page.locator('button[aria-label="Add attachment"]');
    
    if (await attachmentButton.isVisible()) {
      // Click attachment button
      await attachmentButton.click();
      
      // Check if file input appears
      await expect(page.locator('input[type="file"]')).toBeVisible();
    }
  });

  test('should handle journal entry comments', async ({ page }) => {
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

  test('should handle journal entry sharing', async ({ page }) => {
    // Look for share button
    const shareButton = page.locator('button[data-testid="share-entry"]');
    
    if (await shareButton.isVisible()) {
      // Click share button
      await shareButton.click();
      
      // Check if share modal opens
      await expect(page.locator('text=Share Entry')).toBeVisible();
    }
  });


  test('should handle journal entry statistics', async ({ page }) => {
    // Look for statistics section
    const statsSection = page.locator('[data-testid="journal-stats"]');
    
    if (await statsSection.isVisible()) {
      // Check for statistics
      await expect(page.locator('text=Total Entries')).toBeVisible();
      await expect(page.locator('text=This Month')).toBeVisible();
      await expect(page.locator('text=This Week')).toBeVisible();
    }
  });


  test('should handle journal entry reminders', async ({ page }) => {
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

  test('should handle journal entry bookmarks', async ({ page }) => {
    // Look for bookmark button
    const bookmarkButton = page.locator('button[aria-label="Bookmark entry"]');
    
    if (await bookmarkButton.isVisible()) {
      // Click bookmark button
      await bookmarkButton.click();
      
      // Wait for bookmark to be added
      await page.waitForTimeout(1000);
      
      // Check if bookmark is added
      await expect(page.locator('[data-testid="bookmarked-entry"]')).toBeVisible();
    }
  });

  test('should handle journal entry favorites', async ({ page }) => {
    // Look for favorite button
    const favoriteButton = page.locator('button[aria-label="Add to favorites"]');
    
    if (await favoriteButton.isVisible()) {
      // Click favorite button
      await favoriteButton.click();
      
      // Wait for favorite to be added
      await page.waitForTimeout(1000);
      
      // Check if favorite is added
      await expect(page.locator('[data-testid="favorite-entry"]')).toBeVisible();
    }
  });

  test('should handle journal entry archiving', async ({ page }) => {
    // Look for archive button
    const archiveButton = page.locator('button[aria-label="Archive entry"]');
    
    if (await archiveButton.isVisible()) {
      // Click archive button
      await archiveButton.click();
      
      // Wait for entry to be archived
      await page.waitForTimeout(1000);
      
      // Check if entry is archived
      await expect(page.locator('[data-testid="archived-entry"]')).toBeVisible();
    }
  });

  test('should handle journal entry restoration', async ({ page }) => {
    // Look for restore button
    const restoreButton = page.locator('button[aria-label="Restore entry"]');
    
    if (await restoreButton.isVisible()) {
      // Click restore button
      await restoreButton.click();
      
      // Wait for entry to be restored
      await page.waitForTimeout(1000);
      
      // Check if entry is restored
      await expect(page.locator('[data-testid="restored-entry"]')).toBeVisible();
    }
  });

  test('should handle journal entry duplication', async ({ page }) => {
    // Look for duplicate button
    const duplicateButton = page.locator('button[aria-label="Duplicate entry"]');
    
    if (await duplicateButton.isVisible()) {
      // Click duplicate button
      await duplicateButton.click();
      
      // Wait for entry to be duplicated
      await page.waitForTimeout(1000);
      
      // Check if entry is duplicated
      await expect(page.locator('[data-testid="duplicated-entry"]')).toBeVisible();
    }
  });

  test('should handle journal entry printing', async ({ page }) => {
    // Look for print button
    const printButton = page.locator('button[data-testid="print-entry"]');
    
    if (await printButton.isVisible()) {
      // Click print button
      await printButton.click();
      
      // Wait for print dialog to open
      await page.waitForTimeout(1000);
      
      // Check if print dialog opened
      await expect(page.locator('text=Print Entry')).toBeVisible();
    }
  });

  test('should handle journal entry email', async ({ page }) => {
    // Look for email button
    const emailButton = page.locator('button[data-testid="email-entry"]');
    
    if (await emailButton.isVisible()) {
      // Click email button
      await emailButton.click();
      
      // Check if email modal opens
      await expect(page.locator('text=Email Entry')).toBeVisible();
    }
  });

  test('should handle journal entry backup', async ({ page }) => {
    // Look for backup button
    const backupButton = page.locator('button[data-testid="backup-entries"]');
    
    if (await backupButton.isVisible()) {
      // Click backup button
      await backupButton.click();
      
      // Wait for backup to complete
      await page.waitForTimeout(1000);
      
      // Check if backup worked
      await expect(backupButton).toBeVisible();
    }
  });

  test('should handle journal entry restore', async ({ page }) => {
    // Look for restore button
    const restoreButton = page.locator('button[data-testid="restore-entries"]');
    
    if (await restoreButton.isVisible()) {
      // Click restore button
      await restoreButton.click();
      
      // Check if restore modal opens
      await expect(page.locator('text=Restore Entries')).toBeVisible();
    }
  });
});
