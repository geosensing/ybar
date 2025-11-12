import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('ybar');
    await expect(page.locator('h2')).toContainText('Sign in to your account');
  });

  test('should login as admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@ybar.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });

  test('should login as worker', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'worker1@ybar.com');
    await page.fill('input[type="password"]', 'worker123');
    await page.click('button[type="submit"]');

    // Should redirect to worker dashboard
    await expect(page).toHaveURL('/worker');
    await expect(page.locator('text=Worker Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });
});
