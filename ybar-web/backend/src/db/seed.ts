import Database from 'better-sqlite3';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, '../../data/ybar.db');
const db = new Database(dbPath);

console.log('Seeding database...');

// Create admin user
const adminPassword = bcrypt.hashSync('admin123', 10);
const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO users (email, password_hash, role, name, phone)
  VALUES (?, ?, ?, ?, ?)
`);
insertAdmin.run('admin@ybar.com', adminPassword, 'admin', 'Admin User', '+1234567890');

// Create worker users
const workerPassword = bcrypt.hashSync('worker123', 10);
const insertWorker = db.prepare(`
  INSERT OR IGNORE INTO users (email, password_hash, role, name, phone)
  VALUES (?, ?, ?, ?, ?)
`);
insertWorker.run('worker1@ybar.com', workerPassword, 'worker', 'John Worker', '+1234567891');
insertWorker.run('worker2@ybar.com', workerPassword, 'worker', 'Jane Doe', '+1234567892');

// Create sample client
const insertClient = db.prepare(`
  INSERT OR IGNORE INTO clients (name, website, contact, location, notes)
  VALUES (?, ?, ?, ?, ?)
`);
insertClient.run(
  'Research Institute',
  'https://research.example.com',
  'contact@research.example.com',
  'New York, NY',
  'Environmental research organization'
);

// Create sample jobs
const insertJob = db.prepare(`
  INSERT INTO jobs (
    client_id, title, description, pay_per_task, n_tasks,
    n_tasks_per_worker_allowed, location, start_date, end_date, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const job1Id = insertJob.run(
  1,
  'Street Photography Survey',
  'Take photos of streets at designated locations to assess infrastructure quality. Photos should be taken at eye level, showing the full street view.',
  15.00,
  50,
  5,
  'New York City',
  '2025-01-15',
  '2025-02-15',
  'active'
).lastInsertRowid;

const job2Id = insertJob.run(
  1,
  'Bird Species Documentation',
  'Visit designated forest locations and document bird species through photos and audio recordings. Record time and weather conditions.',
  25.00,
  30,
  3,
  'Central Park, NYC',
  '2025-01-20',
  '2025-03-01',
  'active'
).lastInsertRowid;

// Create sample tasks for job 1
const insertTask = db.prepare(`
  INSERT INTO tasks (
    job_id, title, description, latitude, longitude, location_name, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const locations = [
  { lat: 40.7589, lng: -73.9851, name: 'Times Square, Manhattan' },
  { lat: 40.7614, lng: -73.9776, name: '5th Avenue & 53rd Street' },
  { lat: 40.7484, lng: -73.9857, name: 'Empire State Building Area' },
  { lat: 40.7549, lng: -73.9840, name: 'Bryant Park' },
  { lat: 40.7580, lng: -73.9855, name: 'Rockefeller Center' },
];

locations.forEach((loc, index) => {
  insertTask.run(
    job1Id,
    `Street Photo - Location ${index + 1}`,
    `Take a photo of the street at ${loc.name}. Ensure the photo is taken at eye level and captures the full street view including both sides.`,
    loc.lat,
    loc.lng,
    loc.name,
    'available'
  );
});

// Create sample tasks for job 2
const parkLocations = [
  { lat: 40.7829, lng: -73.9654, name: 'Central Park - North Woods' },
  { lat: 40.7812, lng: -73.9665, name: 'Central Park - The Pool' },
  { lat: 40.7794, lng: -73.9632, name: 'Central Park - Great Hill' },
];

parkLocations.forEach((loc, index) => {
  insertTask.run(
    job2Id,
    `Bird Survey - Location ${index + 1}`,
    `Document bird species at ${loc.name}. Take photos or audio recordings of any birds observed. Note the time and weather conditions.`,
    loc.lat,
    loc.lng,
    loc.name,
    'available'
  );
});

console.log('Database seeded successfully!');
console.log('\nTest Accounts:');
console.log('Admin: admin@ybar.com / admin123');
console.log('Worker 1: worker1@ybar.com / worker123');
console.log('Worker 2: worker2@ybar.com / worker123');

db.close();
