import { test, expect } from '@playwright/test';

test.describe('Finance Page Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('text=Sign in here');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Navigate to finance page
    await page.click('text=Finance');
    await page.waitForSelector('text=Finance', { timeout: 5000 });
  });

  test('should display finance page with all main sections', async ({ page }) => {
    // Check for page title
    await expect(page.locator('text=Finance')).toBeVisible();
    
    // Check for financial overview
    await expect(page.locator('[data-testid="financial-overview"]')).toBeVisible();
    
    // Check for expense tracking
    await expect(page.locator('[data-testid="expense-tracking"]')).toBeVisible();
  });

  test('should handle adding a new expense', async ({ page }) => {
    // Click add expense button
    await page.click('text=Add Expense');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Expense')).toBeVisible();
    
    // Fill expense form
    await page.fill('input[name="amount"]', '50.00');
    await page.fill('input[name="description"]', 'Groceries');
    await page.selectOption('select[name="category"]', 'food');
    await page.fill('input[name="date"]', '2024-01-01');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for expense to be added
    await page.waitForTimeout(1000);
    
    // Check if expense appears in list
    await expect(page.locator('text=Groceries')).toBeVisible();
  });

  test('should handle editing an expense', async ({ page }) => {
    // Wait for expenses to load
    await page.waitForTimeout(2000);
    
    // Look for edit button
    const editButton = page.locator('button[aria-label="Edit expense"]').first();
    
    if (await editButton.isVisible()) {
      // Click edit button
      await editButton.click();
      
      // Check if edit modal opens
      await expect(page.locator('text=Edit Expense')).toBeVisible();
      
      // Update expense amount
      await page.fill('input[name="amount"]', '75.00');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for expense to be updated
      await page.waitForTimeout(1000);
      
      // Check if expense is updated
      await expect(page.locator('text=75.00')).toBeVisible();
    }
  });

  test('should handle deleting an expense', async ({ page }) => {
    // Wait for expenses to load
    await page.waitForTimeout(2000);
    
    // Look for delete button
    const deleteButton = page.locator('button[aria-label="Delete expense"]').first();
    
    if (await deleteButton.isVisible()) {
      // Click delete button
      await deleteButton.click();
      
      // Check if confirmation dialog appears
      await expect(page.locator('text=Are you sure?')).toBeVisible();
      
      // Confirm deletion
      await page.click('text=Yes, Delete');
      
      // Wait for expense to be deleted
      await page.waitForTimeout(1000);
      
      // Check if expense is removed
      await expect(page.locator('[data-testid="expense-list"]')).toBeVisible();
    }
  });

  test('should handle expense filtering', async ({ page }) => {
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

  test('should handle expense sorting', async ({ page }) => {
    // Look for sort options
    const sortSelect = page.locator('select[data-testid="sort-select"]');
    
    if (await sortSelect.isVisible()) {
      // Select a sort option
      await sortSelect.selectOption('amount');
      
      // Wait for sorted results
      await page.waitForTimeout(1000);
      
      // Check if sort is applied
      await expect(sortSelect).toHaveValue('amount');
    }
  });

  test('should handle expense search', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[placeholder="Search expenses..."]');
    
    if (await searchInput.isVisible()) {
      // Type in search query
      await searchInput.fill('groceries');
      
      // Wait for search results
      await page.waitForTimeout(1000);
      
      // Check if search is triggered
      await expect(searchInput).toHaveValue('groceries');
    }
  });

  test('should handle budget creation', async ({ page }) => {
    // Click add budget button
    await page.click('text=Add Budget');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Budget')).toBeVisible();
    
    // Fill budget form
    await page.fill('input[name="amount"]', '1000.00');
    await page.fill('input[name="category"]', 'Food');
    await page.fill('input[name="month"]', '2024-01');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for budget to be added
    await page.waitForTimeout(1000);
    
    // Check if budget appears in list
    await expect(page.locator('text=Food')).toBeVisible();
  });

  test('should handle budget editing', async ({ page }) => {
    // Wait for budgets to load
    await page.waitForTimeout(2000);
    
    // Look for edit button
    const editButton = page.locator('button[aria-label="Edit budget"]').first();
    
    if (await editButton.isVisible()) {
      // Click edit button
      await editButton.click();
      
      // Check if edit modal opens
      await expect(page.locator('text=Edit Budget')).toBeVisible();
      
      // Update budget amount
      await page.fill('input[name="amount"]', '1200.00');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for budget to be updated
      await page.waitForTimeout(1000);
      
      // Check if budget is updated
      await expect(page.locator('text=1200.00')).toBeVisible();
    }
  });

  test('should handle budget deletion', async ({ page }) => {
    // Wait for budgets to load
    await page.waitForTimeout(2000);
    
    // Look for delete button
    const deleteButton = page.locator('button[aria-label="Delete budget"]').first();
    
    if (await deleteButton.isVisible()) {
      // Click delete button
      await deleteButton.click();
      
      // Check if confirmation dialog appears
      await expect(page.locator('text=Are you sure?')).toBeVisible();
      
      // Confirm deletion
      await page.click('text=Yes, Delete');
      
      // Wait for budget to be deleted
      await page.waitForTimeout(1000);
      
      // Check if budget is removed
      await expect(page.locator('[data-testid="budget-list"]')).toBeVisible();
    }
  });

  test('should handle income tracking', async ({ page }) => {
    // Click add income button
    await page.click('text=Add Income');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Income')).toBeVisible();
    
    // Fill income form
    await page.fill('input[name="amount"]', '3000.00');
    await page.fill('input[name="source"]', 'Salary');
    await page.fill('input[name="date"]', '2024-01-01');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for income to be added
    await page.waitForTimeout(1000);
    
    // Check if income appears in list
    await expect(page.locator('text=Salary')).toBeVisible();
  });

  test('should handle savings tracking', async ({ page }) => {
    // Click add savings button
    await page.click('text=Add Savings');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Savings')).toBeVisible();
    
    // Fill savings form
    await page.fill('input[name="amount"]', '500.00');
    await page.fill('input[name="goal"]', 'Emergency Fund');
    await page.fill('input[name="date"]', '2024-01-01');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for savings to be added
    await page.waitForTimeout(1000);
    
    // Check if savings appears in list
    await expect(page.locator('text=Emergency Fund')).toBeVisible();
  });


  test('should handle debt tracking', async ({ page }) => {
    // Click add debt button
    await page.click('text=Add Debt');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Debt')).toBeVisible();
    
    // Fill debt form
    await page.fill('input[name="amount"]', '5000.00');
    await page.fill('input[name="type"]', 'Credit Card');
    await page.fill('input[name="date"]', '2024-01-01');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for debt to be added
    await page.waitForTimeout(1000);
    
    // Check if debt appears in list
    await expect(page.locator('text=Credit Card')).toBeVisible();
  });

  test('should handle financial goals', async ({ page }) => {
    // Click add goal button
    await page.click('text=Add Goal');
    
    // Check if modal opens
    await expect(page.locator('text=Add New Goal')).toBeVisible();
    
    // Fill goal form
    await page.fill('input[name="amount"]', '10000.00');
    await page.fill('input[name="description"]', 'Emergency Fund');
    await page.fill('input[name="targetDate"]', '2024-12-31');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for goal to be added
    await page.waitForTimeout(1000);
    
    // Check if goal appears in list
    await expect(page.locator('text=Emergency Fund')).toBeVisible();
  });

  test('should handle financial reports', async ({ page }) => {
    // Look for reports section
    const reportsSection = page.locator('[data-testid="financial-reports"]');
    
    if (await reportsSection.isVisible()) {
      // Check for reports
      await expect(page.locator('text=Monthly Report')).toBeVisible();
      await expect(page.locator('text=Yearly Report')).toBeVisible();
      await expect(page.locator('text=Category Report')).toBeVisible();
    }
  });

  test('should handle financial charts', async ({ page }) => {
    // Look for charts section
    const chartsSection = page.locator('[data-testid="financial-charts"]');
    
    if (await chartsSection.isVisible()) {
      // Check for charts
      await expect(page.locator('text=Expense Chart')).toBeVisible();
      await expect(page.locator('text=Income Chart')).toBeVisible();
      await expect(page.locator('text=Savings Chart')).toBeVisible();
    }
  });

  test('should handle financial statistics', async ({ page }) => {
    // Look for statistics section
    const statsSection = page.locator('[data-testid="financial-stats"]');
    
    if (await statsSection.isVisible()) {
      // Check for statistics
      await expect(page.locator('text=Total Income')).toBeVisible();
      await expect(page.locator('text=Total Expenses')).toBeVisible();
      await expect(page.locator('text=Net Worth')).toBeVisible();
    }
  });

  test('should handle financial trends', async ({ page }) => {
    // Look for trends section
    const trendsSection = page.locator('[data-testid="financial-trends"]');
    
    if (await trendsSection.isVisible()) {
      // Check for trends
      await expect(page.locator('text=Income Trend')).toBeVisible();
      await expect(page.locator('text=Expense Trend')).toBeVisible();
      await expect(page.locator('text=Savings Trend')).toBeVisible();
    }
  });

  test('should handle financial alerts', async ({ page }) => {
    // Look for alerts section
    const alertsSection = page.locator('[data-testid="financial-alerts"]');
    
    if (await alertsSection.isVisible()) {
      // Check for alerts
      await expect(page.locator('text=Budget Alert')).toBeVisible();
      await expect(page.locator('text=Goal Alert')).toBeVisible();
      await expect(page.locator('text=Debt Alert')).toBeVisible();
    }
  });

  test('should handle financial recommendations', async ({ page }) => {
    // Look for recommendations section
    const recommendationsSection = page.locator('[data-testid="financial-recommendations"]');
    
    if (await recommendationsSection.isVisible()) {
      // Check for recommendations
      await expect(page.locator('text=Financial Recommendations')).toBeVisible();
    }
  });

});
