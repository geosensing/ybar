import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import db from '../db';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import csv from 'csv-parser';

const router = Router();

// Configure multer for CSV uploads
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '../../uploads/csv');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tasks-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadCSV = multer({
  storage: csvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

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

// Bulk create tasks from CSV (admin only) - Per PRD requirement
router.post('/:id/upload-tasks', authenticateToken, requireRole('admin'), uploadCSV.single('file'), async (req: AuthRequest, res) => {
  try {
    const jobId = req.params.id;

    // Verify job exists
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const tasks: any[] = [];
    const errors: string[] = [];

    // Parse CSV file
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(req.file!.path)
        .pipe(csv())
        .on('data', (row) => {
          // Expected CSV columns: latitude, longitude, location_name, date, start_time, end_time, title, description
          // Or at minimum: latitude, longitude
          try {
            const task: any = {
              job_id: jobId,
              title: row.title || row.Title || `Task at ${row.location_name || 'Location'}`,
              description: row.description || row.Description || `Complete task at location`,
              latitude: parseFloat(row.latitude || row.lat || row.Latitude),
              longitude: parseFloat(row.longitude || row.long || row.lng || row.Longitude),
              location_name: row.location_name || row.location || row.Location || null,
              start_time: row.start_time || row.date || null,
              end_time: row.end_time || null,
              status: 'available'
            };

            // Validate required fields
            if (isNaN(task.latitude) || isNaN(task.longitude)) {
              errors.push(`Invalid coordinates in row: ${JSON.stringify(row)}`);
            } else {
              tasks.push(task);
            }
          } catch (error) {
            errors.push(`Error parsing row: ${JSON.stringify(row)} - ${error}`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Delete the uploaded file
    fs.unlinkSync(req.file.path);

    if (tasks.length === 0) {
      return res.status(400).json({ error: 'No valid tasks found in CSV', errors });
    }

    // Insert tasks into database
    const insertTask = db.prepare(`
      INSERT INTO tasks (
        job_id, title, description, latitude, longitude, location_name,
        start_time, end_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let insertedCount = 0;
    const insertMany = db.transaction((tasksToInsert: any[]) => {
      for (const task of tasksToInsert) {
        insertTask.run(
          task.job_id,
          task.title,
          task.description,
          task.latitude,
          task.longitude,
          task.location_name,
          task.start_time,
          task.end_time,
          task.status
        );
        insertedCount++;
      }
    });

    insertMany(tasks);

    res.json({
      message: 'Tasks created successfully',
      created: insertedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Upload tasks error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload tasks' });
  }
});

export default router;
