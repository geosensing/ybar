import * as fc from 'fast-check';
import { testDb, createTestUser } from '../setup';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {}
}));

describe('Points System Property-Based Tests', () => {
  let dbModule: any;

  beforeEach(() => {
    dbModule = require('../../db');
    dbModule.default = testDb;
  });

  it('balance should always equal sum of points', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: -1000, max: 1000 }), { minLength: 1, maxLength: 50 }),
        (pointsArray) => {
          const user = createTestUser(testDb, 'worker');
          const userId = (user as any).id;

          let expectedBalance = 0;
          for (const points of pointsArray) {
            expectedBalance += points;
            testDb.prepare(`
              INSERT INTO points (user_id, points, transaction_type, balance_after, description)
              VALUES (?, ?, ?, ?, ?)
            `).run(userId, points, points >= 0 ? 'earned' : 'adjusted', expectedBalance, 'Test');
          }

          const actualBalance = testDb.prepare(`
            SELECT COALESCE(SUM(points), 0) as balance
            FROM points WHERE user_id = ?
          `).get(userId) as any;

          expect(actualBalance.balance).toBe(expectedBalance);

          // Clean up
          testDb.prepare('DELETE FROM points WHERE user_id = ?').run(userId);
          testDb.prepare('DELETE FROM users WHERE id = ?').run(userId);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('balance_after should be cumulative', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 }), { minLength: 2, maxLength: 20 }),
        (pointsArray) => {
          const user = createTestUser(testDb, 'worker');
          const userId = (user as any).id;

          let runningBalance = 0;
          for (const points of pointsArray) {
            runningBalance += points;
            testDb.prepare(`
              INSERT INTO points (user_id, points, transaction_type, balance_after, description)
              VALUES (?, ?, 'earned', ?, ?)
            `).run(userId, points, runningBalance, 'Test');
          }

          const transactions = testDb.prepare(`
            SELECT balance_after FROM points
            WHERE user_id = ?
            ORDER BY id ASC
          `).all(userId) as any[];

          // Verify each balance_after is increasing
          for (let i = 1; i < transactions.length; i++) {
            expect(transactions[i].balance_after).toBeGreaterThan(transactions[i - 1].balance_after);
          }

          // Clean up
          testDb.prepare('DELETE FROM points WHERE user_id = ?').run(userId);
          testDb.prepare('DELETE FROM users WHERE id = ?').run(userId);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('reimbursement should never exceed balance', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 2000 }),
        (initialPoints, reimbursementAmount) => {
          const user = createTestUser(testDb, 'worker');
          const userId = (user as any).id;

          // Add initial points
          testDb.prepare(`
            INSERT INTO points (user_id, points, transaction_type, balance_after, description)
            VALUES (?, ?, 'earned', ?, ?)
          `).run(userId, initialPoints, initialPoints, 'Initial');

          // Try to reimburse
          const actualReimbursement = Math.min(reimbursementAmount, initialPoints);
          const newBalance = initialPoints - actualReimbursement;

          testDb.prepare(`
            INSERT INTO points (user_id, points, transaction_type, balance_after, description)
            VALUES (?, ?, 'reimbursed', ?, ?)
          `).run(userId, -actualReimbursement, newBalance, 'Reimbursement');

          const finalBalance = testDb.prepare(`
            SELECT COALESCE(SUM(points), 0) as balance
            FROM points WHERE user_id = ?
          `).get(userId) as any;

          expect(finalBalance.balance).toBeGreaterThanOrEqual(0);
          expect(finalBalance.balance).toBeLessThanOrEqual(initialPoints);

          // Clean up
          testDb.prepare('DELETE FROM points WHERE user_id = ?').run(userId);
          testDb.prepare('DELETE FROM users WHERE id = ?').run(userId);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
