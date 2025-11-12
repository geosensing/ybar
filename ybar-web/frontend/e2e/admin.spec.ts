import { test, expect } from '@playwright/test';

test.describe('Admin Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@ybar.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');

    // Check for stat cards
    await expect(page.locator('text=Active Jobs')).toBeVisible();
    await expect(page.locator('text=Pending Review')).toBeVisible();
    await expect(page.locator('text=Pending Payments')).toBeVisible();
  });

  test('should create a new job', async ({ page }) => {
    // Navigate to jobs page
    await page.click('text=Jobs');
    await expect(page).toHaveURL('/admin/jobs');

    // Open create job form
    await page.click('button:has-text("Create Job")');

    // Fill in job details
    await page.fill('input[name="title"]', 'E2E Test Job');
    await page.fill('input[name="location"]', 'Test City');
    await page.fill('textarea[name="description"]', 'This is a test job created by E2E test');
    await page.fill('input[name="pay_per_task"]', '20');
    await page.fill('input[name="n_tasks"]', '10');
    await page.fill('input[name="n_tasks_per_worker_allowed"]', '2');

    // Set dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await page.fill('input[name="start_date"]', startDate.toISOString().split('T')[0]);
    await page.fill('input[name="end_date"]', endDate.toISOString().split('T')[0]);

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Job")');

    // Verify job appears in list
    await expect(page.locator('text=E2E Test Job')).toBeVisible();
  });

  test('should view job details and add tasks', async ({ page }) => {
    // Navigate to jobs page
    await page.click('text=Jobs');

    // Click on first job
    const firstJob = page.locator('.shadow.rounded-lg').first();
    await firstJob.click();

    // Should be on job detail page
    await expect(page.locator('h1')).not.toBeEmpty();

    // Add a task
    await page.click('button:has-text("Add Task")');
    await page.fill('input[name="title"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'Test task description');
    await page.fill('input[name="location_name"]', 'Test Location');
    await page.fill('input[name="latitude"]', '40.7589');
    await page.fill('input[name="longitude"]', '-73.9851');

    await page.click('button[type="submit"]:has-text("Add Task")');

    // Verify task appears
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
  });

  test('should review and approve submitted tasks', async ({ page }) => {
    // Navigate to review page
    await page.click('text=Review Tasks');
    await expect(page).toHaveURL('/admin/review');

    // Check if there are tasks to review
    const tasksExist = await page.locator('.shadow.rounded-lg').count();

    if (tasksExist > 0) {
      // Click on first task
      await page.locator('.shadow.rounded-lg').first().click();

      // Should see review panel
      await expect(page.locator('button:has-text("Approve")')).toBeVisible();
      await expect(page.locator('button:has-text("Reject")')).toBeVisible();

      // Can add review notes
      await page.fill('textarea[placeholder*="notes"]', 'Great work!');

      // Approve task
      await page.click('button:has-text("Approve")');

      // Task should be removed from pending list or page should update
      await page.waitForTimeout(1000);
    }
  });

  test('should view and manage payments', async ({ page }) => {
    // Navigate to payments page
    await page.click('text=Payments');
    await expect(page).toHaveURL('/admin/payments');

    // Check for payment stats
    await expect(page.locator('text=Total Amount')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();

    // Filter buttons should work
    await page.click('button:has-text("Pending")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("Paid")');
    await page.waitForTimeout(500);

    await page.click('button:has-text("All")');
  });

  test('should logout successfully', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL('/login');
  });
});
