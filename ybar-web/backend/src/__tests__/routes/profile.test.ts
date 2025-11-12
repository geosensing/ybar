import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../middleware/auth';
import profileRoutes from '../../routes/profile';
import { testDb, createTestUser } from '../setup';

// Mock the db module
jest.mock('../../db', () => ({
  __esModule: true,
  default: {} // Will be replaced in tests
}));

const app = express();
app.use(express.json());
app.use('/profile', profileRoutes);

describe('Profile Routes', () => {
  let dbModule: any;

  beforeEach(() => {
    // Replace the mocked db with testDb
    dbModule = require('../../db');
    dbModule.default = testDb;
  });

  describe('GET /profile', () => {
    it('should return user profile with ratings for workers', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      // Create a task with rating
      const job = testDb.prepare(`
        INSERT INTO jobs (title, description, pay_per_task, n_tasks, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Job', 'Desc', 10, 1, '2025-01-01', '2025-12-31');

      testDb.prepare(`
        INSERT INTO tasks (job_id, worker_id, title, description, status, worker_rating)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(job.lastInsertRowid, (user as any).id, 'Task', 'Desc', 'approved', 5);

      const response = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id', (user as any).id);
      expect(response.body.user).toHaveProperty('average_rating', 5);
      expect(response.body.user).toHaveProperty('total_ratings', 1);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/profile');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /profile', () => {
    it('should update user profile', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const updates = {
        name: 'Updated Name',
        phone: '+1234567890',
        age: 30,
        paytm: 'paytm123'
      };

      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('name', 'Updated Name');
      expect(response.body.user).toHaveProperty('phone', '+1234567890');
      expect(response.body.user).toHaveProperty('age', 30);
      expect(response.body.user).toHaveProperty('paytm', 'paytm123');
    });

    it('should reject empty updates', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const response = await request(app)
        .put('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No valid fields');
    });
  });

  describe('DELETE /profile', () => {
    it('should delete user account with correct password', async () => {
      const password = 'testpassword';
      const passwordHash = bcrypt.hashSync(password, 10);

      const result = testDb.prepare(`
        INSERT INTO users (email, password_hash, role, name)
        VALUES (?, ?, ?, ?)
      `).run('delete@test.com', passwordHash, 'worker', 'Delete Me');

      const user = testDb.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const response = await request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ password });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted');

      // Verify user is deleted
      const deletedUser = testDb.prepare('SELECT * FROM users WHERE id = ?').get((user as any).id);
      expect(deletedUser).toBeUndefined();
    });

    it('should reject deletion with wrong password', async () => {
      const password = 'testpassword';
      const passwordHash = bcrypt.hashSync(password, 10);

      const result = testDb.prepare(`
        INSERT INTO users (email, password_hash, role, name)
        VALUES (?, ?, ?, ?)
      `).run('delete2@test.com', passwordHash, 'worker', 'Delete Me');

      const user = testDb.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const response = await request(app)
        .delete('/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ password: 'wrongpassword' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /profile/change-password', () => {
    it('should change password successfully', async () => {
      const currentPassword = 'oldpassword';
      const newPassword = 'newpassword';
      const passwordHash = bcrypt.hashSync(currentPassword, 10);

      const result = testDb.prepare(`
        INSERT INTO users (email, password_hash, role, name)
        VALUES (?, ?, ?, ?)
      `).run('change@test.com', passwordHash, 'worker', 'Change Pass');

      const user = testDb.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const response = await request(app)
        .post('/profile/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: currentPassword, new_password: newPassword });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('changed');

      // Verify new password works
      const updatedUser = testDb.prepare('SELECT password_hash FROM users WHERE id = ?').get((user as any).id) as any;
      const isValid = bcrypt.compareSync(newPassword, updatedUser.password_hash);
      expect(isValid).toBe(true);
    });

    it('should reject password change with short password', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const response = await request(app)
        .post('/profile/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: 'test', new_password: '12345' });

      expect(response.status).toBe(400);
    });
  });
});
