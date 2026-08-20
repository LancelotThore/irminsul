import path from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './client.js';
import { logger } from '../lib/logger.js';

export function runMigrations(): void {
  migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  logger.info('Database migrations applied');
}
