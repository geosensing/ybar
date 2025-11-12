import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();

// Get all active jobs (for workers)
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const jobs = db.prepare(`
      SELECT
        j.*,
        c.name as client_name,
        (SELECT COUNT(*) FROM tasks WHERE job_id = j.id AND status = 'available') as available_tasks,
        (SELECT COUNT(*) FROM tasks WHERE job_id = j.id) as total_tasks
      FROM jobs j
      LEFT JOIN clients c ON j.client_id = c.id
      WHERE j.status = 'active'
      ORDER BY j.created_at DESC
    `).all();

    res.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get single job
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const job = db.prepare(`
      SELECT
        j.*,
        c.name as client_name,
        c.website as client_website,
        (SELECT COUNT(*) FROM tasks WHERE job_id = j.id AND status = 'available') as available_tasks,
        (SELECT COUNT(*) FROM tasks WHERE job_id = j.id AND status = 'assigned') as assigned_tasks,
        (SELECT COUNT(*) FROM tasks WHERE job_id = j.id AND status = 'submitted') as submitted_tasks,
        (SELECT COUNT(*) FROM tasks WHERE job_id = j.id AND status = 'approved') as approved_tasks
      FROM jobs j
      LEFT JOIN clients c ON j.client_id = c.id
      WHERE j.id = ?
    `).get(req.params.id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// Create job (admin only)
router.post('/', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const {
      client_id,
      title,
      description,
      pay_per_task,
      n_tasks,
      n_tasks_per_worker_allowed = 1,
      location,
      location_restrictions,
      start_date,
      end_date,
      status = 'draft'
    } = req.body;

    if (!title || !description || !pay_per_task || !n_tasks || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
      INSERT INTO jobs (
        client_id, title, description, pay_per_task, n_tasks,
        n_tasks_per_worker_allowed, location, location_restrictions,
        start_date, end_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      client_id || null,
      title,
      description,
      pay_per_task,
      n_tasks,
      n_tasks_per_worker_allowed,
      location || null,
      location_restrictions || null,
      start_date,
      end_date,
      status
    );

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ job });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const allowedFields = [
      'title', 'description', 'pay_per_task', 'n_tasks',
      'n_tasks_per_worker_allowed', 'location', 'location_restrictions',
      'start_date', 'end_date', 'status', 'image_url'
    ];

    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    db.prepare(`UPDATE jobs SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    res.json({ job });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Get job statistics (admin only)
router.get('/:id/stats', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM tasks
      WHERE job_id = ?
    `).get(req.params.id);

    res.json({ stats });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

export default router;
