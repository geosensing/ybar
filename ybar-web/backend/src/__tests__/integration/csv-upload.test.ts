import request from 'supertest';
import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { generateToken } from '../../middleware/auth';
import jobsRoutes from '../../routes/jobs';
import { testDb, createTestUser, createTestJob } from '../setup';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {}
}));

const app = express();
app.use(express.json());
app.use('/jobs', jobsRoutes);

describe('CSV Upload Integration Tests', () => {
  let dbModule: any;
  let csvFilePath: string;

  beforeEach(() => {
    dbModule = require('../../db');
    dbModule.default = testDb;

    // Create temporary CSV file
    csvFilePath = path.join(__dirname, '../../../data/test-tasks.csv');
    const csvContent = `latitude,longitude,location_name,title,description,start_time,end_time
40.7589,-73.9851,Times Square,Task 1,Description 1,2025-01-15 09:00:00,2025-01-15 17:00:00
40.7614,-73.9776,5th Avenue,Task 2,Description 2,2025-01-16 09:00:00,2025-01-16 17:00:00
40.7484,-73.9857,Empire State,Task 3,Description 3,2025-01-17 09:00:00,2025-01-17 17:00:00`;

    fs.writeFileSync(csvFilePath, csvContent);
  });

  afterEach(() => {
    // Clean up CSV file
    if (fs.existsSync(csvFilePath)) {
      fs.unlinkSync(csvFilePath);
    }
  });

  it('should upload and create tasks from CSV', async () => {
    const admin = createTestUser(testDb, 'admin');
    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });
    const job = createTestJob(testDb);

    const response = await request(app)
      .post(`/jobs/${(job as any).id}/upload-tasks`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', csvFilePath);

    expect(response.status).toBe(200);
    expect(response.body.created).toBe(3);

    // Verify tasks were created
    const tasks = testDb.prepare('SELECT * FROM tasks WHERE job_id = ?').all((job as any).id);
    expect(tasks).toHaveLength(3);
    expect((tasks[0] as any).title).toBe('Task 1');
    expect((tasks[0] as any).latitude).toBeCloseTo(40.7589, 4);
    expect((tasks[0] as any).location_name).toBe('Times Square');
  });

  it('should handle CSV with minimal columns', async () => {
    const admin = createTestUser(testDb, 'admin');
    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });
    const job = createTestJob(testDb);

    // Create minimal CSV
    const minimalCsvPath = path.join(__dirname, '../../../data/minimal-tasks.csv');
    const minimalCsvContent = `lat,lng
40.7589,-73.9851
40.7614,-73.9776`;
    fs.writeFileSync(minimalCsvPath, minimalCsvContent);

    const response = await request(app)
      .post(`/jobs/${(job as any).id}/upload-tasks`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', minimalCsvPath);

    expect(response.status).toBe(200);
    expect(response.body.created).toBe(2);

    fs.unlinkSync(minimalCsvPath);
  });

  it('should reject CSV with invalid data', async () => {
    const admin = createTestUser(testDb, 'admin');
    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });
    const job = createTestJob(testDb);

    // Create CSV with invalid coordinates
    const invalidCsvPath = path.join(__dirname, '../../../data/invalid-tasks.csv');
    const invalidCsvContent = `latitude,longitude
invalid,invalid
not-a-number,also-invalid`;
    fs.writeFileSync(invalidCsvPath, invalidCsvContent);

    const response = await request(app)
      .post(`/jobs/${(job as any).id}/upload-tasks`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', invalidCsvPath);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('No valid tasks');

    fs.unlinkSync(invalidCsvPath);
  });

  it('should reject non-CSV files', async () => {
    const admin = createTestUser(testDb, 'admin');
    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });
    const job = createTestJob(testDb);

    // Create a text file
    const txtFilePath = path.join(__dirname, '../../../data/test.txt');
    fs.writeFileSync(txtFilePath, 'This is not a CSV file');

    const response = await request(app)
      .post(`/jobs/${(job as any).id}/upload-tasks`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', txtFilePath);

    expect(response.status).toBe(500); // Multer will reject it

    fs.unlinkSync(txtFilePath);
  });

  it('should handle large CSV files', async () => {
    const admin = createTestUser(testDb, 'admin');
    const token = generateToken({ id: (admin as any).id, email: (admin as any).email, role: 'admin' });
    const job = createTestJob(testDb);

    // Create large CSV with 100 tasks
    const largeCsvPath = path.join(__dirname, '../../../data/large-tasks.csv');
    let largeCsvContent = 'latitude,longitude,title\n';
    for (let i = 0; i < 100; i++) {
      largeCsvContent += `${40.75 + i * 0.001},${-73.98 + i * 0.001},Task ${i + 1}\n`;
    }
    fs.writeFileSync(largeCsvPath, largeCsvContent);

    const response = await request(app)
      .post(`/jobs/${(job as any).id}/upload-tasks`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', largeCsvPath);

    expect(response.status).toBe(200);
    expect(response.body.created).toBe(100);

    const taskCount = testDb.prepare('SELECT COUNT(*) as count FROM tasks WHERE job_id = ?').get((job as any).id) as any;
    expect(taskCount.count).toBe(100);

    fs.unlinkSync(largeCsvPath);
  });

  it('should prevent worker from uploading CSV', async () => {
    const worker = createTestUser(testDb, 'worker');
    const token = generateToken({ id: (worker as any).id, email: (worker as any).email, role: 'worker' });
    const job = createTestJob(testDb);

    const response = await request(app)
      .post(`/jobs/${(job as any).id}/upload-tasks`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', csvFilePath);

    expect(response.status).toBe(403);
  });
});
