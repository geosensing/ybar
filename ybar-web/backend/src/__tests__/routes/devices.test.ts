import request from 'supertest';
import express from 'express';
import { generateToken } from '../../middleware/auth';
import devicesRoutes from '../../routes/devices';
import { testDb, createTestUser } from '../setup';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {}
}));

const app = express();
app.use(express.json());
app.use('/devices', devicesRoutes);

describe('Devices Routes', () => {
  let dbModule: any;

  beforeEach(() => {
    dbModule = require('../../db');
    dbModule.default = testDb;
  });

  describe('GET /devices', () => {
    it('should return user devices', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      // Register a device
      testDb.prepare(`
        INSERT INTO devices (user_id, device_id, device_type, device_name)
        VALUES (?, ?, ?, ?)
      `).run((user as any).id, 'device123', 'mobile', 'iPhone 13');

      const response = await request(app)
        .get('/devices')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toHaveLength(1);
      expect(response.body.devices[0]).toHaveProperty('device_id', 'device123');
      expect(response.body.devices[0]).toHaveProperty('device_type', 'mobile');
    });

    it('should return empty array for user with no devices', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const response = await request(app)
        .get('/devices')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.devices).toHaveLength(0);
    });
  });

  describe('POST /devices/register', () => {
    it('should register a new device', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const deviceData = {
        device_id: 'newdevice456',
        device_type: 'android',
        device_name: 'Samsung Galaxy'
      };

      const response = await request(app)
        .post('/devices/register')
        .set('Authorization', `Bearer ${token}`)
        .send(deviceData);

      expect(response.status).toBe(201);
      expect(response.body.device).toHaveProperty('device_id', 'newdevice456');
      expect(response.body.message).toContain('registered');
    });

    it('should update existing device on re-registration', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      // Register device first time
      testDb.prepare(`
        INSERT INTO devices (user_id, device_id, device_type, device_name)
        VALUES (?, ?, ?, ?)
      `).run((user as any).id, 'device789', 'mobile', 'Old Name');

      // Re-register same device
      const response = await request(app)
        .post('/devices/register')
        .set('Authorization', `Bearer ${token}`)
        .send({
          device_id: 'device789',
          device_type: 'mobile',
          device_name: 'New Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.device).toHaveProperty('device_name', 'New Name');
      expect(response.body.message).toContain('already registered');
    });

    it('should reject registration without device_id', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const response = await request(app)
        .post('/devices/register')
        .set('Authorization', `Bearer ${token}`)
        .send({ device_type: 'mobile' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /devices/:id', () => {
    it('should deregister own device', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const result = testDb.prepare(`
        INSERT INTO devices (user_id, device_id, device_type)
        VALUES (?, ?, ?)
      `).run((user as any).id, 'device999', 'mobile');

      const response = await request(app)
        .delete(`/devices/${result.lastInsertRowid}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deregistered');

      // Verify device is deleted
      const device = testDb.prepare('SELECT * FROM devices WHERE id = ?').get(result.lastInsertRowid);
      expect(device).toBeUndefined();
    });

    it('should not deregister another user device', async () => {
      const user1 = createTestUser(testDb, 'worker');
      const user2 = createTestUser(testDb, 'worker');
      const token1 = generateToken({ id: (user1 as any).id, email: (user1 as any).email, role: 'worker' });

      // Register device for user2
      const result = testDb.prepare(`
        INSERT INTO devices (user_id, device_id, device_type)
        VALUES (?, ?, ?)
      `).run((user2 as any).id, 'device888', 'mobile');

      // Try to delete user2's device as user1
      const response = await request(app)
        .delete(`/devices/${result.lastInsertRowid}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /devices/:id/ping', () => {
    it('should update device activity', async () => {
      const user = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (user as any).id, email: (user as any).email, role: 'worker' });

      const result = testDb.prepare(`
        INSERT INTO devices (user_id, device_id, device_type, last_active)
        VALUES (?, ?, ?, datetime('now', '-1 day'))
      `).run((user as any).id, 'device777', 'mobile');

      const beforePing = testDb.prepare('SELECT last_active FROM devices WHERE id = ?').get(result.lastInsertRowid) as any;

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const response = await request(app)
        .post(`/devices/${result.lastInsertRowid}/ping`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      const afterPing = testDb.prepare('SELECT last_active FROM devices WHERE id = ?').get(result.lastInsertRowid) as any;
      expect(afterPing.last_active).not.toBe(beforePing.last_active);
    });
  });
});
