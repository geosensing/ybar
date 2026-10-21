import { test, expect, Page } from '@playwright/test';
import { credentials, createTask, submittedTask } from './fixtures';

async function login(page: Page, role: 'admin' | 'worker') {
  await page.goto('/login');
  await page.fill('input[type="email"]', role === 'admin' ? 'admin@ybar.com' : 'worker1@ybar.com');
  await page.fill('input[type="password"]', `${role}123`);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(`/${role}`);
}


test.describe('PRD Features E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/');
  });

  test.describe('Worker Profile Management', () => {
    test('should allow worker to update profile', async ({ page }) => {
      // Login as worker
      await page.fill('input[type="email"]', 'worker1@ybar.com');
      await page.fill('input[type="password"]', 'worker123');
      await page.click('button:has-text("Sign In")');

      // Wait for dashboard
      await expect(page.getByRole('heading', { name: 'Worker Dashboard' })).toBeVisible();

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

    });
  });

  test.describe('Points and Reimbursement', () => {
    test('should allow worker to request reimbursement', async ({ page, request }) => {
      const admin = await credentials(request, 'admin');
      const worker = await credentials(request, 'worker');
      await expect(await request.put('/api/profile', {
        headers: worker.headers, data: { paytm: 'browser-fixture' },
      })).toBeOK();
      await expect(await request.post('/api/points/admin/adjust', {
        headers: admin.headers, data: { user_id: worker.user.id, points: 20, description: 'Browser fixture' },
      })).toBeOK();
      await login(page, 'worker');
      await page.getByRole('link', { name: 'Profile' }).click();
      page.on('dialog', dialog => dialog.accept());
      const responsePromise = page.waitForResponse(response => response.url().endsWith('/points/reimburse'));
      await page.getByRole('button', { name: 'Request Reimbursement' }).click();
      expect((await responsePromise).ok()).toBe(true);
      await expect(page.getByRole('button', { name: 'Request Reimbursement' })).toBeDisabled();
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

  test('uploads CSV content and displays the created tasks', async ({ page, request }) => {
    const { job } = await createTask(request);
    await login(page, 'admin');
    await page.goto(`/admin/jobs/${job.id}`);
    await page.getByRole('button', { name: 'Upload CSV' }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: 'tasks.csv', mimeType: 'text/csv',
      buffer: Buffer.from('latitude,longitude,location_name,title,description\n40.75,-73.98,Times Square,CSV browser task,Collect a photo'),
    });
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Upload Tasks' }).click();
    await expect(page.getByText('CSV browser task', { exact: true })).toBeVisible();
  });

  test('rates a worker when approving a submitted task', async ({ page, request }) => {
    const { task, admin } = await submittedTask(request);
    await login(page, 'admin');
    await page.getByRole('link', { name: 'Review Tasks' }).click();
    await page.getByRole('heading', { name: task.title, exact: true }).click();
    await page.getByRole('button', { name: 'Rate 5 stars' }).click();
    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(page.getByRole('heading', { name: task.title, exact: true })).toHaveCount(0);
    const response = await request.get(`/api/tasks/${task.id}`, { headers: admin.headers });
    expect((await response.json()).task.worker_rating).toBe(5);
  });

  test('shows registered devices in the worker profile', async ({ page, request }) => {
    const worker = await credentials(request, 'worker');
    await expect(await request.post('/api/devices/register', {
      headers: worker.headers,
      data: { device_id: `browser-${Date.now()}`, device_name: 'Browser fixture phone', device_type: 'android' },
    })).toBeOK();
    await login(page, 'worker');
    await page.getByRole('link', { name: 'Profile' }).click();
    await expect(page.getByText('Registered Devices', { exact: true })).toBeVisible();
    await expect(page.getByText('Browser fixture phone', { exact: true })).toBeVisible();
  });
});
