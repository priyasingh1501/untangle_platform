import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should complete full registration flow', async ({ page }) => {
    // Click on sign up link
    await page.click('text=Sign up here');
    
    // Fill registration form
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Verify user is logged in
    expect(await page.textContent('h1')).toContain('Welcome back, John!');
  });

  test('should complete full login flow', async ({ page }) => {
    // Click on login link
    await page.click('text=Sign in here');
    
    // Fill login form
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Verify user is logged in
    expect(await page.textContent('h1')).toContain('Welcome back, John!');
  });

  test('should handle invalid login credentials', async ({ page }) => {
    // Click on login link
    await page.click('text=Sign in here');
    
    // Fill login form with invalid credentials
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=Invalid credentials', { timeout: 5000 });
    
    // Verify error message is displayed
    expect(await page.textContent('body')).toContain('Invalid credentials');
  });

  test('should handle registration with existing email', async ({ page }) => {
    // Click on sign up link
    await page.click('text=Sign up here');
    
    // Fill registration form with existing email
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=already exists', { timeout: 5000 });
    
    // Verify error message is displayed
    expect(await page.textContent('body')).toContain('already exists');
  });

  test('should handle password validation', async ({ page }) => {
    // Click on sign up link
    await page.click('text=Sign up here');
    
    // Fill registration form with weak password
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for validation error
    await page.waitForSelector('text=password', { timeout: 5000 });
    
    // Verify validation error is displayed
    expect(await page.textContent('body')).toContain('password');
  });

  test('should handle email validation', async ({ page }) => {
    // Click on sign up link
    await page.click('text=Sign up here');
    
    // Fill registration form with invalid email
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for validation error
    await page.waitForSelector('text=email', { timeout: 5000 });
    
    // Verify validation error is displayed
    expect(await page.textContent('body')).toContain('email');
  });

  test('should handle logout', async ({ page }) => {
    // First login
    await page.click('text=Sign in here');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login success
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Click logout button
    await page.click('button[aria-label="Logout"]');
    
    // Wait for redirect to login page
    await page.waitForSelector('text=Welcome back to Untangle', { timeout: 5000 });
    
    // Verify user is logged out
    expect(await page.textContent('h1')).toContain('Welcome back to Untangle');
  });

  test('should persist login state on page refresh', async ({ page }) => {
    // First login
    await page.click('text=Sign in here');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for login success
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Refresh page
    await page.reload();
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Welcome back, John!', { timeout: 10000 });
    
    // Verify user is still logged in
    expect(await page.textContent('h1')).toContain('Welcome back, John!');
  });

  test('should handle password visibility toggle', async ({ page }) => {
    // Click on login link
    await page.click('text=Sign in here');
    
    // Check password input type
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click visibility toggle
    await page.click('button[aria-label="Toggle password visibility"]');
    
    // Check password input type changed
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click visibility toggle again
    await page.click('button[aria-label="Toggle password visibility"]');
    
    // Check password input type changed back
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should handle form validation on empty submit', async ({ page }) => {
    // Click on login link
    await page.click('text=Sign in here');
    
    // Submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await page.waitForSelector('text=required', { timeout: 5000 });
    
    // Verify validation errors are displayed
    expect(await page.textContent('body')).toContain('required');
  });
});
