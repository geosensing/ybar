import Database from 'better-sqlite3';
import { createTables } from './schema';
import * as path from 'path';
import * as fs from 'fs';

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'ybar.db');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

console.log('Running database migrations...');
createTables(db);
console.log('Migrations completed successfully!');

db.close();
