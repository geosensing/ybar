import Database from 'better-sqlite3';

export function createTables(db: Database.Database): void {
  // Users table - Enhanced per PRD requirements
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'worker')),
      name TEXT NOT NULL,
      sex TEXT,
      phone TEXT,
      address TEXT,
      age INTEGER,
      paytm TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Clients table (companies posting jobs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      website TEXT,
      contact TEXT,
      location TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Jobs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      pay_per_task REAL NOT NULL,
      n_tasks INTEGER NOT NULL,
      n_tasks_per_worker_allowed INTEGER DEFAULT 1,
      location TEXT,
      location_restrictions TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('draft', 'active', 'completed', 'cancelled')),
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);

  // Tasks table (individual task assignments) - Enhanced per PRD
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      worker_id INTEGER,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      location_name TEXT,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'available' CHECK(status IN ('available', 'assigned', 'submitted', 'approved', 'rejected')),
      assigned_at DATETIME,
      submitted_at DATETIME,
      reviewed_at DATETIME,
      submission_data TEXT,
      reviewer_notes TEXT,
      worker_rating INTEGER CHECK(worker_rating BETWEEN 1 AND 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (worker_id) REFERENCES users(id)
    );
  `);

  // Task files (photos/videos uploaded by workers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );
  `);

  // Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'cancelled')),
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (worker_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );
  `);

  // Devices table - Per PRD requirement for device registration
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_id TEXT NOT NULL,
      device_type TEXT,
      device_name TEXT,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME,
      UNIQUE(user_id, device_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Points table - Per PRD for points/reimbursement system
  db.exec(`
    CREATE TABLE IF NOT EXISTS points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      job_id INTEGER,
      points REAL NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('earned', 'reimbursed', 'adjusted')),
      balance_after REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (job_id) REFERENCES jobs(id)
    );
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_job_id ON tasks(job_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_worker_id ON tasks(worker_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_payments_worker_id ON payments(worker_id);
    CREATE INDEX IF NOT EXISTS idx_task_files_task_id ON task_files(task_id);
    CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
    CREATE INDEX IF NOT EXISTS idx_points_user_id ON points(user_id);
  `);

  console.log('Database tables created successfully');
}

export function dropTables(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS points;
    DROP TABLE IF EXISTS devices;
    DROP TABLE IF EXISTS task_files;
    DROP TABLE IF EXISTS payments;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS jobs;
    DROP TABLE IF EXISTS clients;
    DROP TABLE IF EXISTS users;
  `);
  console.log('Database tables dropped');
}
