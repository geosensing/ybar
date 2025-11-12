import request from 'supertest';
import express from 'express';
import { generateToken } from '../../middleware/auth';
import clientsRoutes from '../../routes/clients';
import { testDb, createTestUser, createTestClient, createTestJob } from '../setup';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {}
}));

const app = express();
app.use(express.json());
app.use('/clients', clientsRoutes);

describe('Clients Routes', () => {
  let dbModule: any;

  beforeEach(() => {
    dbModule = require('../../db');
    dbModule.default = testDb;
  });

  describe('GET /clients', () => {
    it('should return all clients with job counts for admin', async () => {
      const admin = createTestUser(testDb, 'admin');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const client = createTestClient(testDb);
      createTestJob(testDb, (client as any).id);
      createTestJob(testDb, (client as any).id);

      const response = await request(app)
        .get('/clients')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.clients).toHaveLength(1);
      expect(response.body.clients[0]).toHaveProperty('total_jobs', 2);
    });

    it('should reject worker access', async () => {
      const worker = createTestUser(testDb, 'worker');
      const token = generateToken({ id: (worker as any).id, email: (worker as any).email, role: 'worker' });

      const response = await request(app)
        .get('/clients')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /clients/:id', () => {
    it('should return single client with jobs', async () => {
      const admin = createTestUser(testDb, 'admin');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const client = createTestClient(testDb);
      createTestJob(testDb, (client as any).id);

      const response = await request(app)
        .get(`/clients/${(client as any).id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.client).toHaveProperty('id', (client as any).id);
      expect(response.body.client.jobs).toHaveLength(1);
    });

    it('should return 404 for non-existent client', async () => {
      const admin = createTestUser(testDb, 'admin');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const response = await request(app)
        .get('/clients/99999')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /clients', () => {
    it('should create new client', async () => {
      const admin = createTestUser(testDb, 'admin');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const clientData = {
        name: 'New Client',
        website: 'https://newclient.com',
        contact: 'contact@newclient.com',
        location: 'New York',
        notes: 'Important client'
      };

      const response = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send(clientData);

      expect(response.status).toBe(201);
      expect(response.body.client).toHaveProperty('name', 'New Client');
      expect(response.body.client).toHaveProperty('website', 'https://newclient.com');
    });

    it('should reject creation without name', async () => {
      const admin = createTestUser(testDb, 'admin');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const response = await request(app)
        .post('/clients')
        .set('Authorization', `Bearer ${token}`)
        .send({ website: 'https://test.com' });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /clients/:id', () => {
    it('should update client', async () => {
      const admin = createTestUser(testDb, 'admin');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const client = createTestClient(testDb);

      const updates = {
        name: 'Updated Client Name',
        contact: 'newemail@test.com'
      };

      const response = await request(app)
        .put(`/clients/${(client as any).id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.client).toHaveProperty('name', 'Updated Client Name');
      expect(response.body.client).toHaveProperty('contact', 'newemail@test.com');
    });
  });

  describe('DELETE /clients/:id', () => {
    it('should delete client without jobs', async () => {
      const admin = createTestUser(testDb, 'admin');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const client = createTestClient(testDb);

      const response = await request(app)
        .delete(`/clients/${(client as any).id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);

      // Verify client is deleted
      const deletedClient = testDb.prepare('SELECT * FROM clients WHERE id = ?').get((client as any).id);
      expect(deletedClient).toBeUndefined();
    });

    it('should prevent deletion of client with jobs', async () => {
      const admin = createTestUser(testDb, 'admin');
      const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });

      const client = createTestClient(testDb);
      createTestJob(testDb, (client as any).id);

      const response = await request(app)
        .delete(`/clients/${(client as any).id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('existing jobs');
    });
  });
});
