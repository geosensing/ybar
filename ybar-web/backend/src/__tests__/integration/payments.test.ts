import request from 'supertest';
import express from 'express';
import { generateToken } from '../../middleware/auth';
import paymentsRoutes from '../../routes/payments';
import { testDb, createTestUser } from '../setup';

jest.mock('../../db', () => ({ __esModule: true, default: {} }));
const app = express();
app.use('/payments', paymentsRoutes);

it('returns numeric zero totals before any payments exist', async () => {
  require('../../db').default = testDb;
  const admin = createTestUser(testDb, 'admin') as any;
  const token = generateToken({ id: admin.id, email: admin.email, role: 'admin' });
  const response = await request(app).get('/payments/stats/summary')
    .set('Authorization', `Bearer ${token}`);
  expect(response.status).toBe(200);
  expect(response.body.stats).toEqual({
    total_payments: 0, total_amount: 0, pending_amount: 0,
    paid_amount: 0, pending_count: 0, paid_count: 0,
  });
});
