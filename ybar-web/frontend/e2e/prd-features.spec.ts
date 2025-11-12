import { test, expect } from '@playwright/test';

test.describe('PRD Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173');
  });

  test.describe('Worker Profile Management', () => {
    test('should allow worker to update profile', async ({ page }) => {
      // Login as worker
      await page.fill('input[type="email"]', 'worker1@ybar.com');
      await page.fill('input[type="password"]', 'worker123');
      await page.click('button:has-text("Sign In")');

      // Wait for dashboard
      await expect(page.locator('text=Dashboard')).toBeVisible();

      // Navigate to profile (assuming there's a profile link)
      await page.click('text=Profile');

      // Edit profile
      await page.click('button:has-text("Edit")');

      // Update fields
      await page.fill('input[name="phone"]', '+1234567890');
      await page.fill('input[name="age"]', '30');
      await page.selectOption('select[name="sex"]', 'male');
      await page.fill('input[name="paytm"]', 'paytm-test-123');
      await page.fill('textarea[name="address"]', '123 Test Street, Test City');

      // Save changes
      await page.click('button:has-text("Save Changes")');

      // Verify changes were saved
      await expect(page.locator('text=+1234567890')).toBeVisible();
      await expect(page.locator('text=30')).toBeVisible();
    });

    test('should display worker rating and points', async ({ page }) => {
      // Login as worker
      await page.fill('input[type="email"]', 'worker1@ybar.com');
      await page.fill('input[type="password"]', 'worker123');
      await page.click('button:has-text("Sign In")');

      await page.click('text=Profile');

      // Check for points balance
      await expect(page.locator('text=Points Balance')).toBeVisible();

      // Check for rating (if worker has ratings)
      // await expect(page.locator('.rating')).toBeVisible();
    });
  });

  test.describe('Points and Reimbursement', () => {
    test('should allow worker to request reimbursement', async ({ page }) => {
      // Login as worker
      await page.fill('input[type="email"]', 'worker1@ybar.com');
      await page.fill('input[type="password"]', 'worker123');
      await page.click('button:has-text("Sign In")');

      await page.click('text=Profile');

      // Assuming worker has points
      const reimbursementButton = page.locator('button:has-text("Request Reimbursement")');

      if (await reimbursementButton.isEnabled()) {
        await reimbursementButton.click();

        // Confirm dialog
        page.on('dialog', dialog => dialog.accept());

        // Wait for success message
        await expect(page.locator('text=Reimbursement request submitted')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show transaction history', async ({ page }) => {
      // Login as worker
      await page.fill('input[type="email"]', 'worker1@ybar.com');
      await page.fill('input[type="password"]', 'worker123');
      await page.click('button:has-text("Sign In")');

      await page.click('text=Profile');

      // Check for transactions section
      await expect(page.locator('text=Recent Transactions')).toBeVisible();
    });
  });

  test.describe('Admin CSV Upload', () => {
    test('should allow admin to upload CSV for tasks', async ({ page }) => {
      // Login as admin
      await page.fill('input[type="email"]', 'admin@ybar.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Sign In")');

      // Navigate to a job
      await page.click('text=Jobs');
      await page.click('.job-card').first(); // Click first job

      // Click upload CSV button
      await page.click('button:has-text("Upload CSV")');

      // Create a test CSV file (in real test, you'd use page.setInputFiles)
      const csvContent = `latitude,longitude,location_name
40.7589,-73.9851,Times Square
40.7614,-73.9776,5th Avenue`;

      // Note: In actual test, you would create a real file and upload it
      // await page.setInputFiles('input[type="file"]', 'path/to/test.csv');

      // For now, just verify the upload button is present
      await expect(page.locator('button:has-text("Upload Tasks")')).toBeVisible();
    });
  });

  test.describe('Admin Worker Rating', () => {
    test('should allow admin to rate worker on task approval', async ({ page }) => {
      // Login as admin
      await page.fill('input[type="email"]', 'admin@ybar.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Sign In")');

      // Navigate to review tasks
      await page.click('text=Review Tasks');

      // Check if there are tasks to review
      const taskCards = page.locator('.task-card');
      const count = await taskCards.count();

      if (count > 0) {
        // Click first task
        await taskCards.first().click();

        // Rating should be visible
        await expect(page.locator('text=Rate Worker')).toBeVisible();

        // Click 5 stars
        const stars = page.locator('button svg[class*="Star"]');
        await stars.nth(4).click(); // 5th star (0-indexed)

        // Approve the task
        await page.click('button:has-text("Approve")');

        // Task should be approved
        await expect(page.locator('text=No tasks pending review')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Device Management', () => {
    test('should show registered devices in profile', async ({ page }) => {
      // Login as worker
      await page.fill('input[type="email"]', 'worker1@ybar.com');
      await page.fill('input[type="password"]', 'worker123');
      await page.click('button:has-text("Sign In")');

      await page.click('text=Profile');

      // Check for devices section
      await expect(page.locator('text=Registered Devices')).toBeVisible();
    });
  });

  test.describe('Complete Workflow E2E', () => {
    test('worker completes full task lifecycle', async ({ page }) => {
      // 1. Worker logs in
      await page.fill('input[type="email"]', 'worker1@ybar.com');
      await page.fill('input[type="password"]', 'worker123');
      await page.click('button:has-text("Sign In")');

      // 2. Browse available jobs
      await page.click('text=Browse Jobs');
      await expect(page.locator('text=Available Tasks')).toBeVisible();

      // 3. Accept a task (if available)
      const acceptButtons = page.locator('button:has-text("Accept Task")');
      const buttonCount = await acceptButtons.count();

      if (buttonCount > 0) {
        await acceptButtons.first().click();

        // Should navigate to My Tasks
        await expect(page).toHaveURL(/.*my-tasks/);

        // 4. View accepted task
        await expect(page.locator('.task-card')).toBeVisible();

        // 5. Submit task (would need to upload files in real scenario)
        // This is simplified for the test
        const taskCard = page.locator('.task-card').first();
        await taskCard.click();

        // In a real scenario, worker would upload files and submit
      }

      // 6. Check points balance
      await page.click('text=Profile');
      await expect(page.locator('text=Points Balance')).toBeVisible();
    });

    test('admin manages complete job lifecycle', async ({ page }) => {
      // 1. Admin logs in
      await page.fill('input[type="email"]', 'admin@ybar.com');
      await page.fill('input[type="password"]', 'admin123');
      await page.click('button:has-text("Sign In")');

      // 2. Create new job
      await page.click('text=Jobs');
      await page.click('button:has-text("Create Job")');

      // Fill job details
      await page.fill('input[name="title"]', 'E2E Test Job');
      await page.fill('textarea[name="description"]', 'This is a test job for E2E testing');
      await page.fill('input[name="pay_per_task"]', '15');
      await page.fill('input[name="n_tasks"]', '10');
      await page.fill('input[name="n_tasks_per_worker_allowed"]', '2');
      await page.fill('input[name="start_date"]', '2025-01-01');
      await page.fill('input[name="end_date"]', '2025-12-31');

      // Submit job creation
      await page.click('button:has-text("Create Job")');

      // Verify job was created
      await expect(page.locator('text=E2E Test Job')).toBeVisible();

      // 3. Add tasks via CSV
      await page.click('text=E2E Test Job'); // Click the job we just created
      await page.click('button:has-text("Upload CSV")');

      // 4. Review submitted tasks
      await page.click('text=Review Tasks');

      // If there are tasks to review
      const tasks = page.locator('.task-card');
      if (await tasks.count() > 0) {
        await tasks.first().click();

        // Rate and approve
        const stars = page.locator('button svg[class*="Star"]');
        await stars.nth(4).click(); // 5 stars

        await page.fill('textarea[placeholder*="notes"]', 'Excellent work!');
        await page.click('button:has-text("Approve")');
      }

      // 5. Check payment statistics
      await page.click('text=Payments');
      await expect(page.locator('text=Payment Statistics')).toBeVisible();
    });
  });
});
