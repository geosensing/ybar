import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import db from '../db';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

// Configure multer for file uploads
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and videos are allowed'));
    }
  }
});

// Get tasks for a job
router.get('/job/:jobId', authenticateToken, (req: AuthRequest, res) => {
  try {
    const tasks = db.prepare(`
      SELECT
        t.*,
        u.name as worker_name,
        u.email as worker_email,
        (SELECT COUNT(*) FROM task_files WHERE task_id = t.id) as file_count
      FROM tasks t
      LEFT JOIN users u ON t.worker_id = u.id
      WHERE t.job_id = ?
      ORDER BY t.created_at DESC
    `).all(req.params.jobId);

    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get available tasks for worker
router.get('/available', authenticateToken, requireRole('worker'), (req: AuthRequest, res) => {
  try {
    const tasks = db.prepare(`
      SELECT
        t.*,
        j.title as job_title,
        j.pay_per_task,
        j.description as job_description
      FROM tasks t
      JOIN jobs j ON t.job_id = j.id
      WHERE t.status = 'available'
        AND j.status = 'active'
        AND date('now') BETWEEN j.start_date AND j.end_date
      ORDER BY t.created_at DESC
    `).all();

    res.json({ tasks });
  } catch (error) {
    console.error('Get available tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch available tasks' });
  }
});

// Get worker's tasks
router.get('/my-tasks', authenticateToken, requireRole('worker'), (req: AuthRequest, res) => {
  try {
    const tasks = db.prepare(`
      SELECT
        t.*,
        j.title as job_title,
        j.pay_per_task,
        (SELECT COUNT(*) FROM task_files WHERE task_id = t.id) as file_count
      FROM tasks t
      JOIN jobs j ON t.job_id = j.id
      WHERE t.worker_id = ?
      ORDER BY t.updated_at DESC
    `).all(req.user!.id);

    res.json({ tasks });
  } catch (error) {
    console.error('Get my tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const task = db.prepare(`
      SELECT
        t.*,
        j.title as job_title,
        j.description as job_description,
        j.pay_per_task,
        u.name as worker_name,
        u.email as worker_email
      FROM tasks t
      JOIN jobs j ON t.job_id = j.id
      LEFT JOIN users u ON t.worker_id = u.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get task files
    const files = db.prepare(`
      SELECT * FROM task_files WHERE task_id = ?
    `).all(req.params.id);

    res.json({ task: { ...task, files } });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task (admin only)
router.post('/', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const {
      job_id,
      title,
      description,
      latitude,
      longitude,
      location_name
    } = req.body;

    if (!job_id || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
      INSERT INTO tasks (
        job_id, title, description, latitude, longitude, location_name, status
      ) VALUES (?, ?, ?, ?, ?, ?, 'available')
    `).run(job_id, title, description, latitude || null, longitude || null, location_name || null);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Assign task to worker
router.post('/:id/assign', authenticateToken, requireRole('worker'), (req: AuthRequest, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'available') {
      return res.status(400).json({ error: 'Task is not available' });
    }

    // Check if worker hasn't exceeded task limit for this job
    const job = db.prepare('SELECT n_tasks_per_worker_allowed FROM jobs WHERE id = ?').get(task.job_id) as any;
    const workerTaskCount = db.prepare(`
      SELECT COUNT(*) as count FROM tasks
      WHERE job_id = ? AND worker_id = ? AND status != 'rejected'
    `).get(task.job_id, req.user!.id) as any;

    if (workerTaskCount.count >= job.n_tasks_per_worker_allowed) {
      return res.status(400).json({ error: 'Task limit reached for this job' });
    }

    db.prepare(`
      UPDATE tasks
      SET worker_id = ?, status = 'assigned', assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.user!.id, req.params.id);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    res.json({ task: updatedTask });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

// Submit task (worker only)
router.post('/:id/submit', authenticateToken, requireRole('worker'), upload.array('files', 10), (req: AuthRequest, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.worker_id !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to submit this task' });
    }

    if (task.status !== 'assigned') {
      return res.status(400).json({ error: 'Task cannot be submitted in current status' });
    }

    const { submission_data } = req.body;

    db.prepare(`
      UPDATE tasks
      SET status = 'submitted', submission_data = ?, submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(submission_data || null, req.params.id);

    // Save uploaded files
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const insertFile = db.prepare(`
        INSERT INTO task_files (task_id, file_path, file_type, file_size)
        VALUES (?, ?, ?, ?)
      `);

      files.forEach(file => {
        insertFile.run(
          req.params.id,
          file.filename,
          file.mimetype,
          file.size
        );
      });
    }

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    res.json({ task: updatedTask });
  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
});

// Review task (admin only) - Enhanced with worker rating per PRD
router.post('/:id/review', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const { status, reviewer_notes, worker_rating } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Validate worker rating if provided (1-5 scale per PRD)
    if (worker_rating !== undefined && (worker_rating < 1 || worker_rating > 5)) {
      return res.status(400).json({ error: 'Worker rating must be between 1 and 5' });
    }

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'submitted') {
      return res.status(400).json({ error: 'Task is not submitted for review' });
    }

    db.prepare(`
      UPDATE tasks
      SET status = ?, reviewer_notes = ?, worker_rating = ?, reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, reviewer_notes || null, worker_rating || null, req.params.id);

    // Create payment and points if approved
    if (status === 'approved') {
      const job = db.prepare('SELECT pay_per_task, id FROM jobs WHERE id = ?').get(task.job_id) as any;

      // Create payment record
      db.prepare(`
        INSERT INTO payments (worker_id, task_id, amount, status)
        VALUES (?, ?, ?, 'pending')
      `).run(task.worker_id, req.params.id, job.pay_per_task);

      // Add points to worker account (per PRD points system)
      const currentBalance = db.prepare(`
        SELECT COALESCE(SUM(points), 0) as balance
        FROM points
        WHERE user_id = ?
      `).get(task.worker_id) as any;

      const newBalance = currentBalance.balance + job.pay_per_task;

      db.prepare(`
        INSERT INTO points (user_id, job_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, 'earned', ?, ?)
      `).run(
        task.worker_id,
        job.id,
        job.pay_per_task,
        newBalance,
        `Earned from task ${req.params.id}`
      );
    }

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    res.json({ task: updatedTask });
  } catch (error) {
    console.error('Review task error:', error);
    res.status(500).json({ error: 'Failed to review task' });
  }
});

// Get tasks pending review (admin only)
router.get('/pending/review', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const tasks = db.prepare(`
      SELECT
        t.*,
        j.title as job_title,
        u.name as worker_name,
        u.email as worker_email,
        (SELECT COUNT(*) FROM task_files WHERE task_id = t.id) as file_count
      FROM tasks t
      JOIN jobs j ON t.job_id = j.id
      JOIN users u ON t.worker_id = u.id
      WHERE t.status = 'submitted'
      ORDER BY t.submitted_at ASC
    `).all();

    res.json({ tasks });
  } catch (error) {
    console.error('Get pending tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch pending tasks' });
  }
});

export default router;
