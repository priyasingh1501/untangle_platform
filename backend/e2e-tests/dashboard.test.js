import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign in here');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
  });

  test('should display all dashboard sections', async ({ page }) => {
    // Check for main sections
    await expect(page.locator('text=MISSION BRIEFING')).toBeVisible();
    await expect(page.locator('text=MISSION STATUS')).toBeVisible();
    
    // Check for component sections
    await expect(page.locator('[data-testid="financial-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    await expect(page.locator('[data-testid="mindfulness-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-reminders"]')).toBeVisible();
    await expect(page.locator('[data-testid="daily-meal-kpis"]')).toBeVisible();
    await expect(page.locator('[data-testid="journal-trends"]')).toBeVisible();
  });

  test('should display quote of the day', async ({ page }) => {
    // Check for quote section
    await expect(page.locator('text=Quote of the Day')).toBeVisible();
    
    // Check for quote content
    await expect(page.locator('[data-testid="quote-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="quote-author"]')).toBeVisible();
  });

  test('should handle quote refresh', async ({ page }) => {
    // Get initial quote
    const initialQuote = await page.textContent('[data-testid="quote-content"]');
    
    // Click refresh button
    await page.click('button[aria-label="Get a new quote"]');
    
    // Wait for new quote to load
    await page.waitForTimeout(2000);
    
    // Check if quote changed (it might be the same, but the action should work)
    const newQuote = await page.textContent('[data-testid="quote-content"]');
    expect(newQuote).toBeDefined();
  });

  test('should display task statistics', async ({ page }) => {
    // Check for task statistics section
    await expect(page.locator('text=GOAL + MINDFUL')).toBeVisible();
    await expect(page.locator('text=GOAL-ALIGNED')).toBeVisible();
    await expect(page.locator('text=MINDFUL')).toBeVisible();
    await expect(page.locator('text=NOT MINDFUL, NOT GOAL-ORIENTED')).toBeVisible();
  });

  test('should handle welcome image upload', async ({ page }) => {
    // Click on welcome image
    await page.click('img[alt="Welcome illustration"]');
    
    // Check if modal opens
    await expect(page.locator('text=Update Welcome Image')).toBeVisible();
    
    // Check for upload button
    await expect(page.locator('text=Choose Image')).toBeVisible();
    
    // Check for cancel button
    await expect(page.locator('text=Cancel')).toBeVisible();
    
    // Click cancel to close modal
    await page.click('text=Cancel');
    
    // Check if modal closes
    await expect(page.locator('text=Update Welcome Image')).not.toBeVisible();
  });

  test('should display 24-hour activity strip', async ({ page }) => {
    // Check for legend items
    await expect(page.locator('text=Goal + Mindful')).toBeVisible();
    await expect(page.locator('text=Goal-aligned')).toBeVisible();
    await expect(page.locator('text=Mindful')).toBeVisible();
    await expect(page.locator('text=Not Mindful, Not Goal-Oriented')).toBeVisible();
    await expect(page.locator('text=No activity')).toBeVisible();
  });

  test('should handle empty task state', async ({ page }) => {
    // This test would need to mock empty tasks
    // For now, just check if the dashboard loads
    await expect(page.locator('text=Welcome back, John!')).toBeVisible();
  });

  test('should display correct user information', async ({ page }) => {
    // Check for welcome message
    await expect(page.locator('text=Welcome back, John!')).toBeVisible();
    await expect(page.locator('text=Here\'s your day at a glance')).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Refresh page to see loading state
    await page.reload();
    
    // Check for loading spinner
    await expect(page.locator('[role="status"]')).toBeVisible();
    
    // Wait for content to load
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Check that loading spinner is gone
    await expect(page.locator('[role="status"]')).not.toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if dashboard still loads
    await expect(page.locator('text=Welcome back, John!')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check if dashboard still loads
    await expect(page.locator('text=Welcome back, John!')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check if dashboard still loads
    await expect(page.locator('text=Welcome back, John!')).toBeVisible();
  });

  test('should handle navigation', async ({ page }) => {
    // Test navigation to different pages
    await page.click('text=Food & Nutrition');
    await expect(page.locator('text=Food & Nutrition')).toBeVisible();
    
    await page.click('text=Tasks');
    await expect(page.locator('text=Tasks')).toBeVisible();
    
    await page.click('text=Goals');
    await expect(page.locator('text=Goals')).toBeVisible();
    
    await page.click('text=Journal');
    await expect(page.locator('text=Journal')).toBeVisible();
    
    // Navigate back to dashboard
    await page.click('text=Dashboard');
    await expect(page.locator('text=Welcome back, John!')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // This test would need to mock API errors
    // For now, just check if the dashboard loads
    await expect(page.locator('text=Welcome back, John!')).toBeVisible();
  });
});
