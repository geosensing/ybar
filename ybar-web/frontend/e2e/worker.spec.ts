import { test, expect } from '@playwright/test';

test.describe('Worker Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as worker
    await page.goto('/login');
    await page.fill('input[type="email"]', 'worker1@ybar.com');
    await page.fill('input[type="password"]', 'worker123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/worker');
  });

  test('should display worker dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/worker');
    await expect(page.locator('h1')).toContainText('Worker Dashboard');

    // Check for stat cards
    await expect(page.locator('text=Active Tasks')).toBeVisible();
    await expect(page.locator('text=Total Earnings')).toBeVisible();
  });

  test('should browse available jobs', async ({ page }) => {
    // Navigate to jobs page
    await page.click('text=Browse Jobs');
    await expect(page).toHaveURL('/worker/jobs');

    // Should see available jobs section
    await expect(page.locator('text=Available Tasks')).toBeVisible();
    await expect(page.locator('text=Active Jobs')).toBeVisible();
  });

  test('should accept a task', async ({ page }) => {
    // Navigate to jobs page
    await page.click('text=Browse Jobs');

    // Check if there are available tasks
    const tasksExist = await page.locator('button:has-text("Accept Task")').count();

    if (tasksExist > 0) {
      // Accept first available task
      await page.locator('button:has-text("Accept Task")').first().click();

      // Should redirect to my tasks
      await expect(page).toHaveURL('/worker/my-tasks');

      // Should see the accepted task
      await expect(page.locator('.shadow.rounded-lg')).toHaveCount(1, { timeout: 5000 });
    } else {
      console.log('No available tasks to accept in this test run');
    }
  });

  test('should view my tasks', async ({ page }) => {
    // Navigate to my tasks
    await page.click('text=My Tasks');
    await expect(page).toHaveURL('/worker/my-tasks');

    // Filter buttons should be visible
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Active")')).toBeVisible();
    await expect(page.locator('button:has-text("Submitted")')).toBeVisible();
    await expect(page.locator('button:has-text("Approved")')).toBeVisible();
  });

  test('should view task details and submit', async ({ page }) => {
    // Navigate to my tasks
    await page.click('text=My Tasks');

    // Filter to active tasks
    await page.click('button:has-text("Active")');

    // Check if there are active tasks
    const tasksExist = await page.locator('.shadow.rounded-lg').count();

    if (tasksExist > 0) {
      // Click on first task
      await page.locator('.shadow.rounded-lg').first().click();

      // Should be on task detail page
      await expect(page.locator('text=Submit Task')).toBeVisible();

      // Fill in submission notes
      await page.fill('textarea[placeholder*="notes"]', 'Task completed successfully. Photos taken as requested.');

      // Note: File upload in E2E tests requires more complex setup
      // For now, we'll just verify the form elements exist
      await expect(page.locator('input[type="file"]')).toBeVisible();

      // Submit the task
      await page.click('button[type="submit"]:has-text("Submit Task")');

      // Should redirect back to my tasks
      await expect(page).toHaveURL('/worker/my-tasks');
    } else {
      console.log('No active tasks to submit in this test run');
    }
  });

  test('should view payments', async ({ page }) => {
    // Navigate to payments page
    await page.click('text=Payments');
    await expect(page).toHaveURL('/worker/payments');

    // Check for payment stats
    await expect(page.locator('text=Total Paid')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();

    // Payment history table should be visible
    await expect(page.locator('text=Payment History')).toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    // Navigate to my tasks
    await page.click('text=My Tasks');

    // Test each filter
    await page.click('button:has-text("Active")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Submitted")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Approved")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("All")');
  });

  test('should logout successfully', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');
  });
});
