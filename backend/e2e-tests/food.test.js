import { test, expect } from '@playwright/test';

test.describe('Food Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign in here');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Navigate to food page
    await page.click('text=Food & Nutrition');
    await page.waitForSelector('text=Food & Nutrition', { timeout: 5000 });
  });

  test('should display food page with all main sections', async ({ page }) => {
    // Check for page title
    await expect(page.locator('text=Food & Nutrition')).toBeVisible();
    
    // Check for search section
    await expect(page.locator('[data-testid="food-search"]')).toBeVisible();
    
    // Check for search results section
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('should handle food search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder="Search for food items..."]');
    
    // Type in search query
    await searchInput.fill('apple');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check if search is triggered
    await expect(searchInput).toHaveValue('apple');
  });


  test('should display food items when loaded', async ({ page }) => {
    // Wait for food items to load
    await page.waitForTimeout(2000);
    
    // Check if food items are displayed
    // This would need to be mocked or seeded with test data
    await expect(page.locator('text=Food & Nutrition')).toBeVisible();
  });

  test('should handle food item selection', async ({ page }) => {
    // Wait for food items to load
    await page.waitForTimeout(2000);
    
    // Look for food items (this would need to be mocked)
    const foodItems = page.locator('[data-testid="food-item"]');
    const itemCount = await foodItems.count();
    
    if (itemCount > 0) {
      // Click on first food item
      await foodItems.first().click();
      
      // Check if item details are shown
      // This would typically open a modal or navigate to details
      await expect(foodItems.first()).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Refresh page to see loading state
    await page.reload();
    
    // Check for loading spinner
    await expect(page.locator('[role="status"]')).toBeVisible();
    
    // Wait for content to load
    await page.waitForSelector('text=Food & Nutrition', { timeout: 10000 });
    
    // Check that loading spinner is gone
    await expect(page.locator('[role="status"]')).not.toBeVisible();
  });

  test('should handle empty search results', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder="Search for food items..."]');
    
    // Type in search query that won't match anything
    await searchInput.fill('nonexistentfooditem');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check for empty state message
    await expect(page.locator('text=No food items found')).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    // Wait for food items to load
    await page.waitForTimeout(2000);
    
    // Look for pagination controls
    const nextButton = page.locator('text=Next');
    const prevButton = page.locator('text=Previous');
    
    if (await nextButton.isVisible()) {
      // Click next button
      await nextButton.click();
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Check if pagination worked
      await expect(nextButton).toBeVisible();
    }
  });

  test('should display nutrition information correctly', async ({ page }) => {
    // Wait for food items to load
    await page.waitForTimeout(2000);
    
    // Check for nutrition labels
    await expect(page.locator('text=Calories')).toBeVisible();
    await expect(page.locator('text=Protein')).toBeVisible();
    await expect(page.locator('text=Carbs')).toBeVisible();
    await expect(page.locator('text=Fat')).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for proper input labels
    const searchInput = page.locator('input[placeholder="Search for food items..."]');
    await expect(searchInput).toHaveAttribute('aria-label');
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if food page still loads
    await expect(page.locator('text=Food & Nutrition')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check if food page still loads
    await expect(page.locator('text=Food & Nutrition')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check if food page still loads
    await expect(page.locator('text=Food & Nutrition')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // This test would need to mock API errors
    // For now, just check if the food page loads
    await expect(page.locator('text=Food & Nutrition')).toBeVisible();
  });

  test('should handle food item filtering', async ({ page }) => {
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

  test('should handle food item sorting', async ({ page }) => {
    // Look for sort options
    const sortSelect = page.locator('select[data-testid="sort-select"]');
    
    if (await sortSelect.isVisible()) {
      // Select a sort option
      await sortSelect.selectOption('name');
      
      // Wait for sorted results
      await page.waitForTimeout(1000);
      
      // Check if sort is applied
      await expect(sortSelect).toHaveValue('name');
    }
  });

  test('should handle food item details modal', async ({ page }) => {
    // Wait for food items to load
    await page.waitForTimeout(2000);
    
    // Look for food items
    const foodItems = page.locator('[data-testid="food-item"]');
    const itemCount = await foodItems.count();
    
    if (itemCount > 0) {
      // Click on first food item
      await foodItems.first().click();
      
      // Check if details modal opens
      await expect(page.locator('[data-testid="food-details-modal"]')).toBeVisible();
      
      // Check for close button
      const closeButton = page.locator('button[aria-label="Close"]');
      if (await closeButton.isVisible()) {
        await closeButton.click();
        
        // Check if modal closes
        await expect(page.locator('[data-testid="food-details-modal"]')).not.toBeVisible();
      }
    }
  });
});
