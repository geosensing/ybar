import db from './index';
import { createTables } from './schema';

console.log('Running database migrations...');
createTables(db);
console.log('Migrations completed successfully!');

db.close();
