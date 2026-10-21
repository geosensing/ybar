import { test, expect } from '@playwright/test';
import { createTask, photo } from './fixtures';

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
    await expect(page.getByRole('heading', { name: /^Available Tasks/ })).toBeVisible();
    await expect(page.locator('text=Active Jobs')).toBeVisible();
  });

  test('should accept a task', async ({ page, request }) => {
    const { job, task } = await createTask(request);
    await page.getByRole('link', { name: 'Browse Jobs', exact: true }).click();
    await page.locator('select').selectOption(String(job.id));
    await page.getByRole('button', { name: 'Accept Task' }).click();
    await expect(page).toHaveURL('/worker/my-tasks');
    await expect(page.getByRole('heading', { name: task.title, exact: true })).toBeVisible();
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

  test('should view task details and submit', async ({ page, request }) => {
    const { task, worker } = await createTask(request);
    await expect(await request.post(`/api/tasks/${task.id}/assign`, { headers: worker.headers })).toBeOK();
    await page.goto(`/worker/tasks/${task.id}`);
    await page.locator('textarea').fill('Task completed successfully.');
    await page.locator('input[type="file"]').setInputFiles(photo);
    await page.getByRole('button', { name: 'Submit Task', exact: true }).click();
    await expect(page).toHaveURL('/worker/my-tasks');
    const response = await request.get(`/api/tasks/${task.id}`, { headers: worker.headers });
    const result = (await response.json()).task;
    expect(result.status).toBe('submitted');
    expect(result.files).toHaveLength(1);
  });

  test('should view payments', async ({ page }) => {
    // Navigate to payments page
    await page.click('text=Payments');
    await expect(page).toHaveURL('/worker/payments');

    // Check for payment stats
    await expect(page.locator('text=Total Paid')).toBeVisible();
    await expect(page.getByText('Pending', { exact: true })).toBeVisible();

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
