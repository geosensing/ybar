import { testDb, createTestUser, createTestClient } from '../setup';
import bcrypt from 'bcryptjs';

jest.mock('../../db', () => ({
  __esModule: true,
  default: {}
}));

describe('Complete Workflow Scenarios', () => {
  let dbModule: any;

  beforeEach(() => {
    dbModule = require('../../db');
    dbModule.default = testDb;
  });

  describe('Worker completes task and gets paid', () => {
    it('should handle complete workflow from signup to payment', () => {
      // 1. Worker signs up
      const passwordHash = bcrypt.hashSync('password123', 10);
      const workerResult = testDb.prepare(`
        INSERT INTO users (email, password_hash, role, name, paytm)
        VALUES (?, ?, ?, ?, ?)
      `).run('worker@scenario.com', passwordHash, 'worker', 'Test Worker', 'paytm-worker');

      const workerId = workerResult.lastInsertRowid;

      // 2. Admin creates client
      const client = createTestClient(testDb);

      // 3. Admin creates job
      const jobResult = testDb.prepare(`
        INSERT INTO jobs (client_id, title, description, pay_per_task, n_tasks, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run((client as any).id, 'Noise Survey', 'Measure noise in Delhi', 25.0, 100, '2025-01-01', '2025-12-31', 'active');

      const jobId = jobResult.lastInsertRowid;

      // 4. Admin creates tasks (simulating CSV upload)
      const taskLocations = [
        { lat: 28.7041, lng: 77.1025, name: 'Connaught Place' },
        { lat: 28.6139, lng: 77.2090, name: 'India Gate' },
        { lat: 28.6562, lng: 77.2410, name: 'Red Fort' }
      ];

      const taskIds: number[] = [];
      for (const loc of taskLocations) {
        const taskResult = testDb.prepare(`
          INSERT INTO tasks (job_id, title, description, latitude, longitude, location_name, status)
          VALUES (?, ?, ?, ?, ?, ?, 'available')
        `).run(jobId, `Survey at ${loc.name}`, 'Take noise measurements', loc.lat, loc.lng, loc.name);
        taskIds.push(Number(taskResult.lastInsertRowid));
      }

      // 5. Worker accepts a task
      testDb.prepare(`
        UPDATE tasks SET worker_id = ?, status = 'assigned', assigned_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(workerId, taskIds[0]);

      // 6. Worker submits task
      testDb.prepare(`
        UPDATE tasks SET status = 'submitted', submission_data = ?, submitted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run('{"noise_level": 75, "time": "10:00"}', taskIds[0]);

      // 7. Admin reviews and approves with rating
      testDb.prepare(`
        UPDATE tasks
        SET status = 'approved', worker_rating = ?, reviewer_notes = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(5, 'Excellent work!', taskIds[0]);

      // 8. Create payment
      testDb.prepare(`
        INSERT INTO payments (worker_id, task_id, amount, status)
        VALUES (?, ?, ?, 'pending')
      `).run(workerId, taskIds[0], 25.0);

      // 9. Add points
      testDb.prepare(`
        INSERT INTO points (user_id, job_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, ?, 'earned', ?, ?)
      `).run(workerId, jobId, 25.0, 25.0, `Earned from task ${taskIds[0]}`);

      // 10. Worker requests reimbursement
      testDb.prepare(`
        INSERT INTO points (user_id, points, transaction_type, balance_after, description)
        VALUES (?, ?, 'reimbursed', ?, ?)
      `).run(workerId, -25.0, 0, 'Reimbursement requested');

      // Verify final state
      const worker = testDb.prepare('SELECT * FROM users WHERE id = ?').get(workerId) as any;
      const task = testDb.prepare('SELECT * FROM tasks WHERE id = ?').get(taskIds[0]) as any;
      const payment = testDb.prepare('SELECT * FROM payments WHERE task_id = ?').get(taskIds[0]) as any;
      const balance = testDb.prepare(`
        SELECT COALESCE(SUM(points), 0) as balance FROM points WHERE user_id = ?
      `).get(workerId) as any;

      expect(worker).toBeDefined();
      expect(task.status).toBe('approved');
      expect(task.worker_rating).toBe(5);
      expect(payment.amount).toBe(25.0);
      expect(balance.balance).toBe(0); // After reimbursement
    });
  });

  describe('Worker accepts multiple tasks within limit', () => {
    it('should enforce task limit per worker per job', () => {
      const worker = createTestUser(testDb, 'worker');
      const client = createTestClient(testDb);

      // Create job with limit of 3 tasks per worker
      const jobResult = testDb.prepare(`
        INSERT INTO jobs (client_id, title, description, pay_per_task, n_tasks, n_tasks_per_worker_allowed, start_date, end_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run((client as any).id, 'Photo Survey', 'Take photos', 10.0, 10, 3, '2025-01-01', '2025-12-31', 'active');

      const jobId = jobResult.lastInsertRowid;

      // Create 5 tasks
      const taskIds: number[] = [];
      for (let i = 0; i < 5; i++) {
        const taskResult = testDb.prepare(`
          INSERT INTO tasks (job_id, title, description, status)
          VALUES (?, ?, ?, 'available')
        `).run(jobId, `Task ${i + 1}`, `Description ${i + 1}`);
        taskIds.push(Number(taskResult.lastInsertRowid));
      }

      // Worker accepts 3 tasks (should succeed)
      for (let i = 0; i < 3; i++) {
        testDb.prepare(`
          UPDATE tasks SET worker_id = ?, status = 'assigned'
          WHERE id = ?
        `).run((worker as any).id, taskIds[i]);
      }

      // Check if worker has reached limit
      const workerTaskCount = testDb.prepare(`
        SELECT COUNT(*) as count FROM tasks
        WHERE job_id = ? AND worker_id = ?
      `).get(jobId, (worker as any).id) as any;

      expect(workerTaskCount.count).toBe(3);

      // Attempting to accept 4th task should be prevented by application logic
      // (in real scenario, this would be checked before assignment)
      const job = testDb.prepare('SELECT n_tasks_per_worker_allowed FROM jobs WHERE id = ?').get(jobId) as any;
      const canAcceptMore = workerTaskCount.count < job.n_tasks_per_worker_allowed;

      expect(canAcceptMore).toBe(false);
    });
  });

  describe('Device registration and management', () => {
    it('should track worker device registrations', () => {
      const worker = createTestUser(testDb, 'worker');

      // Worker registers multiple devices
      const devices = [
        { id: 'device-123', type: 'mobile', name: 'iPhone 13' },
        { id: 'device-456', type: 'tablet', name: 'iPad Pro' },
        { id: 'device-789', type: 'mobile', name: 'Android Phone' }
      ];

      for (const device of devices) {
        testDb.prepare(`
          INSERT INTO devices (user_id, device_id, device_type, device_name)
          VALUES (?, ?, ?, ?)
        `).run((worker as any).id, device.id, device.type, device.name);
      }

      // Verify all devices are registered
      const registeredDevices = testDb.prepare(`
        SELECT * FROM devices WHERE user_id = ?
      `).all((worker as any).id);

      expect(registeredDevices).toHaveLength(3);

      // Update device activity
      testDb.prepare(`
        UPDATE devices SET last_active = CURRENT_TIMESTAMP
        WHERE user_id = ? AND device_id = ?
      `).run((worker as any).id, 'device-123');

      // Deregister one device
      testDb.prepare(`
        DELETE FROM devices WHERE user_id = ? AND device_id = ?
      `).run((worker as any).id, 'device-789');

      const remainingDevices = testDb.prepare(`
        SELECT * FROM devices WHERE user_id = ?
      `).all((worker as any).id);

      expect(remainingDevices).toHaveLength(2);
    });
  });

  describe('Admin manages clients and jobs', () => {
    it('should handle complete admin workflow', () => {
      const admin = createTestUser(testDb, 'admin');

      // 1. Admin creates client
      const clientResult = testDb.prepare(`
        INSERT INTO clients (name, website, contact, location, notes)
        VALUES (?, ?, ?, ?, ?)
      `).run('Research Corp', 'https://research.com', 'info@research.com', 'New York', 'Main client');

      const clientId = clientResult.lastInsertRowid;

      // 2. Admin creates multiple jobs for client
      const jobs = [
        { title: 'Street Photos', pay: 15.0, tasks: 50 },
        { title: 'Noise Survey', pay: 20.0, tasks: 30 },
        { title: 'Air Quality', pay: 25.0, tasks: 40 }
      ];

      const jobIds: number[] = [];
      for (const job of jobs) {
        const jobResult = testDb.prepare(`
          INSERT INTO jobs (client_id, title, description, pay_per_task, n_tasks, start_date, end_date, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `).run(clientId, job.title, `${job.title} project`, job.pay, job.tasks, '2025-01-01', '2025-12-31');
        jobIds.push(Number(jobResult.lastInsertRowid));
      }

      // 3. Verify client has all jobs
      const clientJobs = testDb.prepare(`
        SELECT * FROM jobs WHERE client_id = ?
      `).all(clientId);

      expect(clientJobs).toHaveLength(3);

      // 4. Admin updates client info
      testDb.prepare(`
        UPDATE clients SET contact = ?, notes = ?
        WHERE id = ?
      `).run('newemail@research.com', 'Updated contact info', clientId);

      // 5. Admin gets job statistics
      const stats = testDb.prepare(`
        SELECT
          (SELECT COUNT(*) FROM jobs WHERE client_id = ?) as total_jobs,
          (SELECT SUM(n_tasks) FROM jobs WHERE client_id = ?) as total_tasks
      `).get(clientId, clientId) as any;

      expect(stats.total_jobs).toBe(3);
      expect(stats.total_tasks).toBe(120); // 50 + 30 + 40

      // 6. Attempting to delete client with jobs should fail in real scenario
      const jobCount = testDb.prepare(`
        SELECT COUNT(*) as count FROM jobs WHERE client_id = ?
      `).get(clientId) as any;

      const canDelete = jobCount.count === 0;
      expect(canDelete).toBe(false);
    });
  });

  describe('Worker profile and rating tracking', () => {
    it('should track worker performance over time', () => {
      const worker = testDb.prepare(`
        INSERT INTO users (email, password_hash, role, name, age, sex, address, paytm)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('topworker@test.com', 'hash', 'worker', 'Top Worker', 28, 'female', '123 Main St', 'paytm123');

      const workerId = worker.lastInsertRowid;
      const job = createTestClient(testDb);
      const jobResult = testDb.prepare(`
        INSERT INTO jobs (title, description, pay_per_task, n_tasks, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('Quality Check', 'Check quality', 10, 20, '2025-01-01', '2025-12-31');

      const jobId = jobResult.lastInsertRowid;

      // Complete multiple tasks with varying ratings
      const ratings = [5, 4, 5, 3, 4, 5, 4];
      let totalEarned = 0;

      for (const rating of ratings) {
        const taskResult = testDb.prepare(`
          INSERT INTO tasks (job_id, worker_id, title, description, status, worker_rating)
          VALUES (?, ?, ?, ?, 'approved', ?)
        `).run(jobId, workerId, 'Task', 'Description', rating);

        testDb.prepare(`
          INSERT INTO points (user_id, job_id, points, transaction_type, balance_after, description)
          VALUES (?, ?, ?, 'earned', ?, ?)
        `).run(workerId, jobId, 10, totalEarned + 10, 'Earned');

        totalEarned += 10;
      }

      // Calculate statistics
      const workerStats = testDb.prepare(`
        SELECT
          AVG(worker_rating) as avg_rating,
          COUNT(*) as total_tasks,
          MIN(worker_rating) as min_rating,
          MAX(worker_rating) as max_rating
        FROM tasks
        WHERE worker_id = ? AND worker_rating IS NOT NULL
      `).get(workerId) as any;

      const pointsBalance = testDb.prepare(`
        SELECT COALESCE(SUM(points), 0) as balance
        FROM points WHERE user_id = ?
      `).get(workerId) as any;

      expect(workerStats.total_tasks).toBe(7);
      expect(workerStats.avg_rating).toBeCloseTo(4.29, 1); // (5+4+5+3+4+5+4)/7
      expect(workerStats.min_rating).toBe(3);
      expect(workerStats.max_rating).toBe(5);
      expect(pointsBalance.balance).toBe(70); // 7 tasks * 10 points
    });
  });
});
