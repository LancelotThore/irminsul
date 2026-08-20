import { mkdirSync } from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const DB_DIR = path.join(process.cwd(), 'data', 'db');
const DB_PATH = path.join(DB_DIR, 'irminsul.sqlite');

mkdirSync(DB_DIR, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
