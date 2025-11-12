import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();

// Get worker's payments
router.get('/my-payments', authenticateToken, requireRole('worker'), (req: AuthRequest, res) => {
  try {
    const payments = db.prepare(`
      SELECT
        p.*,
        t.title as task_title,
        j.title as job_title
      FROM payments p
      JOIN tasks t ON p.task_id = t.id
      JOIN jobs j ON t.job_id = j.id
      WHERE p.worker_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user!.id);

    res.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Get all payments (admin only)
router.get('/', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT
        p.*,
        u.name as worker_name,
        u.email as worker_email,
        t.title as task_title,
        j.title as job_title
      FROM payments p
      JOIN users u ON p.worker_id = u.id
      JOIN tasks t ON p.task_id = t.id
      JOIN jobs j ON t.job_id = j.id
    `;

    const params: any[] = [];

    if (status) {
      query += ' WHERE p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const payments = db.prepare(query).all(...params);

    res.json({ payments });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Mark payment as paid (admin only)
router.post('/:id/pay', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id) as any;

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    db.prepare(`
      UPDATE payments
      SET status = 'paid', paid_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    const updatedPayment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id);

    res.json({ payment: updatedPayment });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get payment statistics (admin only)
router.get('/stats/summary', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count
      FROM payments
    `).get();

    res.json({ stats });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Failed to fetch payment statistics' });
  }
});

export default router;
