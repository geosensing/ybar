import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import db from '../db';

const router = Router();

// Get own profile
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = db.prepare(`
      SELECT id, email, role, name, sex, phone, address, age, paytm, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(req.user!.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get average worker rating if worker
    if ((user as any).role === 'worker') {
      const ratingData = db.prepare(`
        SELECT AVG(worker_rating) as average_rating, COUNT(worker_rating) as total_ratings
        FROM tasks
        WHERE worker_id = ? AND worker_rating IS NOT NULL
      `).get(req.user!.id) as any;

      (user as any).average_rating = ratingData.average_rating;
      (user as any).total_ratings = ratingData.total_ratings;
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update own profile - Per PRD requirement
router.put('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { name, sex, phone, address, age, paytm } = req.body;

    const allowedFields: any = {};
    if (name !== undefined) allowedFields.name = name;
    if (sex !== undefined) allowedFields.sex = sex;
    if (phone !== undefined) allowedFields.phone = phone;
    if (address !== undefined) allowedFields.address = address;
    if (age !== undefined) allowedFields.age = age;
    if (paytm !== undefined) allowedFields.paytm = paytm;

    if (Object.keys(allowedFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const fields = Object.keys(allowedFields);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => allowedFields[field]);
    values.push(req.user!.id);

    db.prepare(`
      UPDATE users
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(...values);

    const updatedUser = db.prepare(`
      SELECT id, email, role, name, sex, phone, address, age, paytm, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(req.user!.id);

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Delete own profile - Per PRD requirement
router.delete('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Verify password
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
    const isValid = bcrypt.compareSync(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user (cascade will delete related records)
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user!.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Change password
router.post('/change-password', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
    const isValid = bcrypt.compareSync(current_password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const newPasswordHash = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newPasswordHash, req.user!.id);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;
