import { readFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');

export async function readCache<T>(filename: string): Promise<T[]> {
  const filePath = path.join(CACHE_DIR, filename);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T[];
}

export async function readCacheRecord<T>(filename: string): Promise<Record<string, T>> {
  const filePath = path.join(CACHE_DIR, filename);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as Record<string, T>;
}
