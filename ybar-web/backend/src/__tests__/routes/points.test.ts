import request from 'supertest';
import express from 'express';
import { generateToken } from '../../middleware/auth';
import pointsRoutes from '../../routes/points';
import { testDb, createTestUser, createTestJob } from '../setup';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {}
}));

const app = express();
app.use(express.json());
app.use('/points', pointsRoutes);

describe('Points Routes', () => {
  let dbModule: any;

  beforeEach(() => {
    dbModule = require('../../db');
    dbModule.default = testDb;
  });

  describe('GET /points/balance', () => {
    it('should return points balance and transactions', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });
      const job = createTestJob(testDb);

      // Add points
      testDb.prepare(`
        INSERT INTO points (user_id, job_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run((user as any).id, (job as any).id, 100, 'earned', 100, 'Task completed');

      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?)
      `).run((user as any).id, 50, 'earned', 150, 'Another task');

      const response = await request(app)
        .get('/points/balance')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.current_balance).toBe(150);
      expect(response.body.transactions).toHaveLength(2);
    });

    it('should return zero balance for new user', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const response = await request(app)
        .get('/points/balance')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.current_balance).toBe(0);
      expect(response.body.transactions).toHaveLength(0);
    });
  });

  describe('POST /points/reimburse', () => {
    it('should reimburse points successfully', async () => {
      const user = testDb.prepare(`
        INSERT INTO users (email, password_hash, role, name, paytm)
        VALUES (?, ?, ?, ?, ?)
      `).run('worker@test.com', 'hash', 'worker', 'Worker', 'paytm123');

      const userId = user.lastInsertRowid;
      const token = generateToken({ id: Number(userId), email: 'worker@test.com', role: 'worker' });

      // Add 100 points
      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, 100, 'earned', 100, 'Initial points');

      const response = await request(app)
        .post('/points/reimburse')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.amount_reimbursed).toBe(100);
      expect(response.body.new_balance).toBe(0);

      // Verify balance is zero
      const balance = testDb.prepare(`
        SELECT COALESCE(SUM(points), 0) as balance
        FROM points WHERE user_id = ?
      `).get(userId) as any;
      expect(balance.balance).toBe(0);
    });

    it('should reject reimbursement below minimum', async () => {
      const user = testDb.prepare(`
        INSERT INTO users (email, password_hash, role, name, paytm)
        VALUES (?, ?, ?, ?, ?)
      `).run('worker2@test.com', 'hash', 'worker', 'Worker', 'paytm456');

      const userId = user.lastInsertRowid;
      const token = generateToken({ id: Number(userId), email: 'worker2@test.com', role: 'worker' });

      // Add only 5 points (below minimum of 10)
      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, 5, 'earned', 5, 'Low points');

      const response = await request(app)
        .post('/points/reimburse')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Minimum');
    });

    it('should reject reimbursement without paytm', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      // Add points
      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?)
      `).run((user as any).id, 100, 'earned', 100, 'Points');

      const response = await request(app)
        .post('/points/reimburse')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Paytm');
    });
  });

  describe('GET /points/admin/transactions', () => {
    it('should return all transactions for admin', async () => {
      const admin = createTestUser(testDb, 'admin');
      const worker = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      // Add transactions
      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?)
      `).run((worker as any).id, 100, 'earned', 100, 'Task 1');

      const response = await request(app)
        .get('/points/admin/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0]).toHaveProperty('user_name');
    });

    it('should filter by transaction type', async () => {
      const admin = createTestUser(testDb, 'admin');
      const worker = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?)
      `).run((worker as any).id, 100, 'earned', 100, 'Earned');

      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?)
      `).run((worker as any).id, -100, 'reimbursed', 0, 'Reimbursed');

      const response = await request(app)
        .get('/points/admin/transactions?transaction_type=earned')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0].transaction_type).toBe('earned');
    });

    it('should reject non-admin access', async () => {
      const worker = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (worker as any).id, email: (worker as any).email, role: 'worker' });

      const response = await request(app)
        .get('/points/admin/transactions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /points/admin/adjust', () => {
    it('should adjust user points', async () => {
      const admin = createTestUser(testDb, 'admin');
      const worker = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const response = await request(app)
        .post('/points/admin/adjust')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: (worker as any).id,
          points: 50,
          description: 'Bonus points'
        });

      expect(response.status).toBe(200);
      expect(response.body.adjustment).toBe(50);
      expect(response.body.new_balance).toBe(50);

      // Verify points were added
      const balance = testDb.prepare(`
        SELECT COALESCE(SUM(points), 0) as balance
        FROM points WHERE user_id = ?
      `).get((worker as any).id) as any;
      expect(balance.balance).toBe(50);
    });

    it('should allow negative adjustments', async () => {
      const admin = createTestUser(testDb, 'admin');
      const worker = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      // Add initial points
      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, ?, ?)
      `).run((worker as any).id, 100, 'earned', 100, 'Initial');

      const response = await request(app)
        .post('/points/admin/adjust')
        .set('Authorization', `Bearer ${token}`)
        .send({
          user_id: (worker as any).id,
          points: -30,
          description: 'Penalty'
        });

      expect(response.status).toBe(200);
      expect(response.body.adjustment).toBe(-30);
      expect(response.body.new_balance).toBe(70);
    });
  });
});
