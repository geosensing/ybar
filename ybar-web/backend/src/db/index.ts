import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const dataDir = path.join(__dirname, '../../data');
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'ybar.db');

// Ensure data directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export default db;
