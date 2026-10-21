import { APIRequestContext, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export async function credentials(request: APIRequestContext, role: 'admin' | 'worker') {
  const response = await request.post('/api/auth/login', {
    data: { email: role === 'admin' ? 'admin@ybar.com' : 'worker1@ybar.com', password: `${role}123` },
  });
  await expect(response).toBeOK();
  const { token, user } = await response.json();
  return { headers: { Authorization: `Bearer ${token}` }, user };
}

export async function createTask(request: APIRequestContext) {
  const admin = await credentials(request, 'admin');
  const worker = await credentials(request, 'worker');
  const title = `Browser fixture ${randomUUID()}`;
  const response = await request.post('/api/jobs', {
    headers: admin.headers,
    data: { title, description: 'Browser integration fixture', pay_per_task: 20,
      n_tasks: 10, n_tasks_per_worker_allowed: 10, status: 'active',
      start_date: '2020-01-01', end_date: '2099-12-31' },
  });
  await expect(response).toBeOK();
  const { job } = await response.json();
  const taskResponse = await request.post('/api/tasks', {
    headers: admin.headers, data: { job_id: job.id, title: `${title} task`, description: 'Collect a photo' },
  });
  await expect(taskResponse).toBeOK();
  const { task } = await taskResponse.json();
  return { admin, worker, job, task };
}

export async function submittedTask(request: APIRequestContext) {
  const fixture = await createTask(request);
  await expect(await request.post(`/api/tasks/${fixture.task.id}/assign`, { headers: fixture.worker.headers })).toBeOK();
  await expect(await request.post(`/api/tasks/${fixture.task.id}/submit`, {
    headers: fixture.worker.headers, multipart: { submission_data: 'Completed fixture' },
  })).toBeOK();
  return fixture;
}

export const photo = {
  name: 'fixture.png', mimeType: 'image/png',
  buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aJ1sAAAAASUVORK5CYII=', 'base64'),
};
