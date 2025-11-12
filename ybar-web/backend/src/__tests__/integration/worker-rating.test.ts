import request from 'supertest';
import express from 'express';
import { generateToken } from '../../middleware/auth';
import tasksRoutes from '../../routes/tasks';
import { testDb, createTestUser, createTestJob, createTestTask } from '../setup';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {}
}));

const app = express();
app.use(express.json());
app.use('/tasks', tasksRoutes);

describe('Worker Rating Integration Tests', () => {
  let dbModule: any;

  beforeEach(() => {
    dbModule = require('../../db');
    dbModule.default = testDb;
  });

  it('should rate worker when approving task', async () => {
    const admin = createTestUser(testDb, 'admin');
    const worker = createTestUser(testDb, 'worker');
    const job = createTestJob(testDb);
    const task = createTestTask(testDb, (job as any).id, (worker as any).id);

    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

    // Submit the task
    testDb.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('submitted', (task as any).id);

    const response = await request(app)
      .post(`/tasks/${(task as any).id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'approved',
        reviewer_notes: 'Great work!',
        worker_rating: 5
      });

    expect(response.status).toBe(200);

    // Verify rating was saved
    const updatedTask = testDb.prepare('SELECT worker_rating FROM tasks WHERE id = ?').get((task as any).id) as any;
    expect(updatedTask.worker_rating).toBe(5);
  });

  it('should create points when task is approved with rating', async () => {
    const admin = createTestUser(testDb, 'admin');
    const worker = createTestUser(testDb, 'worker');
    const job = createTestJob(testDb);
    const task = createTestTask(testDb, (job as any).id, (worker as any).id);

    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

    testDb.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('submitted', (task as any).id);

    await request(app)
      .post(`/tasks/${(task as any).id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'approved',
        worker_rating: 4
      });

    // Verify points were created
    const points = testDb.prepare('SELECT * FROM points WHERE user_id = ?').all((worker as any).id);
    expect(points).toHaveLength(1);
    expect((points[0] as any).points).toBe((job as any).pay_per_task);
    expect((points[0] as any).transaction_type).toBe('earned');
  });

  it('should reject invalid rating values', async () => {
    const admin = createTestUser(testDb, 'admin');
    const worker = createTestUser(testDb, 'worker');
    const job = createTestJob(testDb);
    const task = createTestTask(testDb, (job as any).id, (worker as any).id);

    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

    testDb.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('submitted', (task as any).id);

    // Try rating with 0 (below minimum)
    let response = await request(app)
      .post(`/tasks/${(task as any).id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'approved',
        worker_rating: 0
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('between 1 and 5');

    // Try rating with 6 (above maximum)
    response = await request(app)
      .post(`/tasks/${(task as any).id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'approved',
        worker_rating: 6
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('between 1 and 5');
  });

  it('should allow approval without rating', async () => {
    const admin = createTestUser(testDb, 'admin');
    const worker = createTestUser(testDb, 'worker');
    const job = createTestJob(testDb);
    const task = createTestTask(testDb, (job as any).id, (worker as any).id);

    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

    testDb.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('submitted', (task as any).id);

    const response = await request(app)
      .post(`/tasks/${(task as any).id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'approved'
      });

    expect(response.status).toBe(200);

    // Verify rating is null
    const updatedTask = testDb.prepare('SELECT worker_rating FROM tasks WHERE id = ?').get((task as any).id) as any;
    expect(updatedTask.worker_rating).toBeNull();
  });

  it('should calculate average rating correctly', async () => {
    const admin = createTestUser(testDb, 'admin');
    const worker = createTestUser(testDb, 'worker');
    const job = createTestJob(testDb);

    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

    // Create and approve multiple tasks with different ratings
    const ratings = [5, 4, 3, 5, 4];
    for (const rating of ratings) {
      const task = createTestTask(testDb, (job as any).id, (worker as any).id);
      testDb.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('submitted', (task as any).id);

      await request(app)
        .post(`/tasks/${(task as any).id}/review`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'approved',
          worker_rating: rating
        });
    }

    // Calculate expected average (5+4+3+5+4)/5 = 4.2
    const result = testDb.prepare(`
      SELECT AVG(worker_rating) as avg_rating, COUNT(worker_rating) as count
      FROM tasks
      WHERE worker_id = ? AND worker_rating IS NOT NULL
    `).get((worker as any).id) as any;

    expect(result.avg_rating).toBeCloseTo(4.2, 1);
    expect(result.count).toBe(5);
  });

  it('should not create points for rejected tasks', async () => {
    const admin = createTestUser(testDb, 'admin');
    const worker = createTestUser(testDb, 'worker');
    const job = createTestJob(testDb);
    const task = createTestTask(testDb, (job as any).id, (worker as any).id);

    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

    testDb.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('submitted', (task as any).id);

    await request(app)
      .post(`/tasks/${(task as any).id}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'rejected',
        reviewer_notes: 'Poor quality',
        worker_rating: 1
      });

    // Verify no points were created
    const points = testDb.prepare('SELECT * FROM points WHERE user_id = ?').all((worker as any).id);
    expect(points).toHaveLength(0);

    // But rating should still be saved
    const updatedTask = testDb.prepare('SELECT worker_rating FROM tasks WHERE id = ?').get((task as any).id) as any;
    expect(updatedTask.worker_rating).toBe(1);
  });
});
