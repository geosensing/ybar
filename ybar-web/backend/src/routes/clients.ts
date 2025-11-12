import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();

// Get all clients (admin only)
router.get('/', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const clients = db.prepare(`
      SELECT
        c.*,
        COUNT(DISTINCT j.id) as total_jobs
      FROM clients c
      LEFT JOIN jobs j ON c.id = j.client_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get single client (admin only)
router.get('/:id', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get client's jobs
    const jobs = db.prepare(`
      SELECT id, title, status, start_date, end_date, created_at
      FROM jobs
      WHERE client_id = ?
      ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({ client: { ...client, jobs } });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create client (admin only)
router.post('/', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const { name, website, contact, location, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const result = db.prepare(`
      INSERT INTO clients (name, website, contact, location, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, website || null, contact || null, location || null, notes || null);

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ client });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// Update client (admin only)
router.put('/:id', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    const { name, website, contact, location, notes } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (website !== undefined) updates.website = website;
    if (contact !== undefined) updates.contact = contact;
    if (location !== undefined) updates.location = location;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const fields = Object.keys(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(req.params.id);

    db.prepare(`UPDATE clients SET ${setClause} WHERE id = ?`).run(...values);

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// Delete client (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), (req: AuthRequest, res) => {
  try {
    // Check if client has jobs
    const jobs = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE client_id = ?').get(req.params.id) as any;

    if (jobs.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete client with existing jobs',
        jobs_count: jobs.count
      });
    }

    db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

export default router;
