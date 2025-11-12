import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();

// Get user's points balance and history - Per PRD requirement
router.get('/balance', authenticateToken, (req: AuthRequest, res) => {
  try {
    // Get current balance
    const balanceData = db.prepare(`
      SELECT COALESCE(SUM(points), 0) as current_balance
      FROM points
      WHERE user_id = ?
    `).get(req.user!.id) as any;

    // Get transaction history
    const transactions = db.prepare(`
      SELECT
        p.id,
        p.points,
        p.transaction_type,
        p.balance_after,
        p.description,
        p.created_at,
        j.title as job_title
      FROM points p
      LEFT JOIN jobs j ON p.job_id = j.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 50
    `).all(req.user!.id);

    res.json({
      current_balance: balanceData.current_balance,
      transactions
    });
  } catch (error) {
    console.error('Get points balance error:', error);
    res.status(500).json({ error: 'Failed to fetch points balance' });
  }
});

// Request reimbursement - Per PRD requirement
router.post('/reimburse', authenticateToken, requireRole('worker'), (req: AuthRequest, res) => {
  try {
    // Get current balance
    const balanceData = db.prepare(`
      SELECT COALESCE(SUM(points), 0) as current_balance
      FROM points
      WHERE user_id = ?
    `).get(req.user!.id) as any;

    const currentBalance = balanceData.current_balance;

    // Check minimum reimbursement amount (could be configurable)
    const MIN_REIMBURSEMENT = 10; // Minimum 10 points to reimburse
    if (currentBalance < MIN_REIMBURSEMENT) {
      return res.status(400).json({
        error: `Minimum balance of ${MIN_REIMBURSEMENT} points required for reimbursement`,
        current_balance: currentBalance
      });
    }

    // Get user's paytm details
    const user = db.prepare(`
      SELECT paytm, email, name FROM users WHERE id = ?
    `).get(req.user!.id) as any;

    if (!user.paytm) {
      return res.status(400).json({
        error: 'Please add your Paytm account details to your profile before requesting reimbursement'
      });
    }

    // Create reimbursement transaction
    const newBalance = 0; // Reimburse all points as per PRD
    const pointsToReimburse = currentBalance;

    db.prepare(`
      INSERT INTO points (user_id, points, transaction_type, balance_after, description)
      VALUES (?, ?, 'reimbursed', ?, ?)
    `).run(
      req.user!.id,
      -pointsToReimburse,
      newBalance,
      `Reimbursement requested for ${pointsToReimburse} points`
    );

    // In a real application, you would trigger an email or payment process here
    // For now, we just log it
    console.log(`Reimbursement requested for user ${req.user!.id}: ${pointsToReimburse} points to ${user.paytm}`);

    res.json({
      message: 'Reimbursement request submitted successfully',
      amount_reimbursed: pointsToReimburse,
      new_balance: newBalance,
      paytm_account: user.paytm,
      note: 'You will receive payment via Paytm within 3-5 business days'
    });
  } catch (error) {
    console.error('Reimburse points error:', error);
    res.status(500).json({ error: 'Failed to process reimbursement' });
  }
});

// Admin: Get all points transactions
router.get('/admin/transactions', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const { user_id, transaction_type } = req.query;

    let query = `
      SELECT
        p.id,
        p.user_id,
        p.points,
        p.transaction_type,
        p.balance_after,
        p.description,
        p.created_at,
        u.name as user_name,
        u.email as user_email,
        j.title as job_title
      FROM points p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN jobs j ON p.job_id = j.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (user_id) {
      query += ' AND p.user_id = ?';
      params.push(user_id);
    }

    if (transaction_type) {
      query += ' AND p.transaction_type = ?';
      params.push(transaction_type);
    }

    query += ' ORDER BY p.created_at DESC LIMIT 200';

    const transactions = db.prepare(query).all(...params);

    res.json({ transactions });
  } catch (error) {
    console.error('Get admin transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Admin: Adjust user points
router.post('/admin/adjust', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const { user_id, points, description } = req.body;

    if (!user_id || points === undefined) {
      return res.status(400).json({ error: 'User ID and points amount are required' });
    }

    // Get current balance
    const balanceData = db.prepare(`
      SELECT COALESCE(SUM(points), 0) as current_balance
      FROM points
      WHERE user_id = ?
    `).get(user_id) as any;

    const newBalance = balanceData.current_balance + points;

    db.prepare(`
      INSERT INTO points (user_id, points, transaction_type, balance_after, description)
      VALUES (?, ?, 'adjusted', ?, ?)
    `).run(
      user_id,
      points,
      newBalance,
      description || `Admin adjustment: ${points} points`
    );

    res.json({
      message: 'Points adjusted successfully',
      previous_balance: balanceData.current_balance,
      adjustment: points,
      new_balance: newBalance
    });
  } catch (error) {
    console.error('Adjust points error:', error);
    res.status(500).json({ error: 'Failed to adjust points' });
  }
});

export default router;
