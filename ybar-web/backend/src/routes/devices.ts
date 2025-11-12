import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();

// Get user's registered devices - Per PRD requirement
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const devices = db.prepare(`
      SELECT id, device_id, device_type, device_name, registered_at, last_active
      FROM devices
      WHERE user_id = ?
      ORDER BY registered_at DESC
    `).all(req.user!.id);

    res.json({ devices });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Register a new device - Per PRD requirement
router.post('/register', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { device_id, device_type, device_name } = req.body;

    if (!device_id) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    // Check if device already registered for this user
    const existing = db.prepare(`
      SELECT id FROM devices WHERE user_id = ? AND device_id = ?
    `).get(req.user!.id, device_id);

    if (existing) {
      // Update last_active timestamp
      db.prepare(`
        UPDATE devices
        SET last_active = CURRENT_TIMESTAMP, device_type = ?, device_name = ?
        WHERE user_id = ? AND device_id = ?
      `).run(device_type || null, device_name || null, req.user!.id, device_id);

      const updated = db.prepare(`
        SELECT id, device_id, device_type, device_name, registered_at, last_active
        FROM devices
        WHERE user_id = ? AND device_id = ?
      `).get(req.user!.id, device_id);

      return res.json({ device: updated, message: 'Device already registered, updated timestamp' });
    }

    // Register new device
    const result = db.prepare(`
      INSERT INTO devices (user_id, device_id, device_type, device_name, last_active)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(req.user!.id, device_id, device_type || null, device_name || null);

    const device = db.prepare(`
      SELECT id, device_id, device_type, device_name, registered_at, last_active
      FROM devices
      WHERE id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ device, message: 'Device registered successfully' });
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// Deregister a device - Per PRD requirement
router.delete('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    // Verify device belongs to user
    const device = db.prepare(`
      SELECT id FROM devices WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);

    res.json({ message: 'Device deregistered successfully' });
  } catch (error) {
    console.error('Deregister device error:', error);
    res.status(500).json({ error: 'Failed to deregister device' });
  }
});

// Update device activity (useful for passive tracking)
router.post('/:id/ping', authenticateToken, (req: AuthRequest, res) => {
  try {
    // Verify device belongs to user
    const device = db.prepare(`
      SELECT id FROM devices WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user!.id);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    db.prepare(`
      UPDATE devices SET last_active = CURRENT_TIMESTAMP WHERE id = ?
    `).run(req.params.id);

    res.json({ message: 'Device activity updated' });
  } catch (error) {
    console.error('Update device activity error:', error);
    res.status(500).json({ error: 'Failed to update device activity' });
  }
});

export default router;
