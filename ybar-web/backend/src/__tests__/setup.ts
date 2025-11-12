import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { createTables, dropTables } from '../db/schema';

// Use in-memory database for tests to avoid file permission issues
export let testDb: Database.Database;

beforeAll(() => {
  // Create in-memory database
  testDb = new Database(':memory:');
  createTables(testDb);
});

afterAll(() => {
  if (testDb) {
    testDb.close();
  }
});

// Clean up between tests
afterEach(() => {
  if (testDb) {
    // Clear all tables
    testDb.exec('DELETE FROM points');
    testDb.exec('DELETE FROM devices');
    testDb.exec('DELETE FROM task_files');
    testDb.exec('DELETE FROM payments');
    testDb.exec('DELETE FROM tasks');
    testDb.exec('DELETE FROM jobs');
    testDb.exec('DELETE FROM clients');
    testDb.exec('DELETE FROM users');
  }
});

let userCounter = 0;

export function createTestUser(db: Database.Database, role: 'admin' | 'worker' = 'worker') {
  userCounter++;
  const result = db.prepare(`
    INSERT INTO users (email, password_hash, role, name)
    VALUES (?, ?, ?, ?)
  `).run(`test-${Date.now()}-${userCounter}-${Math.random()}@test.com`, 'hash', role, 'Test User');

  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
}

export function createTestJob(db: Database.Database, clientId?: number) {
  const result = db.prepare(`
    INSERT INTO jobs (client_id, title, description, pay_per_task, n_tasks, start_date, end_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(clientId || null, 'Test Job', 'Test Description', 10.0, 5, '2025-01-01', '2025-12-31', 'active');

  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid);
}

export function createTestTask(db: Database.Database, jobId: number, workerId?: number) {
  const result = db.prepare(`
    INSERT INTO tasks (job_id, worker_id, title, description, latitude, longitude, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(jobId, workerId || null, 'Test Task', 'Test Description', 40.7589, -73.9851, workerId ? 'assigned' : 'available');

  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
}

export function createTestClient(db: Database.Database) {
  const result = db.prepare(`
    INSERT INTO clients (name, website, contact, location)
    VALUES (?, ?, ?, ?)
  `).run('Test Client', 'https://test.com', 'test@test.com', 'Test Location');

  return db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
}
